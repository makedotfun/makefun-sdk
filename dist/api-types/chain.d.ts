import type { PhaseKey, PrizeKind } from './shared.js';
export type SolanaCluster = 'localnet' | 'devnet' | 'mainnet';
export type EscrowStatus = 'open' | 'challengeable' | 'disputed' | 'claimable' | 'frozen' | 'closed';
export type PrizeLeafStatus = 'claimable' | 'requested' | 'held' | 'claimed' | 'refunded';
export type HoldReason = 'sanctions' | 'geo' | 'tax_form_required' | 'review';
export interface HoldReasonCodes {
    sanctions: 1;
    geo: 2;
    tax_form_required: 3;
    review: 4;
}
export type PayoutRail = 'manual' | 'onchain';
export type SettleOutcome = 'undisputed' | 'upheld' | 'overturned' | 'no_quorum';
export type ChainEventName = 'EscrowOpened' | 'EscrowFunded' | 'EntriesCommitted' | 'ResultPosted' | 'Challenged' | 'Attested' | 'Settled' | 'ArbiterResolved' | 'ClaimRequested' | 'Claimed' | 'HoldPlaced' | 'HoldReleased' | 'Refunded' | 'ReceiptClosed' | 'ChallengeClosed' | 'ChallengeCommitted' | 'CommitClosed' | 'AttestationClosed' | 'EscrowClosed' | 'FreezeChanged' | 'Escalated' | 'RoleRotated' | 'ConfigChanged' | 'StopChanged' | 'RevocationChanged' | 'ConfigRetired' | 'ConfigClosed';
export interface EscrowHashes {
    rules_sha256: string;
    entries_root: string | null;
    result_sha256: string | null;
    payout_root: string | null;
    kit_sha256: string | null;
    commitment: string | null;
    alt_result_sha256: string | null;
    alt_payout_root: string | null;
    alt_commitment: string | null;
}
export interface EscrowWindows {
    challenge_seconds: number;
    attest_seconds: number;
    hold_seconds: number;
    claim_seconds: number;
}
export interface EscrowDeadlines {
    entries_deadline: string;
    final_end: string | null;
    resolve_deadline: string;
    challenge_deadline: string | null;
    attest_deadline: string | null;
    claim_deadline: string | null;
    hard_deadline: string;
}
export interface EscrowTxs {
    open: string | null;
    commit: string | null;
    post: string | null;
    settle: string | null;
}
export interface EscrowView {
    cluster: SolanaCluster;
    chain_id: string;
    program_id: string;
    escrow: string;
    vault: string;
    mint: string;
    decimals: number;
    status: EscrowStatus;
    total_base_units: string;
    alt_total: string | null;
    funded_base_units: string;
    claimed_base_units: string;
    entries_count: number;
    sponsor: string;
    resolver: string;
    compliance: string | null;
    arbiter: string;
    refund_to: string;
    regraders: string[];
    k: number;
    bond_lamports: string;
    challenger: string | null;
    votes: {
        result: number;
        alt: number;
    };
    hashes: EscrowHashes;
    windows: EscrowWindows;
    deadlines: EscrowDeadlines;
    txs: EscrowTxs;
    explorer: string;
    synced_slot: string | null;
    synced_at: string | null;
}
export type EscrowFundedFrom = 'reward-wallet' | 'sponsor';
export interface EscrowLock {
    cluster: SolanaCluster;
    program_id: string;
    escrow: string;
    vault: string;
    mint: string;
    amount_usd: string;
    amount_base_units: string;
    held_base_units: string;
    claimed_base_units: string;
    funded_by: string;
    funded_from: EscrowFundedFrom;
    open_tx: string;
    funded_at: string;
    status: EscrowStatus;
    challenge_window_seconds: number;
    explorer: {
        escrow: string;
        open_tx: string;
    };
    text_view: {
        escrow: string;
        open_tx: string;
    };
}
export interface EscrowOpenBody {
    arbiter?: string;
    refund_to?: string;
    bond_lamports: string;
    sponsor?: string;
    compliance?: string | null;
    regraders?: string[];
    k?: number;
    windows?: Partial<EscrowWindows>;
    entries_deadline?: string;
    resolve_deadline?: string;
    hard_deadline?: string;
}
export interface RulesSidecar {
    name: string;
    sha256: string;
}
export interface EscrowRulesT {
    bundle_sha256: string;
    sidecars: RulesSidecar[];
    rules_sha256: string;
}
export interface EscrowInstructionT {
    program_id: string;
    accounts: {
        address: string;
        signer: boolean;
        writable: boolean;
    }[];
    data: string;
}
export interface EscrowProposalT {
    sponsor: string;
    sponsor_token_account: string;
    transaction: string;
    message: string;
    blockhash: string;
    last_valid_block_height: string;
    instructions: EscrowInstructionT[];
}
export type EscrowCheckStatus = 'pass' | 'fail' | 'skip' | 'warn';
export type EscrowOpenCheckId = 'commit_window';
export interface EscrowOpenCheckT {
    check: EscrowOpenCheckId;
    status: EscrowCheckStatus;
    reason: string;
    fix: string;
}
export interface EscrowOpenResponse {
    competition: string;
    mode: 'opened' | 'proposal';
    escrow: EscrowView;
    rules: EscrowRulesT;
    commit_entries: {
        job_id: string;
        runs_at: string;
    };
    open_tx: {
        signature: string;
        explorer: string;
    } | null;
    proposal: EscrowProposalT | null;
    checks: EscrowOpenCheckT[];
}
export type EscrowFundBody = Record<string, never>;
export interface EscrowFundProposalT extends EscrowProposalT {
    simulated: {
        account: string;
        delta: string;
    }[];
}
export interface EscrowFundResponse {
    competition: string;
    mode: 'funded' | 'proposal';
    escrow: EscrowView;
    amount_base_units: string;
    vault_before_base_units: string;
    total_base_units: string;
    fund_tx: {
        signature: string;
        explorer: string;
    } | null;
    proposal: EscrowFundProposalT | null;
}
export interface EscrowRoutes {
    'POST /api/admin/competitions/:slug/escrow': {
        params: {
            slug: string;
        };
        body: EscrowOpenBody;
        response: EscrowOpenResponse;
    };
    'POST /api/admin/competitions/:slug/escrow/fund': {
        params: {
            slug: string;
        };
        body: EscrowFundBody;
        response: EscrowFundResponse;
    };
    'GET /api/competitions/:slug/result': {
        params: {
            slug: string;
        };
        response: ResultResponse;
    };
}
export type ResultSchema = 'agent-fun/result/v1';
export interface ResultEntryT {
    submission_id: string;
    run_id: string;
    result_sha256: string;
    action_log_sha256: string;
    rank_value: string | null;
}
export interface ResultStandingT {
    place: number;
    submission_id: string;
    claimant: string;
    rank_value: string;
    receipt_time: string;
    amount_base_units: string;
}
export type ResultExclusionReason = 'house' | 'baseline' | 'identical_behaviour' | 'duplicate_snapshot' | 'cancelled' | 'rejected' | 'superseded' | 'below_baseline' | 'ineligible' | 'run_failed' | 'nondeterministic' | 'dev_unprofitable';
export interface ResultExclusionT {
    submission_id: string;
    reason: ResultExclusionReason;
}
export interface PayoutAwardT {
    payout_id: string;
    submission_id: string;
    place: number | null;
    claim_id: string | null;
    amount_base_units: string;
}
export interface PayoutLeafT {
    index: number;
    claimant: string;
    amount_base_units: string;
    awards: PayoutAwardT[];
}
export interface ResultUnawardedT {
    prize: PrizeKind;
    place: number | null;
    amount_base_units: string;
}
export interface ResultOffchainPrizeT {
    prize: PrizeKind;
    place: number | null;
    submission_id: string | null;
    amount_usd: string;
}
export interface ResultVerdictT {
    submission_id: string;
    verdict_sha256: string;
}
export interface ResultDocumentT {
    schema: ResultSchema;
    competition: {
        id: string;
        slug: string;
    };
    phase: PhaseKey;
    rules_sha256: string;
    kit_sha256: string;
    dataset_sha256: string;
    harness_version: string;
    scorer_version: string;
    entries: ResultEntryT[];
    standings: ResultStandingT[];
    excluded: ResultExclusionT[];
    leaves: PayoutLeafT[];
    unawarded: ResultUnawardedT[];
    offchain_prizes: ResultOffchainPrizeT[];
    verdicts: ResultVerdictT[];
    mint: string;
    decimals: number;
    total: string;
}
export type ResultInForce = 'posted' | 'alternative';
export interface ResultLeafView {
    index: number;
    claimant: string;
    amount: string;
    proof: string[];
    payout_ids: string[];
}
export interface ResultView {
    document: ResultDocumentT;
    result_sha256: string;
    payout_root: string;
    total: string;
    commitment: string;
    tx: string | null;
    leaves: ResultLeafView[];
}
export interface ResultAlternativeView {
    challenge: string;
    challenger: string;
    index: number;
    result_sha256: string;
    payout_root: string;
    total: string;
    commitment: string;
    tx: string;
    in_force: boolean;
    result: ResultView | null;
}
export interface ResultResponse {
    competition: string;
    cluster: SolanaCluster;
    escrow: EscrowView;
    in_force: ResultInForce;
    posted: ResultView;
    alternative: ResultView | null;
    alternatives: ResultAlternativeView[];
}
export type ChainValue = string | number | boolean | null | ChainValue[] | {
    [field: string]: ChainValue;
};
export interface ChainEventT {
    escrow: string;
    signature: string;
    ix_index: number;
    slot: string;
    block_time: string | null;
    name: ChainEventName;
    data: {
        [field: string]: ChainValue;
    };
}
//# sourceMappingURL=chain.d.ts.map