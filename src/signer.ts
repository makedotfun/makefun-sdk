// The one signer shape the SDK takes wherever a wallet has to sign: entering a bounty with a signed
// entry message, minting an API key with Sign in with Solana, and a proposal's deposit transaction.
// It is the Wallet Standard's shape cut down to what the SDK calls, so a browser wallet, a
// @solana/kit signer (./kit.ts fromKitSigner) or a keypair file (./node.ts keypairSigner) all fit.
//
// signerFromKeypairBytes is the keypair signer itself, on WebCrypto alone: the 32-byte seed of a
// 64-byte Solana keypair goes into a PKCS#8 envelope, is imported non-extractable as an Ed25519
// key and signs with crypto.subtle.sign('Ed25519', …), which gives the 64-byte signature Solana
// verifies. WebCrypto Ed25519 is in Node 22.13 and later, Chrome and Edge 137+, Firefox 129+ and
// Safari 17+.

import { encodeBase58 } from './base58.ts';

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
export class SignerError extends Error {
  override name = 'SignerError';
}

/** The DER of a PKCS#8 Ed25519 private key up to its 32-byte seed (RFC 8410): SEQUENCE, version 0, the Ed25519 OID, OCTET STRING of OCTET STRING. */
export const ED25519_PKCS8_PREFIX: Uint8Array<ArrayBuffer> = Uint8Array.of(0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20);

const ED25519 = 'Ed25519';

/**
 * A WebCrypto key, as signerFromCryptoKey takes one: the CryptoKey interface's read-only fields, written out because
 * `CryptoKey` is a DOM-lib global that @types/node does not declare (Node has the class at runtime, its type only as
 * `webcrypto.CryptoKey` in node:crypto). A browser's CryptoKey, Node's webcrypto.CryptoKey and what @solana/kit's
 * generateKeyPair answers all fit.
 */
export interface WebCryptoKey {
  readonly type: string;
  readonly extractable: boolean;
  readonly algorithm: { readonly name: string };
  readonly usages: readonly string[];
}

/** Whether `value` has the Signer shape. */
export function isSigner(value: unknown): value is Signer {
  const s = value as Partial<Signer> | null;
  return typeof s === 'object' && s !== null && typeof s.address === 'string' && typeof s.signMessage === 'function' && (s.signTransaction === undefined || typeof s.signTransaction === 'function');
}

const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * A signer over a Solana keypair's 64 bytes (the seed, then the public key: what solana-keygen
 * writes as a JSON array). The private key is imported non-extractable and the bytes passed in are
 * left as they are (zero them when done). Throws SignerError for anything but 64 bytes, for a
 * public half that is not the seed's, or on a runtime without WebCrypto Ed25519.
 */
export async function signerFromKeypairBytes(keypair: Uint8Array): Promise<Signer> {
  if (!(keypair instanceof Uint8Array) || keypair.length !== 64) {
    throw new SignerError('a Solana keypair is 64 bytes: the 32-byte seed, then the 32-byte public key');
  }
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) throw new SignerError('this runtime has no WebCrypto (crypto.subtle): use Node 22.13 or later, or a current browser');
  const der = new Uint8Array(ED25519_PKCS8_PREFIX.length + 32);
  der.set(ED25519_PKCS8_PREFIX);
  der.set(keypair.subarray(0, 32), ED25519_PKCS8_PREFIX.length);
  let privateKey: CryptoKey;
  try {
    privateKey = await subtle.importKey('pkcs8', der, { name: ED25519 }, false, ['sign']);
  } catch (err) {
    throw new SignerError(`cannot import the keypair as a WebCrypto Ed25519 key (Node 22.13 or later, or a current browser, has it): ${errorText(err)}`, { cause: err });
  } finally {
    der.fill(0);
  }
  const publicKey = keypair.slice(32);
  let publicCryptoKey: CryptoKey;
  try {
    publicCryptoKey = await subtle.importKey('raw', publicKey, { name: ED25519 }, true, ['verify']);
  } catch (err) {
    throw new SignerError(`the keypair's public half is not an Ed25519 public key: ${errorText(err)}`, { cause: err });
  }
  // The public half must be the seed's: sign a fresh probe and check it with the public half.
  const probe = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const probeSignature = await subtle.sign(ED25519, privateKey, probe);
  if (!(await subtle.verify(ED25519, publicCryptoKey, probeSignature, probe))) {
    throw new SignerError("the keypair's public half does not match its seed");
  }
  return signerFromCryptoKey(privateKey, publicKey);
}

