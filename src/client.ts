// The make.fun API client: one typed request over every public route, the retries a request budget calls for, and
// the named helpers (./resources/*) on top. Browser-safe: no Node API, no import of ./node.ts.
//
//   const client = createClient({ apiKey: process.env.MAKEFUN_API_KEY });
//   const page = await client.request('GET /api/competitions', { query: { status: 'open' } });
//   const md = await client.request('GET /api/competitions/:slug', { params: { slug }, format: 'markdown' });
//
// request(route, options) is typed over PublicRoutes (./api-types/public.ts, the server's own route map, vendored):
// the route key names the method and the path, `params` fill its :names, `tail` its trailing *, `query` its query
// string, `body` its JSON body (a Blob anywhere in it turns the body into multipart/form-data) and the answer is the
// route's response type, or its markdown twin as a string with `format: 'markdown'` (Accept: text/markdown).
//
// Every answer's rate headers (RateLimit-Policy and RateLimit, X-RateLimit-*) are read into client.budget, null when
// an answer carries none or came from a cache (Age > 0: the draft's §7.3 says to ignore them there). A refusal is
// thrown as the most specific error in ./errors.ts. 429 and 503 are retried, up to maxRetries times: after the
// server's Retry-After (or a 429 body's retry_after) when it names one, else after an exponential backoff with full
// jitter. GET and HEAD are retried on both, and when the network fails; a write only on 429, which the budget refuses
// before any handler runs, so nothing was written. A wait longer than maxRetryDelayMs (a day's quota spent) is not
// waited out: the error is thrown at once, its retryAfter saying how long.

import type { BodyOf, ParamsOf, PublicRoute, PublicRoutes, QueryOf, ResponseOf } from './api-types/public.ts';
import { parseRateLimitHeaders, type ParsedBudget } from './budget-policy.ts';
import { API_KEY_HEADER, DEFAULT_ORIGIN, USER_AGENT_PRODUCT } from './constants.ts';
import { MakefunError, QuotaExceededError, parseRetryAfter, toMakefunError } from './errors.ts';
import { backoffMs, encodeBody, parseBody, routeMethod, routePath, sleep, withQuery, type HttpMethod } from './http.ts';
import type { EntryDelegation } from './resources/entries.ts';
import { agentResource, type AgentResource } from './resources/agent.ts';
import { bountiesResource, type BountiesResource } from './resources/bounties.ts';
import { entriesResource, type EntriesResource } from './resources/entries.ts';
import { profilesResource, type ProfilesResource } from './resources/profiles.ts';
import { proposalsResource, type ProposalsResource } from './resources/proposals.ts';
import { rankingsResource, type RankingsResource } from './resources/rankings.ts';
import { paginate, pages, type PagedRoute, type PageItem } from './paging.ts';
import { stream, type StreamEventOf, type StreamOptions, type StreamRoute } from './stream.ts';
import { SDK_VERSION } from './version.ts';

// ---------------------------------------------------------------- options

/** The fetch the client calls: the global one by default, or any with its signature (a test's, a proxy's). */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /** The site: scheme, host and port (default https://make.fun). */
  origin?: string;
  /** An `af_…` API key, sent as x-api-key. Without one the client calls as a visitor, on the free tier. */
  apiKey?: string;
  /** Default the global fetch. */
  fetch?: FetchLike;
  /**
   * Your program's own product token (`my-agent/1.2`), sent before the SDK's in the User-Agent. A browser sends its own
   * User-Agent and the SDK sets none there (a page may not, across origins).
   */
  userAgent?: string;
  /** How many times a request is retried after a 429 or a 503 (or a GET's network failure). Default 2. */
  maxRetries?: number;
  /** Each attempt's deadline in milliseconds, until the whole answer is read (a download's or a stream's: until its headers). Default 60000; 0 for none. */
  timeoutMs?: number;
  /** The longest wait a retry takes; a Retry-After past it is thrown at once. Default 60000. */
  maxRetryDelayMs?: number;
  /**
   * The account's payout delegation, used by entries.submit when its signer is the delegation's agent (the entry is
   * then signed `make.fun entry v2`, paying the delegation's payout wallet). createClientFromEnv fills it from the
   * credentials file.
   */
  delegation?: EntryDelegation | null;
}

/** What every call takes. */
export interface CallOptions {
  /** Abort the request (its retries and waits too). */
  signal?: AbortSignal;
  /** More request headers (lowercase names win over the client's own of the same name). */
  headers?: Readonly<Record<string, string>>;
  /** This call's API key in place of the client's; null: send none. */
  apiKey?: string | null;
}

