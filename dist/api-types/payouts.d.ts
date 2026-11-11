import type { Page } from './shared.js';
export type PayoutSource = 'reward-wallet' | 'escrow';
export interface PublicPayout {
    id: string;
    paid_at: string;
    amount_usd: string;
    place: number | null;
    handle: string;
    competition: {
        slug: string;
        title: string;
    };
    signature: string;
    explorer_url: string;
    text_view_url: string;
    source: PayoutSource;
    sender: string | null;
    memo: string | null;
    escrow: {
        account: string;
        explorer_url: string;
        text_view_url: string;
    } | null;
    solution: {
        repo_url: string;
        commit_sha: string;
    } | null;
}
export interface PayoutTally {
    transfers: number;
    usd: string;
}
export interface PayoutBountyTally {
    slug: string;
    title: string;
    transfers: number;
    usd: string;
    last_paid_at: string;
}
export interface PayoutLedgerSummary {
    first_paid_at: string | null;
    last_paid_at: string | null;
    total_usd: string;
    accounts: number;
    transfers: number;
    largest_usd: string | null;
    median_usd: string | null;
    from_reward_wallet: PayoutTally;
    from_escrow: PayoutTally;
    by_competition: PayoutBountyTally[];
    reward_wallets: string[];
    unlisted: PayoutTally;
}
export interface EscrowFacts {
    program_id: string;
    config: string;
    program_sha256: string;
}
export interface EscrowStanding {
    open_escrows: number;
    held_usd: string;
    claimed_usd: string;
}
export interface ExplorerLinks {
    explorer_url: string;
    text_view_url: string;
}
export interface PayoutEscrow {
    facts: EscrowFacts;
    standing: EscrowStanding | null;
    explorer: {
        program: ExplorerLinks;
        config: ExplorerLinks;
    };
}
export interface PayoutLedger {
    summary: PayoutLedgerSummary;
    payouts: Page<PublicPayout>;
    escrow: PayoutEscrow;
}
//# sourceMappingURL=payouts.d.ts.map