// GENERATED from the make.fun API's community.ts: do not edit, every release regenerates it.
import type {
  ApiIssue,
  CommentAuthorKind,
  CommentReportReason,
  CommentState,
  CompetitionStatus,
  EntryClone,
  Page,
  PageQuery,
  PayoutMethod,
  PayoutStatus,
  PrizeKind,
  ProfileRole,
  PublicReceipt,
  SubmissionStatus,
  TaxForm,
  Visibility,
} from './shared.ts';
import type { PayoutRailRef } from './entry.ts';

export interface CommentAuthor {
  handle: string;
  kind: CommentAuthorKind;
  image: string | null;
  entrant: boolean;
}

export type CommentLinkKind =
  | 'denied'
  | 'scheme'
  | 'ip'
  | 'userinfo'
  | 'shortener'
  | 'solana_action'
  | 'malformed'
  | 'idn'
  | 'user_content'
  | 'chat_invite'
  | 'lookalike'
  | 'site'
  | 'known_good'
  | 'external';

export interface CommentLink {
  index: number;
  start: number;
  end: number;
  host: string;
  display_host: string;
  registrable: string | null;
  shared_suffix: string | null;
  kind: CommentLinkKind;
  href?: string;
}

export interface Comment {
  id: string;
  competition: string;
  submission_id: string | null;
  parent_id: string | null;
  root_id: string | null;
  author: CommentAuthor;
  body: string;
  created_at: string;
  state: CommentState | 'removed';
  deleted: boolean;
  placeholder: boolean;
  held_reason: string | null;
  reply_count: number;
  like_count: number;
  viewer_liked: boolean;
  links: CommentLink[];
}

export type CommentSort = 'newest' | 'top';

export interface CommentsQuery extends PageQuery {
  submission_id?: string;
  sort?: CommentSort;
  entrants?: 'true' | 'false';
  parent_id?: string;
}

export interface PostCommentBody {
  body: string;
  parent_id?: string | null;
  submission_id?: string | null;
}

export type CommentRefusalReason = 'length' | 'muted' | 'rate_limited' | 'secret' | 'link_blocked' | 'link_shortener' | 'link_scheme' | 'repeat';

export type CommentCheck = 'length' | 'mute' | 'rates' | 'secrets' | 'links' | 'duplicates' | 'reputation';

export interface CommentCheckResult {
  check: CommentCheck;
  status: 'fail';
  reason: string;
  fix: string;
}

export interface CommentProblem {
  type: 'about:blank';
  title: string;
  status: number;
  detail: string;
  fix: string;
  instance: string;
  reason: CommentRefusalReason;
  retry_at?: string;
  until?: string | null;
  checks: CommentCheckResult[];
  success: false;
  error: ApiIssue[];
}

export type CommentActionRefusalReason =
  | 'not_found'
  | 'not_author'
  | 'not_published'
  | 'own_comment'
  | 'already_reported'
  | 'rate_limited'
  | 'parent_not_found'
  | 'parent_not_visible'
  | 'submission_not_found'
  | 'submission_mismatch';

export interface CommentActionProblem {
  type: 'about:blank';
  title: string;
  status: number;
  detail: string;
  fix: string;
  instance: string;
  reason: CommentActionRefusalReason;
  retry_at?: string;
  success: false;
  error: ApiIssue[];
}

export interface ReportCommentBody {
  reason: CommentReportReason;
  note?: string | null;
}

export interface CommentReportReceipt {
  id: string;
  comment_id: string;
  reason: CommentReportReason;
  note: string | null;
  created_at: string;
}

export type CommentLinkVerdict = 'open' | 'caution' | 'blocked' | 'error';

export interface CommentLinkCheck {
  index: number;
  host: string;
  display_host: string;
  registrable: string | null;
  url?: string;
  verdict: CommentLinkVerdict;
  reasons: string[];
  checked_at: string;
  lists_as_of: string | null;
}

export interface CommentStreamQuery {
  after?: string;
  entrants?: 'true' | 'false';
}

export interface CommentRemoved {
  id: string;
  root_id: string | null;
  state: CommentState | 'removed';
  deleted: boolean;
}

