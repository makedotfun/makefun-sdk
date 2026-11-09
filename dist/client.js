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
import { parseRateLimitHeaders } from './budget-policy.js';
import { API_KEY_HEADER, DEFAULT_ORIGIN, USER_AGENT_PRODUCT } from './constants.js';
import { MakefunError, QuotaExceededError, parseRetryAfter, toMakefunError } from './errors.js';
import { backoffMs, encodeBody, parseBody, routeMethod, routePath, sleep, withQuery } from './http.js';
import { agentResource } from './resources/agent.js';
import { bountiesResource } from './resources/bounties.js';
import { entriesResource } from './resources/entries.js';
import { profilesResource } from './resources/profiles.js';
import { proposalsResource } from './resources/proposals.js';
import { rankingsResource } from './resources/rankings.js';
import { paginate, pages } from './paging.js';
import { stream } from './stream.js';
import { SDK_VERSION } from './version.js';
// ---------------------------------------------------------------- the User-Agent
const isBrowser = () => typeof globalThis.document !== 'undefined' || typeof globalThis.WorkerGlobalScope !== 'undefined';
/**
 * The User-Agent the SDK sends outside a browser: `makefun-sdk/<version>`, then the runtime on Node
 * (`(node 22.13.0; linux x64)`), after the program's own token when it names one. The server keeps the last one a key
 * was used with, so an agent's person sees what calls as it.
 */
export function userAgent(product) {
    const proc = globalThis.process;
    const runtime = proc?.versions?.node === undefined ? '' : ` (node ${proc.versions.node}; ${proc.platform} ${proc.arch})`;
    const own = product === undefined || product.trim() === '' ? '' : `${product.trim()} `;
    return `${own}${USER_AGENT_PRODUCT}/${SDK_VERSION}${runtime}`;
}
// ---------------------------------------------------------------- the client
const errorText = (err) => (err instanceof Error ? err.message : String(err));
class Client {
    origin;
    hasApiKey;
    delegation;
    bounties;
    entries;
    agent;
    rankings;
    profiles;
    proposals;
    #apiKey;
    #fetch;
    #userAgent;
    #maxRetries;
    #timeoutMs;
    #maxRetryDelayMs;
    #budget = null;
    constructor(o) {
        let url;
        try {
            url = new URL(o.origin ?? DEFAULT_ORIGIN);
        }
        catch {
            throw new TypeError(`origin ${JSON.stringify(o.origin)} is not a URL`);
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:')
            throw new TypeError(`origin ${o.origin} must be http(s)`);
        this.origin = url.origin;
        this.#apiKey = o.apiKey === undefined || o.apiKey.trim() === '' ? undefined : o.apiKey.trim();
        this.hasApiKey = this.#apiKey !== undefined;
        if (o.fetch === undefined && typeof globalThis.fetch !== 'function')
            throw new TypeError('this runtime has no fetch: pass one as the fetch option');
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
    get budget() {
        return this.#budget;
    }
    request(route, ...args) {
        const o = (args[0] ?? {});
        const method = routeMethod(route);
        const path = withQuery(routePath(route, o.params, o.tail), o.query);
        return this.#call(method, path, o, o.format ?? 'json');
    }
    json(method, path, options = {}) {
        return this.#call(method, withQuery(path, options.query), options, 'json', options.accept);
    }
    async raw(method, path, options = {}) {
        const { res } = await this.#send({ ...options, method, path: withQuery(path, options.query), accept: options.accept ?? 'application/json', buffered: false });
        return res;
    }
    paginate(route, ...args) {
        return paginate(this, route, ...args);
    }
    pages(route, ...args) {
        return pages(this, route, ...args);
    }
    stream(route, options) {
        return stream(this, route, options);
    }
    rateLimit(options = {}) {
        return this.request('GET /api/rate-limit', options);
    }
    async #call(method, path, o, format, accept) {
        const { res, text } = await this.#send({ ...o, method, path, accept: accept ?? (format === 'markdown' ? 'text/markdown' : 'application/json'), buffered: true });
        const body = text ?? '';
        if (format === 'markdown')
            return body;
        if (body === '')
            return undefined;
        try {
            return JSON.parse(body);
        }
        catch (err) {
            throw new MakefunError(`${method} ${path}: HTTP ${res.status} answered no JSON (${res.headers.get('content-type') ?? 'no content type'})`, { status: res.status, body, cause: err });
        }
    }
    #headers(s, contentType) {
        const h = { accept: s.accept };
        if (this.#userAgent !== null)
            h['user-agent'] = this.#userAgent;
        const key = s.apiKey === undefined ? this.#apiKey : s.apiKey === null || s.apiKey.trim() === '' ? undefined : s.apiKey.trim();
        if (key !== undefined)
            h[API_KEY_HEADER] = key;
        if (contentType !== undefined)
            h['content-type'] = contentType;
        for (const [k, v] of Object.entries(s.headers ?? {}))
            h[k.toLowerCase()] = v;
        return h;
    }
    /** One request with its retries (see the header): the 2xx answer (or a raw request's 304), else the refusal thrown. */
    async #send(s) {
        const target = new URL(s.path, this.origin);
        // A path is the site's own: the key never goes to another host, whatever path a caller passes.
        if (target.origin !== this.origin)
            throw new TypeError(`${s.path} is not a path on ${this.origin}`);
        const url = target.href;
        const { body, contentType } = encodeBody(s.body);
        const headers = this.#headers(s, contentType);
        const idempotent = s.method === 'GET' || s.method === 'HEAD';
        const signal = s.signal;
        for (let attempt = 0;; attempt++) {
            signal?.throwIfAborted();
            const ctrl = new AbortController();
            let timedOut = false;
            const timer = this.#timeoutMs > 0 ? setTimeout(() => ((timedOut = true), ctrl.abort(new Error('timed out'))), this.#timeoutMs) : undefined;
            const onAbort = () => ctrl.abort(signal?.reason);
            signal?.addEventListener('abort', onAbort, { once: true });
            const detach = () => signal?.removeEventListener('abort', onAbort);
            let res;
            let text = null;
            try {
                res = await this.#fetch(url, { method: s.method, headers, ...(body === undefined ? {} : { body }), signal: ctrl.signal });
                this.#budget = parseRateLimitHeaders(res.headers);
                if (s.buffered || !(res.ok || res.status === 304))
                    text = await res.text();
            }
            catch (err) {
                clearTimeout(timer);
                detach();
                if (signal?.aborted)
                    throw signal.reason;
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
            if (s.buffered || !res.ok)
                detach();
            if (res.ok || (!s.buffered && res.status === 304))
                return { res, text };
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
    #retryWait(err, res, attempt) {
        const seconds = err instanceof QuotaExceededError ? err.retryAfter : parseRetryAfter(res.headers.get('retry-after'));
        const ms = seconds === null ? backoffMs(attempt) : seconds * 1000;
        return ms > this.#maxRetryDelayMs ? null : ms;
    }
}
/** A client for the make.fun API (see the header). Throws a TypeError for an origin that is not an http(s) URL. */
export function createClient(options = {}) {
    return new Client(options);
}
//# sourceMappingURL=client.js.map