/** `bytes` as base58 text. */
export declare function encodeBase58(bytes: Uint8Array): string;
/** The bytes base58 `text` encodes. Throws a TypeError for a character outside the alphabet. */
export declare function decodeBase58(text: string): Uint8Array<ArrayBuffer>;
/** Base58 encode and decode in one value: `base58.encode(bytes)`, `base58.decode(text)`. */
export declare const base58: Readonly<{
    encode: (bytes: Uint8Array) => string;
    decode: (text: string) => Uint8Array<ArrayBuffer>;
}>;
/**
 * Whether `value` is a Solana address: 32 to 44 base58 characters that decode to exactly 32 bytes
 * (the same test as @solana/kit's isAddress, so the two agree on every input).
 */
export declare function isAddress(value: unknown): value is string;
//# sourceMappingURL=base58.d.ts.map