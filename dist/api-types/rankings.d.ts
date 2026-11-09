import type { AvatarView, ProfileRecord } from './community.js';
import type { Page, PageQuery } from './shared.js';
export type RankingOrder = 'wins' | 'paid';
export interface RankedAccount {
    rank: number;
    handle: string;
    display_name: string | null;
    image: string | null;
    avatar: AvatarView | null;
    profile_url: string;
    record: ProfileRecord;
}
export interface RankingsResponse extends Page<RankedAccount> {
    order: RankingOrder;
    total: number;
}
export interface RankingsQuery extends PageQuery {
    order?: RankingOrder;
}
export interface RankingsRoutes {
    'GET /api/rankings': {
        query: RankingsQuery;
        response: RankingsResponse;
    };
}
//# sourceMappingURL=rankings.d.ts.map