// The wallet registration message: what a wallet signs to be added to an account as a registered wallet, which then
// signs the account's entries and can be paid any of its rewards (it never signs in). This is the server's own
// format, byte for byte; nothing here does I/O or needs Node.
//
// The message is UTF-8 text: five lines joined by LF, no CR, no trailing newline, each field `Name: value` in this
// order and nothing else:
//
//   make.fun wallet v1
//   Domain: make.fun                        the site's host, with its port when it has one: GET /api/me/wallets
//                                           names it (register.domain)
//   Account: <user id>                      the account the wallet joins: its user id (register.account)
//   Wallet: <base58 address>                the wallet that signs, and is registered
//   Issued At: 2026-11-11T02:23:00.000Z     RFC 3339 in UTC; the server takes it for ten minutes
//
// It goes up as JSON to POST /api/me/wallets: `message`, the text, and `signature`, the Ed25519 signature of its
// UTF-8 bytes by Wallet, base58 (signWalletMessage), with an optional `name`, the wallet's label.

import { isAddress } from './base58.ts';
import { signTextBase58, type Signer } from './signer.ts';

/** The message's first line: its format and version. */
export const WALLET_MESSAGE_HEADER = 'make.fun wallet v1';

/** Where a signed wallet message is posted (POST) and the account's wallets are listed (GET). */
export const ACCOUNT_WALLETS_PATH = '/api/me/wallets';

/** A signed wallet message is good for this long after its Issued At: ten minutes. */
export const WALLET_MESSAGE_MAX_AGE_MS = 10 * 60_000;

/** How far ahead of the server's clock an Issued At may be (a client clock running fast). */
export const WALLET_MESSAGE_MAX_SKEW_MS = 60_000;

/** The longest wallet message taken, in UTF-8 bytes (a real one is under 250). */
export const MAX_WALLET_MESSAGE_BYTES = 1024;

/** The longest wallet label the server takes. */
export const WALLET_NAME_MAX = 32;

const DOMAIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,252})(?::[0-9]{1,5})?$/;
/** A user id: 1 to 128 printable ASCII characters, no spaces. */
const ACCOUNT_RE = /^[\x21-\x7e]{1,128}$/;
const ISSUED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

/** Whether `v` is an RFC 3339 UTC time naming a real instant (2026-02-30 is not one). */
function validIssuedAt(v: string): boolean {
  if (!ISSUED_AT_RE.test(v)) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 19) === v.slice(0, 19);
}

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

/** One field's line: the key, the line's label, and what a valid value is. */
interface WalletMessageField {
  readonly key: keyof WalletManifest;
  readonly label: string;
  readonly what: string;
  readonly valid: (v: string) => boolean;
}

/** The fields' lines in order, after the header. */
const WALLET_MESSAGE_FIELDS: readonly WalletMessageField[] = Object.freeze([
  { key: 'domain', label: 'Domain', what: "the site's host name (with its port when it has one)", valid: (v: string) => DOMAIN_RE.test(v) },
  { key: 'account', label: 'Account', what: "the account's user id (1 to 128 printable characters, no spaces)", valid: (v: string) => ACCOUNT_RE.test(v) },
  { key: 'wallet', label: 'Wallet', what: 'a base58 Solana address', valid: (v: string) => isAddress(v) },
  { key: 'issuedAt', label: 'Issued At', what: 'an RFC 3339 time in UTC, like 2026-11-11T02:23:00.000Z', valid: validIssuedAt },
] as const);

/** A manifest that cannot be written as a wallet message (formatWalletMessage). */
export class WalletMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletMessageError';
  }
}

/**
 * The wallet message for `m`, exactly as it is signed. `issuedAt` may be a Date (written as its toISOString()).
 * Throws WalletMessageError for a field that is not valid.
 */
export function formatWalletMessage(m: Omit<WalletManifest, 'issuedAt'> & { issuedAt: string | Date }): string {
  const values: WalletManifest = { ...m, issuedAt: m.issuedAt instanceof Date ? m.issuedAt.toISOString() : m.issuedAt };
  const lines = [WALLET_MESSAGE_HEADER];
  for (const f of WALLET_MESSAGE_FIELDS) {
    const v = values[f.key];
    if (typeof v !== 'string' || !f.valid(v)) throw new WalletMessageError(`${f.label}: ${JSON.stringify(String(v).slice(0, 80))} is not ${f.what}`);
    lines.push(`${f.label}: ${v}`);
  }
  return lines.join('\n');
}

export type ParsedWalletMessage = { ok: true; manifest: WalletManifest } | { ok: false; reason: string };

/** Read a wallet message: its fields, or why it is not one (the format in the header, nothing more or less). */
export function parseWalletMessage(text: string): ParsedWalletMessage {
  if (typeof text !== 'string' || text === '') return { ok: false, reason: `the wallet message is empty: it must start with the line "${WALLET_MESSAGE_HEADER}"` };
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_WALLET_MESSAGE_BYTES) return { ok: false, reason: `the wallet message is ${bytes} bytes, over the ${MAX_WALLET_MESSAGE_BYTES} taken` };
  if (text.includes('\r')) return { ok: false, reason: 'the wallet message carries a CR: its lines are joined by LF alone' };
  const lines = text.split('\n');
  if (lines[0] !== WALLET_MESSAGE_HEADER) {
    return { ok: false, reason: `the wallet message must start with the line "${WALLET_MESSAGE_HEADER}", not ${JSON.stringify(lines[0]!.slice(0, 80))}` };
  }
  const want = 1 + WALLET_MESSAGE_FIELDS.length;
  if (lines.length !== want) {
    if (lines.length === want + 1 && lines[want] === '') return { ok: false, reason: 'the wallet message ends with a newline: sign it without one' };
    return {
      ok: false,
      reason: `the wallet message has ${lines.length} lines; it must have ${want}: the header, then ${WALLET_MESSAGE_FIELDS.map((f) => f.label).join(', ')}`,
    };
  }
  const manifest: Partial<WalletManifest> = {};
  for (const [i, f] of WALLET_MESSAGE_FIELDS.entries()) {
    const line = lines[i + 1]!;
    const prefix = `${f.label}: `;
    if (!line.startsWith(prefix)) return { ok: false, reason: `line ${i + 2} of the wallet message must be "${f.label}: <${f.key}>", not ${JSON.stringify(line.slice(0, 80))}` };
    const value = line.slice(prefix.length);
    if (!f.valid(value)) return { ok: false, reason: `the wallet message's ${f.label} ${JSON.stringify(value.slice(0, 80))} is not ${f.what}` };
    manifest[f.key] = value;
  }
  return { ok: true, manifest: manifest as WalletManifest };
}

/** The base58 signature `signer` makes over a wallet message's UTF-8 bytes: what POST /api/me/wallets takes as `signature`. */
export function signWalletMessage(message: string, signer: Pick<Signer, 'signMessage'>): Promise<string> {
  return signTextBase58(signer, message);
}
