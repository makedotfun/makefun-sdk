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

export interface SubmissionsRoutes {
  'POST /api/competitions/:slug/submissions': { params: { slug: string }; body: SubmissionForm; response: SubmissionCreated };
  'GET /api/competitions/:slug/submissions': { params: { slug: string }; query: SubmissionListQuery; response: Page<SubmissionListItem> };
  'GET /api/activity/entries': { response: ActivityEntries };
}