export type CommentStreamResetReason = 'retention' | 'cap' | 'cursor';

export interface CommentStreamReset {
  reason: CommentStreamResetReason;
}

export interface CommentStreamEvicted {
  limit: number;
}

export type CommentStreamEvent =
  | { event: 'comment'; id: string; data: Comment }
  | { event: 'comment_removed'; id: string; data: CommentRemoved }
  | { event: 'reset'; id: string; data: CommentStreamReset }
  | { event: 'evicted'; data: CommentStreamEvicted };

export interface PayoutProfileView {
  legal_name: string | null;
  country: string | null;
  tax_form: TaxForm | null;
  method: PayoutMethod;
  destination: string;
  agreement_signed_at: string | null;
  sanctions_screened_at: string | null;
}

export interface PayoutSending {
  tx_ref: string;
  explorer_url: string | null;
  sent_at: string;
}

export interface Payout extends PayoutRailRef {
  id: string;
  competition: { slug: string; title: string; rehost?: true };
  submission_id: string | null;
  prize: PrizeKind;
  placement: number | null;
  amount_usd: string;
  method: PayoutMethod | null;
  status: PayoutStatus;
  claim_deadline: string | null;
  claimed: boolean;
  tx_ref: string | null;
  explorer_url: string | null;
  paid_at: string | null;
  created_at: string;
  sending?: PayoutSending;
  autopay_hold?: PayoutAutopayHold;
  tax_details_required?: boolean;
  tax_threshold_usd?: string;
}

export const AUTO_SCREEN_CODES = [
  'no_claim',
  'wire',
  'manual_payouts',
  'demo',
  'list_unavailable',
  'list_stale',
  'sanctioned',
  'not_on_curve',
  'not_linked',
  'agent_destination',
  'delegated',
  'country_blocked',
  'country_region',
  'over_limit',
  'changed',
] as const;
export type AutoScreenCode = (typeof AUTO_SCREEN_CODES)[number];

export type AutopayHoldAction = 'claim_again' | 'none';

export interface PayoutAutopayHold {
  sentence: string;
  codes: AutoScreenCode[];
  action: AutopayHoldAction;
}

export interface ClaimBody {
  legal_name?: string;
  country?: string;
  tax_form?: TaxForm;
  method?: 'usdc-solana';
  destination: string;
  winner_agreement: true;
}

export interface ClaimResponse {
  submission_id: string;
  payouts: Payout[];
  profile: PayoutProfileView;
}

export interface MeUser {
  id: string;
  handle: string;
  role: ProfileRole;
  display_name: string | null;
  bio: string | null;
  name: string;
  email: string;
  image: string | null;
  github_login: string | null;
  via: 'session' | 'api-key';
  avatar: AvatarView | null;
  username: UsernameState;
  wallet_handles: string[];
  profile_url: string;
  wallets: string[];
}

export interface MeEntry extends EntryClone {
  id: string;
  competition: { slug: string; title: string };
  title: string | null;
  status: SubmissionStatus;
  visibility: Visibility;
  house: boolean;
  baseline: boolean;
  repo_url: string;
  commit_sha: string;
  created_at: string;
  error: string | null;
  receipt: PublicReceipt | null;
  source_removed?: true;
  source_removed_note?: string;
}

export interface Earnings {
  total_usd: string;
  paid_usd: string;
  pending_usd: string;
  payouts: Payout[];
}

export type ContactChannel = 'email' | 'phone';

export interface ContactView {
  email: string | null;
  email_verified_at: string | null;
  email_code_expires_at: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  phone_code_expires_at: string | null;
  verify_channels: ContactChannel[];
}

export interface ContactBody {
  email?: string | null;
  phone?: string | null;
  phone_country?: string;
}

export type ContactSendBody = Record<string, never>;

export interface ContactCodeSent {
  channel: ContactChannel;
  sent_to: string;
  expires_at: string;
  attempts_left: number;
  contact: ContactView;
}

export interface ContactConfirmBody {
  code: string;
}

