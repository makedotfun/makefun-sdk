export declare const DRAFT_REVISION = "draft-ietf-httpapi-ratelimit-headers-11";
export declare const DRAFT_EXPIRES = "2026-11-24";
export declare const TIERS: readonly ['free', 'registered'];
export type Tier = (typeof TIERS)[number];
export interface BudgetPolicy {
    readonly name: string;
    readonly q: number;
    readonly w: number;
}
export declare const BUDGET_POLICIES: {
    readonly 'free-minute': {
        readonly name: 'free-minute';
        readonly q: 60;
        readonly w: 60;
    };
    readonly 'free-day': {
        readonly name: 'free-day';
        readonly q: 5000;
        readonly w: 86400;
    };
    readonly 'visitor-day': {
        readonly name: 'visitor-day';
        readonly q: 20000;
        readonly w: 86400;
    };
    readonly 'address-minute': {
        readonly name: 'address-minute';
        readonly q: 300;
        readonly w: 60;
    };
    readonly 'platform-minute': {
        readonly name: 'platform-minute';
        readonly q: 300;
        readonly w: 60;
    };
    readonly 'registered-minute': {
        readonly name: 'registered-minute';
        readonly q: 300;
        readonly w: 60;
    };
    readonly 'registered-day': {
        readonly name: 'registered-day';
        readonly q: 50000;
        readonly w: 86400;
    };
    readonly 'keyed-address-minute': {
        readonly name: 'keyed-address-minute';
        readonly q: 1200;
        readonly w: 60;
    };
    readonly 'free-heavy-hour': {
        readonly name: 'free-heavy-hour';
        readonly q: 10;
        readonly w: 3600;
    };
    readonly 'registered-heavy-hour': {
        readonly name: 'registered-heavy-hour';
        readonly q: 100;
        readonly w: 3600;
    };
};
export type PolicyName = keyof typeof BUDGET_POLICIES;
export type BudgetPolicyTable = {
    readonly [P in PolicyName]: BudgetPolicy;
};
export declare const LANES: readonly ['visitor', 'address', 'address-ceiling', 'platform', 'key', 'session', 'keyed-address-ceiling', 'heavy'];
export type Lane = (typeof LANES)[number];
export interface LaneSpec {
    readonly prefix: string;
    readonly keyedBy: string;
    readonly policies: {
        readonly [T in Tier]?: readonly PolicyName[];
    };
}
export declare const BUDGET_LANES: {
    readonly visitor: {
        readonly prefix: 'v';
        readonly keyedBy: 'the signed visitor cookie mf_vid';
        readonly policies: {
            readonly free: readonly ["free-minute", "visitor-day"];
        };
    };
    readonly address: {
        readonly prefix: 'a';
        readonly keyedBy: 'the client address (IPv6 by /64), without a visitor cookie';
        readonly policies: {
            readonly free: readonly ["free-minute", "free-day"];
        };
    };
    readonly 'address-ceiling': {
        readonly prefix: 'aa';
        readonly keyedBy: 'the client address, all anonymous traffic';
        readonly policies: {
            readonly free: readonly ["address-minute"];
        };
    };
    readonly platform: {
        readonly prefix: 'p';
        readonly keyedBy: "an address in Anthropic's or OpenAI's published egress ranges";
        readonly policies: {
            readonly free: readonly ["platform-minute"];
        };
    };
    readonly key: {
        readonly prefix: 'k';
        readonly keyedBy: 'the account: all its keys share one lane';
        readonly policies: {
            readonly registered: readonly ["registered-minute", "registered-day"];
        };
    };
    readonly session: {
        readonly prefix: 's';
        readonly keyedBy: 'the account, a partition of its own';
        readonly policies: {
            readonly registered: readonly ["registered-minute", "registered-day"];
        };
    };
    readonly 'keyed-address-ceiling': {
        readonly prefix: 'ka';
        readonly keyedBy: 'the client address, all keyed traffic';
        readonly policies: {
            readonly registered: readonly ["keyed-address-minute"];
        };
    };
    readonly heavy: {
        readonly prefix: 'h';
        readonly keyedBy: "the caller's own lane key";
        readonly policies: {
            readonly free: readonly ["free-heavy-hour"];
            readonly registered: readonly ["registered-heavy-hour"];
        };
    };
};
export declare const KIT_CONCURRENCY = 2;
export declare const BUDGET_EXEMPT_ROLES: readonly ['house', 'admin'];
export declare function laneTier(lane: Lane): Tier | null;
export declare function lanePolicies(lane: Lane, tier: Tier, table?: BudgetPolicyTable): readonly BudgetPolicy[];
export declare function budgetPolicyTable(overrides?: {
    readonly [P in PolicyName]?: {
        readonly q: number;
        readonly w: number;
    };
}): BudgetPolicyTable;
export declare function budgetKey(lane: Lane, id: string): string;
export declare function isBudgetedPath(path: string): boolean;
export declare function isKitPath(path: string): boolean;
export type BudgetClass = 'request' | 'heavy' | 'stream' | 'exempt';
export declare const BUDGET_CLASSES: {
    readonly default: 'request';
    readonly heavy: readonly ['/c/:slug/kit', '/export/*', '/api/submissions/:id/download/*', '/api/submissions/:id/raw/*'];
    readonly stream: readonly ['*/stream'];
    readonly exempt: readonly ['/api/avatars/*', '/api/profiles/:handle/picture.png', '/api/auth/*', '/api/webhooks/*', '/api/telemetry/*', '/health', '/api/rate-limit', '/api/openapi*.json'];
};
export declare function matchesBudgetPattern(pattern: string, path: string): boolean;
export declare function budgetClassOf(path: string): BudgetClass;
export interface GcraResult {
    readonly allowed: boolean;
    readonly newTat: number;
    readonly remaining: number;
    readonly resetSeconds: number;
    readonly retryAfterSeconds: number;
}
export declare function gcraPeek(tatMs: number, nowMs: number, policy: BudgetPolicy): {
    remaining: number;
    resetSeconds: number;
};
export declare function gcra(tatMs: number, nowMs: number, policy: BudgetPolicy, cost?: number): GcraResult;
export interface PolicyResult extends GcraResult {
    readonly policy: BudgetPolicy;
}
export declare function gcraAll(tats: readonly number[], nowMs: number, policies: readonly BudgetPolicy[], cost?: number): {
    allowed: boolean;
    results: PolicyResult[];
    violated: string[];
};
export declare function bindingResult<R extends PolicyResult>(results: readonly R[]): R | undefined;
/**
 * The response headers for a lane's results (the lane names the tier; heavy is charged beside a base
 * lane, so pass that). Adds Retry-After when a policy refused.
 */
