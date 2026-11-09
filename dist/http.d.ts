export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/**
 * `'GET /api/submissions/:id/tree/*'` + params + tail → `/api/submissions/<id>/tree/<tail>`, each part URL-encoded.
 * Throws a TypeError for a missing param.
 */
export declare function routePath(route: string, params?: Readonly<Record<string, string>>, tail?: string): string;
/** `?a=1&b=x`, skipping undefined, null and empty values; arrays repeat the key. */
export declare function withQuery(path: string, query: Readonly<Record<string, unknown>> | undefined): string;
/** A route key's method: `'POST /api/…'` → POST. */
export declare function routeMethod(route: string): HttpMethod;
export declare const isBlob: (v: unknown) => v is Blob;
/** A blob's file name in a form: a File's own name, else `fallback`. */
export declare function fileNameOf(blob: Blob, fallback: string): string;
/** A plain object as multipart/form-data: each value a field, a Blob a file part, an array its key repeated, null and undefined left out. */
export declare function toFormData(fields: Readonly<Record<string, unknown>>): FormData;
/**
 * A body fetch takes: the `body` of the runtime's own RequestInit, so the declarations name no DOM-only global
 * (`BodyInit` is the DOM lib's; a Node program type-checked with @types/node alone has RequestInit and not it).
 */
export type FetchBody = NonNullable<RequestInit['body']>;
/**
 * A request body as fetch sends it: a FormData, Blob, string, URLSearchParams or bytes as they are; a plain object
 * with a Blob among its values (or in an array value) as multipart/form-data; anything else as JSON.
 */
export declare function encodeBody(body: unknown): {
    body?: FetchBody;
    contentType?: string;
};
/** An answer's text as JSON when it is JSON, else the text itself; null for an empty one. */
export declare function parseBody(text: string): unknown;
/** Exponential backoff with full jitter: a uniform wait in [0, min(30 s, 500 ms · 2^attempt)). */
export declare function backoffMs(attempt: number, random?: () => number): number;
/** Wait `ms`, or reject with the signal's reason as soon as it aborts. */
export declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
/** Bytes as standard base64 (with padding), on btoa: a proposal's deposit transaction travels this way. */
export declare function encodeBase64(bytes: Uint8Array): string;
/** Standard base64 as bytes, on atob. Throws a TypeError for text that is not base64. */
export declare function decodeBase64(text: string): Uint8Array<ArrayBuffer>;
//# sourceMappingURL=http.d.ts.map