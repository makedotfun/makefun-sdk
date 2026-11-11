import type { AgentRoutes } from './agent.js';
import type { ArchiveRoutes, SourceRemovalRoutes } from './archive.js';
import type { BarsRoutes } from './bars.js';
import type { BudgetRoutes } from './budget.js';
import type { BuildKeyRoutes } from './build-key.js';
import type { EscrowRoutes } from './chain.js';
import type { CommunityRoutes } from './community.js';
import type { CompetitionsRoutes } from './competitions.js';
import type { AccountMergeRoutes, AgentConnectRoutes, CoreRoutes } from './core.js';
import type { ClaimRoutes, EntryRoutes } from './entry.js';
import type { EntrySecretRoutes } from './entry-secrets.js';
import type { ExperimentRoutes } from './experiments.js';
import type { LikesRoutes } from './likes.js';
import type { LiveRoutes } from './live.js';
import type { MarketRoutes } from './market.js';
import type { NotificationsRoutes } from './notifications.js';
import type { SponsorRoutes } from './proposal.js';
import type { QuestRoutes } from './quests.js';
import type { RankingsRoutes } from './rankings.js';
import type { ReferralRoutes } from './referrals.js';
import type { RehostRoutes } from './rehost.js';
import type { SubmissionsRoutes } from './submissions.js';
export interface PublicRouteMaps extends CoreRoutes, AgentConnectRoutes, AccountMergeRoutes, CompetitionsRoutes, SubmissionsRoutes, ArchiveRoutes, SourceRemovalRoutes, CommunityRoutes, LiveRoutes, MarketRoutes, RankingsRoutes, NotificationsRoutes, ReferralRoutes, EscrowRoutes, AgentRoutes, EntryRoutes, ClaimRoutes, SponsorRoutes, RehostRoutes, BarsRoutes, BuildKeyRoutes, EntrySecretRoutes, BudgetRoutes, QuestRoutes, ExperimentRoutes, LikesRoutes {
}
export type AdminPath = `${string} /api/admin/${string}`;
export declare const SESSION_ONLY_ROUTES: readonly ["POST /api/notifications/push", "DELETE /api/notifications/push", "GET /api/agents/connect/pending", "POST /api/agents/connect/approve", "POST /api/agents/connect/deny", "GET /api/agents/connected", "POST /api/agents/connected/scopes", "POST /api/agents/connect/disconnect", "POST /api/account/merges/approve", "GET /api/me/sessions", "DELETE /api/me/sessions/:id", "GET /api/me/discord", "DELETE /api/me/discord"];
export type SessionOnlyRoute = (typeof SESSION_ONLY_ROUTES)[number];
export type PublicRoute = Exclude<keyof PublicRouteMaps, AdminPath | SessionOnlyRoute>;
export type PublicRoutes = Pick<PublicRouteMaps, PublicRoute>;
export type ResponseOf<R extends PublicRoute> = PublicRoutes[R]['response'];
export type BodyOf<R extends PublicRoute> = PublicRoutes[R] extends {
    body: infer B;
} ? B : never;
export type QueryOf<R extends PublicRoute> = PublicRoutes[R] extends {
    query: infer Q;
} ? Q : Record<string, never>;
export type ParamsOf<R extends PublicRoute> = PublicRoutes[R] extends {
    params: infer P;
} ? P : Record<string, never>;
//# sourceMappingURL=public.d.ts.map