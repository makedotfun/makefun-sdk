// What the SDK throws when the API refuses a request, or a request gets no answer. Every API error
// is one JSON shape, `{success: false, error: [{message, path?}], data?}`, and some carry more:
//
//   an RFC 9457 problem (application/problem+json): type, title, status, detail and instance on
//     top of the same members: an entry's or a claim's refusal, and the request budget's 429
//   401 for an API key: data.code KEY_EXPIRED the first time an expired key is used, then
//     INVALID_API_KEY (the server forgets an expired key once it has said so)
//   429: the request budget's problem (type <origin>/problems/api-quota-exceeded) with the tier, the
//     policy that ran out, every policy past its quota, the limit, the use, when it resets and how
//     long to wait; or a route's own rate limit, an ApiError with Retry-After
//
// toMakefunError(status, body, headers) reads a refusal into the most specific class:
//
//   MakefunError              every refusal: status, issues, problem, code (data.code), body
//   QuotaExceededError        429: tier, policy, violatedPolicies, limit, used, resetsAt, retryAfter
//   InvalidApiKeyError        401 INVALID_API_KEY, with the renewal hint
//   KeyExpiredError           401 KEY_EXPIRED, an InvalidApiKeyError (catch that one for both)
//   FeatureUnavailableError   a feature this site does not have switched on
//
// A refused entry or prize claim is an EntryProblem (a problem with the checks that refused it, each with its reason
// and fix, and whether a new attempt can pass): MakefunError.entryProblem holds it.

import type { EntryProblem } from './api-types/entry.ts';

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
export const KEY_RENEWAL_HINT =
  "mint a new API key: sign in on the site and open Profile → Keys, or sign with the account's wallet (mintWithWallet, POST /api/auth/solana/key), or run makefun register --keypair <file>";

/** The path an api-quota-exceeded problem type ends with. */
export const QUOTA_PROBLEM_PATH = '/problems/api-quota-exceeded';

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
export class MakefunError extends Error {
  override name = 'MakefunError';
  readonly status: number | null;
  readonly issues: readonly ApiIssue[];
  readonly problem: ProblemDetails | null;
  readonly code: string | null;
  readonly body: unknown;
  constructor(message: string, init: MakefunErrorInit) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.status = init.status;
    this.issues = init.issues ?? [];
    this.problem = init.problem ?? null;
    this.code = init.code ?? null;
    this.body = init.body ?? null;
  }

  /** The refused entry or claim, when the API answered one (an RFC 9457 problem with its checks and retry); else null. */
  get entryProblem(): EntryProblem | null {
    return isEntryProblem(this.body) ? this.body : null;
  }
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
export class QuotaExceededError extends MakefunError {
  override name = 'QuotaExceededError';
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
  constructor(message: string, init: QuotaExceededInit) {
    super(message, init);
    this.tier = init.tier ?? null;
    this.policy = init.policy ?? null;
    this.violatedPolicies = init.violatedPolicies ?? [];
    this.limit = init.limit ?? null;
    this.used = init.used ?? null;
    this.resetsAt = init.resetsAt ?? null;
    this.retryAfter = init.retryAfter ?? null;
    this.docsUrl = init.docsUrl ?? null;
    this.registerUrl = init.registerUrl ?? null;
  }
}

/** 401: the API key is not one the server takes (unknown, revoked, or expired and already reported). */
export class InvalidApiKeyError extends MakefunError {
  override name = 'InvalidApiKeyError';
  /** How to get a new key (KEY_RENEWAL_HINT). */
  readonly renewal: string = KEY_RENEWAL_HINT;
}

/** 401 KEY_EXPIRED: the key has expired (said once: the same key answers INVALID_API_KEY after). */
export class KeyExpiredError extends InvalidApiKeyError {
  override name = 'KeyExpiredError';
}

/** A feature this site does not have switched on (proposals, when the sponsor area is off). */
export class FeatureUnavailableError extends MakefunError {
  override name = 'FeatureUnavailableError';
  readonly feature: string;
  constructor(feature: string, message = `${feature} is not available on this site`, init: Partial<MakefunErrorInit> = {}) {
    super(message, { status: null, ...init });
    this.feature = feature;
  }
}

// ---------------------------------------------------------------- reading a refusal

type HeadersLike = Headers | Readonly<Record<string, string | undefined>> | null | undefined;

function header(headers: HeadersLike, name: string): string | null {
  if (headers === null || headers === undefined) return null;
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name);
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers as Record<string, string | undefined>)) if (k.toLowerCase() === want && v !== undefined) return v;
  return null;
}

const record = (v: unknown): Record<string, unknown> | null => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Whether `body` is an RFC 9457 problem: a string type and title and a numeric status. */
export function isProblem(body: unknown): body is ProblemDetails {
  const b = record(body);
  return b !== null && typeof b.type === 'string' && typeof b.title === 'string' && typeof b.status === 'number';
}

