import type { EntryProblem } from './api-types/entry.js';
/** One issue of an API error: what is wrong, and where in the request when it is about a field. */
export interface ApiIssue {
    message: string;
    path?: (string | number)[];
    code?: string;
}
/** An RFC 9457 problem's members, and whatever else it carries. */
export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    [member: string]: unknown;
}
/** How to get a new API key, carried by every API key refusal. */
export declare const KEY_RENEWAL_HINT = "mint a new API key: sign in on the site and open Profile \u2192 Keys, or sign with the account's wallet (mintWithWallet, POST /api/auth/solana/key), or run makefun register --keypair <file>";
/** The path an api-quota-exceeded problem type ends with. */
export declare const QUOTA_PROBLEM_PATH = "/problems/api-quota-exceeded";
export interface MakefunErrorInit {
    /** The HTTP status, or null when no answer came (the network, a timeout, an abort). */
    status: number | null;
    issues?: readonly ApiIssue[];
    problem?: ProblemDetails | null;
    /** data.code (or a top-level code, as Better Auth's refusals carry it). */
    code?: string | null;
    /** The parsed body (JSON, or the text when it is not JSON). */
    body?: unknown;
    cause?: unknown;
}
/** A request the API refused (status set), or one that got no answer (status null). */
export declare class MakefunError extends Error {
    name: string;
    readonly status: number | null;
    readonly issues: readonly ApiIssue[];
    readonly problem: ProblemDetails | null;
    readonly code: string | null;
    readonly body: unknown;
    constructor(message: string, init: MakefunErrorInit);
    /** The refused entry or claim, when the API answered one (an RFC 9457 problem with its checks and retry); else null. */
    get entryProblem(): EntryProblem | null;
}
export interface QuotaExceededInit extends MakefunErrorInit {
    tier?: string | null;
    policy?: string | null;
    violatedPolicies?: readonly string[];
    limit?: number | null;
    used?: number | null;
    resetsAt?: Date | null;
    retryAfter?: number | null;
    docsUrl?: string | null;
    registerUrl?: string | null;
}
/**
 * 429: a request over its budget (or a route's own rate limit, which names only retryAfter).
 * retryAfter is in seconds; register_url, on the free tier, is where a key lifts the limits.
 */
export declare class QuotaExceededError extends MakefunError {
    name: string;
    /** 'free' or 'registered', when the budget answered. */
    readonly tier: string | null;
    /** The policy that ran out first, like 'free-minute'. */
    readonly policy: string | null;
    /** Every policy past its quota. */
    readonly violatedPolicies: readonly string[];
    readonly limit: number | null;
    readonly used: number | null;
    readonly resetsAt: Date | null;
    /** Seconds to wait before the next request: the body's retry_after, else the Retry-After header. */
    readonly retryAfter: number | null;
    readonly docsUrl: string | null;
    readonly registerUrl: string | null;
    constructor(message: string, init: QuotaExceededInit);
}
/** 401: the API key is not one the server takes (unknown, revoked, or expired and already reported). */
export declare class InvalidApiKeyError extends MakefunError {
    name: string;
    /** How to get a new key (KEY_RENEWAL_HINT). */
    readonly renewal: string;
}
/** 401 KEY_EXPIRED: the key has expired (said once: the same key answers INVALID_API_KEY after). */
export declare class KeyExpiredError extends InvalidApiKeyError {
    name: string;
}
/** A feature this site does not have switched on (proposals, when the sponsor area is off). */
export declare class FeatureUnavailableError extends MakefunError {
    name: string;
    readonly feature: string;
    constructor(feature: string, message?: string, init?: Partial<MakefunErrorInit>);
}
type HeadersLike = Headers | Readonly<Record<string, string | undefined>> | null | undefined;
/** Whether `body` is an RFC 9457 problem: a string type and title and a numeric status. */
export declare function isProblem(body: unknown): body is ProblemDetails;
/** Whether `body` is an EntryProblem: a refused entry or claim (a problem with its checks and whether a new attempt can pass). */
export declare function isEntryProblem(body: unknown): body is EntryProblem;
/** An API error's issues (`error`, one issue or a list; a bare string kept as its message). */
export declare function issuesOf(body: unknown): ApiIssue[];
/** A refusal's code: data.code, else a top-level code (Better Auth's). */
export declare function codeOf(body: unknown): string | null;
/** Retry-After in seconds: delta-seconds, or an HTTP date from `now`; null when absent or unreadable. */
export declare function parseRetryAfter(value: string | null, now?: Date): number | null;
/** A refusal's words: the problem's title and detail, else its issues (each with its code), else Better Auth's message, else the text. */
export declare function errorText(body: unknown): string;
/** Where a refused request went, for the message: `GET /api/competitions: HTTP 429: …`. */
export interface RequestContext {
    method?: string;
    path?: string;
    /** For an HTTP-date Retry-After (default now). */
    now?: Date;
}
/**
 * The error for a refused request: status, its parsed body (JSON, or the text) and its headers.
 * 429 is a QuotaExceededError, a 401 with data.code KEY_EXPIRED a KeyExpiredError and INVALID_API_KEY
 * an InvalidApiKeyError; anything else a MakefunError.
 */
export declare function toMakefunError(status: number, body: unknown, headers?: HeadersLike, context?: RequestContext): MakefunError;
/** Whether a quota problem's type is the request budget's (`<origin>/problems/api-quota-exceeded`). */
export declare function isQuotaProblem(body: unknown): boolean;
export {};
//# sourceMappingURL=errors.d.ts.map