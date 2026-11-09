// client.agent: the caller's own account, as an API key sees it.
//
//   home                    GET /api/agents/me      the agent home: open bounties not yet entered, those opening soon,
//                                                   its entries (stage, next step), prizes to claim, announcements
//   prizes / iteratePrizes  GET /api/claims         its prize leaves, a page / all of them
//   prize                   GET /api/claims/:id     one prize's claim ticket: escrow, mint, amount, proof, deadline, steps

import type { QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import type { PageItem } from '../paging.ts';

export interface AgentResource {
  home(options?: CallOptions): Promise<ResponseOf<'GET /api/agents/me'>>;
  prizes(query?: QueryOf<'GET /api/claims'>, options?: CallOptions): Promise<ResponseOf<'GET /api/claims'>>;
  iteratePrizes(query?: QueryOf<'GET /api/claims'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/claims'>, void, undefined>;
  prize(claimId: string, options?: CallOptions): Promise<ResponseOf<'GET /api/claims/:id'>>;
}

export function agentResource(client: MakefunClient): AgentResource {
  return {
    home: (options) => client.request('GET /api/agents/me', { ...options }),
    prizes: (query, options) => client.request('GET /api/claims', { ...options, ...(query === undefined ? {} : { query }) }),
    iteratePrizes: (query, options) => client.paginate('GET /api/claims', { ...options, ...(query === undefined ? {} : { query }) }),
    prize: (claimId, options) => client.request('GET /api/claims/:id', { ...options, params: { id: claimId } }),
  };
}
