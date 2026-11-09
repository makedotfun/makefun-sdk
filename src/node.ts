// Node only (`@makedotfun/sdk/node`): a signer from a solana-keygen keypair file, and where a
// program's origin and API key come from, the same way the makefun command line finds them.
//
// resolveAccess, in order:
//   origin   the `origin` option, else $MAKEFUN_ORIGIN, else the credentials file's default_origin,
//            else https://make.fun
//   key      the `apiKey` option, else $MAKEFUN_API_KEY, else the key stored for that origin while it
//            has not expired (a stored key that expires within three days still works, with a warning)
//
// The credentials file is the command line's own, so a key `makefun register` stored works here and
// one stored here works there: $MAKEFUN_CREDENTIALS, else ~/.makefun/credentials, JSON in the format
// agent-fun/credentials/v1, keyed by origin. It is written mode 600 in a mode 700 directory, through a
// temporary file renamed into place:
//
//   {"format": "agent-fun/credentials/v1", "default_origin": "https://make.fun",
//    "keys": {"https://make.fun": {"key": "af_…", "expires_at": "…", "wallet": "…",
//             "user_id": "…", "handle": "…", "saved_at": "…", "delegation"?: {…}}}}
//
// createClientFromEnv() is a client at the origin and with the key resolveAccess finds; mintAndStoreKey(signer) mints
// a key with the wallet (./keys.ts mintWithWallet) and stores it there, as `makefun register --keypair` does.

import { chmodSync, constants, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createClient, type ClientOptions, type MakefunClient } from './client.ts';
import { DEFAULT_ORIGIN } from './constants.ts';
import { mintWithWallet, type MintedApiKey, type MintOptions } from './keys.ts';
import { signerFromKeypairBytes, type Signer } from './signer.ts';

export { DEFAULT_ORIGIN };
export const ORIGIN_ENV = 'MAKEFUN_ORIGIN';
export const API_KEY_ENV = 'MAKEFUN_API_KEY';
export const CREDENTIALS_ENV = 'MAKEFUN_CREDENTIALS';
export const CREDENTIALS_FORMAT = 'agent-fun/credentials/v1';
/** A stored key this close to its expiry still works, with a warning: three days. */
export const KEY_EXPIRY_WARNING_MS = 3 * 86_400_000;

/** A keypair file that cannot be used, or a credentials file that cannot be read or written. */
export class CredentialsError extends Error {
  override name = 'CredentialsError';
}

// ---------------------------------------------------------------- keypair files

/**
 * The 64 bytes of a solana-keygen JSON keypair file (zero them when done). Refuses a file that group
 * or others can read (chmod 600 it), as the makefun command line does.
 */
