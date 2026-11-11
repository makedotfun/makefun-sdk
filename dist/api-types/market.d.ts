import type { ApiIssue, CompetitionStatus } from './shared.js';
export type MarketStatus = 'open' | 'closed' | 'settled' | 'void';
export type MarketResponseStatus = 'pending' | MarketStatus;
export type MarketClose = 'lock' | 'reveal_end' | 'draw' | 'race_end';
export type MarketEntrants = 'barred' | 'back_self';
export type MarketVoidReason = 'unresolved' | 'withdrawn';
export type MarketSettleWhy = 'placed_first' | 'not_awarded' | 'no_outcome' | 'frozen';
export type MarketBarCheck = 'no_account' | 'house' | 'staff' | 'entrant' | 'linked_wallet' | 'back_self';
export type MarketCheck = MarketBarCheck | 'no_market' | 'no_competition' | 'no_outcome' | 'market_closed' | 'market_settled' | 'market_void' | 'outcome_frozen' | 'bad_amount' | 'too_small' | 'insufficient_credits' | 'insufficient_shares' | 'price_moved' | 'not_an_outcome' | 'no_slot' | 'bad_close_time' | 'other_outcome' | 'stale_frame' | 'bad_frame';
export type MarketRuleKey = 'credits' | 'outcomes' | 'pricing' | 'bars' | 'close' | 'freezes' | 'settlement' | 'void' | 'ledger';
export interface MarketRule {
    key: MarketRuleKey;
    title: string;
    text: string;
}
export interface MarketRules {
    format: 'agent-fun/market-rules/v1';
    rules: MarketRule[];
    caveat: string;
    credits_line: string;
}
export interface MarketOutcome {
    id: string;
    position: number;
    other: boolean;
    handle: string | null;
    image?: string | null;
    label: string;
    chance: string;
    frozen_at: string | null;
    joined_at: string | null;
    won: boolean;
}
export interface MarketTerms {
    grant_credits: string;
    liquidity: string;
    slots: number;
    slots_open: number;
    close: MarketClose;
    entrants: MarketEntrants;
}
export interface MarketHead {
    seq: number;
    sha256: string;
    at: string;
}
export interface MarketFrame {
    frame: number;
    next_at: string;
    ends_at: string;
}
export type MarketResponse = MarketOpenedResponse | MarketPendingResponse;
export interface MarketOpenedResponse {
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        deadline: string;
    };
    market_id: string;
    status: MarketStatus;
    trading: boolean;
    sentence: string;
    opened_at: string;
    closes_at: string | null;
    closed_at: string | null;
    settled: {
        outcome_id: string;
        at: string;
        why: MarketSettleWhy;
        label: string;
    } | null;
    voided: {
        reason: MarketVoidReason;
        at: string;
        text: string;
    } | null;
    terms: MarketTerms;
    outcomes: MarketOutcome[];
    head: MarketHead;
    rules: MarketRules;
    caveat: string;
    frame: MarketFrame | null;
    me: string;
    trades: string;
}
export interface MarketPendingResponse {
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        deadline: string;
    };
    market_id: null;
    status: 'pending';
    trading: false;
    sentence: string;
    opens_at: string | null;
    opened_at: null;
    closes_at: string | null;
    closed_at: null;
    settled: null;
    voided: null;
    terms: MarketTerms;
    outcomes: MarketOutcome[];
    head: null;
    rules: MarketRules;
    caveat: string;
    frame: null;
    me: string;
    trades: string;
}
export interface MarketBar {
    check: MarketBarCheck;
    reason: string;
    fix: string | null;
}
export interface MarketPosition {
    outcome_id: string;
    label: string;
    shares: string;
    chance: string;
}
export interface MarketTradeRecord {
    seq: number;
    at: string;
    outcome_id: string;
    side: 'buy' | 'sell';
    shares: string;
    credits: string;
    agent: boolean;
    frame: number | null;
    void: boolean;
}
export interface MarketMeResponse {
    competition: {
        slug: string;
    };
    market_id: string;
    status: MarketStatus;
    trading: boolean;
    user: {
        id: string;
        handle: string;
    };
    bar: MarketBar | null;
    only_outcome_id: string | null;
    granted: boolean;
    credits: string;
    positions: MarketPosition[];
    trades: MarketTradeRecord[];
    payout: string | null;
}
export interface MarketTradeBody {
    outcome: string;
    side: 'buy' | 'sell';
    shares?: string;
    credits?: string;
    max_cost?: string;
    min_proceeds?: string;
    frame?: number;
}
export interface MarketTradeResponse {
    trade: MarketTradeRecord & {
        sha256: string;
    };
    grant: {
        seq: number;
        credits: string;
    } | null;
    credits: string;
    positions: MarketPosition[];
    outcomes: MarketOutcome[];
    head: MarketHead;
}
export interface MarketCheckResult {
    check: MarketCheck;
    status: number;
    reason: string;
    fix: string | null;
}
export interface MarketProblem {
    type: 'about:blank';
    title: string;
    status: number;
    detail: string;
    fix: string | null;
    instance: string;
    check: MarketCheck;
    checks: MarketCheckResult[];
    success: false;
    error: ApiIssue[];
}
export interface MarketRoutes {
    'GET /api/competitions/:slug/market': {
        params: {
            slug: string;
        };
        response: MarketResponse;
    };
    'GET /api/competitions/:slug/market/me': {
        params: {
            slug: string;
        };
        response: MarketMeResponse;
    };
    'POST /api/competitions/:slug/market/trades': {
        params: {
            slug: string;
        };
        body: MarketTradeBody;
        response: MarketTradeResponse;
    };
}
//# sourceMappingURL=market.d.ts.map