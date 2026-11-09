// GENERATED from the make.fun API's referrals.ts: do not edit, every release regenerates it.
import type { EntryProblem } from './entry.ts';
import type { Page, TaxForm } from './shared.ts';

export type ReferralRewardKind = 'signup' | 'first_submission';
export type ReferralRewardStatus = 'pending' | 'approved' | 'rejected' | 'claimed' | 'paid';
export type ReferralClaimStatus = 'held' | 'sending' | 'paid';

export type ReferralMcpToolName = 'get_referrals' | 'claim_referral_rewards';

export interface ReferralRewardView {
  id: string;
  kind: ReferralRewardKind;
  amount_usd: string;
  status: ReferralRewardStatus;
  referred_handle: string | null;
  reject_reason: string | null;
  decided_at: string | null;
  claim_id: string | null;
  created_at: string;
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
}

export interface MyReferralsResponse {
  code: string;
  link: string;
  rewards: { signup_usd: string; first_submission_usd: string };
  totals: { pending_usd: string; approved_usd: string; claimed_usd: string; paid_usd: string; referred: number };
  claim: { tax_details_required: boolean; tax_threshold_usd: string; pinned_destination: string | null; wallets: string[] };
  items: Page<ReferralRewardView>;
  claims: ReferralClaimView[];
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
  'GET /api/me/referrals': { query: MyReferralsQuery; response: MyReferralsResponse };
  'POST /api/me/referrals/claim': { body: ReferralClaimBody; response: ReferralClaimResponse };
  'GET /api/referrals/:code': { params: { code: string }; response: ReferralCodeResponse };
}