/** json: the parsed JSON answer (Accept: application/json). markdown: the route's markdown twin as text (Accept: text/markdown). */
export type Format = 'json' | 'markdown';

type ParamsPart<R extends PublicRoute> = PublicRoutes[R] extends { params: unknown } ? { params: ParamsOf<R> } : { params?: undefined };
type QueryPart<R extends PublicRoute> = PublicRoutes[R] extends { query: unknown } ? { query?: QueryOf<R> } : { query?: undefined };
type BodyPart<R extends PublicRoute> = PublicRoutes[R] extends { body: unknown } ? ({} extends BodyOf<R> ? { body?: BodyOf<R> } : { body: BodyOf<R> }) : { body?: undefined };
type TailPart<R extends PublicRoute> = R extends `${string}/*` ? { tail?: string } : { tail?: undefined };

/** request()'s options for `route`: its params (required when the path has any), query, body (required when the route's has a required field), tail, and the format. */
export type RequestOptions<R extends PublicRoute, F extends Format = Format> = ParamsPart<R> & QueryPart<R> & BodyPart<R> & TailPart<R> & CallOptions & { format?: F };

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

/** The options argument: optional when the route needs nothing, required when it has params or a required body. */
export type RequestArgs<R extends PublicRoute, F extends Format = Format> = [RequiredKeys<RequestOptions<R, F>>] extends [never] ? [options?: RequestOptions<R, F>] : [options: RequestOptions<R, F>];

/** What request() resolves to: the route's response type, or the markdown twin's text. */
export type RequestResult<R extends PublicRoute, F extends Format> = F extends 'markdown' ? string : ResponseOf<R>;

/** A request to a path outside the route map (a download, a stream, Better Auth's own routes). */
export interface RawRequestOptions extends CallOptions {
  /** Query string values: undefined, null and '' are left out, an array repeats its key. */
  query?: Readonly<Record<string, unknown>>;
  /** JSON, or multipart/form-data when a value is a Blob; a FormData, Blob, string or bytes go as they are. */
  body?: unknown;
  /** The Accept header (default application/json). */
  accept?: string;
}

/** The client createClient makes. */
export interface MakefunClient {
  /** The site it talks to (URL origin). */
  readonly origin: string;
  /** Whether it sends an API key. */
  readonly hasApiKey: boolean;
  /** The last answer's request budget (its rate headers), or null when it carried none or came from a cache. */
  readonly budget: ParsedBudget | null;
  /** The payout delegation entries.submit signs under (ClientOptions.delegation), or null. */
  readonly delegation: EntryDelegation | null;

