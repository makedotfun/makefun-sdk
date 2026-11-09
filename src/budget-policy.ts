// GENERATED from the make.fun API's api-budget.ts: do not edit, every release regenerates it.
export const DRAFT_REVISION = 'draft-ietf-httpapi-ratelimit-headers-11';
export const DRAFT_EXPIRES = '2026-11-24';

export const TIERS = ['free', 'registered'] as const;
export type Tier = (typeof TIERS)[number];

export interface BudgetPolicy {
  readonly name: string;
  readonly q: number;
  readonly w: number;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

export const BUDGET_POLICIES = {
  'free-minute': { name: 'free-minute', q: 60, w: MINUTE },
  'free-day': { name: 'free-day', q: 5_000, w: DAY },
  'visitor-day': { name: 'visitor-day', q: 20_000, w: DAY },
  'address-minute': { name: 'address-minute', q: 300, w: MINUTE },
  'platform-minute': { name: 'platform-minute', q: 300, w: MINUTE },
  'registered-minute': { name: 'registered-minute', q: 300, w: MINUTE },
  'registered-day': { name: 'registered-day', q: 50_000, w: DAY },
  'keyed-address-minute': { name: 'keyed-address-minute', q: 1_200, w: MINUTE },
  'free-heavy-hour': { name: 'free-heavy-hour', q: 10, w: HOUR },
  'registered-heavy-hour': { name: 'registered-heavy-hour', q: 100, w: HOUR },
} as const satisfies Record<string, BudgetPolicy>;
export type PolicyName = keyof typeof BUDGET_POLICIES;
export type BudgetPolicyTable = { readonly [P in PolicyName]: BudgetPolicy };

export const LANES = ['visitor', 'address', 'address-ceiling', 'platform', 'key', 'session', 'keyed-address-ceiling', 'heavy'] as const;
export type Lane = (typeof LANES)[number];

export interface LaneSpec {
  readonly prefix: string;
  readonly keyedBy: string;
  readonly policies: { readonly [T in Tier]?: readonly PolicyName[] };
}

export const BUDGET_LANES = {
  visitor: { prefix: 'v', keyedBy: 'the signed visitor cookie mf_vid', policies: { free: ['free-minute', 'visitor-day'] } },
  address: { prefix: 'a', keyedBy: 'the client address (IPv6 by /64), without a visitor cookie', policies: { free: ['free-minute', 'free-day'] } },
  'address-ceiling': { prefix: 'aa', keyedBy: 'the client address, all anonymous traffic', policies: { free: ['address-minute'] } },
  platform: { prefix: 'p', keyedBy: "an address in Anthropic's or OpenAI's published egress ranges", policies: { free: ['platform-minute'] } },
  key: { prefix: 'k', keyedBy: 'the account: all its keys share one lane', policies: { registered: ['registered-minute', 'registered-day'] } },
  session: { prefix: 's', keyedBy: 'the account, a partition of its own', policies: { registered: ['registered-minute', 'registered-day'] } },
  'keyed-address-ceiling': { prefix: 'ka', keyedBy: 'the client address, all keyed traffic', policies: { registered: ['keyed-address-minute'] } },
  heavy: { prefix: 'h', keyedBy: "the caller's own lane key", policies: { free: ['free-heavy-hour'], registered: ['registered-heavy-hour'] } },
} as const satisfies Record<Lane, LaneSpec>;

export const KIT_CONCURRENCY = 2;
export const BUDGET_EXEMPT_ROLES = ['house', 'admin'] as const;

export function laneTier(lane: Lane): Tier | null {
  const tiers = TIERS.filter((t) => (BUDGET_LANES[lane].policies as LaneSpec['policies'])[t] !== undefined);
  return tiers.length === 1 ? tiers[0]! : null;
}

export function lanePolicies(lane: Lane, tier: Tier, table: BudgetPolicyTable = BUDGET_POLICIES): readonly BudgetPolicy[] {
  const names = (BUDGET_LANES[lane].policies as LaneSpec['policies'])[tier];
  if (names === undefined) throw new RangeError(`lane ${lane} serves no ${tier} caller`);
  return names.map((n) => table[n]);
}

export function budgetPolicyTable(overrides: { readonly [P in PolicyName]?: { readonly q: number; readonly w: number } } = {}): BudgetPolicyTable {
  const out = { ...BUDGET_POLICIES } as Record<PolicyName, BudgetPolicy>;
  for (const name of Object.keys(overrides) as PolicyName[]) {
    const o = overrides[name]!;
    out[name] = checkPolicy({ name, q: o.q, w: o.w });
  }
  return out;
}

export function budgetKey(lane: Lane, id: string): string {
  return `${BUDGET_LANES[lane].prefix}:${id}`;
}

const KIT_PATH = /^\/c\/[^/]+\/kit$/;

export function isBudgetedPath(path: string): boolean {
  const p = path.split('?', 1)[0]!;
  return p.startsWith('/api/') || p === '/mcp' || p === '/mcp/public' || p.startsWith('/export/') || KIT_PATH.test(p);
}

export function isKitPath(path: string): boolean {
  return KIT_PATH.test(path.split('?', 1)[0]!);
}

export type BudgetClass = 'request' | 'heavy' | 'stream' | 'exempt';

export const BUDGET_CLASSES = {
  default: 'request',
  heavy: ['/c/:slug/kit', '/export/*', '/api/submissions/:id/download/*', '/api/submissions/:id/raw/*'],
  stream: ['*/stream'],
  exempt: ['/api/avatars/*', '/api/profiles/:handle/picture.png', '/api/auth/*', '/api/webhooks/*', '/api/telemetry/*', '/health', '/api/rate-limit', '/api/openapi*.json'],
} as const;

const patternCache = new Map<string, RegExp>();
function patternRe(pattern: string): RegExp {
  let re = patternCache.get(pattern);
  if (re === undefined) {
    const trailing = pattern.endsWith('/*');
    const body = trailing ? pattern.slice(0, -2) : pattern;
    const src = body
      .split(/(\*|:[A-Za-z_][A-Za-z0-9_]*)/)
      .map((part) => (part === '*' ? '.*' : part.startsWith(':') ? '[^/]+' : part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')))
      .join('');
    re = new RegExp(`^${src}${trailing ? '(?:/.*)?' : ''}$`);
    patternCache.set(pattern, re);
  }
  return re;
}

export function matchesBudgetPattern(pattern: string, path: string): boolean {
  return patternRe(pattern).test(path);
}

export function budgetClassOf(path: string): BudgetClass {
  const p = path.split('?', 1)[0]!;
  for (const cls of ['exempt', 'heavy', 'stream'] as const) {
    if (BUDGET_CLASSES[cls].some((pat) => matchesBudgetPattern(pat, p))) return cls;
  }
  return BUDGET_CLASSES.default;
}

export interface GcraResult {
  readonly allowed: boolean;
  readonly newTat: number;
  readonly remaining: number;
  readonly resetSeconds: number;
  readonly retryAfterSeconds: number;
}

function checkPolicy<P extends BudgetPolicy>(p: P): P {
  if (!Number.isSafeInteger(p.q) || p.q < 1 || !Number.isSafeInteger(p.w) || p.w < 1 || (p.w * 1000) % p.q !== 0) {
    throw new RangeError(`policy ${p.name}: q and w must be positive integers and q must divide 1000 * w, so w/q is whole ms (got q=${p.q}, w=${p.w})`);
  }
  return p;
}

function intervalMs(policy: BudgetPolicy): number {
  return (checkPolicy(policy).w * 1000) / policy.q;
}

const ceilSeconds = (ms: number): number => Math.max(0, Math.ceil(ms / 1000));

export function gcraPeek(tatMs: number, nowMs: number, policy: BudgetPolicy): { remaining: number; resetSeconds: number } {
  const t = intervalMs(policy);
  const limit = policy.w * 1000;
  const backlog = Math.max(tatMs, nowMs) - nowMs;
  const remaining = Math.min(policy.q, Math.max(0, Math.floor((limit - backlog) / t)));
  return { remaining, resetSeconds: ceilSeconds(remaining > 0 ? backlog : backlog + t - limit) };
}

function checkCost(cost: number): number {
  if (!Number.isSafeInteger(cost) || cost < 1) throw new RangeError(`a take costs a positive whole number of requests, not ${cost}`);
  return cost;
}

export function gcra(tatMs: number, nowMs: number, policy: BudgetPolicy, cost: number = 1): GcraResult {
  const t = intervalMs(policy);
  const limit = policy.w * 1000;
  const base = Math.max(tatMs, nowMs);
  const newTat = base + checkCost(cost) * t;
  const allowAt = newTat - limit;
  if (nowMs < allowAt) {
    const left = gcraPeek(tatMs, nowMs, policy);
    return { allowed: false, newTat: tatMs, ...left, retryAfterSeconds: cost > policy.q ? Math.max(1, left.resetSeconds) : ceilSeconds(allowAt - nowMs) };
  }
  const { remaining, resetSeconds } = gcraPeek(newTat, nowMs, policy);
  return { allowed: true, newTat, remaining, resetSeconds, retryAfterSeconds: 0 };
}

export interface PolicyResult extends GcraResult {
  readonly policy: BudgetPolicy;
}

export function gcraAll(
  tats: readonly number[],
  nowMs: number,
  policies: readonly BudgetPolicy[],
  cost: number = 1,
): { allowed: boolean; results: PolicyResult[]; violated: string[] } {
  const taken = policies.map((policy, i) => ({ ...gcra(tats[i] ?? 0, nowMs, policy, cost), policy }));
  const violated = taken.filter((r) => !r.allowed).map((r) => r.policy.name);
  if (violated.length === 0) return { allowed: true, results: taken, violated };
  const results = taken.map((r, i) => (r.allowed ? { ...r, ...gcraPeek(tats[i] ?? 0, nowMs, r.policy), newTat: tats[i] ?? 0 } : r));
  return { allowed: false, results, violated };
}

export function bindingResult<R extends PolicyResult>(results: readonly R[]): R | undefined {
  const binds = (a: R, b: R): boolean => {
    if (a.allowed !== b.allowed) return !a.allowed;
    if (!a.allowed) return a.retryAfterSeconds > b.retryAfterSeconds;
    return a.remaining < b.remaining || (a.remaining === b.remaining && a.resetSeconds > b.resetSeconds);
  };
  let best: R | undefined;
  for (const r of results) if (best === undefined || binds(r, best)) best = r;
  return best;
}

const sfString = (s: string): string => `"${s.replace(/[\\"]/g, '\\$&')}"`;

/**
 * The response headers for a lane's results (the lane names the tier; heavy is charged beside a base
 * lane, so pass that). Adds Retry-After when a policy refused.
 */
export function formatRateLimitHeaders(lane: Lane, results: readonly PolicyResult[], nowMs: number = Date.now()): Record<string, string> {
  const tier = laneTier(lane);
  if (tier === null) throw new RangeError(`lane ${lane} has no tier of its own: format with the caller's base lane`);
  const bind = bindingResult(results);
  if (bind === undefined) return {};
  const out: Record<string, string> = {
    'RateLimit-Policy': results.map((r) => `${sfString(r.policy.name)};q=${r.policy.q};w=${r.policy.w}`).join(', '),
    RateLimit: results.map((r) => `${sfString(r.policy.name)};r=${r.remaining};t=${r.resetSeconds}`).join(', '),
    'X-RateLimit-Limit': String(bind.policy.q),
    'X-RateLimit-Remaining': String(bind.remaining),
    'X-RateLimit-Reset': String(Math.ceil(nowMs / 1000) + bind.resetSeconds),
    'X-RateLimit-Resource': bind.policy.name,
    'X-RateLimit-Tier': tier,
  };
  if (!bind.allowed) out['Retry-After'] = String(bind.retryAfterSeconds);
  return out;
}

/** A fetch `Headers` (or anything with `get`), or a plain record such as Node's IncomingHttpHeaders. */
export type HeaderSource = { get(name: string): string | null } | { readonly [name: string]: string | readonly string[] | undefined };

function header(h: HeaderSource, name: string): string | null {
  if (typeof (h as { get?: unknown }).get === 'function') return (h as { get(name: string): string | null }).get(name);
  const rec = h as { readonly [name: string]: string | readonly string[] | undefined };
  for (const k of Object.keys(rec)) {
    if (k.toLowerCase() !== name) continue;
    const v = rec[k];
    return v === undefined ? null : typeof v === 'string' ? v : v.join(', ');
  }
  return null;
}

export interface ParsedPolicyItem {
  readonly name: string;
  readonly params: Readonly<Record<string, number | string | boolean>>;
}

/**
 * A Structured Fields List of String items with parameters (RFC 9651 §4.2.1, the subset the draft
 * uses). Lenient: a malformed member is skipped, the rest kept.
 */
export function parseSfPolicyList(value: string): ParsedPolicyItem[] {
  const out: ParsedPolicyItem[] = [];
  let i = 0;
  const ws = (): void => {
    while (value[i] === ' ' || value[i] === '\t') i++;
  };
  const str = (): string | null => {
    let s = '';
    for (i++; i < value.length; i++) {
      const c = value[i]!;
      if (c === '"') {
        i++;
        return s;
      }
      if (c === '\\') i++;
      s += value[i] ?? '';
    }
    return null;
  };
  const bare = (): number | string | boolean | null => {
    if (value[i] === '"') return str();
    const m = /^(?:-?\d+(?:\.\d+)?|\?[01]|:[A-Za-z0-9+/=]*:|[A-Za-z*][A-Za-z0-9_\-.:%*/!#$&'^`|~+]*)/.exec(value.slice(i));
    if (m === null) return null;
    i += m[0].length;
    const v = m[0];
    return v[0] === '?' ? v === '?1' : /^-?\d/.test(v) ? Number(v) : v;
  };
  const member = (): ParsedPolicyItem | null => {
    if (value[i] !== '"') return null;
    const name = str();
    if (name === null) return null;
    const params: Record<string, number | string | boolean> = {};
    while (value[i] === ';') {
      i++;
      ws();
      const key = /^[a-z*][a-z0-9_\-.*]*/.exec(value.slice(i))?.[0];
      if (key === undefined) return null;
      i += key.length;
      if (value[i] !== '=') {
        params[key] = true;
        continue;
      }
      i++;
      const v = bare();
      if (v === null) return null;
      params[key] = v;
    }
    ws();
    return i >= value.length || value[i] === ',' ? { name, params } : null;
  };
  const skip = (): void => {
    for (let quoted = false; i < value.length; i++) {
      const c = value[i];
      if (quoted && c === '\\') i++;
      else if (c === '"') quoted = !quoted;
      else if (c === ',' && !quoted) return;
    }
  };
  while (i < value.length) {
    ws();
    if (i >= value.length) break;
    const item = member();
    if (item === null) skip();
    else out.push(item);
    i++;
  }
  return out;
}

export interface ParsedBudget {
  readonly policy: string | null;
  readonly tier: string | null;
  readonly limit: number;
  readonly remaining: number;
  readonly resetMs: number;
  readonly policies: readonly { name: string; q: number | null; w: number | null; r: number | null; t: number | null }[];
}

const int = (s: string | null): number | null => (s !== null && /^\s*\d+\s*$/.test(s) ? Number(s) : null);
const num = (v: number | string | boolean | undefined): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);

export function parseRateLimitHeaders(headers: HeaderSource, nowMs: number = Date.now()): ParsedBudget | null {
  const age = int(header(headers, 'age'));
  if (age !== null && age > 0) return null;

  const policyItems = parseSfPolicyList(header(headers, 'ratelimit-policy') ?? '');
  const limitItems = parseSfPolicyList(header(headers, 'ratelimit') ?? '');
  const names = [...new Set([...policyItems, ...limitItems].map((p) => p.name))];
  const policies = names.map((name) => {
    const p = policyItems.find((x) => x.name === name)?.params ?? {};
    const l = limitItems.find((x) => x.name === name)?.params ?? {};
    return { name, q: num(p.q), w: num(p.w), r: num(l.r), t: num(l.t) };
  });

  const xLimit = int(header(headers, 'x-ratelimit-limit'));
  const xRemaining = int(header(headers, 'x-ratelimit-remaining'));
  const xReset = int(header(headers, 'x-ratelimit-reset'));
  const xResource = header(headers, 'x-ratelimit-resource')?.trim() || null;
  const tier = header(headers, 'x-ratelimit-tier')?.trim() || null;

  if (xLimit !== null && xRemaining !== null) {
    const t = policies.find((p) => p.name === xResource)?.t ?? null;
    const resetMs = t !== null ? t * 1000 : xReset !== null ? Math.max(0, xReset * 1000 - nowMs) : 0;
    return { policy: xResource, tier, limit: xLimit, remaining: xRemaining, resetMs, policies };
  }

  let bind: (typeof policies)[number] | undefined;
  for (const p of policies) {
    if (p.q === null || p.r === null) continue;
    if (bind === undefined || p.r < bind.r! || (p.r === bind.r && (p.t ?? 0) > (bind.t ?? 0))) bind = p;
  }
  if (bind === undefined) return null;
  return { policy: bind.name, tier, limit: bind.q!, remaining: bind.r!, resetMs: (bind.t ?? 0) * 1000, policies };
}

export function pacingDelayMs(pollMs: number, budget: Pick<ParsedBudget, 'limit' | 'remaining' | 'resetMs'> | null | undefined): number {
  if (budget == null || budget.remaining >= budget.limit * 0.1) return pollMs;
  return Math.max(pollMs, Math.ceil(budget.resetMs / Math.max(budget.remaining, 1)));
}
