import type { PublicRoute, QueryOf, ResponseOf } from './api-types/public.js';
import type { MakefunClient, RequestArgs } from './client.js';
/** A GET route that answers a page (`items` and `next_cursor`) and takes `?cursor=`. */
export type PagedRoute = {
    [R in PublicRoute]: R extends `GET ${string}` ? (ResponseOf<R> extends {
        items: readonly unknown[];
        next_cursor: string | null;
    } ? ({
        cursor?: string;
    } extends QueryOf<R> ? R : never) : never) : never;
}[PublicRoute];
/** One item of a paged route's pages. */
export type PageItem<R extends PagedRoute> = ResponseOf<R> extends {
    items: readonly (infer T)[];
} ? T : never;
/** Every page of `route` (see the header), the first at `query.cursor` when one is given. */
export declare function pages<R extends PagedRoute>(client: Pick<MakefunClient, 'request'>, route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<ResponseOf<R>, void, undefined>;
/** Every item of every page of `route` (see the header). */
export declare function paginate<R extends PagedRoute>(client: Pick<MakefunClient, 'request'>, route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<PageItem<R>, void, undefined>;
//# sourceMappingURL=paging.d.ts.map