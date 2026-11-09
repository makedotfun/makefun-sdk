// client.bounties: the competitions (bounties) and what each publishes. Every helper answers its route's full
// response type; kit and export answer the raw Response (a .tar.gz, JSON Lines), whose body the caller reads.
//
//   list / iterate   GET /api/competitions                       the board, a page / every bounty on it
//   get              GET /api/competitions/:slug                 one bounty: its rules, phases, prizes, dates
//   requirements     GET /api/competitions/:slug/requirements    what an entry needs and how to submit it
//   leaderboard      GET /api/competitions/:slug/leaderboard
//   result           GET /api/competitions/:slug/result          the posted result and its on-chain facts
//   live             GET /api/competitions/:slug/live            the live board's snapshot (client.stream follows it)
//   comments         GET /api/competitions/:slug/comments        the discussion, a page (iterateComments: all of it)
//   kitManifest      GET /api/competitions/:slug/kit             kit.json: every file of the kit and its sha256
//   kit              GET /c/:slug/kit                            the kit itself, application/gzip
//   export           GET /export/:slug.jsonl                     the results as JSON Lines (application/x-ndjson)
//
// The kit and the export are heavy downloads: each costs a unit of the hour's heavy budget besides a request, and a
// kit download past the server's concurrent-download cap is a 429 (violated policy kit-concurrency) that is retried
// like any other.

import type { QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import type { PageItem } from '../paging.ts';

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

export function bountiesResource(client: MakefunClient): BountiesResource {
  return {
    list: (query, options) => client.request('GET /api/competitions', { ...options, ...(query === undefined ? {} : { query }) }),
    iterate: (query, options) => client.paginate('GET /api/competitions', { ...options, ...(query === undefined ? {} : { query }) }),
    get: (slug, options) => client.request('GET /api/competitions/:slug', { ...options, params: { slug } }),
    requirements: (slug, options) => client.request('GET /api/competitions/:slug/requirements', { ...options, params: { slug } }),
    leaderboard: (slug, query, options) => client.request('GET /api/competitions/:slug/leaderboard', { ...options, params: { slug }, ...(query === undefined ? {} : { query }) }),
    result: (slug, options) => client.request('GET /api/competitions/:slug/result', { ...options, params: { slug } }),
    live: (slug, options) => client.request('GET /api/competitions/:slug/live', { ...options, params: { slug } }),
    comments: (slug, query, options) => client.request('GET /api/competitions/:slug/comments', { ...options, params: { slug }, ...(query === undefined ? {} : { query }) }),
    iterateComments: (slug, query, options) => client.paginate('GET /api/competitions/:slug/comments', { ...options, params: { slug }, ...(query === undefined ? {} : { query }) }),
    kitManifest: (slug, query, options) => client.request('GET /api/competitions/:slug/kit', { ...options, params: { slug }, ...(query === undefined ? {} : { query }) }),
    kit: (slug, options = {}) => {
      const { phase, ifNoneMatch, ...call } = options;
      return client.raw('GET', `/c/${encodeURIComponent(slug)}/kit`, {
        ...call,
        accept: 'application/gzip',
        query: { phase },
        ...(ifNoneMatch === undefined ? {} : { headers: { ...call.headers, 'if-none-match': ifNoneMatch } }),
      });
    },
    export: (slug, options) => client.raw('GET', `/export/${encodeURIComponent(slug)}.jsonl`, { ...options, accept: 'application/x-ndjson' }),
  };
}