/**
 * A signer over a WebCrypto Ed25519 private key (extractable or not) and its 32-byte public key:
 * what @solana/kit's generateKeyPair makes, once its public key is exported raw.
 */
export function signerFromCryptoKey(privateKey: WebCryptoKey, publicKey: Uint8Array): Signer {
  if (publicKey.length !== 32) throw new SignerError('an Ed25519 public key is 32 bytes');
  const pub = Uint8Array.from(publicKey);
  const address = encodeBase58(pub);
  // The runtime's own CryptoKey, which WebCryptoKey's fields describe; subtle.sign rejects anything else at runtime.
  const key = privateKey as CryptoKey;
  const sign = async (message: Uint8Array): Promise<Uint8Array> => {
    const signature = new Uint8Array(await globalThis.crypto.subtle.sign(ED25519, key, Uint8Array.from(message)));
    if (signature.length !== 64) throw new SignerError(`WebCrypto answered a ${signature.length}-byte Ed25519 signature, not 64 bytes`);
    return signature;
  };
  return Object.freeze({
    address,
    signMessage: sign,
    signTransaction: (transaction: Uint8Array) => signWireTransaction(transaction, pub, address, sign),
  });
}

/** The base58 signature `signer` makes over `text`'s UTF-8 bytes: what an entry message and a Sign in with Solana message carry. */
export async function signTextBase58(signer: Pick<Signer, 'signMessage'>, text: string): Promise<string> {
  const signature = await signer.signMessage(new TextEncoder().encode(text));
  if (!(signature instanceof Uint8Array) || signature.length !== 64) {
    throw new SignerError(`the signer answered ${signature instanceof Uint8Array ? `${signature.length} bytes` : 'no bytes'}, not a 64-byte Ed25519 signature`);
  }
  return encodeBase58(signature);
}

// ---------------------------------------------------------------- transactions in wire format

/** A compact-u16 (Solana's shortvec) at `at`: its value and its length in bytes. */
function readShortU16(bytes: Uint8Array, at: number): { value: number; size: number } {
  let value = 0;
  for (let size = 0; size < 3; size++) {
    const b = bytes[at + size];
    if (b === undefined) throw new SignerError('the transaction ends inside a length');
    value |= (b & 0x7f) << (7 * size);
    if ((b & 0x80) === 0) return { value, size: size + 1 };
  }
  throw new SignerError('the transaction carries a length longer than three bytes');
}

/**
 * Sign a transaction in wire format: a compact-u16 count of 64-byte signature slots, the slots,
 * then the message (legacy, or v0 behind its 0x80 prefix). The message's first
 * numRequiredSignatures static accounts are its signers, in slot order; this wallet's slot is its
 * place among them.
 */
async function signWireTransaction(transaction: Uint8Array, publicKey: Uint8Array, address: string, sign: (message: Uint8Array) => Promise<Uint8Array>): Promise<Uint8Array> {
  if (!(transaction instanceof Uint8Array)) throw new SignerError('a transaction to sign is its wire bytes (a Uint8Array)');
  const slots = readShortU16(transaction, 0);
  const messageAt = slots.size + 64 * slots.value;
  if (transaction.length <= messageAt) throw new SignerError('the transaction ends inside its signatures');
  const message = transaction.subarray(messageAt);
  let at = 0;
  const first = message[0] as number;
  if ((first & 0x80) !== 0) {
    const version = first & 0x7f;
    if (version !== 0) throw new SignerError(`transaction message version ${version} is not one this signer reads (legacy or v0)`);
    at = 1;
  }
  const required = message[at];
  if (required === undefined) throw new SignerError('the transaction message has no header');
  if (required !== slots.value) throw new SignerError(`the transaction has ${slots.value} signature slots for ${required} required signers`);
  const accounts = readShortU16(message, at + 3);
  const keysAt = at + 3 + accounts.size;
  if (message.length < keysAt + 32 * accounts.value) throw new SignerError('the transaction message ends inside its accounts');
  let slot = -1;
  for (let i = 0; i < Math.min(required, accounts.value) && slot < 0; i++) {
    const key = message.subarray(keysAt + 32 * i, keysAt + 32 * (i + 1));
    if (key.every((b, j) => b === publicKey[j])) slot = i;
  }
  if (slot < 0) throw new SignerError(`${address} is not one of the transaction's ${required} required signers`);
  const signature = await sign(message);
  const out = Uint8Array.from(transaction);
  out.set(signature, slots.size + 64 * slot);
  return out;
}
