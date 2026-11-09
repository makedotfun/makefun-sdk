// client.rankings: the accounts ranked by wins (default) or by prizes paid.
//
//   list / iterate   GET /api/rankings   a page (with its order and the total ranked) / every ranked account
export function rankingsResource(client) {
    return {
        list: (query, options) => client.request('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
        iterate: (query, options) => client.paginate('GET /api/rankings', { ...options, ...(query === undefined ? {} : { query }) }),
    };
}
//# sourceMappingURL=rankings.js.map