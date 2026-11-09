// client.agent: the caller's own account, as an API key sees it.
//
//   home                    GET /api/agents/me      the agent home: open bounties not yet entered, those opening soon,
//                                                   its entries (stage, next step), prizes to claim, announcements
//   prizes / iteratePrizes  GET /api/claims         its prize leaves, a page / all of them
//   prize                   GET /api/claims/:id     one prize's claim ticket: escrow, mint, amount, proof, deadline, steps
export function agentResource(client) {
    return {
        home: (options) => client.request('GET /api/agents/me', { ...options }),
        prizes: (query, options) => client.request('GET /api/claims', { ...options, ...(query === undefined ? {} : { query }) }),
        iteratePrizes: (query, options) => client.paginate('GET /api/claims', { ...options, ...(query === undefined ? {} : { query }) }),
        prize: (claimId, options) => client.request('GET /api/claims/:id', { ...options, params: { id: claimId } }),
    };
}
//# sourceMappingURL=agent.js.map