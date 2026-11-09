import type { LeaderboardValue } from './competitions.js';
import type { CompetitionStatus, PageQuery, PhaseKey, RunStatus } from './shared.js';
export type LiveEntryStatus = 'ranked' | 'unranked' | 'did_not_finish';
export interface LiveUnit {
    name: 'lamports' | 'quote_units';
    asset: 'SOL' | 'USDC';
    decimals: number;
}
export type LiveFillKind = 'order' | 'set_range' | 'withdraw' | 'complete' | 'flatten' | 'writeoff' | 'close_out';
export interface LiveFill {
    t_ms: number;
    item: string;
    kind: LiveFillKind;
    side: 'buy' | 'sell' | null;
    size: string;
    price?: {
        value: string;
        scale: number;
    };
    cash_flow: string;
}
export interface LiveRow {
    submission_id: string;
    run_id: string;
    handle: string;
    title: string | null;
    received_at: string;
    baseline: boolean;
    internal: boolean;
    status: LiveEntryStatus;
    label: string | null;
    rank: number | null;
    previous_rank: number | null;
    start_equity: string | null;
    equity: string | null;
    net: string | null;
    change: string | null;
    fills: number | null;
    last_fill: LiveFill | null;
    exact: boolean | null;
}
export interface LiveFrame {
    frame: number;
    last_frame: number;
    final: boolean;
    ranked_by: 'equity' | 'placement';
    t_ms: number;
    at_ms: number;
    next_at_ms: number | null;
    started_at_ms: number;
    ends_at_ms: number;
    speed: number;
    frame_seconds: number;
    window: {
        start_ms: number;
        end_ms: number;
    };
    unit: LiveUnit | null;
    rows: LiveRow[];
    footnote: string;
}
export type LivePhaseKey = 'upcoming' | 'submission' | 'grading' | 'running' | 'results' | 'resolved';
export interface LiveStatus {
    sentence: string;
    expected_at: string | null;
    action: string;
}
export interface LivePhase {
    key: LivePhaseKey;
    ranking_phase: PhaseKey | null;
    locked_at: string | null;
    finalized_at: string | null;
    hold: string | null;
}
export type LiveAutoStep = 'lock' | 'gates' | 'reveal' | 'resolve' | 'paying' | 'done' | 'held';
export interface LiveAutomation {
    step: LiveAutoStep;
    reason: string | null;
    next_at: string | null;
    updated_at: string;
}
export interface LiveReveal {
    speed: number;
    frame_seconds: number;
    starts_after_minutes: number;
    earliest_at: string;
    scheduled_at: string | null;
    started_at: string | null;
    ends_at: string | null;
}
export type LiveCommitmentWithheld = 'before_end' | 'surface';
export interface LiveCommitmentDocument {
    format: 'agent-fun/reveal-commitment/v1';
    slug: string;
    phase: PhaseKey;
    dataset_sha256: string | null;
    runs: Array<{
        submission_id: string;
        run_id: string;
        result_sha256: string | null;
        trace_sha256: string | null;
        action_log_sha256: string | null;
    }>;
}
export interface LiveCommitment {
    sha256: string;
    proves: string;
    opens_at: string;
    preimage: LiveCommitmentDocument | null;
    canonical: string | null;
    verified: boolean | null;
    withheld: LiveCommitmentWithheld | null;
}
export interface LiveStandingsRow {
    rank: number | null;
    submission_id: string;
    handle: string;
    title: string | null;
    received_at: string;
    baseline: boolean;
    internal: boolean;
    status: RunStatus;
    ranked: boolean;
    value: LeaderboardValue;
    display: string;
}
export interface LiveStandings {
    phase: PhaseKey;
    scores_visible: boolean;
    placements_held: boolean;
    rank_key: string;
    rank_key_title: string;
    total: number;
    rows: LiveStandingsRow[];
    leaderboard: string;
}
export interface LiveJudging {
    kind: 'judge' | 'score';
    grades_done: number;
    grades_total: number;
    draw_round: number | null;
    draw_at: string | null;
    regrades_done: number;
    regrades_total: number;
    stage: 'draw' | 'grades' | 'swiss' | 'playoff' | 'regrades' | 'checks';
    round: number | null;
    rounds: number;
    calls_done: number;
    calls_total: number;
    started_at: string | null;
    expected_at: string | null;
    entries: number;
    standings: LiveJudgingRow[];
    held: LiveJudgingHold | null;
}
export interface LiveJudgingHold {
    kind: 'review' | 'appeal' | 'other';
    sentence: string;
    until: string | null;
}
export interface LiveJudgingRow {
    place: number;
    submission_ids: string[];
    handle: string | null;
    win_rate_micro: number;
    wins: number;
    losses: number;
    draws: number;
    prize_usd: string | null;
}
export interface LiveResponse {
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        opens_at: string;
        deadline: string;
        resolved_at: string | null;
    };
    status: LiveStatus;
    phase: LivePhase;
    automation: LiveAutomation | null;
    reveal: LiveReveal | null;
    commitment: LiveCommitment | null;
    frame: LiveFrame | null;
    standings: LiveStandings | null;
    judging: LiveJudging | null;
    stream: string;
}
export interface LiveStreamQuery {
    after?: string;
}
export type LiveTopicName = 'standings' | 'phase' | 'market' | 'race';
export interface LiveChange {
    competition_id: string;
    kinds: string[];
}
export type LiveStreamResetReason = 'retention' | 'cap' | 'cursor';
export interface LiveStreamReset {
    reason: LiveStreamResetReason;
}
export interface LiveStreamEvicted {
    limit: number;
}
export type LiveStreamEvent = {
    event: 'standings';
    id: string;
    data: LiveChange;
} | {
    event: 'phase';
    id: string;
    data: LiveChange;
} | {
    event: 'market';
    id: string;
    data: LiveChange;
} | {
    event: 'race';
    id: string;
    data: LiveChange;
} | {
    event: 'frame';
    data: LiveFrame;
} | {
    event: 'reset';
    id: string;
    data: LiveStreamReset;
} | {
    event: 'evicted';
    data: LiveStreamEvicted;
};
export interface CheckRevealPart {
    key: string;
    max: number;
}
export interface CheckReveal {
    duration_sec: number;
    parts: CheckRevealPart[];
    held: string[];
    stage1_step_sec: number;
}
export type RevealStatus = 'none' | 'scheduled' | 'running' | 'ended' | 'fallback' | 'unavailable' | 'published';
export type RevealAggregation = 'sum' | 'mean';
export interface RevealEntryView {
    submission_id: string;
    handle: string;
    title: string | null;
    baseline: boolean;
    house: boolean;
}
export interface RevealTimetableView {
    started_at: string;
    ends_at: string;
    open: string[];
    held: string[];
    demoted: string[];
    rows: number;
    stage1_step_ms: number;
    stage2_step_ms: number | null;
    preroll_ms: number;
    resolving_starts_at: string | null;
    steps: number;
}
export interface RevealBoardRowView extends RevealEntryView {
    position: number;
    place: number | null;
    total: string;
    ceiling: string;
    revealed: Record<string, number[]>;
    pending: string[];
}
export interface RevealNextView {
    step: number;
    at: string;
    stage: 1 | 2;
    part: string;
    submission_id: string | null;
}
export interface RevealBoardView {
    step: number;
    rows: RevealBoardRowView[];
    decided: string | null;
    next: RevealNextView | null;
}
export interface RevealResponse {
    competition: {
        slug: string;
        title: string;
    };
    phase: PhaseKey | null;
    status: RevealStatus;
    sentence: string;
    reveal: CheckReveal | null;
    aggregation: RevealAggregation | null;
    scheduled_at: string | null;
    started_at: string | null;
    ends_at: string | null;
    published_at: string | null;
    timetable: RevealTimetableView | null;
    latest_step: number;
    step: number;
    board: RevealBoardView | null;
    aside: RevealEntryView[];
    fallback: string | null;
    stream: string;
}
export interface RevealQuery {
    step?: string;
}
export interface RevealStreamQuery {
    after?: string;
}
export interface RevealStepShown {
    submission_id: string;
    points: number[];
    total: string;
    ceiling: string;
}
export interface RevealStepPlace {
    submission_id: string;
    place: number;
}
export interface RevealStepEvent {
    step: number;
    at: string;
    stage: 1 | 2;
    part: string;
    reveals: RevealStepShown[];
    finalized: RevealStepPlace[];
    decided: string | null;
}
export interface RevealPlanEvent {
    phase: PhaseKey;
    aggregation: RevealAggregation;
    parts: CheckRevealPart[];
    timetable: RevealTimetableView;
    rows: RevealEntryView[];
    aside: RevealEntryView[];
}
export interface RevealFallbackEvent {
    reason: string;
    publishes_at: string;
}
export type RevealStreamEvent = {
    event: 'step';
    id: string;
    data: RevealStepEvent;
} | {
    event: 'plan';
    data: RevealPlanEvent;
} | {
    event: 'fallback';
    data: RevealFallbackEvent;
} | {
    event: 'reset';
    id: string;
    data: LiveStreamReset;
} | {
    event: 'evicted';
    data: LiveStreamEvicted;
};
export type RaceStatus = 'none' | 'scheduled' | 'racing' | 'ended' | 'official';
export type RaceRacerStatus = 'staged' | 'racing' | 'timeout' | 'failed' | 'finished' | 'diverged';
export type RaceTag = 'house' | 'baseline' | 'you';
export type RaceInterval = '1h' | '1d' | '1m';
export interface RaceWindow {
    starts_at: string;
    ends_at: string;
    start_ms: number;
    end_ms: number;
    bars: number;
}
export interface RaceRules {
    requires_dev_profit: boolean;
    max_racers: number;
    lag_note_bars: number;
}
export interface RaceSymbol {
    symbol: string;
    mint: string;
    price_scale: number | null;
}
export interface RaceBar {
    seq: number;
    t_ms: number;
    closes: Record<string, string>;
}
export interface RaceRacer {
    submission_id: string;
    handle: string;
    title: string | null;
    received_at: string;
    tags: RaceTag[];
    status: RaceRacerStatus;
    seq_done: number;
    behind: number | null;
    diverged_seq: number | null;
    seq: number | null;
    equity: string | null;
    net: string | null;
    return: string | null;
    trades: number | null;
    error: string | null;
    crosscheck: RaceRacerCrosscheck | null;
}
export interface RaceRacerCrosscheck {
    verdict: 'matched' | 'diverged' | 'unscored';
    seq: number | null;
}
export interface RacePoint {
    seq: number;
    equity: string;
}
export interface RaceSeries {
    submission_id: string;
    points: RacePoint[];
}
export interface RaceQuery {
    since?: string;
}
export interface RaceResponse {
    competition: {
        slug: string;
        title: string;
    };
    phase: PhaseKey | null;
    status: RaceStatus;
    sentence: string;
    expected_at: string | null;
    action: string;
    window: RaceWindow | null;
    interval: RaceInterval | null;
    interval_ms: number | null;
    rules: RaceRules | null;
    unit: LiveUnit | null;
    start_equity: string | null;
    head: number | null;
    since: number | null;
    symbols: RaceSymbol[];
    tape: RaceBar[];
    marks_visible: boolean;
    racers: RaceRacer[];
    series: RaceSeries[];
    frame: LiveFrame | null;
    footnote: string;
    stream: string;
    leaderboard: string;
}
export type BreakdownKind = 'pnl' | 'checks';
export type BreakdownView = 'full' | 'replay' | 'aggregates' | 'none';
export type BreakdownSource = 'trace' | 'replay' | 'score';
export interface BreakdownSum {
    name: string;
    lhs: string;
    rhs: string;
    ok: boolean | null;
}
export interface BreakdownPoint {
    seq: number;
    t_ms: number;
    slot?: number;
    equity: string;
}
export interface BreakdownFill {
    seq: number | null;
    index: number | null;
    kind: LiveFillKind;
    client_id?: string;
    status: 'filled' | 'failed';
    t_ms: number;
    slot?: number;
    item: string;
    side: 'buy' | 'sell' | null;
    size: string;
    price?: {
        value: string;
        scale: number;
    };
    cash_flow: string;
    trade: string;
    fees: Record<string, string>;
    tx_fee: string;
    other: Record<string, string>;
    cash_after: string;
}
export interface BreakdownRoundTrip {
    item: string;
    opened_t_ms: number;
    closed_t_ms: number;
    opened_slot?: number;
    closed_slot?: number;
    pnl: string;
    bought?: string;
    range?: {
        lower_tick: number;
        upper_tick: number;
    };
}
export interface BreakdownItem {
    item: string;
    realized: string;
    fees: string;
    tx_fees: string;
    fills: number;
    size_decimals: number;
}
export interface BreakdownPnl {
    unit: LiveUnit;
    protocol?: string;
    window?: {
        start_ms: number;
        end_ms: number;
    };
    start_equity?: string;
    equity?: string;
    net?: string;
    realized?: string;
    unrealized?: string;
    exact?: boolean;
    items?: BreakdownItem[];
    items_total?: {
        realized: string;
        fees: string;
        tx_fees: string;
        fills: number;
    };
    sums?: BreakdownSum[];
    rejected?: Record<string, number> | null;
    round_trips?: BreakdownRoundTrip[];
    equity_curve?: {
        points: BreakdownPoint[];
        total: number;
        max: number;
        downsampled: boolean;
    };
    fills: {
        items: BreakdownFill[];
        start: number;
        next_cursor: string | null;
        total: number;
        truncated: number | null;
    };
}
export type BreakdownPnlFirstPage = Required<BreakdownPnl>;
export type BreakdownPnlSealedPage = Required<Pick<BreakdownPnl, 'protocol' | 'unit' | 'window' | 'start_equity' | 'equity' | 'net' | 'equity_curve' | 'fills'>>;
export interface BreakdownAggregateRow {
    key: string;
    realized: string;
    fees: string | null;
    fills: number | null;
}
export interface BreakdownAggregates {
    rows_of: 'per_token' | 'per_symbol' | 'per_block';
    unit: LiveUnit | null;
    rows: BreakdownAggregateRow[];
    total: {
        realized: string;
        fees: string | null;
        fills: number | null;
    };
    adds_to: {
        key: string;
        value: string;
        ok: boolean;
    };
}
export interface BreakdownCheckPart {
    key: string;
    group?: string;
    title: string;
    max: number | null;
    earned?: number | null;
    earned_by_trial?: Array<number | null>;
    mean?: number | null;
}
export interface BreakdownChecks {
    from: 'checks' | 'columns';
    aggregation: 'sum' | 'mean';
    trials: number;
    parts: BreakdownCheckPart[];
    total: number | null;
    total_key: string | null;
    sums: BreakdownSum[];
}
export interface BreakdownClock {
    frame: number;
    last_frame: number;
    final: boolean;
    t_ms: number;
    at_ms: number;
    next_at_ms: number | null;
    started_at_ms: number;
    ends_at_ms: number;
    speed: number;
    frame_seconds: number;
    window: {
        start_ms: number;
        end_ms: number;
    };
}
export interface BreakdownQuery extends PageQuery {
    phase?: PhaseKey;
    full?: '0' | '1';
}
export interface BreakdownResponse {
    submission_id: string;
    competition: {
        slug: string;
        title: string;
    } | null;
    phase: PhaseKey;
    phases: PhaseKey[];
    run: {
        id: string;
        attempt: number;
        status: RunStatus;
    };
    harness_kind: string | null;
    kind: BreakdownKind | null;
    view: BreakdownView;
    source: BreakdownSource | null;
    note: string;
    opens_at: string | null;
    trace_problem: string | null;
    clock: BreakdownClock | null;
    pnl: BreakdownPnl | null;
    aggregates: BreakdownAggregates | null;
    checks: BreakdownChecks | null;
}
export interface LiveRoutes {
    'GET /api/competitions/:slug/live': {
        params: {
            slug: string;
        };
        response: LiveResponse;
    };
    'GET /api/competitions/:slug/reveal': {
        params: {
            slug: string;
        };
        query: RevealQuery;
        response: RevealResponse;
    };
    'GET /api/competitions/:slug/race': {
        params: {
            slug: string;
        };
        query: RaceQuery;
        response: RaceResponse;
    };
    'GET /api/submissions/:id/breakdown': {
        params: {
            id: string;
        };
        query: BreakdownQuery;
        response: BreakdownResponse;
    };
}
//# sourceMappingURL=live.d.ts.map