export async function readKeypairBytes(path: string): Promise<Uint8Array<ArrayBuffer>> {
  let st;
  try {
    st = await stat(path);
  } catch {
    throw new CredentialsError(`keypair ${path}: no such file`);
  }
  if (!st.isFile()) throw new CredentialsError(`keypair ${path} is not a file`);
  if (process.platform !== 'win32' && (st.mode & (constants.S_IRWXG | constants.S_IRWXO)) !== 0) {
    throw new CredentialsError(`keypair ${path} is readable by group or others (mode ${(st.mode & 0o777).toString(8)}): chmod 600 it`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new CredentialsError(`keypair ${path} is not a solana-keygen JSON keypair`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 64 || !parsed.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    if (Array.isArray(parsed)) parsed.fill(0);
    throw new CredentialsError(`keypair ${path} is not a solana-keygen JSON keypair (expected an array of 64 bytes)`);
  }
  const bytes = Uint8Array.from(parsed as number[]);
  parsed.fill(0);
  return bytes;
}

/**
 * A Signer over a solana-keygen JSON keypair file (64 bytes: the seed, then the public key), on
 * WebCrypto Ed25519: it signs messages and transactions in wire format. The file must be mode 600.
 */
export async function keypairSigner(path: string): Promise<Signer> {
  const bytes = await readKeypairBytes(path);
  try {
    return await signerFromKeypairBytes(bytes);
  } finally {
    bytes.fill(0);
  }
}

// ---------------------------------------------------------------- the credentials file

/** The account's payout delegation as the credentials keep it: entries are signed `make.fun entry v2` naming its payout wallet. */
export interface StoredDelegation {
  /** The delegation message's sha256: the Delegation line of every v2 entry. */
  sha256: string;
  /** The payout wallet. */
  payout: string;
  /** The agent's wallet that signs the entries. */
  agent: string;
  /** The Domain it names. */
  domain: string;
  competitions: '*' | string[];
  expires_at: string;
}

/** One origin's stored key. */
export interface StoredKey {
  key: string;
  expires_at: string;
  wallet: string;
  user_id: string;
  handle: string;
  saved_at: string;
  /** The account's payout delegation, when one is registered. */
  delegation?: StoredDelegation;
}

export interface Credentials {
  format: typeof CREDENTIALS_FORMAT;
  /** The origin used when none is given: the last one a key was stored for. */
  default_origin: string | null;
  /** By origin (scheme, host and port: URL.origin). */
  keys: Record<string, StoredKey>;
}

type Env = Readonly<Record<string, string | undefined>>;

/** Where the credentials live: $MAKEFUN_CREDENTIALS, else ~/.makefun/credentials. */
export function credentialsPath(env: Env = process.env): string {
  const set = env[CREDENTIALS_ENV];
  if (set !== undefined && set !== '') return set;
  return join(env.HOME !== undefined && env.HOME !== '' ? env.HOME : homedir(), '.makefun', 'credentials');
}

const emptyCredentials = (): Credentials => ({ format: CREDENTIALS_FORMAT, default_origin: null, keys: {} });

function isStoredDelegation(v: unknown): v is StoredDelegation {
  const d = v as Partial<StoredDelegation> | null;
  return (
    typeof d === 'object' &&
    d !== null &&
    (['sha256', 'payout', 'agent', 'domain', 'expires_at'] as const).every((f) => typeof d[f] === 'string') &&
    (d.competitions === '*' || (Array.isArray(d.competitions) && d.competitions.every((c) => typeof c === 'string')))
  );
}

function isStoredKey(v: unknown): v is StoredKey {
  const k = v as Partial<StoredKey> | null;
  return (
    typeof k === 'object' &&
    k !== null &&
    (['key', 'expires_at', 'wallet', 'user_id', 'handle', 'saved_at'] as const).every((f) => typeof k[f] === 'string') &&
    (k.delegation === undefined || isStoredDelegation(k.delegation))
  );
}

/** The credentials file, or empty credentials when there is none. Throws CredentialsError for a file that is not one. */
export function readCredentials(file: string = credentialsPath()): Credentials {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyCredentials();
    throw new CredentialsError(`cannot read the credentials file ${file}: ${(err as Error).message}`, { cause: err });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = null;
  }
  const c = raw as Partial<Credentials> | null;
  const ok =
    typeof c === 'object' &&
    c !== null &&
    c.format === CREDENTIALS_FORMAT &&
    (c.default_origin === null || typeof c.default_origin === 'string') &&
    typeof c.keys === 'object' &&
    c.keys !== null &&
    !Array.isArray(c.keys) &&
    Object.values(c.keys).every(isStoredKey);
  if (!ok) throw new CredentialsError(`${file} is not a makefun credentials file (${CREDENTIALS_FORMAT}): move it away and store a key again`);
  return { format: CREDENTIALS_FORMAT, default_origin: c.default_origin ?? null, keys: { ...c.keys } };
}

/** Write the credentials file, mode 600 in a mode 700 directory, through a temporary file renamed into place. */
export function writeCredentials(file: string, c: Credentials): void {
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(tmp, `${JSON.stringify(c, null, 2)}\n`, { mode: 0o600 });
    chmodSync(tmp, 0o600);
    renameSync(tmp, file);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw new CredentialsError(`cannot write the credentials file ${file}: ${(err as Error).message}`, { cause: err });
  }
}

