// Pagination: every list route of the API answers a page, `{items, next_cursor, …}`, and takes the cursor back as
// `?cursor=`. paginate walks the items of every page; pages walks the pages themselves, each its route's full answer
// (a rankings page's order and total too). Both stop at a null next_cursor, and at a cursor the server answered
// before (so a server that repeats one cannot loop them).
//
//   for await (const bounty of client.paginate('GET /api/competitions', { query: { status: 'open' } })) …
/** Every page of `route` (see the header), the first at `query.cursor` when one is given. */
export async function* pages(client, route, ...args) {
    const o = (args[0] ?? {});
    const request = client.request.bind(client);
    const seen = new Set();
    let cursor = typeof o.query?.cursor === 'string' && o.query.cursor !== '' ? o.query.cursor : undefined;
    for (;;) {
        const page = await request(route, { ...o, format: 'json', query: { ...o.query, cursor } });
        yield page;
        const next = page.next_cursor;
        if (typeof next !== 'string' || next === '' || seen.has(next))
            return;
        seen.add(next);
        cursor = next;
    }
}
/** Every item of every page of `route` (see the header). */
export async function* paginate(client, route, ...args) {
    for await (const page of pages(client, route, ...args)) {
        for (const item of page.items)
            yield item;
    }
}
//# sourceMappingURL=paging.js.map