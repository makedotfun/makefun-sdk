// Pagination: every list route of the API answers a page, `{items, next_cursor, …}`, and takes the cursor back as
// `?cursor=`. paginate walks the items of every page; pages walks the pages themselves, each its route's full answer
// (a rankings page's order and total too). Both stop at a null next_cursor, and at a cursor the server answered
// before (so a server that repeats one cannot loop them).
//
//   for await (const bounty of client.paginate('GET /api/competitions', { query: { status: 'open' } })) …

import type { PublicRoute, QueryOf, ResponseOf } from './api-types/public.ts';
import type { CallOptions, MakefunClient, RequestArgs } from './client.ts';

/** A GET route that answers a page (`items` and `next_cursor`) and takes `?cursor=`. */
export type PagedRoute = {
  [R in PublicRoute]: R extends `GET ${string}` ? (ResponseOf<R> extends { items: readonly unknown[]; next_cursor: string | null } ? ({ cursor?: string } extends QueryOf<R> ? R : never) : never) : never;
}[PublicRoute];

/** One item of a paged route's pages. */
export type PageItem<R extends PagedRoute> = ResponseOf<R> extends { items: readonly (infer T)[] } ? T : never;

/** The loose shape of request() the walkers call it through (the route is generic here). */
type LooseRequest = (route: string, options: Record<string, unknown>) => Promise<{ items: unknown[]; next_cursor: string | null }>;

/** Every page of `route` (see the header), the first at `query.cursor` when one is given. */
export async function* pages<R extends PagedRoute>(client: Pick<MakefunClient, 'request'>, route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<ResponseOf<R>, void, undefined> {
  const o = (args[0] ?? {}) as { query?: Record<string, unknown> } & CallOptions & Record<string, unknown>;
  const request = client.request.bind(client) as unknown as LooseRequest;
  const seen = new Set<string>();
  let cursor = typeof o.query?.cursor === 'string' && o.query.cursor !== '' ? o.query.cursor : undefined;
  for (;;) {
    const page = await request(route, { ...o, format: 'json', query: { ...o.query, cursor } });
    yield page as ResponseOf<R>;
    const next = page.next_cursor;
    if (typeof next !== 'string' || next === '' || seen.has(next)) return;
    seen.add(next);
    cursor = next;
  }
}

/** Every item of every page of `route` (see the header). */
export async function* paginate<R extends PagedRoute>(client: Pick<MakefunClient, 'request'>, route: R, ...args: RequestArgs<R, 'json'>): AsyncGenerator<PageItem<R>, void, undefined> {
  for await (const page of pages(client, route, ...args)) {
    for (const item of (page as { items: PageItem<R>[] }).items) yield item;
  }
}
