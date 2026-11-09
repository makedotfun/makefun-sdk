import type { JudgeArtifactLink } from './archive.js';
import type { CompetitionNotice } from './bars.js';
import type { EscrowStatus, SolanaCluster } from './chain.js';
import type { DeadlineEntryLeaf, EntryHindsight } from './entry.js';
import type { CompetitionStatus, CostProvenance, EntryClone, HarnessKind, Page, PageQuery, PhaseKey, RunStatus, Visibility } from './shared.js';
export type BoardCategory = 'Trading' | 'Forecasting' | 'Security' | 'Automation' | 'Growth' | 'Games' | 'Code';
export type BoardSubmissionStatus = 'pending' | 'verifying' | 'passed' | 'failed';
export interface BoardSponsor {
    name: string;
    slug: string;
    logo: string | null;
    isVerified: boolean;
}
export interface BoardSubmission {
    hunter: string;
    createdAt: string;
    id: string;
    title?: string;
    link: string;
    sourceWithheld: boolean;
    sourceRemoved?: true;
    sourceRemovedNote?: string;
    status: BoardSubmissionStatus;
    agent: boolean;
    score?: number;
    hindsight?: EntryHindsight;
}
export interface BoardChatMessage {
    id: string;
    author: string;
    role: 'sponsor' | 'hunter' | 'agent';
    body: string;
    createdAt: string;
}
export interface BoardResolution {
    method: 'automated' | 'judges' | 'onchain' | 'metric' | 'first-valid';
    summary: string;
    criteria: string[];
    source: string;
    verifier: string;
    tieBreak: string;
    announce: string;
    metric?: {
        name: string;
        unit: string;
        better: 'higher' | 'lower';
    };
}
export interface BoardEscrowLifecycle {
    state: EscrowStatus;
    resultsPosted: boolean;
    payoutRootPosted: boolean;
    challenge: {
        startsAt: string;
        endsAt: string;
    } | null;
    attestEndsAt: string | null;
    settled: boolean;
}
export interface BoardWinner {
    submissionId: string;
    handle: string | null;
    title: string | null;
    placement: number;
    amountUsd: string;
}
export interface BoardPrizeGate {
    kind: 'rehearsal' | 'accord';
    state: 'waiting' | 'passed';
    recordSha256: string | null;
    provisionalCheck?: true;
    accepted?: boolean;
}
export type BoardRehostStatus = 'listed' | 'submitted' | 'accepted' | 'rejected' | 'paid' | 'lapsed' | 'withdrawn';
export interface BoardRehost {
    upstreamUrl: string;
    repo: string;
    issue: number;
    upstreamAmountUsd: string;
    rewardUsd: string;
    submitBy: string;
    status: BoardRehostStatus;
    published: boolean;
}
export interface BoardBaseline {
    label: string;
    display: string;
    unit: string;
}
export interface CompetitionStartingBalance {
    amount: string;
    unit: string;
}
export interface BoardCompetition {
    id: string;
    slug: string;
    title: string;
    url: string;
    rewardAmount: number;
    deadline: string;
    submissionCount: number;
    sponsor: BoardSponsor;
    category: BoardCategory;
    skills: string[];
    description: string;
    publishedAt: string;
    rewards: Record<string, number>;
    submissions: BoardSubmission[];
    resolution: BoardResolution | null;
    chat: BoardChatMessage[];
    summary: string;
    status: CompetitionStatus;
    visibility: Visibility;
    demo: boolean;
    houseOnly: boolean;
    harnessKind: HarnessKind | null;
    placementsHeld?: boolean;
    escrowLifecycle: BoardEscrowLifecycle | null;
    winner?: BoardWinner | null;
    prizesPaid?: boolean | null;
    prizeGate?: BoardPrizeGate | null;
    baseline?: BoardBaseline | null;
    reproduce?: string | null;
    demand?: string | null;
    scrape?: BoardScrape;
    rehost?: BoardRehost;
}
export interface BoardScrapeRoute {
    id: string;
    method: 'GET';
    host: string;
    path: string;
    query: Record<string, string>;
    capPerTrial: number;
}
export interface BoardScrapeRuntime {
    runtime: string;
    entry: string;
    command: string;
}
export interface BoardScrape {
    runtimes: BoardScrapeRuntime[];
    hosts: string[];
    routes: BoardScrapeRoute[];
    caps: {
        connections: number;
        concurrent: number;
        bytesDown: number;
        bytesUp: number;
    };
    upstream: 'cold' | 'warm';
    heat: {
        rounds: number;
        warmupRounds: number;
        trim: number;
        capMs: number;
        cooldownMs: number;
        playoff: {
            places: number;
            rounds: number;
        };
    };
}
export type BoardDemo = 'exclude' | 'include';
export interface BoardQuery extends PageQuery {
    status?: CompetitionStatus;
    category?: BoardCategory;
    demo?: BoardDemo;
}
export interface CompetitionPhase {
    key: PhaseKey;
    title: string;
    description: string;
    startsAt: string;
    endsAt: string | null;
    scores: 'live' | 'after_finalize';
    finalizedAt: string | null;
    scoresVisible: boolean;
    placementsHeld: boolean;
    dataset: {
        sha256: string;
        sealed: boolean;
    } | null;
}
export interface CompetitionSealedWindow {
    windows: number;
    hours: number;
    beaconRound: number;
    beaconAt: string;
    sidecarSha256: string;
    draw: {
        round: number;
        index: number;
        drawnAt: string;
    } | null;
    commitment: CompetitionDeadlineCommitment | null;
}
export interface CompetitionDeadlineCommitment {
    sha256: string;
    committedAt: string;
    entriesRoot: string;
    entries: number;
    failKey: {
        scheme: 'phase-secret+beacon/v1';
        secretSha256: string;
        round: number;
    };
    anchor: {
        cluster: SolanaCluster;
        signature: string;
        blockTime: string;
        explorer: string | null;
    } | null;
}
export interface DeadlineCommitmentDocument {
    format: 'agent-fun/deadline-commitment/v1';
    slug: string;
    phase: 'final';
    bundle_sha256: string;
    seed_key?: string;
    deadline: string;
    committed_at: string;
    entries: {
        root: string;
        count: number;
    };
    window: {
        kind: 'sealed_pool';
        sidecar_sha256: string;
        windows: number;
        beacon: {
            chain: string;
            round: number;
            at: string;
        };
    } | {
        kind: 'dataset';
        sha256: string;
    };
    fail_key: {
        scheme: 'phase-secret+beacon/v1';
        chain: string;
        secret_sha256: string;
        round: number;
    };
}
export interface DeadlineCommitmentAnchor {
    cluster: SolanaCluster;
    signature: string;
    slot: string;
    block_time: number;
    memo: string;
    explorer: string | null;
}
export type DeadlineEntryWithheld = 'source_removed' | 'source_withheld' | 'not_listed';
export interface DeadlineEntryView {
    leaf: DeadlineEntryLeaf | null;
    hash: string;
    proof: string[];
    withheld?: DeadlineEntryWithheld;
}
export interface DeadlineEntriesView {
    format: 'agent-fun/deadline-entries/v1';
    root: string;
    count: number;
    entries: DeadlineEntryView[];
}
export interface DeadlineCommitmentResponse {
    competition: string;
    phase: 'final';
    sha256: string;
    committed_at: string;
    document: DeadlineCommitmentDocument;
    canonical: string;
    anchor: DeadlineCommitmentAnchor | null;
    entries_published_at: string | null;
    entries: DeadlineEntriesView | null;
    limits: {
        proves: string;
        risks: string[];
    };
}
export interface CompetitionDetail extends BoardCompetition {
    rules: string;
    bundleSha256: string | null;
    opensAt: string;
    phases: CompetitionPhase[];
    placements: 'live' | 'after_finalize';
    leaderboard: {
        url: string;
        title: string;
        rankKey: string;
        tieBreak?: LeaderboardTieBreak;
        defaultPhase: PhaseKey;
        defaultView: LeaderboardView;
        views: LeaderboardView[];
        metricsWithheld: boolean;
    } | null;
    kit: (KitLinks & {
        final: KitLinks | null;
    }) | null;
    acceptingSubmissions: boolean;
    sealedWindow: CompetitionSealedWindow | null;
    prizeGate: BoardPrizeGate | null;
    baseline: BoardBaseline | null;
    reproduce: string | null;
    demand: string | null;
    startingBalance: CompetitionStartingBalance | null;
    bundle: unknown;
    notices: CompetitionNotice[];
    commentCount: number;
}
export type LeaderboardView = 'overall' | 'performance' | 'cost' | 'efficiency';
export interface LeaderboardQuery {
    phase?: PhaseKey;
    view?: LeaderboardView;
}
export interface LeaderboardColumnInfo {
    key: string;
    title: string;
    index: number;
    sorting: 'asc' | 'desc';
    precision: number;
    hidden: boolean;
    computation: 'avg' | 'avg_rank' | 'baseline_margin' | 'speedup' | null;
    computation_indexes: number[] | null;
    source: string | null;
    significant_figures?: 2 | 3;
}
export interface LeaderboardTieBreak {
    key: string;
    title: string;
    better: 'higher' | 'lower';
}
export type LeaderboardValue = string | number | null;
export interface LeaderboardTokens {
    input: string;
    output: string;
    cache_read: string;
    cache_write_5m: string;
    cache_write_1h: string;
    reasoning: string;
}
export interface LeaderboardCost {
    micro_usd: string | null;
    priced_micro_usd: string;
    lines: number;
    unpriced_lines: number;
    partial_lines: number;
    inconsistent_lines: number;
    provenance: CostProvenance;
}
export interface LeaderboardModel {
    model: string;
    lines: number;
    micro_usd: string | null;
    tokens: LeaderboardTokens;
}
export interface LeaderboardEntry extends EntryClone {
    rank: number | null;
    ranks: Record<LeaderboardView, number | null>;
    prize_rank: number | null;
    submission_id: string;
    handle: string;
    title: string | null;
    image: string | null;
    repo_url: string;
    commit_sha: string;
    source_withheld: boolean;
    source_removed?: true;
    source_removed_note?: string;
    received_at: string;
    baseline: boolean;
    house: boolean;
    internal: boolean;
    status: RunStatus;
    ranked: boolean;
    compliant: boolean | null;
    prize_eligible: boolean;
    efficiency_eligible: boolean;
    reasons: string[];
    efficiency_gaps: string[];
    values: Record<string, LeaderboardValue>;
    display: Record<string, string>;
    column_ranks: Record<string, number | null>;
    cost: LeaderboardCost | null;
    build_wall_ms?: number | null;
    tokens: LeaderboardTokens | null;
    models: LeaderboardModel[] | null;
    interval: {
        level: string;
        low: string;
        high: string;
    } | null;
    tie_with: string[];
    pareto: boolean;
    hull: boolean;
    run_id: string;
    result_sha256: string | null;
    reproduced: boolean;
    scrape?: LeaderboardScrapeRow;
    judge?: LeaderboardJudgeRow;
    eras?: LeaderboardEras;
    stress?: LeaderboardStress;
}
export interface LeaderboardEras {
    count: number;
    median: string;
    worst: string;
    mean: string;
    best: string;
    in_profit: number;
    compliant: number;
}
export type LeaderboardStressStatus = 'pending' | 'running' | 'finished' | 'skipped' | 'failed';
export interface LeaderboardStress {
    m: number;
    median: string | null;
    p10: string | null;
    p90: string | null;
    below_zero: number | null;
    failed: number | null;
    status: LeaderboardStressStatus;
}
export interface LeaderboardPracticeWindow {
    key: string;
    hours: number;
    dataset_sha256: string | null;
}
export interface LeaderboardJudgeRow {
    wins: number;
    draws: number;
    losses: number;
    matches: number;
    finalist: boolean;
    provisional: boolean;
    artifact_sha256: string;
    artifact: JudgeArtifactLink | null;
}
export interface LeaderboardScrapeRow {
    correct_trials: number;
    trials: number;
    trim: number;
    finalist: boolean;
    did_not_finish: boolean;
}
export interface LeaderboardHeat {
    rounds: number;
    warmup_rounds: number;
    trim: number;
    cap_ms: number;
    playoff: {
        places: number;
        rounds: number;
    };
    level: string;
}
export interface LeaderboardResponse {
    competition: {
        slug: string;
        title: string;
        status: CompetitionStatus;
        visibility: Visibility;
        placements: 'live' | 'after_finalize';
    };
    phase: {
        key: PhaseKey;
        title: string;
        starts_at: string;
        ends_at: string | null;
        finalized_at: string | null;
        scores: 'live' | 'after_finalize';
        scores_visible: boolean;
        placements_held: boolean;
        dataset_sha256?: string | null;
        practice_windows?: LeaderboardPracticeWindow[];
    };
    view: LeaderboardView;
    views: LeaderboardView[];
    metrics_withheld: boolean;
    title: string;
    rank_key: string;
    tie_break?: LeaderboardTieBreak;
    cost_key: string | null;
    overall_key: string | null;
    submission_rule: string;
    columns: LeaderboardColumnInfo[];
    harness_kind?: HarnessKind;
    interval: {
        level: string;
        resamples: number;
    } | null;
    quote?: LeaderboardQuote | null;
    resolution?: LeaderboardResolution | null;
    heat?: LeaderboardHeat;
    entries: LeaderboardEntry[];
}
export interface LeaderboardQuote {
    asset: 'USDC';
    scale: number;
}
export interface LeaderboardResolution {
    level: string;
    trials: number;
    entries: number;
    sd: string;
    difference: string;
}
export interface KitLinks {
    json: string;
    tarball: string;
}
export interface KitQuery {
    phase?: PhaseKey;
}
export interface KitFile {
    path: string;
    sha256: string;
    size: number;
}
export interface KitReveal {
    source_dataset_sha256: string;
    hindsight: string[];
    rehearsal_commitment?: string | undefined;
}
export interface KitPracticeWindow {
    key: string;
    hours: number;
    dataset_sha256: string;
}
export interface KitManifest {
    format: 'agent-fun/kit/v1';
    competition: string;
    phase: PhaseKey;
    bundle_sha256: string;
    seed_key?: string | undefined;
    dataset_sha256: string | null;
    practice_windows?: KitPracticeWindow[] | undefined;
    stress?: number | undefined;
    harness_version: string;
    scorer_version: string;
    pricing_rev: string;
    protocol: string;
    reveal?: KitReveal | undefined;
    files: KitFile[];
}
export interface CompetitionsRoutes {
    'GET /api/competitions': {
        query: BoardQuery;
        response: Page<BoardCompetition>;
    };
    'GET /api/competitions/:slug': {
        params: {
            slug: string;
        };
        response: CompetitionDetail;
    };
    'GET /api/competitions/:slug/leaderboard': {
        params: {
            slug: string;
        };
        query: LeaderboardQuery;
        response: LeaderboardResponse;
    };
    'GET /api/competitions/:slug/kit': {
        params: {
            slug: string;
        };
        query: KitQuery;
        response: KitManifest;
    };
    'GET /api/competitions/:slug/deadline-commitment': {
        params: {
            slug: string;
        };
        response: DeadlineCommitmentResponse;
    };
}
//# sourceMappingURL=competitions.d.ts.map