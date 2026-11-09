import type { CommentStreamEvent, CommentStreamQuery } from './api-types/community.js';
import type { LiveStreamEvent, LiveStreamQuery, RevealStreamEvent, RevealStreamQuery } from './api-types/live.js';
import type { CallOptions, MakefunClient } from './client.js';
/** The SSE routes: their params, query and the events they send. */
export interface StreamRoutes {
    'GET /api/competitions/:slug/live/stream': {
        params: {
            slug: string;
        };
        query: LiveStreamQuery;
        event: LiveStreamEvent;
    };
    'GET /api/competitions/:slug/comments/stream': {
        params: {
            slug: string;
        };
        query: CommentStreamQuery;
        event: CommentStreamEvent;
    };
    'GET /api/competitions/:slug/reveal/stream': {
        params: {
            slug: string;
        };
        query: RevealStreamQuery;
        event: RevealStreamEvent;
    };
}
export type StreamRoute = keyof StreamRoutes;
/** One event of `R`'s stream. */
export type StreamEventOf<R extends StreamRoute> = StreamRoutes[R]['event'];
export interface StreamOptions<R extends StreamRoute> extends Omit<CallOptions, 'headers'> {
    params: StreamRoutes[R]['params'];
    /** The route's query (`after` resumes after an event id; the comment stream's `entrants`). */
    query?: StreamRoutes[R]['query'];
    /** Reconnect when the server ends the stream (default true). */
    reconnect?: boolean;
    /** Dropped connections retried in a row before the error is thrown (default 5). */
    maxRetries?: number;
}
/** One event as the wire carries it: its name (default message), its id when it has one, its data lines joined by LF. */
export interface RawSseEvent {
    event: string;
    id?: string;
    data: string;
    /** The reconnection time the event block set, in milliseconds. */
    retry?: number;
}
/**
 * The events of a text/event-stream body (the WHATWG parsing rules, minus the dispatch to an EventSource): fields
 * `event`, `data` (each line joined by LF), `id` (one with a NUL is ignored) and `retry`, comments (`:`) skipped, a
 * block dispatched at its blank line, a block with no data line dropped unless it sets `retry`.
 */
export declare function parseEventStream(body: ReadableStream<Uint8Array>): AsyncGenerator<RawSseEvent, void, undefined>;
/** `route`'s events (see the header). */
export declare function stream<R extends StreamRoute>(client: Pick<MakefunClient, 'raw'>, route: R, options: StreamOptions<R>): AsyncGenerator<StreamEventOf<R>, void, undefined>;
//# sourceMappingURL=stream.d.ts.map