export type ContactRefusalReason =
  | 'invalid_value'
  | 'nothing_to_verify'
  | 'already_verified'
  | 'no_code'
  | 'code_expired'
  | 'code_exhausted'
  | 'code_mismatch'
  | 'rate_limited'
  | 'sender_not_configured'
  | 'send_failed';

export interface ContactProblem {
  type: 'about:blank';
  title: string;
  status: number;
  detail: string;
  instance: string;
  reason: ContactRefusalReason;
  channel: ContactChannel | null;
  attempts_left?: number;
  retry_at?: string;
  success: false;
  error: ApiIssue[];
}

export interface MeResponse {
  user: MeUser;
  payout_profile: PayoutProfileView | null;
  contact: ContactView;
  entries: MeEntry[];
  entry_count: number;
  earnings: Earnings;
}

export interface AvatarView {
  url: string;
  url_small: string;
  updated_at: string;
}

export interface UsernameState {
  chosen: boolean;
  ask: boolean;
  needs_choice: boolean;
  suggestion: string | null;
  next_change_at: string | null;
}

export interface ProfilePatchBody {
  handle?: string;
  username_step?: 'skipped';
  bio?: string | null;
}

export interface ProfileSettings {
  handle: string;
  previous_handle: string | null;
  profile_url: string;
  username: UsernameState;
  bio: string | null;
}

export interface AvatarUploadForm {
  file: Blob;
}

export interface AvatarResponse {
  avatar: AvatarView | null;
  image: string | null;
}

export interface BioRemoved {
  handle: string;
  bio: null;
}

export type ProfileRefusalReason =
  | 'shape'
  | 'reserved'
  | 'taken'
  | 'held'
  | 'too_soon'
  | 'missing_file'
  | 'too_large'
  | 'unsupported_type'
  | 'unreadable'
  | 'too_long';

export interface ProfileProblem {
  type: 'about:blank';
  title: string;
  status: number;
  detail: string;
  fix: string;
  instance: string;
  reason: ProfileRefusalReason;
  handle?: string;
  retry_at?: string;
  success: false;
  error: ApiIssue[];
}

export interface ProfileRecord {
  competitions_entered: number;
  competitions_placed: number;
  competitions_won: number;
  podium_finishes: number;
  other_placements: number;
  best_placement: number | null;
  prize_usd: string;
}

export interface ProfileSolution {
  submission_id: string;
  title: string | null;
  competition: { slug: string; title: string; status: CompetitionStatus; deadline: string; refunded: boolean; category: string; reward_usd: string; prize_gate_waiting: boolean };
  placement: number | null;
  score: { column: { key: string; title: string; source: string | null; precision: number }; value: string | number | null; display: string } | null;
  entered_at: string;
  sealed: boolean;
  archive_url: string;
  download_url: string | null;
  repo_url: string | null;
  commit_sha: string | null;
}

export interface PublicProfile {
  handle: string;
  display_name: string | null;
  bio: string | null;
  image: string | null;
  avatar: AvatarView | null;
  github_login: string | null;
  house: boolean;
  demo: boolean;
  joined_at: string;
  profile_url: string;
  record: ProfileRecord;
  solutions: ProfileSolution[];
}

export type StepUpChallengePath = '/api/me/step-up';

export type StepUpHeaderName = 'X-Step-Up';

export interface StepUpOffer {
  action: string;
  change: string;
  wallets: string[];
  ticket: string;
  expires_at: string;
  challenge: StepUpChallengePath;
  header: StepUpHeaderName;
}

export type StepUpReason = 'step_up_required' | 'step_up_invalid';

export type StepUpFailedCheck = 'header' | 'challenge' | 'account' | 'session' | 'action' | 'params' | 'wallet' | 'message' | 'signature';

export interface StepUpProblem {
  type: 'about:blank';
  title: string;
  status: 403;
  detail: string;
  instance: string;
  reason: StepUpReason;
  failed?: StepUpFailedCheck;
  checks: [{ check: 'step_up'; status: 'fail'; reason: string; fix: string }];
  step_up: StepUpOffer;
  success: false;
  error: ApiIssue[];
}

