// client.rankings: the accounts ranked by wins (default) or by reward paid out.
//
//   list / iterate   GET /api/rankings           a page (with its order and the total ranked) / every ranked account
//   standing         GET /api/rankings/:handle   one account's place in either order: its row (null when unranked), the
//                                                account just ahead of it and the total ranked (404 for no such profile)

import type { QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import type { PageItem } from '../paging.ts';

export interface RankingsResource {
  list(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): Promise<ResponseOf<'GET /api/rankings'>>;
  iterate(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/rankings'>, void, undefined>;
  standing(handle: string, query?: QueryOf<'GET /api/rankings/:handle'>, options?: CallOptions): Promise<ResponseOf<'GET /api/rankings/:handle'>>;
}

export function rankingsResource(client: MakefunClient): RankingsResource {
  return {
    list: (query, options) => client.request('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
    iterate: (query, options) => client.paginate('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
    standing: (handle, query, options) => client.request('GET /api/rankings/:handle', { ...options, params: { handle }, ...(query === undefined ? {} : { query }) }),
  };
}
