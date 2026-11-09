import type { EscrowWindows, SolanaCluster } from './chain.js';
import type { CheckStatus, ProblemRetry, ProposalCheckId } from './entry.js';
import type { ApiError, CompetitionStatus, Page, Visibility } from './shared.js';
export type ProposalStatus = 'draft' | 'checking' | 'needs_fix' | 'ready' | 'in_review' | 'approved' | 'rejected' | 'withdrawn' | 'expired' | 'held' | 'setup_requested';
export type ProposalStage = 'draft' | 'checking' | 'fix_needed' | 'setup_requested' | 'in_review' | 'listed' | 'returned' | 'withdrawn' | 'expired' | 'held';
export type ProposalScoringSetBy = 'sponsor' | 'house';
export interface ProposalSetup {
    brief: string;
    examples: string | null;
    kind?: string;
    runtimes?: string[];
    requested_at: string;
    note: string | null;
    noted_at: string | null;
    outcome: 'finished' | 'returned' | 'withdrawn' | null;
    ended_at: string | null;
    template: string | null;
    rules_reviewed_at?: string | null;
}
export interface ProposalCheckResult {
    check: ProposalCheckId;
    status: CheckStatus;
    reason: string;
    fix: string | null;
}
export interface ProposalRejectionReason {
    check: ProposalCheckId;
    reason: string;
    fix?: string;
}
export interface ProposalRejection {
    type: string;
    title: string;
    status: number;
    detail: string;
    checks: ProposalCheckResult[];
    decided_at: string;
    proposal: string;
}
export interface ProposalProblem extends ApiError {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    proposal_id: string;
    checks: ProposalCheckResult[];
    retry: ProblemRetry;
    success: false;
}
export interface SponsorTermsClause {
    id: string;
    title: string;
    text: string;
}
export interface SponsorTerms {
    version: string;
    status: 'draft' | 'final';
    counsel_reviewed: boolean;
    title: string;
    summary: string;
    notice: string | null;
    clauses: SponsorTermsClause[];
}
export interface SponsorLimits {
    min_prize_usd: number | null;
    max_prize_usd: number | null;
    min_allowance_usd?: number | null;
    max_allowance_usd?: number | null;
    build_key_per_entrant_usd?: number;
    review_hours: number;
    min_entries_hours?: number;
    max_open: number;
    max_per_day: number;
    mint: string;
    cluster: SolanaCluster;
    schedule?: 'house' | 'test-windows';
    final_start_after_deadline_seconds?: number;
    dataset_scale?: number;
    escrow_windows?: EscrowWindows | null;
}
export interface SponsorAssistFacts {
    enabled: boolean;
    max_idea_chars: number;
    unlogged?: boolean;
}
export interface SponsorTermsResponse {
    terms: SponsorTerms;
    sha256: string;
    limits: SponsorLimits;
    intake_open: boolean;
    assist?: SponsorAssistFacts;
}
export interface SponsorProposalCreateBody {
    proposal: Record<string, unknown>;
    wallet?: string;
}
export interface SponsorProposalPatchBody {
    proposal?: Record<string, unknown>;
    wallet?: string;
}
export interface ProposalAssistBody {
    idea: string;
}
export interface ProposalDepositBody {
    terms_version?: string;
}
export interface ProposalSubmitBody {
    transaction: string;
}
export type ProposalNextAction = 'edit' | 'run_checks' | 'fix' | 'request_setup' | 'accept_terms' | 'deposit' | 'submit_deposit' | 'withdraw' | 'wait' | 'propose_again' | 'link_wallet';
export interface ProposalNextStep {
    action: ProposalNextAction;
    method: 'GET' | 'POST' | 'PATCH';
    href: string;
    until?: string;
    why: string;
}
export interface ProposalDepositFacts {
    proposal: string;
    vault: string;
    mint: string;
    decimals: number;
    total_base_units: string;
    bundle_sha256: string | null;
    opens_at: string;
    submit_tx: string | null;
    explorer: string;
}
export type AllowanceStatus = 'pending' | 'held' | 'refund_owed' | 'refunded';
export interface SponsorProposalAllowance {
    usd: string;
    status: AllowanceStatus | null;
    spent_usd: string | null;
    refund_usd: string | null;
    refund_tx: string | null;
}
export interface ProposalDepositAllowance {
    usd: string;
    base_units: string;
    to: string;
    token_account: string;
}
export interface SponsorProposalSummary {
    id: string;
    competition_id: string;
    slug: string;
    title: string;
    status: ProposalStatus;
    stage: ProposalStage;
    review_deadline: string | null;
    created_at: string;
    updated_at: string;
}
export interface SponsorProposalView {
    id: string;
    competition_id: string;
    status: ProposalStatus;
    stage: ProposalStage;
    wallet: string;
    cluster: SolanaCluster;
    program_id: string;
    proposal: Record<string, unknown>;
    written_sha256?: string;
    scoring: {
        custom: boolean;
        set_by: ProposalScoringSetBy;
        setup: ProposalSetup | null;
    };
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        visibility: Visibility;
        bundle_sha256: string | null;
    };
    checks: ProposalCheckResult[];
    checked_at: string | null;
    terms: {
        accepted_version: string | null;
        accepted_at: string | null;
        current_version: string;
    };
    rules_sha256: string | null;
    review_deadline: string | null;
    deposit: ProposalDepositFacts | null;
    allowance?: SponsorProposalAllowance | null;
    decision: {
        approve_tx: string | null;
        close_tx: string | null;
        decided_at: string | null;
    };
    rejection: ProposalRejection | null;
    next_steps: ProposalNextStep[];
    created_at: string;
    updated_at: string;
}
export type ProposalSetupRequestResponse = SponsorProposalView;
export interface ProposalChecksResponse {
    proposal: SponsorProposalView;
    problem: ProposalProblem | null;
    rent_lamports?: string | null;
    wallet_short?: ProposalWalletShort | null;
}
export interface ProposalWalletShort {
    wallet: string;
    mint: string;
    decimals: number;
    token_base_units: string | null;
    lamports: string | null;
}
export type ProposalDepositGateId = 'intake' | 'checks' | 'terms' | 'sanctions' | 'geo' | 'limits' | 'wallet';
export interface ProposalDepositGate {
    gate: ProposalDepositGateId;
    status: CheckStatus;
    reason: string;
    fix: string | null;
}
export interface ProposalDepositProblem extends ProposalProblem {
    gates: ProposalDepositGate[];
}
export interface ProposalDepositResponse {
    proposal_id: string;
    transaction: string;
    fee_payer: string;
    curator: string;
    last_valid_block_height: string;
    proposal: string;
    vault: string;
    escrow: string;
    mint: string;
    decimals: number;
    total_base_units: string;
    allowance?: ProposalDepositAllowance | null;
    rules_sha256: string;
    bundle_sha256: string | null;
    written_sha256?: string;
    opens_at: string;
    review_deadline: string;
    terms_version: string;
    gates: ProposalDepositGate[];
    checks: ProposalCheckResult[];
    submit: ProposalNextStep;
    rent_lamports?: string;
}
export type ProposalAssistField = 'competition.title' | 'competition.summary' | 'competition.description' | 'competition.category' | 'harness' | 'scoring.custom.kind' | 'scoring.custom.runtimes' | 'scoring.custom.brief' | 'scoring.custom.examples' | 'prizes' | 'competition.duration_hours';
export interface ProposalAssistResponse {
    proposal: Record<string, unknown>;
    fit_reason: string | null;
    filled: ProposalAssistField[];
}
export interface ProposalSubmitResponse {
    proposal_id: string;
    signature: string;
    commitment: 'confirmed';
    status: ProposalStatus;
    proposal: string;
    review_deadline: string;
    explorer: string;
}
export interface ProposalWithdrawResponse {
    proposal_id: string;
    transaction: string;
    fee_payer: string;
    proposal: string;
    sponsor_token_account: string;
    vault_base_units: string;
    last_valid_block_height: string;
    why: string;
}
export interface SponsorRoutes {
    'GET /api/sponsor/terms': {
        response: SponsorTermsResponse;
    };
    'GET /api/sponsor/proposals': {
        query: {
            limit?: number | string;
            cursor?: string;
        };
        response: Page<SponsorProposalSummary>;
    };
    'POST /api/sponsor/proposals': {
        body: SponsorProposalCreateBody;
        response: SponsorProposalView;
    };
    'POST /api/sponsor/proposals/assist': {
        body: ProposalAssistBody;
        response: ProposalAssistResponse;
    };
    'GET /api/sponsor/proposals/:id': {
        params: {
            id: string;
        };
        response: SponsorProposalView;
    };
    'PATCH /api/sponsor/proposals/:id': {
        params: {
            id: string;
        };
        body: SponsorProposalPatchBody;
        response: SponsorProposalView;
    };
    'POST /api/sponsor/proposals/:id/checks': {
        params: {
            id: string;
        };
        response: ProposalChecksResponse;
    };
    'POST /api/sponsor/proposals/:id/request-setup': {
        params: {
            id: string;
        };
        response: ProposalSetupRequestResponse;
    };
    'POST /api/sponsor/proposals/:id/deposit': {
        params: {
            id: string;
        };
        body: ProposalDepositBody;
        response: ProposalDepositResponse;
    };
    'POST /api/sponsor/proposals/:id/deposit/submit': {
        params: {
            id: string;
        };
        body: ProposalSubmitBody;
        response: ProposalSubmitResponse;
    };
    'POST /api/sponsor/proposals/:id/withdraw': {
        params: {
            id: string;
        };
        response: ProposalWithdrawResponse;
    };
    'GET /api/sponsor/activity': {
        response: SponsorActivityResponse;
    };
}
export type SponsorActivityKind = 'proposed' | 'setup_requested' | 'setup_finished' | 'setup_returned' | 'funded' | 'listed' | 'rejected' | 'withdrawn' | 'expired';
export interface SponsorActivityEvent {
    id: string;
    kind: SponsorActivityKind;
    at: string;
    proposal_id: string;
    title: string;
    competition_slug: string | null;
}
export interface SponsorActivityCounts {
    running: number;
    waiting: number;
}
export interface SponsorActivityResponse {
    counts: SponsorActivityCounts;
    events: SponsorActivityEvent[];
}
//# sourceMappingURL=proposal.d.ts.map