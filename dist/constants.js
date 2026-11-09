// The SDK's few fixed values that both the browser-safe client (./client.ts) and the Node-only helpers (./node.ts)
// need. No imports and no runtime APIs, so it loads anywhere.
/** The site the SDK talks to when nothing names another. */
export const DEFAULT_ORIGIN = 'https://make.fun';
/** The header an API key goes in (Better Auth's apiKey plugin's documented header). */
export const API_KEY_HEADER = 'x-api-key';
/** The product token of the SDK's User-Agent: `makefun-sdk/<version>`. */
export const USER_AGENT_PRODUCT = 'makefun-sdk';
//# sourceMappingURL=constants.js.map