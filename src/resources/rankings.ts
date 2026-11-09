// client.rankings: the accounts ranked by wins (default) or by prizes paid.
//
//   list / iterate   GET /api/rankings   a page (with its order and the total ranked) / every ranked account

import type { QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import type { PageItem } from '../paging.ts';

export interface RankingsResource {
  list(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): Promise<ResponseOf<'GET /api/rankings'>>;
  iterate(query?: QueryOf<'GET /api/rankings'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/rankings'>, void, undefined>;
}

export function rankingsResource(client: MakefunClient): RankingsResource {
  return {
    list: (query, options) => client.request('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
    iterate: (query, options) => client.paginate('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
  };
}
