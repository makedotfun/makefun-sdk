import type { BodyOf, ParamsOf, PublicRoute, PublicRoutes, QueryOf, ResponseOf } from './api-types/public.js';
import { type ParsedBudget } from './budget-policy.js';
import { type HttpMethod } from './http.js';
import type { EntryDelegation } from './resources/entries.js';
import { type AgentResource } from './resources/agent.js';
import { type BountiesResource } from './resources/bounties.js';
import { type EntriesResource } from './resources/entries.js';
import { type ProfilesResource } from './resources/profiles.js';
import { type ProposalsResource } from './resources/proposals.js';
import { type RankingsResource } from './resources/rankings.js';
import { type PagedRoute, type PageItem } from './paging.js';
import { type StreamEventOf, type StreamOptions, type StreamRoute } from './stream.js';
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
type ParamsPart<R extends PublicRoute> = PublicRoutes[R] extends {
    params: unknown;
} ? {
    params: ParamsOf<R>;
} : {
    params?: undefined;
};
type QueryPart<R extends PublicRoute> = PublicRoutes[R] extends {
    query: unknown;
} ? {
    query?: QueryOf<R>;
} : {
    query?: undefined;
};
type BodyPart<R extends PublicRoute> = PublicRoutes[R] extends {
    body: unknown;
} ? ({} extends BodyOf<R> ? {
    body?: BodyOf<R>;
} : {
    body: BodyOf<R>;
}) : {
    body?: undefined;
};
type TailPart<R extends PublicRoute> = R extends `${string}/*` ? {
    tail?: string;
} : {
    tail?: undefined;
};
/** request()'s options for `route`: its params (required when the path has any), query, body (required when the route's has a required field), tail, and the format. */
export type RequestOptions<R extends PublicRoute, F extends Format = Format> = ParamsPart<R> & QueryPart<R> & BodyPart<R> & TailPart<R> & CallOptions & {
    format?: F;
};
type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
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
/**
 * The User-Agent the SDK sends outside a browser: `makefun-sdk/<version>`, then the runtime on Node
 * (`(node 22.13.0; linux x64)`), after the program's own token when it names one. The server keeps the last one a key
 * was used with, so an agent's person sees what calls as it.
 */
export declare function userAgent(product?: string): string;
/** A client for the make.fun API (see the header). Throws a TypeError for an origin that is not an http(s) URL. */
export declare function createClient(options?: ClientOptions): MakefunClient;
export {};
//# sourceMappingURL=client.d.ts.map