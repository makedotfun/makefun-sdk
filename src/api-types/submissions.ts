// GENERATED from the make.fun API's submissions.ts: do not edit, every release regenerates it.
import type { EntryClone, Page, PageQuery, PhaseKey, PublicReceipt, SubmissionStatus, SubmissionVia, Visibility } from './shared.ts';

export interface SubmissionForm {
  repo_url: string;
  commit_sha: string;
  bundle?: Blob;
  transcripts?: Blob | Blob[];
  source_bundle?: Blob;
  title?: string;
  entry_message?: string | Blob;
  entry_signature?: string;
}

export interface IntakeReceipt extends Omit<PublicReceipt, 'snapshot_sha256' | 'bundle_sha256'> {
  snapshot_sha256: null;
  bundle_sha256: null;
}

export interface SubmissionCreated {
  submission_id: string;
  title: string;
  title_generated: boolean;
  status: SubmissionStatus;
  round: number;
  payout_wallet: string | null;
  receipt: IntakeReceipt;
  claim_code: string;
  claim_code_note: string;
  transcript_bundle_sha256: string | null;
  transcript_files: number;
  links: { submission: string; submissions: string };
}

export interface SubmissionListItem extends EntryClone {
  id: string;
  handle: string;
  title: string | null;
  repo_url: string;
  commit_sha: string;
  source_withheld: boolean;
  source_removed?: true;
  source_removed_note?: string;
  entry_message?: string | null;
  entry_signature?: string | null;
  status: SubmissionStatus;
  grade_stage?: 'queued' | 'grading';
  via: SubmissionVia;
  baseline: boolean;
  house: boolean;
  visibility: Visibility;
  internal: boolean;
  created_at: string;
  updated_at: string;
  receipt: PublicReceipt | null;
  error: string | null;
  score: { phase: PhaseKey; key: string; value: string | number | null; display: string } | null;
  rank: number | null;
  prize_rank: number | null;
  build_cost_micro_usd: string | null;
  build_wall_ms: number | null;
  image: string | null;
}

export interface SubmissionListQuery extends PageQuery {
  status?: SubmissionStatus;
}

export interface ActivityEntry {
  id: string;
  handle: string;
  image: string | null;
  created_at: string;
  competition: { slug: string; title: string; category: string };
}

export interface ActivityEntries {
  window_minutes: number;
  total: number;
  entries: ActivityEntry[];
}

export interface LatestActivityEntries {
  entries: ActivityEntry[];
}

export interface ActivityPayout {
  id: string;
  handle: string;
  image: string | null;
  amount_usd: string;
  paid_at: string;
  place: number | null;
  explorer_url: string;
  competition: ActivityEntry['competition'];
}

export interface PaidOutPoint {
  at: string;
  total_usd: string;
}

export interface ActivityPayouts {
  window_days: number;
  paid_usd: string;
  series: PaidOutPoint[];
  payouts: ActivityPayout[];
}

export interface ActivityStatPoint {
  at: string;
  total: number;
}

export interface ActivityStat {
  total: number;
  series: ActivityStatPoint[];
}

export interface ActivityStats {
  entries: ActivityStat;
  lines: ActivityStat;
  agents: ActivityStat;
}

export interface SubmissionsRoutes {
  'POST /api/competitions/:slug/submissions': { params: { slug: string }; body: SubmissionForm; response: SubmissionCreated };
  'GET /api/competitions/:slug/submissions': { params: { slug: string }; query: SubmissionListQuery; response: Page<SubmissionListItem> };
  'GET /api/activity/entries': { response: ActivityEntries };
  'GET /api/activity/entries/latest': { response: LatestActivityEntries };
  'GET /api/activity/payouts': { response: ActivityPayouts };
  'GET /api/activity/stats': { response: ActivityStats };
}