export interface StepUpRequest {
  ticket: string;
  wallet: string;
}

export interface StepUpChallenge {
  id: string;
  action: string;
  change: string;
  wallet: string;
  message: string;
  expires_at: string;
  header: StepUpHeaderName;
}

export type DeviceKind = 'desktop' | 'phone' | 'tablet' | 'cli' | 'unknown';

export interface SessionView {
  id: string;
  current: boolean;
  kind: DeviceKind;
  browser: string | null;
  os: string | null;
  ip: string | null;
  signed_in_at: string;
  last_seen_at: string;
}

export interface SessionsResponse {
  sessions: SessionView[];
}

export interface RevokeSessionResponse {
  revoked: true;
  id: string;
}

export type DiscordLinkedFrom = 'site' | 'discord';

export interface DiscordLinkView {
  discord_user_id: string;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
  linked_at: string;
  linked_from: DiscordLinkedFrom;
  in_server: boolean | null;
}

export type DiscordRankUnit = 'link' | 'entries' | 'usd' | 'weeks' | 'referrals' | 'competitions' | 'places';

export interface DiscordRankProgress {
  key: 'linked' | 'builder' | 'podium' | 'winner' | 'paid' | 'big_earner' | 'whale' | 'streak' | 'recruiter' | 'sponsor';
  name: string;
  held: boolean;
  have: number;
  need: number;
  unit: DiscordRankUnit;
}

export interface MeDiscord {
  available: boolean;
  link: DiscordLinkView | null;
  roles: DiscordRankProgress[];
}

export interface UnlinkDiscordResponse {
  unlinked: true;
}

export interface DiscordLastSignIn {
  error: 'last_sign_in';
  message: string;
}

export interface SiteFeaturesResponse {
  coin_page: boolean;
  hero_featured: string[];
}

export interface CommunityRoutes {
  'GET /api/competitions/:slug/comments': { params: { slug: string }; query: CommentsQuery; response: Page<Comment> };
  'POST /api/competitions/:slug/comments': { params: { slug: string }; body: PostCommentBody; response: Comment };
  'DELETE /api/comments/:id': { params: { id: string }; response: Comment };
  'PUT /api/comments/:id/like': { params: { id: string }; response: Comment };
  'DELETE /api/comments/:id/like': { params: { id: string }; response: Comment };
  'POST /api/comments/:id/report': { params: { id: string }; body: ReportCommentBody; response: CommentReportReceipt };
  'POST /api/comments/:id/links/:index/check': { params: { id: string; index: string }; response: CommentLinkCheck };
  'POST /api/submissions/:id/claim': { params: { id: string }; body: ClaimBody; response: ClaimResponse };
  'GET /api/me': { response: MeResponse };
  'GET /api/site/features': { response: SiteFeaturesResponse };
  'POST /api/me/contact': { body: ContactBody; response: ContactView };
  'POST /api/me/contact/:channel/send': { params: { channel: ContactChannel }; body: ContactSendBody; response: ContactCodeSent };
  'POST /api/me/contact/:channel/confirm': { params: { channel: ContactChannel }; body: ContactConfirmBody; response: ContactView };
  'GET /api/me/sessions': { response: SessionsResponse };
  'DELETE /api/me/sessions/:id': { params: { id: string }; response: RevokeSessionResponse };
  'GET /api/me/discord': { response: MeDiscord };
  'DELETE /api/me/discord': { response: UnlinkDiscordResponse };
  'POST /api/me/step-up': { body: StepUpRequest; response: StepUpChallenge };
  'GET /api/profiles/:handle': { params: { handle: string }; response: PublicProfile };
  'PATCH /api/me/profile': { body: ProfilePatchBody; response: ProfileSettings };
  'POST /api/me/avatar': { body: AvatarUploadForm; response: AvatarResponse };
  'DELETE /api/me/avatar': { response: AvatarResponse };
  'DELETE /api/admin/profiles/:handle/avatar': { params: { handle: string }; response: AvatarResponse };
  'DELETE /api/admin/profiles/:handle/bio': { params: { handle: string }; response: BioRemoved };
}
