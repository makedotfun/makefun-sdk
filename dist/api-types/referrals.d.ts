import type { EntryProblem } from './entry.js';
import type { Page, TaxForm } from './shared.js';
export type ReferralRewardKind = 'signup' | 'first_submission' | 'prize_share';
export type ReferralRewardStatus = 'pending' | 'approved' | 'rejected' | 'claimed' | 'paid';
export type ReferralClaimStatus = 'held' | 'sending' | 'paid';
export type ReferralMcpToolName = 'get_referrals' | 'claim_referral_rewards';
export interface ReferralRewardView {
    id: string;
    kind: ReferralRewardKind;
    amount_usd: string;
    status: ReferralRewardStatus;
    referred_handle: string | null;
    image: string | null;
    reject_reason: string | null;
    decided_at: string | null;
    claim_id: string | null;
    created_at: string;
    prize: ReferralRewardPrize | null;
}
export interface ReferralRewardPrize {
    share_percent: string;
    winnings_usd: string;
    competition: {
        slug: string;
        title: string;
    };
    placement: number | null;
}
export interface ReferralShareWindow {
    referred_handle: string | null;
    image: string | null;
    share_percent: string;
    ends_at: string;
}
export interface ReferralClaimView {
    id: string;
    status: ReferralClaimStatus;
    amount_usd: string;
    destination: string;
    hold: string | null;
    tx_ref: string | null;
    explorer_url: string | null;
    created_at: string;
    paid_at: string | null;
}
export interface MyReferralsQuery {
    limit?: number | string;
    cursor?: string;
    share_cursor?: string;
}
export interface MyReferralSharesQuery {
    limit?: number | string;
    cursor?: string;
}
export type MyReferralSharesResponse = Page<ReferralShareWindow>;
export interface MyReferralsResponse {
    code: string;
    link: string;
    rewards: {
        signup_usd: string;
        first_submission_usd: string;
        prize_share_percent: string;
        prize_share_days: number;
    };
    totals: {
        pending_usd: string;
        approved_usd: string;
        claimed_usd: string;
        paid_usd: string;
        referred: number;
    };
    claim: {
        tax_details_required: boolean;
        tax_threshold_usd: string;
        pinned_destination: string | null;
        wallets: string[];
        claimable_usd: string;
        quest_usd: string;
    };
    items: Page<ReferralRewardView>;
    claims: ReferralClaimView[];
    share_windows: ReferralShareWindow[];
    share_windows_next_cursor: string | null;
}
export interface ReferralClaimBody {
    legal_name?: string;
    country?: string;
    tax_form?: TaxForm;
    method?: 'usdc-solana';
    destination: string;
}
export interface ReferralClaimResponse {
    claim: ReferralClaimView;
}
export interface ReferralClaimProblem extends Omit<EntryProblem, 'competition' | 'submission_id' | 'round'> {
    competition: null;
    submission_id: null;
    round: null;
    requirements: string;
    claim_form: string;
}
export interface ReferralCodeResponse {
    code: string;
    handle: string;
    display_name: string | null;
}
export interface ReferralRoutes {
    'GET /api/me/referrals': {
        query: MyReferralsQuery;
        response: MyReferralsResponse;
    };
    'GET /api/me/referrals/shares': {
        query: MyReferralSharesQuery;
        response: MyReferralSharesResponse;
    };
    'POST /api/me/referrals/claim': {
        body: ReferralClaimBody;
        response: ReferralClaimResponse;
    };
    'GET /api/referrals/:code': {
        params: {
            code: string;
        };
        response: ReferralCodeResponse;
    };
}
//# sourceMappingURL=referrals.d.ts.map