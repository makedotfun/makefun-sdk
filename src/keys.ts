// An API key from a wallet, with Sign in with Solana: no account to make first, no browser. The wallet's first key
// makes its account (its handle is the wallet's); a later one is another key of the same account.
//
//   1. GET  /api/auth/methods                  the chain the message names, and the statement a key takes
//   2. POST /api/auth/siws/nonce               {walletAddress} → the challenge: domain, URI, nonce, issued and expiry
//   3. the wallet signs the SIWS text of the challenge (the Wallet Standard's solana:signIn layout), its statement the
//      server's key statement (methods.solana.key_statement), so a sign-in relayed from another page never mints a key
//   4. POST /api/auth/solana/key               {walletAddress, message, signature (base58), name?, ref?, ga?}
//                                              → {key, expires_at, user}: the key, shown this once, good for 30 days
//
// Browser-safe: nothing is stored. On Node, mintAndStoreKey (./node.ts) stores the key where the makefun command line
// finds it.

import type { AuthMethodsResponse, SiwsChallenge } from './api-types/core.ts';
import type { ResponseOf } from './api-types/public.ts';
import { createClient, type ClientOptions, type MakefunClient } from './client.ts';
import { MakefunError } from './errors.ts';
import { signTextBase58, type Signer } from './signer.ts';

/** The statement a server from before key_statement takes: its sign-in statement. */
export const SIGN_IN_STATEMENT = 'Sign in to make.fun. No transaction, no fee.';
/** The longest key name the server takes. */
export const KEY_NAME_MAX = 32;
/** The longest referral code the key route reads. */
export const REF_MAX = 64;
/** The longest GA handoff the key route reads. */
export const GA_MAX = 256;

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
export function siwsMessage(challenge: SiwsChallenge, address: string, chainId: string, statement: string = SIGN_IN_STATEMENT): string {
  const fields = [`URI: ${challenge.uri}`, 'Version: 1', `Chain ID: ${chainId}`, `Nonce: ${challenge.nonce}`, `Issued At: ${challenge.issuedAt}`, `Expiration Time: ${challenge.expirationTime}`];
  return `${challenge.domain} wants you to sign in with your Solana account:\n${address}\n\n${statement}\n\n${fields.join('\n')}`;
}

/** The statement a key's message carries: the server's key statement, or the sign-in statement when it names none (a server from before it). */
export function keyStatementOf(methods: Pick<AuthMethodsResponse, 'solana'>): string {
  const named = methods.solana.key_statement;
  return typeof named === 'string' && named !== '' ? named : SIGN_IN_STATEMENT;
}

function bounded(what: string, value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  const v = value.trim();
  if (v === '' || v.length > max) throw new TypeError(`${what}: 1 to ${max} characters`);
  return v;
}

/**
 * Mint an API key for `signer`'s wallet (see the header): `{key, expires_at, user}`. Throws MakefunError for a server
 * that offers no Sign in with Solana or refuses the proof, and TypeError for a name, ref or ga out of bounds.
 */
export async function mintWithWallet(signer: Pick<Signer, 'address' | 'signMessage'>, options: MintOptions = {}): Promise<MintedApiKey> {
  const name = bounded('name', options.name, KEY_NAME_MAX);
  const ref = bounded('ref', options.ref, REF_MAX);
  const ga = bounded('ga', options.ga, GA_MAX);
  const client =
    options.client ??
    createClient({
      ...(options.origin === undefined ? {} : { origin: options.origin }),
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      ...(options.userAgent === undefined ? {} : { userAgent: options.userAgent }),
      ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    });
  // No API key goes along: these routes take none, and an expired one would only be refused.
  const call = { apiKey: null, ...(options.signal === undefined ? {} : { signal: options.signal }) };
  const methods = await client.request('GET /api/auth/methods', call);
  if (!methods.methods.includes('solana')) {
    throw new MakefunError(`${client.origin} does not offer Sign in with Solana (it offers ${methods.methods.join(', ') || 'nothing'})`, { status: null, body: methods });
  }
  const challenge = await client.json<SiwsChallenge>('POST', '/api/auth/siws/nonce', { ...call, body: { walletAddress: signer.address } });
  const message = siwsMessage(challenge, signer.address, methods.solana.chain_id, keyStatementOf(methods));
  const signature = await signTextBase58(signer, message);
  const minted = await client.request('POST /api/auth/solana/key', {
    ...call,
    body: { walletAddress: signer.address, message, signature, ...(name === undefined ? {} : { name }), ...(ref === undefined ? {} : { ref }), ...(ga === undefined ? {} : { ga }) },
  });
  if (typeof minted?.key !== 'string' || !minted.key.startsWith('af_')) throw new MakefunError(`${client.origin} answered no af_ key`, { status: null, body: minted });
  return minted;
}
