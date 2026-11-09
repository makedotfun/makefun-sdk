import type { CompetitionStatus, CostProvenance, EntryClone, Page, PageQuery, PhaseKey, ProvenanceTier, PublicReceipt, RunKind, RunStatus, SubmissionStatus, SubmissionVia, TranscriptSource, Visibility } from './shared.js';
export type PrivatePartsClosed = 'internal' | 'removed' | 'before_deadline';
export type SecretWithheld = 'withheld';
export interface EntryAccess {
    snapshot: boolean;
    tree: boolean;
    blame: boolean;
    transcripts: boolean;
    action_log: boolean;
    closed: PrivatePartsClosed | SecretWithheld | null;
    withheld_unchecked?: true;
    opens_at: string | null;
}
export interface ArchiveCompetitionRef {
    slug: string;
    title: string;
    status: CompetitionStatus;
    visibility: Visibility;
    deadline: string;
    rehost?: true;
}
export interface ArchiveOwner {
    handle: string | null;
    display_name: string | null;
    image: string | null;
}
export interface ArchiveTokenPnl {
    mint: string;
    realized_pnl_lamports: string;
    fills: number;
    fees_lamports: string;
}
export interface ArchivePnlInterval {
    level: string;
    method: 'bootstrap-tokens';
    resamples: number;
    seed: string;
    low_lamports: string;
    high_lamports: string;
}
export interface ArchiveRoundTripConstraint {
    min_buy_lamports: string;
    counted: number;
    counted_mints: number;
}
export interface ArchiveConstraints {
    min_fills: number;
    min_distinct_mints: number;
    max_drawdown: string;
    fills_ok: boolean;
    mints_ok: boolean;
    drawdown_ok: boolean;
    compliant: boolean;
    round_trips?: ArchiveRoundTripConstraint;
}
export interface ArchiveContamination {
    no_future_events: boolean;
    final_window_first_block_time: string | null;
    last_graded_receipt_at: string | null;
    window_after_receipts: boolean | null;
    dataset_sha256: string;
}
export interface ArchiveCostSensitivity {
    fee_multiplier: number;
    net_pnl_lamports: string;
}
export interface ArchiveEraRow {
    key: string;
    hours: number;
    dataset_sha256: string;
    net_pnl_lamports: string;
    fills: number;
    distinct_mints: number;
    max_drawdown: string;
    compliant: boolean;
    action_log_sha256: string;
    trace_sha256: string | null;
}
export interface ArchiveEras {
    rank_window: string;
    rows: ArchiveEraRow[];
}
export type ArchiveStressStatus = 'pending' | 'running' | 'finished' | 'skipped' | 'failed';
export interface ArchiveStress {
    m: number;
    median: string | null;
    p10: string | null;
    p90: string | null;
    below_zero: number | null;
    failed: number | null;
    dev_rank: number | null;
    status: ArchiveStressStatus;
}
export interface ArchiveReplayMetrics {
    net_pnl_lamports: string;
    return: string;
    sharpe: string | null;
    sortino: string | null;
    max_drawdown: string;
    win_rate: string | null;
    round_trips: number;
    fills: number;
    rejected: number;
    failed_txs: number;
    distinct_mints: number;
    fees_lamports: string;
    tx_fees_lamports: string;
    fee_fallback_fills: number;
    per_token: ArchiveTokenPnl[];
    interval: ArchivePnlInterval;
    cost_sensitivity: ArchiveCostSensitivity;
    constraints: ArchiveConstraints;
    contamination: ArchiveContamination;
    counterparties?: {
        distinct: number;
        min_per_coin: number | null;
        per_coin: {
            mint: string;
            distinct: number;
        }[];
    };
}
export interface ArchiveSymbolPnl {
    symbol: string;
    pnl_quote_units: string;
    trades: number;
    fees_quote_units: string;
}
export interface ArchiveBarsPnlInterval {
    level: string;
    method: 'bootstrap-symbols';
    resamples: number;
    seed: string;
    low_quote_units: string;
    high_quote_units: string;
}
export interface ArchiveBarsConstraints {
    min_trades: number;
    min_distinct_symbols: number;
    max_drawdown: string;
    trades_ok: boolean;
    symbols_ok: boolean;
    drawdown_ok: boolean;
    compliant: boolean;
}
export interface ArchiveBarsContamination {
    no_future_bars: boolean;
    final_window_first_bar_time: string | null;
    last_graded_receipt_at: string | null;
    window_after_receipts: boolean | null;
    dataset_sha256: string;
}
export interface ArchiveBarsCapital {
    quote: 'USDC';
    quote_scale: number;
    quote_units: string;
}
export interface ArchiveBarsMetrics {
    net_pnl_quote_units: string;
    return: string;
    sharpe: string | null;
    sortino: string | null;
    max_drawdown: string;
    win_rate: string | null;
    trades: number;
    rejected: number;
    distinct_symbols: number;
    fees_quote_units: string;
    exposure: string;
    per_symbol: ArchiveSymbolPnl[];
    interval: ArchiveBarsPnlInterval;
    cost_sensitivity: {
        fee_multiplier: 2;
        net_pnl_quote_units: string;
    };
    constraints: ArchiveBarsConstraints;
    contamination: ArchiveBarsContamination;
}
export interface ArchiveClmmPnlInterval {
    level: string;
    method: 'bootstrap-blocks/v2';
    block_hours: number;
    resamples: number;
    seed: string;
    low_quote_units: string;
    high_quote_units: string;
}
export interface ArchiveClmmConstraints {
    min_in_range_share: string;
    in_range_ok: boolean;
    compliant: boolean;
}
export interface ArchiveClmmMetrics {
    hedged_pnl_quote_units: string;
    net_pnl_quote_units: string;
    fees_quote_units: string;
    costs_quote_units: string;
    lvr_quote_units: string;
    in_range_share: string;
    actions: number;
    max_drawdown: string;
    per_block: {
        block: number;
        pnl_quote_units: string;
    }[];
    interval: ArchiveClmmPnlInterval;
    cost_sensitivity: {
        fee_multiplier: 2;
        hedged_pnl_quote_units: string;
    };
    constraints: ArchiveClmmConstraints;
    contamination: ArchiveBarsContamination;
}
export interface ArchiveAgentTrial {
    index: number;
    instance_sha256: string;
    status: 'finished' | 'timeout' | 'nondeterministic';
    scores: Record<string, number | null>;
    working: boolean;
    requests: number;
    spend_micro_usd: string;
    cassette_sha256: string;
    state_sha256: string;
}
export interface ArchiveAgentPerformance {
    kind: 'agent/v1';
    trials: ArchiveAgentTrial[];
    scores: Record<string, number | null>;
    interval: {
        level: string;
        low: number | null;
        high: number | null;
    };
    counts: {
        trials: number;
        finished: number;
        timeout: number;
        nondeterministic: number;
        voids_rerun: number;
    };
    working_trials: number;
    spend: {
        pricing_rev: string;
        micro_usd: string;
        requests: number;
    };
}
export interface ArchiveScrapeTrial {
    round: number;
    stage: 'main' | 'playoff';
    status: 'correct' | 'incorrect' | 'timeout' | 'crashed' | 'invalid_output' | 'leftover_process' | 'off_route' | 'over_cap' | 'void';
    wall_us: number;
}
export interface ArchiveScrapePerformance {
    kind: 'scrape/v1';
    trim: number;
    trials: ArchiveScrapeTrial[];
    scores: {
        time_ms: string | null;
        median_ms: string | null;
        best_ms: string | null;
        correct_trials: number;
        finalist: boolean;
    };
    interval: {
        level: '0.900000000';
        low_ms: string | null;
        high_ms: string | null;
    };
    counts: {
        rounds: number;
        correct: number;
        failed: number;
        voids_rerun: number;
    };
}
export type ArchivePatchRefusal = 'missing' | 'empty' | 'too_large' | 'not_utf8' | 'malformed' | 'binary' | 'mode' | 'unsafe_path' | 'protected_path' | 'apply_failed';
export interface ArchivePatchPerformance {
    kind: 'patch/v1';
    applied: boolean;
    refused: ArchivePatchRefusal | null;
    tampered: boolean;
    f2p: {
        passed: number;
        total: number;
    };
    p2p: {
        passed: number;
        total: number;
    };
    scores: {
        resolved: 0 | 1;
        f2p_passed: number;
        f2p_total: number;
        p2p_passed: number;
        p2p_total: number;
    };
    passed: boolean;
}
export type ArchivePerformance = {
    kind: 'pumpfun-replay/v2';
    metrics: ArchiveReplayMetrics;
} | {
    kind: 'program/v1';
    scores: Record<string, number | null>;
} | {
    kind: 'bars-replay/v1';
    metrics: ArchiveBarsMetrics;
} | ArchiveAgentPerformance | {
    kind: 'clmm-replay/v1';
    metrics: ArchiveClmmMetrics;
} | ArchiveScrapePerformance | ArchivePatchPerformance;
export interface ArchiveAgentTrialWithheld extends Omit<ArchiveAgentTrial, 'requests' | 'spend_micro_usd'> {
    requests: null;
    spend_micro_usd: null;
}
export interface ArchiveAgentPerformanceWithheld extends Omit<ArchiveAgentPerformance, 'trials' | 'spend'> {
    trials: ArchiveAgentTrialWithheld[];
    spend: null;
}
export interface ArchiveAgentTrialFile {
    name: string;
    url: string;
    sha256: string;
    media_type: string;
}
export interface ArchiveAgentTrialRow {
    index: number;
    instance_sha256: string;
    status: ArchiveAgentTrial['status'];
    score: number | null;
    working: boolean;
    replay_matched: boolean | null;
    cassette: ArchiveAgentTrialFile | null;
    state: ArchiveAgentTrialFile | null;
    transcript: ArchiveAgentTrialFile | null;
}
export type ArchiveAgentFilesClosed = 'not_finalized' | PrivatePartsClosed | SecretWithheld;
export interface ArchiveAgentTrials {
    column: string | null;
    mean: number | null;
    interval: ArchiveAgentPerformance['interval'];
    counts: {
        trials: number;
        valid: number;
        failed: number;
        void: number;
        working: number;
    };
    target: boolean;
    files_closed: ArchiveAgentFilesClosed | null;
    rows: ArchiveAgentTrialRow[];
}
export interface ArchiveScrapeFile {
    name: string;
    url: string;
    sha256: string;
    media_type: string;
}
export interface ArchiveScrapeTrialRow {
    stage: ArchiveScrapeTrial['stage'];
    round: number;
    status: ArchiveScrapeTrial['status'];
    wall_ms: string;
    cassette: ArchiveScrapeFile | null;
    outputs: ArchiveScrapeFile[] | null;
}
export type ArchiveScrapeFilesClosed = PrivatePartsClosed | SecretWithheld | 'no_record';
export interface ArchiveScrapeTrials {
    time_ms: string | null;
    median_ms: string | null;
    best_ms: string | null;
    interval: ArchiveScrapePerformance['interval'];
    trim: number;
    correct_trials: number;
    finalist: boolean;
    did_not_finish: boolean;
    counts: {
        trials: number;
        correct: number;
        failed: number;
        voids_rerun: number;
    };
    files_closed: ArchiveScrapeFilesClosed | null;
    heat: ArchiveScrapeFile | null;
    manifest: ArchiveScrapeFile | null;
    rows: ArchiveScrapeTrialRow[];
}
export interface ArchiveEligibility {
    ranked: boolean;
    prize_eligible: boolean;
    efficiency_eligible: boolean;
    reasons: string[];
}
export interface ArchiveAuthorshipSummary {
    algo_version: number;
    lines_total: number;
    authored: number;
    pasted: number;
    read: number;
    absent: number;
    authored_coverage: string | null;
    micro_usd_per_surviving_line: string | null;
    dead_spend: string | null;
}
export interface JudgeArtifactLink {
    media: 'text' | 'image';
    url: string;
    preview_url: string;
    sha256: string;
}
export interface ArchiveJudgeCall {
    first: 'entry' | 'opponent';
    verdict: 'entry' | 'opponent' | null;
    margin: number | null;
    reason: string | null;
    invalid: string | null;
    model: string | null;
}
export interface ArchiveJudgeOpponentEntry {
    submission_id: string;
    handle: string | null;
    house: boolean;
}
export interface ArchiveJudgeOpponent {
    kind: 'entry' | 'anchor';
    artifact_sha256: string;
    anchor_files: string[];
    entries: ArchiveJudgeOpponentEntry[];
    artifact: JudgeArtifactLink | null;
}
export interface ArchiveJudgeMatch {
    stage: 'swiss' | 'playoff' | 'provisional';
    round: number;
    opponent: ArchiveJudgeOpponent;
    points: number;
    result: 'win' | 'draw' | 'loss';
    calls: ArchiveJudgeCall[];
}
export interface ArchiveJudgeHeat {
    sha256: string;
    stage: 'final' | 'provisional';
    verdict: 'v1' | 'v2';
    model: string;
    invalid_calls: number;
    matches: ArchiveJudgeMatch[];
}
export interface ArchiveJudge {
    artifact_file: string;
    media: 'text' | 'image';
    artifact: JudgeArtifactLink | null;
    artifact_sha256: string;
    win_rate_micro: number;
    se_micro: number;
    interval_low_micro: number;
    interval_high_micro: number;
    wins: number;
    draws: number;
    losses: number;
    matches: number;
    finalist: boolean;
    provisional: boolean;
    heat: ArchiveJudgeHeat | null;
    heat_closed: PrivatePartsClosed | null;
}
export interface ArchivePhaseScore {
    phase: PhaseKey;
    title: string;
    run_id: string;
    status: RunStatus;
    scores_visible: boolean;
    placements_held: boolean;
    reproduced: boolean;
    reproduced_by: string[];
    performance: ArchivePerformance | ArchiveAgentPerformanceWithheld | null;
    agent?: ArchiveAgentTrials;
    scrape?: ArchiveScrapeTrials;
    judge?: ArchiveJudge;
    capital?: ArchiveBarsCapital;
    constraints: ArchiveConstraints | null;
    cost_sensitivity: (ArchiveCostSensitivity & {
        base_net_pnl_lamports: string;
    }) | null;
    eras?: ArchiveEras;
    stress?: ArchiveStress;
    eligibility: ArchiveEligibility | null;
    flags: string[];
}
export interface ArchiveRun {
    id: string;
    kind: RunKind;
    phase: PhaseKey;
    attempt: number;
    status: RunStatus;
    image_digest: string | null;
    dataset_sha256: string | null;
    harness_version: string | null;
    scorer_version: string | null;
    seed: string | null;
    fail_key: string | null;
    action_log_sha256: string | null;
    result_sha256: string | null;
    exec_count: number;
    wall_ms: number | null;
    flags: string[];
    reproduces_run_id: string | null;
    reproduced: boolean;
    scores_visible: boolean;
    error: string | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
}
export interface ArchiveTokenTotals {
    input: string;
    output: string;
    cache_read: string;
    cache_write_5m: string;
    cache_write_1h: string;
    reasoning: string;
}
export interface ArchiveModelCost {
    model: string;
    lines: number;
    unpriced_lines: number;
    micro_usd: string | null;
    priced_micro_usd: string;
    tokens: ArchiveTokenTotals;
}
export interface ArchiveMeteredCost {
    micro_usd: string | null;
    priced_micro_usd: string;
    requests: number;
    unpriced_requests: number;
    through: string;
    pricing_rev: string;
    requests_sha256: string | null;
}
export interface ArchiveCost {
    withheld: false;
    pricing_rev: string | null;
    micro_usd: string | null;
    priced_micro_usd: string;
    lines: number;
    unpriced_lines: number;
    partial_lines: number;
    inconsistent_lines: number;
    tokens: ArchiveTokenTotals;
    models: ArchiveModelCost[];
    provenance: CostProvenance;
    sessions: number;
    turns: number;
    metered?: ArchiveMeteredCost;
}
export interface ArchiveCostWithheld {
    withheld: true;
    pricing_rev: string | null;
    micro_usd: string | null;
    provenance: CostProvenance;
    sessions: number;
    turns: number;
}
export interface ArchiveDeadSpend {
    share: string | null;
    dead_micro_usd: string | null;
    priced_micro_usd: string | null;
    authoring_micro_usd: string | null;
    dead_sessions: number;
    sessions: number;
}
export interface ArchiveAuthorship {
    algo_version: number;
    pricing_rev: string;
    authorship_sha256: string;
    summary: ArchiveAuthorshipSummary;
    dead_spend: ArchiveDeadSpend | null;
}
export type ArchiveDownloadKind = 'git-bundle' | 'snapshot-index' | 'authorship-ledger' | 'action-log' | 'atif' | 'code-heat' | 'artifact' | 'judge-record';
export interface ArchiveDownload {
    name: string;
    kind: ArchiveDownloadKind;
    url: string;
    sha256: string;
    media_type: string;
}
export interface SubmissionArchive extends EntryClone {
    id: string;
    title: string | null;
    status: SubmissionStatus;
    visibility: Visibility;
    house: boolean;
    baseline: boolean;
    via: SubmissionVia;
    owner: ArchiveOwner;
    competition: ArchiveCompetitionRef | null;
    repo_url: string;
    commit_sha: string;
    source_withheld: boolean;
    source_removed?: true;
    source_removed_note?: string;
    entry_message?: string | null;
    entry_signature?: string | null;
    license_spdx: string | null;
    repo_created_at: string | null;
    created_at: string;
    updated_at: string;
    error: string | null;
    receipt: PublicReceipt | null;
    snapshot: {
        sha256: string | null;
        bundle_sha256: string | null;
        files: number | null;
        bytes: number | null;
    };
    access: EntryAccess;
    scores: ArchivePhaseScore[];
    reproduced: boolean;
    runs: ArchiveRun[];
    metrics_withheld: boolean;
    cost: ArchiveCost | ArchiveCostWithheld;
    build_wall_ms?: number | null;
    authorship: ArchiveAuthorship | null;
    downloads: ArchiveDownload[];
}
export type TreeEntryType = 'dir' | 'file' | 'symlink';
export interface TreeEntry {
    name: string;
    path: string;
    type: TreeEntryType;
    size: number;
    mode: number | null;
    blob_sha256: string | null;
    files: number;
}
export interface TreeFileAuthorship {
    algo_version: number;
    lines: number;
    authored: number;
    pasted: number;
    read: number;
    absent: number;
}
export interface TreeDir {
    type: 'dir';
    submission_id: string;
    path: string;
    entries: TreeEntry[];
}
export interface TreeFile {
    type: 'file';
    submission_id: string;
    path: string;
    size: number;
    mode: number;
    blob_sha256: string;
    binary: boolean;
    text: string | null;
    truncated: boolean;
    lines: number | null;
    authorship: TreeFileAuthorship | null;
    download: string;
}
export interface TreeSymlink {
    type: 'symlink';
    submission_id: string;
    path: string;
    mode: number;
    blob_sha256: string;
    target: string;
    download: null;
}
export type TreeResponse = TreeDir | TreeFile | TreeSymlink;
export interface BlameOrigin {
    session_id: string;
    session: string;
    source: TranscriptSource;
    agent_id: string | null;
    turn: string;
    cost_share_micro_usd: string | null;
}
export interface BlameLine {
    line: number;
    text: string;
    origin: BlameOrigin | null;
}
export interface BlameTurn {
    session_id: string;
    turn: string;
    lines: number;
    micro_usd: string | null;
}
export interface BlameResponse {
    submission_id: string;
    path: string;
    blob_sha256: string;
    lines: BlameLine[];
    truncated: boolean;
    authorship: TreeFileAuthorship | null;
    authored_lines: number;
    micro_usd: string | null;
    unpriced_lines: number;
    turns: BlameTurn[];
}
export interface BlameAnswer extends BlameResponse {
    metrics_withheld: boolean;
}
export interface TranscriptSessionInfo {
    id: string;
    source: TranscriptSource;
    session_id: string;
    parent_session_id: string | null;
    agent_id: string | null;
    bundle_path: string;
    provenance: ProvenanceTier;
    ingest_version: string;
    first_at: string | null;
    last_at: string | null;
    in_window: boolean | null;
    turns: number;
    excluded_turns: number;
    redactions: number;
    models: string[];
    atif_sha256: string | null;
    usage: TranscriptUsage | null;
}
export interface TranscriptUsage {
    lines: number;
    unpriced_lines: number;
    micro_usd: string | null;
    priced_micro_usd: string;
}
export interface TranscriptList extends Page<TranscriptSessionInfo> {
    submission_id: string;
    metrics_withheld: boolean;
    manifest: unknown;
}
export interface TranscriptToolCall {
    id: string;
    name: string;
    arguments: string;
}
export interface TranscriptObservation {
    call_id: string | null;
    text: string;
    subagent: string | null;
    is_error: boolean;
}
export type TranscriptTurnSource = 'system' | 'user' | 'agent';
export interface TranscriptTurn {
    index: number;
    trajectory: string | null;
    step_id: number;
    source: TranscriptTurnSource;
    at: string | null;
    model: string | null;
    message_id: string | null;
    text: string;
    reasoning: string | null;
    tool_calls: TranscriptToolCall[];
    observations: TranscriptObservation[];
    billed: boolean;
    micro_usd: string | null;
}
export interface TranscriptTurns extends Page<TranscriptTurn> {
    submission_id: string;
    session: TranscriptSessionInfo;
    metrics_withheld: boolean;
}
export interface ArchiveRunRef {
    id: string;
    kind: RunKind;
    phase: PhaseKey;
    attempt: number;
    status: RunStatus;
    fail_key: string | null;
}
export interface ActionLogPage extends Page<unknown> {
    submission_id: string;
    run: ArchiveRunRef;
    action_log_sha256: string;
    format: string | null;
    header: Record<string, unknown>;
    list: string | null;
    total: number;
}
export interface ActionLogQuery extends PageQuery {
    run?: string;
}
export interface CompareSide extends EntryClone {
    id: string;
    title: string | null;
    status: SubmissionStatus;
    visibility: Visibility;
    owner: ArchiveOwner;
    competition: ArchiveCompetitionRef | null;
    repo_url: string;
    commit_sha: string;
    source_withheld: boolean;
    source_removed?: true;
    source_removed_note?: string;
    scores: ArchivePhaseScore[];
    reproduced: boolean;
    metrics_withheld: boolean;
    cost: ArchiveCost | ArchiveCostWithheld;
    build_wall_ms?: number | null;
    authorship: ArchiveAuthorship | null;
    access: EntryAccess;
}
export type FileDiffStatus = 'added' | 'removed' | 'modified';
export interface CompareFileSide {
    blob_sha256: string;
    size: number;
    kind: 'file' | 'symlink';
}
export interface CompareFile {
    path: string;
    status: FileDiffStatus;
    a: CompareFileSide | null;
    b: CompareFileSide | null;
    lines_added: number | null;
    lines_removed: number | null;
}
export interface CompareDiff {
    files: CompareFile[];
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    lines_added: number;
    lines_removed: number;
}
export type CompareDelta = {
    phase: PhaseKey;
    net_pnl_lamports: string;
} | {
    phase: PhaseKey;
    net_pnl_quote_units: string;
    quote: ArchiveBarsCapital['quote'];
    quote_scale: number;
    hedged_pnl_quote_units?: string;
};
export interface CompareResponse {
    a: CompareSide;
    b: CompareSide;
    same_competition: boolean;
    delta: CompareDelta[];
    cost_delta_micro_usd: string | null;
    diff: CompareDiff | null;
    diff_closed: PrivatePartsClosed | SecretWithheld | null;
    file: {
        path: string;
        status: FileDiffStatus | 'unchanged' | 'absent';
        unified: string | null;
    } | null;
}
export interface CompareQuery {
    path?: string;
    stats?: 'none';
}
export type SearchKind = 'snapshot' | 'transcript';
export interface SearchHit {
    submission_id: string;
    competition: string;
    kind: SearchKind;
    path: string | null;
    line_start: number | null;
    line_end: number | null;
    session_id: string | null;
    trajectory: string | null;
    step: number | null;
    turn: string | null;
    snippet: string;
    rank: number;
}
export interface SearchQuery extends PageQuery {
    q: string;
    kind?: SearchKind | 'all';
    competition?: string;
    submission?: string;
}
export interface SearchResponse extends Page<SearchHit> {
    query: string;
    kind: SearchKind | 'all';
}
export type SourceRemovalReason = 'dmca' | 'license' | 'malware' | 'privacy' | 'other';
export interface SourceRemoval {
    submission_id: string;
    competition: string;
    reason: SourceRemovalReason;
    note: string;
    removed_at: string;
}
export type SourceRemovalsQuery = PageQuery;
export interface SourceRemovalRoutes {
    'GET /api/source-removals': {
        query: SourceRemovalsQuery;
        response: Page<SourceRemoval>;
    };
}
export interface ArchiveRoutes {
    'GET /api/submissions/:id': {
        params: {
            id: string;
        };
        response: SubmissionArchive;
    };
    'GET /api/submissions/:id/tree': ArchiveRoutes['GET /api/submissions/:id/tree/*'];
    'GET /api/submissions/:id/tree/*': {
        params: {
            id: string;
        };
        response: TreeResponse;
    };
    'GET /api/submissions/:id/blame/*': {
        params: {
            id: string;
        };
        response: BlameAnswer;
    };
    'GET /api/submissions/:id/transcripts': {
        params: {
            id: string;
        };
        query: PageQuery;
        response: TranscriptList;
    };
    'GET /api/submissions/:id/transcripts/:sessionId/turns': {
        params: {
            id: string;
            sessionId: string;
        };
        query: PageQuery;
        response: TranscriptTurns;
    };
    'GET /api/submissions/:id/action-log': {
        params: {
            id: string;
        };
        query: ActionLogQuery;
        response: ActionLogPage;
    };
    'GET /api/compare/:a/:b': {
        params: {
            a: string;
            b: string;
        };
        query: CompareQuery;
        response: CompareResponse;
    };
    'GET /api/search': {
        query: SearchQuery;
        response: SearchResponse;
    };
}
//# sourceMappingURL=archive.d.ts.map