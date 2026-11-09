/** A wallet that can sign: the Wallet Standard's solana:signMessage and, optionally, solana:signTransaction. */
export interface Signer {
    /** The wallet's address: its Ed25519 public key, base58. */
    readonly address: string;
    /** The 64-byte Ed25519 signature of `message`, exactly these bytes. */
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    /** `transaction` (wire format: signatures, then the message) with this wallet's signature in its slot. */
    signTransaction?(transaction: Uint8Array): Promise<Uint8Array>;
}
/** A signer that cannot be made or cannot sign: a bad keypair, a runtime without WebCrypto Ed25519, a transaction it is not a signer of. */
export declare class SignerError extends Error {
    name: string;
}
/** The DER of a PKCS#8 Ed25519 private key up to its 32-byte seed (RFC 8410): SEQUENCE, version 0, the Ed25519 OID, OCTET STRING of OCTET STRING. */
export declare const ED25519_PKCS8_PREFIX: Uint8Array<ArrayBuffer>;
/**
 * A WebCrypto key, as signerFromCryptoKey takes one: the CryptoKey interface's read-only fields, written out because
 * `CryptoKey` is a DOM-lib global that @types/node does not declare (Node has the class at runtime, its type only as
 * `webcrypto.CryptoKey` in node:crypto). A browser's CryptoKey, Node's webcrypto.CryptoKey and what @solana/kit's
 * generateKeyPair answers all fit.
 */
export interface WebCryptoKey {
    readonly type: string;
    readonly extractable: boolean;
    readonly algorithm: {
        readonly name: string;
    };
    readonly usages: readonly string[];
}
/** Whether `value` has the Signer shape. */
export declare function isSigner(value: unknown): value is Signer;
/**
 * A signer over a Solana keypair's 64 bytes (the seed, then the public key: what solana-keygen
 * writes as a JSON array). The private key is imported non-extractable and the bytes passed in are
 * left as they are (zero them when done). Throws SignerError for anything but 64 bytes, for a
 * public half that is not the seed's, or on a runtime without WebCrypto Ed25519.
 */
export declare function signerFromKeypairBytes(keypair: Uint8Array): Promise<Signer>;
/**
 * A signer over a WebCrypto Ed25519 private key (extractable or not) and its 32-byte public key:
 * what @solana/kit's generateKeyPair makes, once its public key is exported raw.
 */
export declare function signerFromCryptoKey(privateKey: WebCryptoKey, publicKey: Uint8Array): Signer;
/** The base58 signature `signer` makes over `text`'s UTF-8 bytes: what an entry message and a Sign in with Solana message carry. */
export declare function signTextBase58(signer: Pick<Signer, 'signMessage'>, text: string): Promise<string>;
//# sourceMappingURL=signer.d.ts.map