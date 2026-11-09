import type { AuthMethodsResponse, SiwsChallenge } from './api-types/core.js';
import type { ResponseOf } from './api-types/public.js';
import { type ClientOptions, type MakefunClient } from './client.js';
import { type Signer } from './signer.js';
/** The statement a server from before key_statement takes: its sign-in statement. */
export declare const SIGN_IN_STATEMENT = "Sign in to make.fun. No transaction, no fee.";
/** The longest key name the server takes. */
export declare const KEY_NAME_MAX = 32;
/** The longest referral code the key route reads. */
export declare const REF_MAX = 64;
/** The longest GA handoff the key route reads. */
export declare const GA_MAX = 256;
/** POST /api/auth/solana/key's answer: the key, when it stops working, and the account it acts as. */
export type MintedApiKey = ResponseOf<'POST /api/auth/solana/key'>;
export interface MintOptions extends Pick<ClientOptions, 'origin' | 'fetch' | 'userAgent' | 'timeoutMs'> {
    /** The client to mint through (its origin and fetch); default one made from `origin` and `fetch`. */
    client?: MakefunClient;
    /** The key's name (1 to 32 characters; the server's default names the wallet). */
    name?: string;
    /** A referral code: an account this call makes is credited to its holder. */
    ref?: string;
    /** The browser handoff a guide was fetched with (`/skill.md?ga=…`), crediting the sign-up to that visit. */
    ga?: string;
    signal?: AbortSignal;
}
/**
 * The Sign in with Solana text a wallet signs for `challenge`: its fields untouched, the statement, Version 1 and the
 * chain, as the Wallet Standard's solana:signIn writes it.
 */
export declare function siwsMessage(challenge: SiwsChallenge, address: string, chainId: string, statement?: string): string;
/** The statement a key's message carries: the server's key statement, or the sign-in statement when it names none (a server from before it). */
export declare function keyStatementOf(methods: Pick<AuthMethodsResponse, 'solana'>): string;
/**
 * Mint an API key for `signer`'s wallet (see the header): `{key, expires_at, user}`. Throws MakefunError for a server
 * that offers no Sign in with Solana or refuses the proof, and TypeError for a name, ref or ga out of bounds.
 */
export declare function mintWithWallet(signer: Pick<Signer, 'address' | 'signMessage'>, options?: MintOptions): Promise<MintedApiKey>;
//# sourceMappingURL=keys.d.ts.map