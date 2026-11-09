import { type ClientOptions, type MakefunClient } from './client.js';
import { DEFAULT_ORIGIN } from './constants.js';
import { type MintedApiKey, type MintOptions } from './keys.js';
import { type Signer } from './signer.js';
export { DEFAULT_ORIGIN };
export declare const ORIGIN_ENV = "MAKEFUN_ORIGIN";
export declare const API_KEY_ENV = "MAKEFUN_API_KEY";
export declare const CREDENTIALS_ENV = "MAKEFUN_CREDENTIALS";
export declare const CREDENTIALS_FORMAT = "agent-fun/credentials/v1";
/** A stored key this close to its expiry still works, with a warning: three days. */
export declare const KEY_EXPIRY_WARNING_MS: number;
/** A keypair file that cannot be used, or a credentials file that cannot be read or written. */
export declare class CredentialsError extends Error {
    name: string;
}
/**
 * The 64 bytes of a solana-keygen JSON keypair file (zero them when done). Refuses a file that group
 * or others can read (chmod 600 it), as the makefun command line does.
 */
export declare function readKeypairBytes(path: string): Promise<Uint8Array<ArrayBuffer>>;
/**
 * A Signer over a solana-keygen JSON keypair file (64 bytes: the seed, then the public key), on
 * WebCrypto Ed25519: it signs messages and transactions in wire format. The file must be mode 600.
 */
export declare function keypairSigner(path: string): Promise<Signer>;
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
export declare function credentialsPath(env?: Env): string;
/** The credentials file, or empty credentials when there is none. Throws CredentialsError for a file that is not one. */
export declare function readCredentials(file?: string): Credentials;
/** Write the credentials file, mode 600 in a mode 700 directory, through a temporary file renamed into place. */
export declare function writeCredentials(file: string, c: Credentials): void;
/** An origin as the credentials key it: scheme, host and port. Throws CredentialsError for anything but an http(s) URL. */
export declare function originKey(origin: string): string;
/** A key the API minted (POST /api/auth/solana/key, or a person's account through the CLI's login), as storeKey takes it. */
export interface MintedKey {
    key: string;
    expires_at: string;
    user: {
        id: string;
        handle: string;
    };
}
/**
 * Store `minted` as `origin`'s key, minted with `wallet`, and make `origin` the default origin: what
 * `makefun register` does, so the command line uses the key too. A payout delegation stored for the
 * same account and wallet stays; it is returned, undefined when none is kept.
 */
export declare function storeKey(o: {
    origin: string;
    wallet: string;
    minted: MintedKey;
    credentialsFile?: string;
    now?: Date;
}): StoredDelegation | undefined;
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
/** A program's origin and API key (see the header). Throws CredentialsError for a credentials file it cannot read. */
export declare function resolveAccess(o?: ResolveAccessOptions): Access;
/** Why an Access carries no key: the stored one expired, or none is stored for the origin. */
export declare function missingKeyText(a: Pick<Access, 'origin' | 'expired'>): string;
export interface ClientFromEnvOptions extends ResolveAccessOptions, Omit<ClientOptions, 'origin' | 'apiKey'> {
    /** Throw CredentialsError (missingKeyText) when no usable key is found; default false: the client calls as a visitor, on the free tier. */
    requireKey?: boolean;
}
/** A client made from the environment, with where its origin and key came from. */
export type EnvClient = MakefunClient & {
    readonly access: Access;
};
/**
 * A client at the origin and with the key resolveAccess finds (see the header), the payout delegation stored with that
 * key passed on for entries.submit. A stored key that expires within three days warns (onWarning) and still works.
 */
export declare function createClientFromEnv(o?: ClientFromEnvOptions): EnvClient;
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
export declare function mintAndStoreKey(signer: Pick<Signer, 'address' | 'signMessage'>, o?: MintAndStoreOptions): Promise<StoredMint>;
//# sourceMappingURL=node.d.ts.map