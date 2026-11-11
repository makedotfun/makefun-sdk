// GENERATED from the make.fun API's public.ts: do not edit, every release regenerates it.
import type { AgentRoutes } from './agent.ts';
import type { ArchiveRoutes, SourceRemovalRoutes } from './archive.ts';
import type { BarsRoutes } from './bars.ts';
import type { BudgetRoutes } from './budget.ts';
import type { BuildKeyRoutes } from './build-key.ts';
import type { EscrowRoutes } from './chain.ts';
import type { CommunityRoutes } from './community.ts';
import type { CompetitionsRoutes } from './competitions.ts';
import type { AccountMergeRoutes, AgentConnectRoutes, CoreRoutes } from './core.ts';
import type { ClaimRoutes, EntryRoutes } from './entry.ts';
import type { EntrySecretRoutes } from './entry-secrets.ts';
import type { ExperimentRoutes } from './experiments.ts';
import type { LikesRoutes } from './likes.ts';
import type { LiveRoutes } from './live.ts';
import type { MarketRoutes } from './market.ts';
import type { NotificationsRoutes } from './notifications.ts';
import type { SponsorRoutes } from './proposal.ts';
import type { QuestRoutes } from './quests.ts';
import type { RankingsRoutes } from './rankings.ts';
import type { ReferralRoutes } from './referrals.ts';
import type { RehostRoutes } from './rehost.ts';
import type { SubmissionsRoutes } from './submissions.ts';

export interface PublicRouteMaps
  extends CoreRoutes,
    AgentConnectRoutes,
    AccountMergeRoutes,
    CompetitionsRoutes,
    SubmissionsRoutes,
    ArchiveRoutes,
    SourceRemovalRoutes,
    CommunityRoutes,
    LiveRoutes,
    MarketRoutes,
    RankingsRoutes,
    NotificationsRoutes,
    ReferralRoutes,
    EscrowRoutes,
    AgentRoutes,
    EntryRoutes,
    ClaimRoutes,
    SponsorRoutes,
    RehostRoutes,
    BarsRoutes,
    BuildKeyRoutes,
    EntrySecretRoutes,
    BudgetRoutes,
    QuestRoutes,
    ExperimentRoutes,
    LikesRoutes {}

export type AdminPath = `${string} /api/admin/${string}`;

export const SESSION_ONLY_ROUTES = [
  'POST /api/notifications/push',
  'DELETE /api/notifications/push',
  'GET /api/agents/connect/pending',
  'POST /api/agents/connect/approve',
  'POST /api/agents/connect/deny',
  'GET /api/agents/connected',
  'POST /api/agents/connected/scopes',
  'POST /api/agents/connect/disconnect',
  'POST /api/account/merges/approve',
  'GET /api/me/sessions',
  'DELETE /api/me/sessions/:id',
  'GET /api/me/discord',
  'DELETE /api/me/discord',
] as const satisfies readonly Exclude<keyof PublicRouteMaps, AdminPath>[];

export type SessionOnlyRoute = (typeof SESSION_ONLY_ROUTES)[number];

export type PublicRoute = Exclude<keyof PublicRouteMaps, AdminPath | SessionOnlyRoute>;

export type PublicRoutes = Pick<PublicRouteMaps, PublicRoute>;

export type ResponseOf<R extends PublicRoute> = PublicRoutes[R]['response'];
export type BodyOf<R extends PublicRoute> = PublicRoutes[R] extends { body: infer B } ? B : never;
export type QueryOf<R extends PublicRoute> = PublicRoutes[R] extends { query: infer Q } ? Q : Record<string, never>;
export type ParamsOf<R extends PublicRoute> = PublicRoutes[R] extends { params: infer P } ? P : Record<string, never>;
