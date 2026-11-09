export interface ApiIssue {
    message: string;
    path?: (string | number)[];
}
export interface ApiError {
    success: false;
    error: ApiIssue[];
    data?: unknown;
}
export interface Page<T> {
    items: T[];
    next_cursor: string | null;
}
export interface PageQuery {
    limit?: number | string;
    cursor?: string;
}
export type ProfileRole = 'entrant' | 'house' | 'admin';
export type Visibility = 'public' | 'internal';
export type CompetitionStatus = 'draft' | 'open' | 'closed' | 'resolved';
export type HarnessKind = 'pumpfun-replay/v2' | 'program/v1' | 'bars-replay/v1' | 'agent/v1' | 'clmm-replay/v1' | 'scrape/v1' | 'patch/v1';
export type PhaseKey = 'dev' | 'final';
export type SubmissionStatus = 'none' | 'submitting' | 'submitted' | 'preparing' | 'running' | 'scoring' | 'awaiting_validation' | 'finished' | 'failed' | 'cancelled' | 'nondeterministic' | 'timeout';
export type SubmissionVia = 'web' | 'api';
export type TranscriptSource = 'claude-code' | 'codex' | 'cursor' | 'specstory' | 'chatgpt-export' | 'claude-export';
export type ProvenanceTier = 'agent-log' | 'self-reported';
export type CostProvenance = ProvenanceTier | 'none' | 'metered';
export type RunKind = 'grade' | 'regrade_l1' | 'regrade_l2';
export type RunStatus = 'queued' | 'running' | 'scoring' | 'finished' | 'failed' | 'cancelled' | 'nondeterministic' | 'timeout';
export type PrizeKind = 'placement' | 'efficiency';
export type PayoutStatus = 'pending_info' | 'ready' | 'paid' | 'forfeited' | 'void';
export type PayoutMethod = 'usdc-solana' | 'wire';
export type TaxForm = 'W-9' | 'W-8BEN';
export type CommentAuthorKind = 'sponsor' | 'hunter' | 'agent';
export type CommentState = 'published' | 'held' | 'hidden';
export type CommentReactionKind = 'like';
export type CommentReportReason = 'scam' | 'spam' | 'impersonation' | 'other';
export interface PublicReceipt {
    id: string;
    server_time: string;
    repo: string;
    commit: string;
    snapshot_sha256: string;
    bundle_sha256: string;
    pricing_rev: string;
    freshness_round?: number;
}
export type SourceServedBy = 'mirror' | 'origin';
export interface EntryClone {
    clone_url?: string;
    served_by?: SourceServedBy | null;
    origin_url?: string | null;
}
export interface RouteSpec {
    response: unknown;
    body?: unknown;
    query?: unknown;
    params?: unknown;
}
//# sourceMappingURL=shared.d.ts.map