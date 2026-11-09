// The API's three Server-Sent Events routes, read over fetch (so an API key goes along, which an EventSource cannot
// send), with a minimal text/event-stream parser:
//
//   GET /api/competitions/:slug/live/stream       a competition's live board: standings, phase, market, race, frame
//   GET /api/competitions/:slug/comments/stream   its discussion: comment, comment_removed
//   GET /api/competitions/:slug/reveal/stream     its check reveal: step, plan, fallback
//
// Each also sends reset (the changes since the cursor cannot be replayed: read the snapshot again) and evicted (a newer
// stream from the same address took this one's place). Every event is `{event, id?, data}`, its data the JSON the
// server sent, typed by the route (./api-types/live.ts, ./api-types/community.ts). A server ends a stream after a
// while with no event; the iterator then reconnects after the server's `retry:` wait with `?after=<the last id>`, so
// nothing is missed, until the caller stops iterating or aborts, the stream is evicted, or (reconnect: false) the first
// stream ends. A refused reconnect (a 404: the competition went private) is thrown; a dropped connection is retried
// up to maxRetries times in a row, after a backoff.
//
//   for await (const ev of client.stream('GET /api/competitions/:slug/live/stream', { params: { slug } })) {
//     if (ev.event === 'standings') …
//   }
import { MakefunError } from './errors.js';
import { backoffMs, routePath, sleep } from './http.js';
/**
 * The events of a text/event-stream body (the WHATWG parsing rules, minus the dispatch to an EventSource): fields
 * `event`, `data` (each line joined by LF), `id` (one with a NUL is ignored) and `retry`, comments (`:`) skipped, a
 * block dispatched at its blank line, a block with no data line dropped unless it sets `retry`.
 */
export async function* parseEventStream(body) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let event = '';
    let id;
    let data = [];
    let retry;
    let first = true;
    const takeLine = (line) => {
        if (line === '') {
            const out = data.length > 0 ? { event: event === '' ? 'message' : event, ...(id === undefined ? {} : { id }), data: data.join('\n'), ...(retry === undefined ? {} : { retry }) } : retry === undefined ? null : { event: '', data: '', retry };
            event = '';
            id = undefined;
            data = [];
            retry = undefined;
            return out;
        }
        if (line.startsWith(':'))
            return null;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        let value = colon < 0 ? '' : line.slice(colon + 1);
        if (value.startsWith(' '))
            value = value.slice(1);
        if (field === 'event')
            event = value;
        else if (field === 'data')
            data.push(value);
        else if (field === 'id') {
            if (!value.includes('\0'))
                id = value;
        }
        else if (field === 'retry' && /^\d+$/.test(value))
            retry = Number(value);
        return null;
    };
    try {
        for (;;) {
            const { value, done } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            if (first && buffer.length > 0) {
                if (buffer.charCodeAt(0) === 0xfeff)
                    buffer = buffer.slice(1);
                first = false;
            }
            let at;
            while ((at = buffer.search(/\r\n|\r|\n/)) >= 0) {
                // A CR at the very end may be the first half of a CRLF still in flight.
                if (buffer[at] === '\r' && at === buffer.length - 1 && !done)
                    break;
                const line = buffer.slice(0, at);
                buffer = buffer.slice(at + (buffer.startsWith('\r\n', at) ? 2 : 1));
                const out = takeLine(line);
                if (out !== null)
                    yield out;
            }
            if (done)
                return; // an unterminated last block is dropped, as the spec says
        }
    }
    finally {
        reader.cancel().catch(() => undefined);
    }
}
/** A raw event as `R`'s typed one: its data parsed as JSON (kept as text when it is not). */
function typed(raw) {
    let data = raw.data;
    try {
        data = JSON.parse(raw.data);
    }
    catch {
        // not JSON: keep the text
    }
    return { event: raw.event, ...(raw.id === undefined ? {} : { id: raw.id }), data };
}
const DEFAULT_RETRY_MS = 3_000;
/** `route`'s events (see the header). */
export async function* stream(client, route, options) {
    const { signal } = options;
    const reconnect = options.reconnect ?? true;
    const maxRetries = Math.max(0, options.maxRetries ?? 5);
    const path = routePath(route, options.params);
    const query = { ...options.query };
    let after = typeof query.after === 'string' && query.after !== '' ? query.after : undefined;
    let retryMs = DEFAULT_RETRY_MS;
    let failures = 0;
    for (;;) {
        let res;
        try {
            res = await client.raw('GET', path, { ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }), ...(signal === undefined ? {} : { signal }), accept: 'text/event-stream', query: { ...query, after } });
        }
        catch (err) {
            if (signal?.aborted)
                throw signal.reason;
            // A refusal (a status) is final; no answer at all is retried.
            if (!(err instanceof MakefunError) || err.status !== null || failures >= maxRetries)
                throw err;
            await sleep(backoffMs(failures++), signal);
            continue;
        }
        if (res.body === null)
            throw new MakefunError(`GET ${path}: the stream answered no body`, { status: res.status });
        try {
            for await (const raw of parseEventStream(res.body)) {
                failures = 0;
                if (raw.retry !== undefined)
                    retryMs = raw.retry;
                if (raw.id !== undefined && raw.id !== '')
                    after = raw.id;
                if (raw.data === '' && raw.event === '')
                    continue; // a retry-only block
                const ev = typed(raw);
                yield ev;
                if (raw.event === 'evicted')
                    return;
            }
        }
        catch (err) {
            if (signal?.aborted)
                throw signal.reason;
            if (failures >= maxRetries)
                throw new MakefunError(`GET ${path}: the stream broke: ${err instanceof Error ? err.message : String(err)}`, { status: null, cause: err });
            failures++;
        }
        if (!reconnect)
            return;
        await sleep(retryMs, signal);
    }
}
//# sourceMappingURL=stream.js.map