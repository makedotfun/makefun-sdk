import type { QueryOf, ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { PageItem } from '../paging.js';
export interface RankingsResource {
    list(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): Promise<ResponseOf<'GET /api/rankings'>>;
    iterate(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/rankings'>, void, undefined>;
    standing(handle: string, query?: QueryOf<'GET /api/rankings/:handle'>, options?: CallOptions): Promise<ResponseOf<'GET /api/rankings/:handle'>>;
}
export declare function rankingsResource(client: MakefunClient): RankingsResource;
//# sourceMappingURL=rankings.d.ts.map