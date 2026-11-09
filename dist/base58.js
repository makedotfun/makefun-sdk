// Base58 with the Bitcoin alphabet, the encoding Solana uses for addresses and signatures. No
// dependencies and no Node APIs, so it runs in browsers too. Leading zero bytes map to leading '1's
// and back, so an encode/decode round trip keeps the length.
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/** Each ASCII code's digit value, -1 for a character outside the alphabet. */
const DIGITS = (() => {
    const digits = new Int8Array(128).fill(-1);
    for (let i = 0; i < ALPHABET.length; i++)
        digits[ALPHABET.charCodeAt(i)] = i;
    return digits;
})();
/** `bytes` as base58 text. */
export function encodeBase58(bytes) {
    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0)
        zeros++;
    // log(256) / log(58) is about 1.366: the most digits the rest can take.
    const size = Math.floor(((bytes.length - zeros) * 138) / 100) + 1;
    const digits = new Uint8Array(size);
    let length = 0;
    for (let i = zeros; i < bytes.length; i++) {
        let carry = bytes[i];
        let j = 0;
        for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
            carry += 256 * digits[k];
            digits[k] = carry % 58;
            carry = Math.floor(carry / 58);
        }
        length = j;
    }
    let start = size - length;
    while (start < size && digits[start] === 0)
        start++;
    let out = '1'.repeat(zeros);
    for (let i = start; i < size; i++)
        out += ALPHABET[digits[i]];
    return out;
}
/** The bytes base58 `text` encodes. Throws a TypeError for a character outside the alphabet. */
export function decodeBase58(text) {
    if (typeof text !== 'string')
        throw new TypeError('base58 text must be a string');
    let zeros = 0;
    while (zeros < text.length && text[zeros] === '1')
        zeros++;
    // log(58) / log(256) is about 0.733: the most bytes the rest can take.
    const size = Math.floor(((text.length - zeros) * 733) / 1000) + 1;
    const bytes = new Uint8Array(size);
    let length = 0;
    for (let i = zeros; i < text.length; i++) {
        const code = text.charCodeAt(i);
        const digit = code < 128 ? DIGITS[code] : -1;
        if (digit < 0)
            throw new TypeError(`not base58: ${JSON.stringify(text[i])} at position ${i}`);
        let carry = digit;
        let j = 0;
        for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
            carry += 58 * bytes[k];
            bytes[k] = carry % 256;
            carry = Math.floor(carry / 256);
        }
        length = j;
    }
    let start = size - length;
    while (start < size && bytes[start] === 0)
        start++;
    const out = new Uint8Array(zeros + (size - start));
    out.set(bytes.subarray(start), zeros);
    return out;
}
/** Base58 encode and decode in one value: `base58.encode(bytes)`, `base58.decode(text)`. */
export const base58 = Object.freeze({
    encode: encodeBase58,
    decode: decodeBase58,
});
/**
 * Whether `value` is a Solana address: 32 to 44 base58 characters that decode to exactly 32 bytes
 * (the same test as @solana/kit's isAddress, so the two agree on every input).
 */
export function isAddress(value) {
    if (typeof value !== 'string' || value.length < 32 || value.length > 44)
        return false;
    try {
        return decodeBase58(value).length === 32;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=base58.js.map