export declare function formatRateLimitHeaders(lane: Lane, results: readonly PolicyResult[], nowMs?: number): Record<string, string>;
/** A fetch `Headers` (or anything with `get`), or a plain record such as Node's IncomingHttpHeaders. */
export type HeaderSource = {
    get(name: string): string | null;
} | {
    readonly [name: string]: string | readonly string[] | undefined;
};
export interface ParsedPolicyItem {
    readonly name: string;
    readonly params: Readonly<Record<string, number | string | boolean>>;
}
/**
 * A Structured Fields List of String items with parameters (RFC 9651 §4.2.1, the subset the draft
 * uses). Lenient: a malformed member is skipped, the rest kept.
 */
export declare function parseSfPolicyList(value: string): ParsedPolicyItem[];
export interface ParsedBudget {
    readonly policy: string | null;
    readonly tier: string | null;
    readonly limit: number;
    readonly remaining: number;
    readonly resetMs: number;
    readonly policies: readonly {
        name: string;
        q: number | null;
        w: number | null;
        r: number | null;
        t: number | null;
    }[];
}
export declare function parseRateLimitHeaders(headers: HeaderSource, nowMs?: number): ParsedBudget | null;
export declare function pacingDelayMs(pollMs: number, budget: Pick<ParsedBudget, 'limit' | 'remaining' | 'resetMs'> | null | undefined): number;
//# sourceMappingURL=budget-policy.d.ts.map