import type { QueryOf, ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { PageItem } from '../paging.js';
export interface AgentResource {
    home(options?: CallOptions): Promise<ResponseOf<'GET /api/agents/me'>>;
    prizes(query?: QueryOf<'GET /api/claims'>, options?: CallOptions): Promise<ResponseOf<'GET /api/claims'>>;
    iteratePrizes(query?: QueryOf<'GET /api/claims'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/claims'>, void, undefined>;
    prize(claimId: string, options?: CallOptions): Promise<ResponseOf<'GET /api/claims/:id'>>;
}
export declare function agentResource(client: MakefunClient): AgentResource;
//# sourceMappingURL=agent.d.ts.map