/** Whether `body` is an EntryProblem: a refused entry or claim (a problem with its checks and whether a new attempt can pass). */
export function isEntryProblem(body: unknown): body is EntryProblem {
  const b = record(body);
  return b !== null && isProblem(b) && typeof b.detail === 'string' && Array.isArray(b.checks) && record(b.retry) !== null;
}

/** An API error's issues (`error`, one issue or a list; a bare string kept as its message). */
export function issuesOf(body: unknown): ApiIssue[] {
  const b = record(body);
  if (b === null || b.error === undefined) return [];
  const list = Array.isArray(b.error) ? b.error : [b.error];
  return list.map((e): ApiIssue => {
    if (typeof e === 'string') return { message: e };
    const r = record(e);
    const message = typeof r?.message === 'string' ? r.message : JSON.stringify(e);
    return {
      message,
      ...(Array.isArray(r?.path) ? { path: (r.path as unknown[]).filter((p): p is string | number => typeof p === 'string' || typeof p === 'number') } : {}),
      ...(typeof r?.code === 'string' ? { code: r.code } : {}),
    };
  });
}

/** A refusal's code: data.code, else a top-level code (Better Auth's). */
export function codeOf(body: unknown): string | null {
  const b = record(body);
  return str(record(b?.data)?.code) ?? str(b?.code);
}

/** Retry-After in seconds: delta-seconds, or an HTTP date from `now`; null when absent or unreadable. */
export function parseRetryAfter(value: string | null, now: Date = new Date()): number | null {
  if (value === null) return null;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v);
  const at = Date.parse(v);
  return Number.isFinite(at) ? Math.max(0, Math.ceil((at - now.getTime()) / 1000)) : null;
}

/** A refusal's words: the problem's title and detail, else its issues (each with its code), else Better Auth's message, else the text. */
export function errorText(body: unknown): string {
  if (isProblem(body)) return typeof body.detail === 'string' && body.detail !== '' ? `${body.title}: ${body.detail}` : body.title;
  const lines = issuesOf(body).map((i) => `${i.path !== undefined && i.path.length > 0 ? `${i.path.join('.')}: ` : ''}${i.message}${i.code === undefined ? '' : ` (${i.code})`}`);
  const b = record(body);
  if (lines.length === 0 && typeof b?.message === 'string') lines.push(b.message);
  const code = codeOf(body);
  const text = lines.length > 0 ? lines.join('; ') : typeof body === 'string' ? body.slice(0, 500) : body === null || body === undefined ? '' : JSON.stringify(body).slice(0, 500);
  return code === null || text.includes(`(${code})`) ? text : `${text} (${code})`;
}

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
export function toMakefunError(status: number, body: unknown, headers?: HeadersLike, context: RequestContext = {}): MakefunError {
  const issues = issuesOf(body);
  const problem = isProblem(body) ? body : null;
  const code = codeOf(body);
  const words = errorText(body);
  const where = context.method !== undefined && context.path !== undefined ? `${context.method} ${context.path}: ` : '';
  const message = `${where}HTTP ${status}${words === '' ? '' : `: ${words}`}`;
  const init: MakefunErrorInit = { status, issues, problem, code, body };
  if (status === 429) {
    const b = record(body) ?? {};
    const resetsAt = str(b.resets_at);
    const resetsAtDate = resetsAt === null ? null : new Date(resetsAt);
    const violated = Array.isArray(b['violated-policies']) ? (b['violated-policies'] as unknown[]).filter((p): p is string => typeof p === 'string') : [];
    return new QuotaExceededError(message, {
      ...init,
      tier: str(b.tier),
      policy: str(b.policy),
      violatedPolicies: violated,
      limit: num(b.limit),
      used: num(b.used),
      resetsAt: resetsAtDate !== null && Number.isFinite(resetsAtDate.getTime()) ? resetsAtDate : null,
      retryAfter: num(b.retry_after) ?? parseRetryAfter(header(headers, 'retry-after'), context.now),
      docsUrl: str(b.docs_url),
      registerUrl: str(b.register_url),
    });
  }
  if (status === 401 && code === 'KEY_EXPIRED') return new KeyExpiredError(message, init);
  if (status === 401 && code === 'INVALID_API_KEY') return new InvalidApiKeyError(message, init);
  return new MakefunError(message, init);
}

/** Whether a quota problem's type is the request budget's (`<origin>/problems/api-quota-exceeded`). */
export function isQuotaProblem(body: unknown): boolean {
  return isProblem(body) && body.status === 429 && body.type.endsWith(QUOTA_PROBLEM_PATH);
}
