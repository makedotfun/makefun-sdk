import { type Signer } from './signer.js';
/** The message's first line: its format and version. */
export declare const WALLET_MESSAGE_HEADER = "make.fun wallet v1";
/** Where a signed wallet message is posted (POST) and the account's wallets are listed (GET). */
export declare const ACCOUNT_WALLETS_PATH = "/api/me/wallets";
/** A signed wallet message is good for this long after its Issued At: ten minutes. */
export declare const WALLET_MESSAGE_MAX_AGE_MS: number;
/** How far ahead of the server's clock an Issued At may be (a client clock running fast). */
export declare const WALLET_MESSAGE_MAX_SKEW_MS = 60000;
/** The longest wallet message taken, in UTF-8 bytes (a real one is under 250). */
export declare const MAX_WALLET_MESSAGE_BYTES = 1024;
/** The longest wallet label the server takes. */
export declare const WALLET_NAME_MAX = 32;
/** What a wallet message names. */
export interface WalletManifest {
    /** The site's host, with its port when it has one. */
    domain: string;
    /** The account's user id. */
    account: string;
    /** The wallet's base58 address. */
    wallet: string;
    /** RFC 3339 in UTC, as written. */
    issuedAt: string;
}
/** A manifest that cannot be written as a wallet message (formatWalletMessage). */
export declare class WalletMessageError extends Error {
    constructor(message: string);
}
/**
 * The wallet message for `m`, exactly as it is signed. `issuedAt` may be a Date (written as its toISOString()).
 * Throws WalletMessageError for a field that is not valid.
 */
export declare function formatWalletMessage(m: Omit<WalletManifest, 'issuedAt'> & {
    issuedAt: string | Date;
}): string;
export type ParsedWalletMessage = {
    ok: true;
    manifest: WalletManifest;
} | {
    ok: false;
    reason: string;
};
/** Read a wallet message: its fields, or why it is not one (the format in the header, nothing more or less). */
export declare function parseWalletMessage(text: string): ParsedWalletMessage;
/** The base58 signature `signer` makes over a wallet message's UTF-8 bytes: what POST /api/me/wallets takes as `signature`. */
export declare function signWalletMessage(message: string, signer: Pick<Signer, 'signMessage'>): Promise<string>;
//# sourceMappingURL=wallet-message.d.ts.map