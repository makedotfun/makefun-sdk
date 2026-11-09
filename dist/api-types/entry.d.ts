import type { EscrowStatus, EscrowView, HoldReason, PayoutRail, PrizeLeafStatus, SolanaCluster } from './chain.js';
import type { Payout, PayoutAutopayHold } from './community.js';
import type { MyReferralsResponse } from './referrals.js';
import type { ApiError, ApiIssue, CompetitionStatus, HarnessKind, Page, PageQuery, PayoutStatus, PrizeKind } from './shared.js';
export type EntryStageKey = 'open' | 'submitted' | 'checked' | 'scored' | 'challenge' | 'paid' | 'rejected' | 'held';
export type EntryOutcome = 'won' | 'placed' | 'unranked' | 'superseded' | 'refunded';
export type IntakeCheckId = 'account_wallet' | 'competition_open' | 'quota' | 'form' | 'entry_signature' | 'repo_owner' | 'repo_public' | 'license_osi' | 'repo_created_after_open' | 'commit_in_repo' | 'duplicate_snapshot' | 'source_bundle' | 'sponsor_self_entry' | EntrySizeCheckId | 'committed_provider_key' | 'patch_entry' | 'committed_secret' | 'security_audit';
export type EntrySizeCheckId = 'entry_size';
export type TranscriptCheckId = 'transcripts_present' | 'thinking_wellformed' | 'thinking_in_window' | 'thinking_committed' | 'thinking_reproduces' | 'thinking_on_task' | 'thinking_turns' | 'thinking_priced' | 'thinking_revised' | 'thinking_fresh';
export type GradingCheckId = 'run_completes' | 'run_deterministic' | 'hindsight_clean' | 'distinct_entrant' | 'model_call' | 'dev_profitable';
export type ClaimRequestCheckId = 'claim_rate' | 'claim_root';
export type ClaimCheckId = 'claim_sanctions' | 'claim_geo' | 'claim_tax_form';
export type CheckId = IntakeCheckId | TranscriptCheckId | GradingCheckId | ClaimRequestCheckId | ClaimCheckId;
export type ProposalAutoCheckId = 'proposal_schema' | 'proposal_bundle' | 'proposal_prizes' | 'proposal_schedule' | 'proposal_category' | 'proposal_files' | 'proposal_reference' | 'proposal_rules_reviewed' | 'proposal_pack' | 'proposal_wallet' | 'proposal_rate';
export type ProposalReviewCheckId = 'proposal_unclear_task' | 'proposal_gameable_scoring' | 'proposal_not_allowed' | 'proposal_duplicate' | 'proposal_sponsor_identity' | 'proposal_other';
export type ProposalCheckId = ProposalAutoCheckId | ProposalReviewCheckId;
export type AnyCheckId = CheckId | ProposalCheckId;
export type CheckPhase = 'intake' | 'transcripts' | 'grading' | 'claim_request' | 'claim' | 'proposal';
export type CheckStatus = 'pass' | 'fail' | 'skip';
export interface CheckResult {
    check: CheckId;
    status: CheckStatus;
    reason: string;
    fix: string | null;
    hold?: HoldReason;
}
export type EntryCheckStatus = CheckStatus | 'note';
export interface EntryCheckResult extends Omit<CheckResult, 'status'> {
    status: EntryCheckStatus;
}
export type EntryHindsightState = 'pass' | 'held' | 'cleared' | 'disqualified';
export interface EntryHindsightRung {
    copies: number;
    real: string;
    highest: string;
    median: string;
    gap: string;
    threshold: string;
    flagged: boolean;
}
export interface EntryHindsight {
    state: EntryHindsightState;
    sentence: string;
    rungs: {
        j: EntryHindsightRung;
        b: EntryHindsightRung;
    } | null;
    appealUntil: string | null;
}
export interface HindsightAppealWindow {
    allowed: boolean;
    until: string | null;
    filed_at: string | null;
    why: string;
}
export interface HindsightEvidenceView {
    submission_id: string;
    competition: string;
    state: EntryHindsightState | null;
    check: CheckResult | null;
    problem_type: string;
    sealed: boolean;
    records: {
        kind: 'audit' | 'appeal';
        recorded_at: string;
        m: number;
        record_sha256: string;
        flagged: boolean;
        reasons: string[];
        numbers: string;
    }[];
    verdicts: {
        verdict: 'clear' | 'disqualify';
        reason: string;
        decided_at: string;
    }[];
    appeal: HindsightAppealWindow;
}
export interface HindsightAppealRequest {
    statement?: string;
}
export interface HindsightAppealResponse {
    submission_id: string;
    competition: string;
    appeal: {
        attempt: string;
        filed_at: string;
        against: {
            verdict: 'disqualify';
            decided_at: string;
        };
        m: number;
        job_id: string;
        statement: string | null;
    };
    note: string;
}
export interface ProblemRetry {
    allowed: boolean;
    until: string | null;
    unchanged_will_fail: boolean;
}
export interface EntryProblem extends ApiError {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    submission_id: string | null;
    competition: string;
    round: number | null;
    stage: EntryStageKey;
    checks: CheckResult[];
    retry: ProblemRetry;
    success: false;
}
export interface ProblemTypeDoc {
    type: string;
    check: AnyCheckId;
    phase: CheckPhase;
    title: string;
    description: string;
    status: number;
    fix: string;
    field: string | null;
    retryable: boolean;
    unchanged_will_fail: boolean;
    hold: HoldReason | null;
}
export type WireNextStepAction = 'submit' | 'resubmit' | 'link_wallet' | 'wait' | 'verify_result' | 'challenge' | 'claim' | 'file_tax_form' | 'request_claim' | 'appeal' | 'push_secrets';
export type WireNextStepMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'CLI';
export interface WireNextStep {
    action: WireNextStepAction;
    method: WireNextStepMethod;
    href: string;
    until?: string;
    why: string;
}
export interface EntryDeadlines {
    entries_close: string | null;
    final_window_start: string | null;
    result_due: string | null;
    challenge_ends: string | null;
    claim_deadline: string | null;
}
export interface EntryPayout {
    id?: string | null;
    rail: PayoutRail;
    prize: PrizeKind;
    place: number | null;
    amount_usd: string;
    amount_base_units: string | null;
    mint: string | null;
    decimals: number | null;
    status: PrizeLeafStatus | PayoutStatus;
    claim_id: string | null;
    hold_reason: HoldReason | null;
    expected_by: string | null;
    hindsight_pending?: true;
    claim_deadline: string | null;
    claim_tx: string | null;
    autopay_hold?: PayoutAutopayHold;
    tax_details_required?: boolean;
    tax_threshold_usd?: string;
}
export interface EntryOnchain {
    cluster: SolanaCluster;
    program_id: string;
    escrow: string;
    escrow_status: EscrowStatus;
    entries_root: string | null;
    entry_leaf: {
        leaf: string;
        proof: string[];
    } | null;
    result_sha256: string | null;
    payout_root: string | null;
    txs: {
        commit: string | null;
        post: string | null;
        claim: string | null;
    };
    explorer: string;
}
export interface DeadlineEntryLeaf {
    submission_id: string;
    received_at: string;
    repo_url: string;
    commit_sha: string;
    transcripts_sha256: string | null;
}
export interface EntryDeadlineCommitment {
    sha256: string;
    committed_at: string;
    root: string;
    entry: {
        leaf: DeadlineEntryLeaf | null;
        hash: string;
        proof: string[];
    } | null;
}
export interface EntryStatus {
    submission_id: string;
    competition: string;
    view: 'owner' | 'public';
    stage: EntryStageKey;
    outcome: EntryOutcome | null;
    round: number;
    checks: EntryCheckResult[];
    problem: EntryProblem | null;
    next_steps: WireNextStep[];
    deadlines: EntryDeadlines;
    payout: EntryPayout | null;
    onchain: EntryOnchain | null;
    hindsight?: EntryHindsight;
    deadline_commitment?: EntryDeadlineCommitment;
    claim_code?: string;
    model_spend_micro_usd?: string;
}
export interface RequirementDeliverable {
    name: string;
    kind: 'form_field' | 'file' | 'repo_file';
    required: boolean;
    description: string;
}
export type RequirementValue = number | string | string[];
export interface RequirementCheck {
    check: CheckId;
    phase: CheckPhase;
    title: string;
    description: string;
    type: string;
    fix: string;
    threshold: {
        [name: string]: RequirementValue;
    } | null;
    applies: boolean;
}
export interface PayoutCurvePlace {
    place: number;
    amount_usd: string;
    amount_base_units: string | null;
    share: number;
}
export interface PayoutCurve {
    rail: PayoutRail;
    total_usd: string;
    total_base_units: string | null;
    mint: string | null;
    decimals: number | null;
    places: PayoutCurvePlace[];
    offchain: Array<{
        prize: PrizeKind;
        amount_usd: string;
        note: string;
    }>;
}
export interface HowToSubmit {
    method: 'POST';
    href: string;
    content_type: 'multipart/form-data';
    auth: string[];
    fields: string[];
    entry_message_template: string | null;
    cli: string;
    source_bundle: HowToSubmitBundle;
}
export interface DrandChainInfo {
    scheme: string;
    hash: string;
    public_key: string;
    genesis_time: number;
    period: number;
}
export interface HowToSubmitBundle {
    deliverable: RequirementDeliverable;
    fields: string[];
    repo_url: string;
    max_bytes: number;
    entry_message_template: string;
    anchor_path: string;
    drand: DrandChainInfo;
    round_min: number;
    round_min_required: boolean;
    init: string;
    cli: string;
}
export interface Requirements {
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        harness: HarnessKind;
    };
    deliverables: RequirementDeliverable[];
    checks: RequirementCheck[];
    quota: {
        max_per_day: number;
        window: 'utc_day';
        refused_attempts_count: boolean;
        github_checks_per_hour: number;
    };
    deadlines: EntryDeadlines;
    payout_curve: PayoutCurve;
    escrow: EscrowView | null;
    how_to_submit: HowToSubmit;
}
export type ClaimTaxForm = 'not_needed' | 'on_file' | 'needed';
export interface PayoutRailRef {
    rail: PayoutRail;
    claim_id: string | null;
}
export interface ClaimProblem extends EntryProblem {
    tax_form?: ClaimTaxForm;
    hold_reason?: HoldReason;
    expected_by?: string;
    hindsight_pending?: true;
}
export interface ClaimSummary {
    claim_id: string;
    competition: string;
    cluster: SolanaCluster;
    escrow: string;
    mint: string;
    decimals: number;
    amount_base_units: string;
    claimed_base_units: string;
    status: PrizeLeafStatus;
    hold_reason: HoldReason | null;
    claim_deadline: string | null;
}
export interface ClaimTicket {
    claim_id: string;
    competition: string;
    cluster: SolanaCluster;
    program_id: string;
    escrow: string;
    mint: string;
    decimals: number;
    claimant: string;
    leaf_index: number;
    amount_base_units: string;
    claimed_base_units: string;
    proof: string[];
    payout_root: string;
    claim_deadline: string;
    requested_at: string | null;
    hold_window_ends: string | null;
    status: PrizeLeafStatus;
    hold_reason: HoldReason | null;
    expected_by: string | null;
    hindsight_pending?: true;
    steps: WireNextStep[];
}
export interface W9Form {
    legal_name: string;
    business_name?: string;
    tin_kind: 'ssn' | 'ein';
    tin: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
    };
    certified: true;
}
export interface ClearanceRequest {
    us_person: boolean;
    tax_form?: W9Form;
    accepts_priority_fee?: boolean;
}
export interface ClearanceResponse {
    decision: 'clear';
    claim_id: string;
    transaction: string;
    fee_payer: string;
    last_valid_block_height: string;
    checks: CheckResult[];
    tax_form: ClaimTaxForm;
    submit: WireNextStep;
}
export interface ClaimSubmitRequest {
    transaction: string;
}
export interface ClaimSubmitResponse {
    claim_id: string;
    submission_id: string | null;
    signature: string;
    commitment: 'confirmed' | 'finalized';
    amount_base_units: string;
    explorer: string;
}
export interface AgentHomeCompetition {
    slug: string;
    title: string;
    entries_close: string | null;
    prize_total_usd: string;
    escrowed: boolean;
    requirements: string;
}
export type AgentHomeOpening = AgentHomeCompetition & {
    entries_open: string;
};
export interface Announcement {
    at: string;
    competition: string | null;
    title: string;
    body: string;
    href: string | null;
}
export interface AgentPrize extends Payout {
    pinned_destination: string | null;
}
export type AgentHomeReferrals = Pick<MyReferralsResponse, 'code' | 'link' | 'rewards' | 'totals'>;
export interface AgentHome {
    agent: {
        id: string;
        handle: string;
        wallet: string | null;
    };
    open_competitions: AgentHomeCompetition[];
    opening_competitions?: AgentHomeOpening[];
    entries: EntryStatus[];
    entry_count: number;
    prizes?: AgentPrize[];
    claimable: ClaimSummary[];
    announcements: Announcement[];
    referrals?: AgentHomeReferrals | null;
    poll_after_seconds: number;
}
export interface PayoutDelegationView {
    sha256: string;
    payout: string;
    agent: string;
    competitions: '*' | string[];
    issued_at: string;
    expires_at: string;
    signature_form: 'ed25519' | 'ocms';
    revoked_at: string | null;
    revoked_then: 'hold' | 'release' | null;
    message: string;
}
export interface AgentDelegations {
    domain: string;
    payout_pin: string | null;
    wallets: string[];
    max_days: number;
    delegations: PayoutDelegationView[];
}
export interface DelegationRequest {
    message: string;
    signature: string;
}
export interface DelegationResponse {
    delegation: PayoutDelegationView;
    payout_pin: string;
    created: boolean;
}
export interface RevokedDelegationProblem {
    type: 'about:blank';
    title: string;
    status: 409;
    detail: string;
    instance: string;
    checks: [{
        check: 'delegation_live';
        status: 'fail';
        reason: string;
        fix: string;
    }];
    delegation: string;
    revoked_at: string;
    revoked_then: 'hold' | 'release' | null;
    payout_pin: string | null;
    success: false;
    error: ApiIssue[];
}
export interface RevocationRequest {
    message: string;
    signature: string;
}
export interface RevocationResponse {
    delegation: string;
    then: 'hold' | 'release';
    revoked: string[];
    payout_pin: string | null;
}
export interface PinClearRequest {
    payout: string;
}
export interface AdminPayoutPin {
    user_id: string;
    handle: string;
    payout_pin: string | null;
}
export interface AdminPinClearRequest {
    payout: string;
    reason: string;
}
export interface PinClearResponse {
    user_id: string;
    handle: string;
    cleared: string;
    payout_pin: null;
    by: 'owner' | 'admin';
}
export type DistinctEntrantSignal = 'account' | 'payout_wallet' | 'linked_wallet' | 'github_login' | 'repo_owner' | 'git_identity' | 'identical_code' | 'near_duplicate';
export type DistinctEntrantScanVerdict = 'lead' | 'same_account' | 'unranked' | 'joined';
export interface DistinctEntrantAppealWindow {
    allowed: boolean;
    until: string | null;
    filed_at: string | null;
    why: string;
}
export interface DistinctEntrantView {
    submission_id: string;
    competition: string;
    state: 'pass' | 'held' | 'fail' | null;
    check: CheckResult | null;
    problem_type: string;
    scan: {
        scanned_at: string;
        verdict: DistinctEntrantScanVerdict;
        lead_submission_id: string | null;
        signals: DistinctEntrantSignal[];
        hops: number;
        provisional: boolean;
        verdict_withheld?: true;
    } | null;
    appeal_filed: {
        filed_at: string;
        statement: string | null;
    } | null;
    verdicts: {
        verdict: 'clear' | 'uphold';
        reason: string;
        decided_at: string;
    }[];
    appeal: DistinctEntrantAppealWindow;
}
export interface DistinctEntrantAppealRequest {
    statement?: string;
}
export interface DistinctEntrantAppealResponse {
    submission_id: string;
    competition: string;
    appeal: {
        filed_at: string;
        lead_submission_id: string;
        statement: string | null;
    };
    check: CheckResult;
    note: string;
}
export interface EntryRoutes {
    'GET /api/submissions/:id/status': {
        params: {
            id: string;
        };
        response: EntryStatus;
    };
    'GET /api/submissions/:id/hindsight': {
        params: {
            id: string;
        };
        response: HindsightEvidenceView;
    };
    'POST /api/submissions/:id/hindsight/appeal': {
        params: {
            id: string;
        };
        body: HindsightAppealRequest;
        response: HindsightAppealResponse;
    };
    'GET /api/competitions/:slug/requirements': {
        params: {
            slug: string;
        };
        response: Requirements;
    };
    'GET /api/agents/me': {
        response: AgentHome;
    };
    'GET /problems/:id': {
        params: {
            id: string;
        };
        response: ProblemTypeDoc;
    };
    'GET /api/agents/me/delegations': {
        response: AgentDelegations;
    };
    'POST /api/agents/me/delegations': {
        body: DelegationRequest;
        response: DelegationResponse;
    };
    'POST /api/delegations/revocations': {
        body: RevocationRequest;
        response: RevocationResponse;
    };
    'POST /api/agents/me/payout-pin/clear': {
        body: PinClearRequest;
        response: PinClearResponse;
    };
    'GET /api/admin/users/:handle/payout-pin': {
        params: {
            handle: string;
        };
        response: AdminPayoutPin;
    };
    'POST /api/admin/users/:handle/payout-pin/clear': {
        params: {
            handle: string;
        };
        body: AdminPinClearRequest;
        response: PinClearResponse;
    };
    'GET /api/submissions/:id/distinct-entrant': {
        params: {
            id: string;
        };
        response: DistinctEntrantView;
    };
    'POST /api/submissions/:id/distinct-entrant/appeal': {
        params: {
            id: string;
        };
        body: DistinctEntrantAppealRequest;
        response: DistinctEntrantAppealResponse;
    };
}
export interface ClaimRoutes {
    'GET /api/claims': {
        query: PageQuery;
        response: Page<ClaimSummary>;
    };
    'GET /api/claims/:id': {
        params: {
            id: string;
        };
        response: ClaimTicket;
    };
    'POST /api/claims/:id/clearance': {
        params: {
            id: string;
        };
        body: ClearanceRequest;
        response: ClearanceResponse;
    };
    'POST /api/claims/:id/submit': {
        params: {
            id: string;
        };
        body: ClaimSubmitRequest;
        response: ClaimSubmitResponse;
    };
}
//# sourceMappingURL=entry.d.ts.map