/** An origin as the credentials key it: scheme, host and port. Throws CredentialsError for anything but an http(s) URL. */
export function originKey(origin: string): string {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new CredentialsError(`origin ${origin} is not a URL`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new CredentialsError(`origin ${origin} must be http(s)`);
  return url.origin;
}

/** A key the API minted (POST /api/auth/solana/key, or a person's account through the CLI's login), as storeKey takes it. */
export interface MintedKey {
  key: string;
  expires_at: string;
  user: { id: string; handle: string };
}

/**
 * Store `minted` as `origin`'s key, minted with `wallet`, and make `origin` the default origin: what
 * `makefun register` does, so the command line uses the key too. A payout delegation stored for the
 * same account and wallet stays; it is returned, undefined when none is kept.
 */
export function storeKey(o: { origin: string; wallet: string; minted: MintedKey; credentialsFile?: string; now?: Date }): StoredDelegation | undefined {
  const file = o.credentialsFile ?? credentialsPath();
  const origin = originKey(o.origin);
  const creds = readCredentials(file);
  const before = creds.keys[origin];
  const kept = before !== undefined && before.wallet === o.wallet && before.user_id === o.minted.user.id ? before.delegation : undefined;
  creds.keys[origin] = {
    key: o.minted.key,
    expires_at: o.minted.expires_at,
    wallet: o.wallet,
    user_id: o.minted.user.id,
    handle: o.minted.user.handle,
    saved_at: (o.now ?? new Date()).toISOString(),
    ...(kept === undefined ? {} : { delegation: kept }),
  };
  creds.default_origin = origin;
  writeCredentials(file, creds);
  return kept;
}

// ---------------------------------------------------------------- resolveAccess

/** Where a program talks to, with which key, and where that came from. */
export interface Access {
  origin: string;
  /** undefined: no key (anonymous, on the free tier). */
  apiKey: string | undefined;
  keySource: 'option' | 'env' | 'credentials' | null;
  /** The stored key's expiry, for a key read from the credentials file; else null. */
  expiresAt: string | null;
  /** The key stored for the origin, when it has expired (and so is not used). */
  expired: StoredKey | null;
  /** The warning for a stored key that expires within three days, else null. */
  warning: string | null;
  /** The payout delegation stored with the key, for a key read from the credentials file; else null. */
  delegation: StoredDelegation | null;
  credentialsFile: string;
}

export interface ResolveAccessOptions {
  /** Wins over $MAKEFUN_ORIGIN and the stored default. */
  origin?: string;
  /** Wins over $MAKEFUN_API_KEY and the stored key. */
  apiKey?: string;
  /** Default process.env. */
  env?: Env;
  /** Default now. */
  now?: Date;
  /** Where the expiry warning goes: default process.emitWarning (code MAKEFUN_KEY_EXPIRING); null for nowhere. */
  onWarning?: ((message: string) => void) | null;
}

const inWords = (ms: number): string => {
  const hours = Math.max(1, Math.round(ms / 3_600_000));
  return hours < 48 ? `${hours} hour${hours === 1 ? '' : 's'}` : `${Math.round(hours / 24)} days`;
};

/** A program's origin and API key (see the header). Throws CredentialsError for a credentials file it cannot read. */
export function resolveAccess(o: ResolveAccessOptions = {}): Access {
  const env = o.env ?? process.env;
  const file = credentialsPath(env);
  let creds: Credentials | null = null;
  const stored = (): Credentials => (creds ??= readCredentials(file));
  const fromOptionOrEnv = (o.origin !== undefined && o.origin !== '' ? o.origin : undefined) ?? (env[ORIGIN_ENV] || undefined);
  const origin = fromOptionOrEnv ?? stored().default_origin ?? DEFAULT_ORIGIN;
  const none = { expiresAt: null, expired: null, warning: null, delegation: null, credentialsFile: file } as const;
  if (o.apiKey !== undefined && o.apiKey !== '') return { ...none, origin, apiKey: o.apiKey, keySource: 'option' };
  const envKey = env[API_KEY_ENV];
  if (envKey !== undefined && envKey !== '') return { ...none, origin, apiKey: envKey, keySource: 'env' };
  let key: StoredKey | undefined;
  try {
    key = stored().keys[originKey(origin)];
  } catch (err) {
    if (err instanceof CredentialsError && /is not a URL|must be http/.test(err.message)) key = undefined;
    else throw err;
  }
  if (key === undefined) return { ...none, origin, apiKey: undefined, keySource: null };
  const at = (o.now ?? new Date()).getTime();
  const expiresAt = Date.parse(key.expires_at);
  if (!(expiresAt > at)) return { ...none, origin, apiKey: undefined, keySource: null, expired: key };
  let warning: string | null = null;
  if (expiresAt - at <= KEY_EXPIRY_WARNING_MS) {
    warning = `the API key stored for ${origin} (wallet ${key.wallet}) expires at ${key.expires_at}, in ${inWords(expiresAt - at)}: mint a new one before then (mintWithWallet, or makefun register --keypair <file>)`;
    const sink = o.onWarning === undefined ? (m: string) => process.emitWarning(m, { code: 'MAKEFUN_KEY_EXPIRING' }) : o.onWarning;
    sink?.(warning);
  }
  return { origin, apiKey: key.key, keySource: 'credentials', expiresAt: key.expires_at, expired: null, warning, delegation: key.delegation ?? null, credentialsFile: file };
}

/** Why an Access carries no key: the stored one expired, or none is stored for the origin. */
export function missingKeyText(a: Pick<Access, 'origin' | 'expired'>): string {
  if (a.expired !== null) return `the API key stored for ${a.origin} (wallet ${a.expired.wallet}) expired at ${a.expired.expires_at}: mint a new one (mintWithWallet, or makefun register --keypair <file>)`;
  return `no API key for ${a.origin}: pass apiKey, set $${API_KEY_ENV}, or mint one (mintWithWallet, or makefun register --keypair <file>)`;
}

// ---------------------------------------------------------------- a client, and a key, from the environment

export interface ClientFromEnvOptions extends ResolveAccessOptions, Omit<ClientOptions, 'origin' | 'apiKey'> {
  /** Throw CredentialsError (missingKeyText) when no usable key is found; default false: the client calls as a visitor, on the free tier. */
  requireKey?: boolean;
}

/** A client made from the environment, with where its origin and key came from. */
export type EnvClient = MakefunClient & { readonly access: Access };

/**
 * A client at the origin and with the key resolveAccess finds (see the header), the payout delegation stored with that
 * key passed on for entries.submit. A stored key that expires within three days warns (onWarning) and still works.
 */
export function createClientFromEnv(o: ClientFromEnvOptions = {}): EnvClient {
  const { origin, apiKey, env, now, onWarning, requireKey, ...clientOptions } = o;
  const access = resolveAccess({
    ...(origin === undefined ? {} : { origin }),
    ...(apiKey === undefined ? {} : { apiKey }),
    ...(env === undefined ? {} : { env }),
    ...(now === undefined ? {} : { now }),
    ...(onWarning === undefined ? {} : { onWarning }),
  });
  if (requireKey === true && access.apiKey === undefined) throw new CredentialsError(missingKeyText(access));
  const client = createClient({
    ...clientOptions,
    origin: access.origin,
    ...(access.apiKey === undefined ? {} : { apiKey: access.apiKey }),
    delegation: clientOptions.delegation !== undefined ? clientOptions.delegation : access.delegation,
  });
  return Object.assign(client, { access });
}

export interface MintAndStoreOptions extends MintOptions {
  /** Default $MAKEFUN_CREDENTIALS, else ~/.makefun/credentials. */
  credentialsFile?: string;
  /** Where the origin is read from when none is given (default process.env). */
  env?: Readonly<Record<string, string | undefined>>;
  /** The stored key's saved_at (default now). */
  now?: Date;
}

export interface StoredMint {
  minted: MintedApiKey;
  /** The origin the key is stored for, now the default origin. */
  origin: string;
  wallet: string;
  credentialsFile: string;
  /** The payout delegation kept with the key (the same account and wallet had one stored), else undefined. */
  delegation?: StoredDelegation;
}

/**
 * mintWithWallet, then the key stored in the credentials file for its origin (made the default origin), as
 * `makefun register --keypair` does, so the command line and createClientFromEnv use it. The origin: the option (or
 * the client's), else $MAKEFUN_ORIGIN, else the stored default, else https://make.fun.
 */
export async function mintAndStoreKey(signer: Pick<Signer, 'address' | 'signMessage'>, o: MintAndStoreOptions = {}): Promise<StoredMint> {
  const env = o.env ?? process.env;
  const credentialsFile = o.credentialsFile ?? credentialsPath(env);
  const origin = o.client?.origin ?? resolveAccess({ ...(o.origin === undefined ? {} : { origin: o.origin }), env: { ...env, [CREDENTIALS_ENV]: credentialsFile }, onWarning: null }).origin;
  const client =
    o.client ??
    createClient({
      origin,
      ...(o.fetch === undefined ? {} : { fetch: o.fetch }),
      ...(o.userAgent === undefined ? {} : { userAgent: o.userAgent }),
      ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
    });
  const minted = await mintWithWallet(signer, { ...o, client });
  const kept = storeKey({
    origin: client.origin,
    wallet: signer.address,
    minted: { key: minted.key, expires_at: minted.expires_at, user: { id: minted.user.id, handle: minted.user.handle } },
    credentialsFile,
    ...(o.now === undefined ? {} : { now: o.now }),
  });
  return { minted, origin: client.origin, wallet: signer.address, credentialsFile, ...(kept === undefined ? {} : { delegation: kept }) };
}
