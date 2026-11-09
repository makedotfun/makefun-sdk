import type { QueryOf, ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { PageItem } from '../paging.js';
type R<K extends keyof ResponseMap> = Promise<ResponseMap[K]>;
interface ResponseMap {
    list: ResponseOf<'GET /api/competitions'>;
    get: ResponseOf<'GET /api/competitions/:slug'>;
    requirements: ResponseOf<'GET /api/competitions/:slug/requirements'>;
    leaderboard: ResponseOf<'GET /api/competitions/:slug/leaderboard'>;
    result: ResponseOf<'GET /api/competitions/:slug/result'>;
    live: ResponseOf<'GET /api/competitions/:slug/live'>;
    comments: ResponseOf<'GET /api/competitions/:slug/comments'>;
    kitManifest: ResponseOf<'GET /api/competitions/:slug/kit'>;
}
export interface KitOptions extends CallOptions {
    /** dev (default) or final, once that phase is finalized. */
    phase?: 'dev' | 'final';
    /** The ETag of a copy fetched before: an unchanged kit answers 304 with no body. */
    ifNoneMatch?: string;
}
export interface BountiesResource {
    /** One page of the board (GET /api/competitions): `status`, `category`, `demo`, `limit`, `cursor`. */
    list(query?: QueryOf<'GET /api/competitions'>, options?: CallOptions): R<'list'>;
    /** Every bounty on the board, page after page. */
    iterate(query?: QueryOf<'GET /api/competitions'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/competitions'>, void, undefined>;
    get(slug: string, options?: CallOptions): R<'get'>;
    requirements(slug: string, options?: CallOptions): R<'requirements'>;
    leaderboard(slug: string, query?: QueryOf<'GET /api/competitions/:slug/leaderboard'>, options?: CallOptions): R<'leaderboard'>;
    result(slug: string, options?: CallOptions): R<'result'>;
    live(slug: string, options?: CallOptions): R<'live'>;
    comments(slug: string, query?: QueryOf<'GET /api/competitions/:slug/comments'>, options?: CallOptions): R<'comments'>;
    iterateComments(slug: string, query?: QueryOf<'GET /api/competitions/:slug/comments'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/competitions/:slug/comments'>, void, undefined>;
    kitManifest(slug: string, query?: QueryOf<'GET /api/competitions/:slug/kit'>, options?: CallOptions): R<'kitManifest'>;
    /** The kit (.tar.gz) as the raw Response: 200 with the archive, or 304 when `ifNoneMatch` still matches. */
    kit(slug: string, options?: KitOptions): Promise<Response>;
    /** The results as JSON Lines (one ExportLine per line), as the raw Response. */
    export(slug: string, options?: CallOptions): Promise<Response>;
}
export declare function bountiesResource(client: MakefunClient): BountiesResource;
export {};
//# sourceMappingURL=bounties.d.ts.map