// The client's small HTTP pieces, shared by ./client.ts, ./paging.ts, ./stream.ts and the resources: a route key's
// method and path, the query string, form bodies and the waits between retries. No imports, no Node APIs.

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * `'GET /api/submissions/:id/tree/*'` + params + tail → `/api/submissions/<id>/tree/<tail>`, each part URL-encoded.
 * Throws a TypeError for a missing param.
 */
export function routePath(route: string, params: Readonly<Record<string, string>> = {}, tail?: string): string {
  const path = route.slice(route.indexOf(' ') + 1);
  return path
    .split('/')
    .map((seg) => {
      if (seg === '*') return (tail ?? '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
      if (!seg.startsWith(':')) return seg;
      const v = params[seg.slice(1)];
      if (v === undefined || v === '') throw new TypeError(`${route}: missing :${seg.slice(1)}`);
      return encodeURIComponent(v);
    })
    .join('/')
    .replace(/\/$/, '');
}

/** `?a=1&b=x`, skipping undefined, null and empty values; arrays repeat the key. */
export function withQuery(path: string, query: Readonly<Record<string, unknown>> | undefined): string {
  if (!query) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    for (const one of Array.isArray(v) ? v : [v]) qs.append(k, String(one));
  }
  const s = qs.toString();
  return s ? `${path}${path.includes('?') ? '&' : '?'}${s}` : path;
}

/** A route key's method: `'POST /api/…'` → POST. */
export function routeMethod(route: string): HttpMethod {
  return route.slice(0, route.indexOf(' ')) as HttpMethod;
}

// ---------------------------------------------------------------- bodies

export const isBlob = (v: unknown): v is Blob => typeof Blob !== 'undefined' && v instanceof Blob;

/** A blob's file name in a form: a File's own name, else `fallback`. */
export function fileNameOf(blob: Blob, fallback: string): string {
  const name = (blob as { name?: unknown }).name;
  return typeof name === 'string' && name !== '' ? name : fallback;
}

/** A plain object as multipart/form-data: each value a field, a Blob a file part, an array its key repeated, null and undefined left out. */
export function toFormData(fields: Readonly<Record<string, unknown>>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    for (const one of Array.isArray(v) ? (v as unknown[]) : [v]) {
      if (one === undefined || one === null) continue;
      if (isBlob(one)) form.append(k, one, fileNameOf(one, k));
      else form.append(k, typeof one === 'object' ? JSON.stringify(one) : String(one));
    }
  }
  return form;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
};

/**
 * A body fetch takes: the `body` of the runtime's own RequestInit, so the declarations name no DOM-only global
 * (`BodyInit` is the DOM lib's; a Node program type-checked with @types/node alone has RequestInit and not it).
 */
export type FetchBody = NonNullable<RequestInit['body']>;

/**
 * A request body as fetch sends it: a FormData, Blob, string, URLSearchParams or bytes as they are; a plain object
 * with a Blob among its values (or in an array value) as multipart/form-data; anything else as JSON.
 */
export function encodeBody(body: unknown): { body?: FetchBody; contentType?: string } {
  if (body === undefined) return {};
  if (
    typeof body === 'string' ||
    isBlob(body) ||
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return { body: body as FetchBody };
  }
  if (isPlainObject(body) && Object.values(body).some((v) => isBlob(v) || (Array.isArray(v) && v.some(isBlob)))) return { body: toFormData(body) };
  return { body: JSON.stringify(body), contentType: 'application/json' };
}

/** An answer's text as JSON when it is JSON, else the text itself; null for an empty one. */
export function parseBody(text: string): unknown {
  if (text === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------- waiting

const RETRY_BASE_MS = 500;
const RETRY_CAP_MS = 30_000;

/** Exponential backoff with full jitter: a uniform wait in [0, min(30 s, 500 ms · 2^attempt)). */
export function backoffMs(attempt: number, random: () => number = Math.random): number {
  return Math.floor(random() * Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** attempt));
}

/** Wait `ms`, or reject with the signal's reason as soon as it aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, ms));
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// ---------------------------------------------------------------- base64

/** Bytes as standard base64 (with padding), on btoa: a proposal's deposit transaction travels this way. */
export function encodeBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Standard base64 as bytes, on atob. Throws a TypeError for text that is not base64. */
export function decodeBase64(text: string): Uint8Array<ArrayBuffer> {
  let s: string;
  try {
    s = atob(text.trim());
  } catch {
    throw new TypeError('not base64');
  }
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