  /** One typed request: see the header. */
  request<R extends PublicRoute, F extends Format = 'json'>(route: R, ...args: RequestArgs<R, F>): Promise<RequestResult<R, F>>;
  /** A JSON request to any path, its answer untyped (`T`). */
  json<T = unknown>(method: HttpMethod, path: string, options?: RawRequestOptions): Promise<T>;
  /** A request to any path, answered as the Response itself once its headers arrive (2xx or 304; a refusal is thrown). */
  raw(method: HttpMethod, path: string, options?: RawRequestOptions): Promise<Response>;
  /** Every item of a paginated route, page after page, following next_cursor. */
  paginate<R extends PagedRoute>(route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<PageItem<R>, void, undefined>;
  /** Every page of a paginated route, each its full response. */
  pages<R extends PagedRoute>(route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<ResponseOf<R>, void, undefined>;
  /** A Server-Sent Events route's events (live board, discussion, check reveal), resuming after each disconnect. */
  stream<R extends StreamRoute>(route: R, options: StreamOptions<R>): AsyncGenerator<StreamEventOf<R>, void, undefined>;
  /** GET /api/rate-limit: what the caller has left under every policy, read without spending any. */
  rateLimit(options?: CallOptions): Promise<ResponseOf<'GET /api/rate-limit'>>;

  readonly bounties: BountiesResource;
  readonly entries: EntriesResource;
  readonly agent: AgentResource;
  readonly rankings: RankingsResource;
  readonly profiles: ProfilesResource;
  readonly proposals: ProposalsResource;
}

// ---------------------------------------------------------------- the User-Agent

const isBrowser = (): boolean => typeof (globalThis as { document?: unknown }).document !== 'undefined' || typeof (globalThis as { WorkerGlobalScope?: unknown }).WorkerGlobalScope !== 'undefined';

/**
 * The User-Agent the SDK sends outside a browser: `makefun-sdk/<version>`, then the runtime on Node
 * (`(node 22.13.0; linux x64)`), after the program's own token when it names one. The server keeps the last one a key
 * was used with, so an agent's person sees what calls as it.
 */
export function userAgent(product?: string): string {
  const proc = (globalThis as { process?: { versions?: { node?: string }; platform?: string; arch?: string } }).process;
  const runtime = proc?.versions?.node === undefined ? '' : ` (node ${proc.versions.node}; ${proc.platform} ${proc.arch})`;
  const own = product === undefined || product.trim() === '' ? '' : `${product.trim()} `;
  return `${own}${USER_AGENT_PRODUCT}/${SDK_VERSION}${runtime}`;
}

// ---------------------------------------------------------------- the client

const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

interface SendInit extends CallOptions {
  method: HttpMethod;
  /** The path with its query string. */
  path: string;
  body?: unknown;
  accept: string;
  /** Read the whole answer under the deadline (JSON, markdown); else hand the Response back at its headers. */
  buffered: boolean;
}

class Client implements MakefunClient {
  readonly origin: string;
  readonly hasApiKey: boolean;
  readonly delegation: EntryDelegation | null;
  readonly bounties: BountiesResource;
  readonly entries: EntriesResource;
  readonly agent: AgentResource;
  readonly rankings: RankingsResource;
  readonly profiles: ProfilesResource;
  readonly proposals: ProposalsResource;
  readonly #apiKey: string | undefined;
  readonly #fetch: FetchLike;
  readonly #userAgent: string | null;
  readonly #maxRetries: number;
  readonly #timeoutMs: number;
  readonly #maxRetryDelayMs: number;
  #budget: ParsedBudget | null = null;

  constructor(o: ClientOptions) {
    let url: URL;
    try {
      url = new URL(o.origin ?? DEFAULT_ORIGIN);
    } catch {
      throw new TypeError(`origin ${JSON.stringify(o.origin)} is not a URL`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new TypeError(`origin ${o.origin} must be http(s)`);
    this.origin = url.origin;
    this.#apiKey = o.apiKey === undefined || o.apiKey.trim() === '' ? undefined : o.apiKey.trim();
    this.hasApiKey = this.#apiKey !== undefined;
    if (o.fetch === undefined && typeof (globalThis as { fetch?: unknown }).fetch !== 'function') throw new TypeError('this runtime has no fetch: pass one as the fetch option');
    // The global fetch is looked up per call (and called unbound from it), so a test's or a polyfill's swap takes effect.
    this.#fetch = o.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#userAgent = isBrowser() ? null : userAgent(o.userAgent);
    this.#maxRetries = Math.max(0, Math.floor(o.maxRetries ?? 2));
    this.#timeoutMs = Math.max(0, o.timeoutMs ?? 60_000);
    this.#maxRetryDelayMs = Math.max(0, o.maxRetryDelayMs ?? 60_000);
    this.delegation = o.delegation ?? null;
    this.bounties = bountiesResource(this);
    this.entries = entriesResource(this);
    this.agent = agentResource(this);
    this.rankings = rankingsResource(this);
    this.profiles = profilesResource(this);
    this.proposals = proposalsResource(this);
  }

  get budget(): ParsedBudget | null {
    return this.#budget;
  }

  request<R extends PublicRoute, F extends Format = 'json'>(route: R, ...args: RequestArgs<R, F>): Promise<RequestResult<R, F>> {
    const o = (args[0] ?? {}) as { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown; tail?: string; format?: Format } & CallOptions;
    const method = routeMethod(route);
    const path = withQuery(routePath(route, o.params, o.tail), o.query);
    return this.#call(method, path, o, o.format ?? 'json') as Promise<RequestResult<R, F>>;
  }

  json<T = unknown>(method: HttpMethod, path: string, options: RawRequestOptions = {}): Promise<T> {
    return this.#call(method, withQuery(path, options.query), options, 'json', options.accept) as Promise<T>;
  }

  async raw(method: HttpMethod, path: string, options: RawRequestOptions = {}): Promise<Response> {
    const { res } = await this.#send({ ...options, method, path: withQuery(path, options.query), accept: options.accept ?? 'application/json', buffered: false });
    return res;
  }

  paginate<R extends PagedRoute>(route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<PageItem<R>, void, undefined> {
    return paginate(this, route, ...args);
  }

  pages<R extends PagedRoute>(route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<ResponseOf<R>, void, undefined> {
    return pages(this, route, ...args);
  }

  stream<R extends StreamRoute>(route: R, options: StreamOptions<R>): AsyncGenerator<StreamEventOf<R>, void, undefined> {
    return stream(this, route, options);
  }

  rateLimit(options: CallOptions = {}): Promise<ResponseOf<'GET /api/rate-limit'>> {
    return this.request('GET /api/rate-limit', options);
  }

  async #call(method: HttpMethod, path: string, o: CallOptions & { body?: unknown }, format: Format, accept?: string): Promise<unknown> {
    const { res, text } = await this.#send({ ...o, method, path, accept: accept ?? (format === 'markdown' ? 'text/markdown' : 'application/json'), buffered: true });
    const body = text ?? '';
    if (format === 'markdown') return body;
    if (body === '') return undefined;
    try {
      return JSON.parse(body) as unknown;
    } catch (err) {
      throw new MakefunError(`${method} ${path}: HTTP ${res.status} answered no JSON (${res.headers.get('content-type') ?? 'no content type'})`, { status: res.status, body, cause: err });
    }
  }

  #headers(s: SendInit, contentType: string | undefined): Record<string, string> {
    const h: Record<string, string> = { accept: s.accept };
    if (this.#userAgent !== null) h['user-agent'] = this.#userAgent;
    const key = s.apiKey === undefined ? this.#apiKey : s.apiKey === null || s.apiKey.trim() === '' ? undefined : s.apiKey.trim();
    if (key !== undefined) h[API_KEY_HEADER] = key;
    if (contentType !== undefined) h['content-type'] = contentType;
    for (const [k, v] of Object.entries(s.headers ?? {})) h[k.toLowerCase()] = v;
    return h;
  }

  /** One request with its retries (see the header): the 2xx answer (or a raw request's 304), else the refusal thrown. */
  async #send(s: SendInit): Promise<{ res: Response; text: string | null }> {
    const target = new URL(s.path, this.origin);
    // A path is the site's own: the key never goes to another host, whatever path a caller passes.
    if (target.origin !== this.origin) throw new TypeError(`${s.path} is not a path on ${this.origin}`);
    const url = target.href;
    const { body, contentType } = encodeBody(s.body);
    const headers = this.#headers(s, contentType);
    const idempotent = s.method === 'GET' || s.method === 'HEAD';
    const signal = s.signal;
    for (let attempt = 0; ; attempt++) {
      signal?.throwIfAborted();
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = this.#timeoutMs > 0 ? setTimeout(() => ((timedOut = true), ctrl.abort(new Error('timed out'))), this.#timeoutMs) : undefined;
      const onAbort = (): void => ctrl.abort(signal?.reason);
      signal?.addEventListener('abort', onAbort, { once: true });
      const detach = (): void => signal?.removeEventListener('abort', onAbort);
      let res: Response;
      let text: string | null = null;
      try {
        res = await this.#fetch(url, { method: s.method, headers, ...(body === undefined ? {} : { body }), signal: ctrl.signal });
        this.#budget = parseRateLimitHeaders(res.headers);
        if (s.buffered || !(res.ok || res.status === 304)) text = await res.text();
      } catch (err) {
        clearTimeout(timer);
        detach();
        if (signal?.aborted) throw signal.reason;
        const failure = timedOut
          ? new MakefunError(`${s.method} ${s.path}: no answer within ${this.#timeoutMs} ms`, { status: null, cause: err })
          : new MakefunError(`${s.method} ${s.path}: cannot reach ${this.origin}: ${errorText(err)}`, { status: null, cause: err });
        if (!timedOut && idempotent && attempt < this.#maxRetries) {
          await sleep(backoffMs(attempt), signal);
          continue;
        }
        throw failure;
      }
      clearTimeout(timer);
      // A raw answer's body is read after this returns: the caller's signal stays tied to it so an abort still stops it.
      if (s.buffered || !res.ok) detach();
      if (res.ok || (!s.buffered && res.status === 304)) return { res, text };
      const err = toMakefunError(res.status, parseBody(text ?? ''), res.headers, { method: s.method, path: s.path });
      const retryable = res.status === 429 || (res.status === 503 && idempotent);
      if (retryable && attempt < this.#maxRetries) {
        const wait = this.#retryWait(err, res, attempt);
        if (wait !== null) {
          await sleep(wait, signal);
          continue;
        }
      }
      throw err;
    }
  }

  /** How long to wait before retrying `res`: the server's word, else the backoff; null when that is past maxRetryDelayMs. */
  #retryWait(err: MakefunError, res: Response, attempt: number): number | null {
    const seconds = err instanceof QuotaExceededError ? err.retryAfter : parseRetryAfter(res.headers.get('retry-after'));
    const ms = seconds === null ? backoffMs(attempt) : seconds * 1000;
    return ms > this.#maxRetryDelayMs ? null : ms;
  }
}

/** A client for the make.fun API (see the header). Throws a TypeError for an origin that is not an http(s) URL. */
export function createClient(options: ClientOptions = {}): MakefunClient {
  return new Client(options);
}
