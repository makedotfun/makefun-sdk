// GENERATED from the make.fun API's bars.ts: do not edit, every release regenerates it.
export interface DatasetView {
  id: string;
  slug: string;
  path: string;
  sha256: string;
  sealed: boolean;
  sealed_at: string | null;
  excluded_mints: number;
  created_at: string;
}

export interface BarsReplacementBody {
  dir: string;
}

export interface BarsSessionView {
  calendar: string;
  holidays: string[];
  bars: number;
}

export interface BarsWindowView {
  start: string;
  end: string;
  bars: number;
  session: BarsSessionView | null;
  counted: number;
  allowed_gaps: number;
}

export interface BarsGapSymbol {
  symbol: string;
  bars: number;
  gaps: number;
  over: boolean;
}

export interface BarsGapReport {
  dataset: string;
  manifest_sha256: string;
  frozen_at: string;
  pools_sha256: string;
  window: BarsWindowView;
  symbols: BarsGapSymbol[];
  verdict: string;
}

export interface BarsReplacementWindow extends BarsWindowView {
  rule: string;
}

export type BarsReplacementStep = 'rejected' | 'attached' | 'refunding';

export interface BarsReplacementRefund {
  escrow: {
    address: string;
    cluster: string;
    resolve_deadline: string;
    job_id: string;
    runs_at: string;
    already_queued: boolean;
  } | null;
}

export interface CompetitionNotice {
  id: string;
  kind: 'final_window_replacement';
  step: BarsReplacementStep;
  posted_at: string;
  title: string;
  body: string;
  final_window: { start: string; end: string };
  replacement_window: { start: string; end: string };
}

export interface BarsReplacementResponse {
  competition: string;
  phase: 'final';
  step: BarsReplacementStep;
  round: 1 | 2;
  repeated: boolean;
  final_window: BarsWindowView;
  rejected: BarsGapReport[];
  replacement: BarsReplacementWindow;
  dataset: DatasetView | null;
  refund: BarsReplacementRefund | null;
  notice: CompetitionNotice;
}

export interface CompetitionNoticesResponse {
  competition: string;
  notices: CompetitionNotice[];
}

export interface BarsRoutes {
  'POST /api/admin/competitions/:slug/bars/replacement': { params: { slug: string }; body: BarsReplacementBody; response: BarsReplacementResponse };
  'GET /api/competitions/:slug/notices': { params: { slug: string }; response: CompetitionNoticesResponse };
}
