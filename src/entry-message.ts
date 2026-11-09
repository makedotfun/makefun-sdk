// The signed entry message: what an entrant's wallet signs to enter a bounty whose prizes are escrowed,
// and every source bundle entry. This is the server's own format, byte for byte; nothing here does I/O
// or needs Node, and hashing is WebCrypto's SHA-256.
//
// The message is UTF-8 text, its lines joined by LF, no CR and no trailing newline, each field
// `Name: value` in this order:
//
//   make.fun entry v1
//   Domain: make.fun                        the site's host (with its port when it has one): read it
//                                           from the bounty's requirements template (templateDomain)
//   Competition: solana-memecoin-bot-01     the bounty's slug
//   Repo: https://github.com/alice/bot      the repository, as normalizeRepoUrl writes it
//     or Source: bundle sha256:<64 hex>     for a source bundle entry: the uploaded file's sha256
//   Commit: <40 lowercase hex>              the submitted commit
//   Transcripts: <64 lowercase hex>         transcriptsSha256 of the upload
//   Wallet: <base58 address>                the signer, and so the entry's payout wallet
//   Nonce: <8 to 64 letters and digits>     fresh for every message (newEntryNonce)
//   Issued At: 2026-10-27T12:00:00.000Z     RFC 3339 in UTC; the server takes it for ten minutes
//
// A delegated entry (an account whose payouts an owner's wallet pinned) signs `make.fun entry v2`:
// the same fields, with two more after Wallet, which is still the signer:
//
//   Payout: <base58 address>                the entry's payout wallet (never the Wallet)
//   Delegation: <64 lowercase hex>          the sha256 of the payout wallet's delegation message
//
// A rehosted bounty's entry (a bounty that rehosts an open upstream issue bounty, its requirements' template
// `make.fun entry v3`) accepts the rehost entrant terms (GET /api/rehost/terms) by signing their sha256 on one more
// line, last: v1's lines (ten in all), or v2's for a delegated entry (twelve), then
//
//   Terms: <64 lowercase hex>               the sha256 of the terms' canonical JSON (rehostTermsSha256)
//
// v2 cannot carry it: a message's header fixes its line count. A rehost is a patch bounty, so its entry is always a
// source bundle, never a repository.
//
// The signature goes up as entry_signature: the Ed25519 signature of the text's UTF-8 bytes by
// Wallet, base58 (signEntryMessage).

import { isAddress } from './base58.ts';
import { signTextBase58, type Signer } from './signer.ts';

/** The message's first line: its format and version. */
export const ENTRY_MESSAGE_HEADER = 'make.fun entry v1';

/** A delegated entry's first line: v1's fields, then Payout and Delegation after Wallet. */
export const ENTRY_MESSAGE_HEADER_V2 = 'make.fun entry v2';

/** A rehosted bounty's entry's first line: v1's fields (v2's when delegated), then Terms. */
export const ENTRY_MESSAGE_HEADER_V3 = 'make.fun entry v3';

/** Nonce: 8 to 64 ASCII letters and digits. */
export const ENTRY_NONCE_RE = /^[A-Za-z0-9]{8,64}$/;

const DOMAIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,252})(?::[0-9]{1,5})?$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const COMMIT_RE = /^[0-9a-f]{40}$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const ISSUED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
/** Printable ASCII without spaces: what a repo URL in the message may hold. */
const REPO_RE = /^[\x21-\x7e]{1,2048}$/;

/** What a bundle entry's Source line says before the upload's sha256. */
export const BUNDLE_SOURCE_PREFIX = 'bundle sha256:';

/** The fields every entry message names, whatever its source. */
interface EntryManifestFields {
  domain: string;
  competition: string;
  commit: string;
  transcripts: string;
  wallet: string;
  /** A delegated entry's only (v2, or a delegated v3): the payout wallet (never the Wallet). */
  payout?: string;
  /** A delegated entry's only (v2, or a delegated v3): the sha256 of the payout wallet's delegation message. */
  delegation?: string;
  nonce: string;
  issuedAt: string;
  /** v3 only: the sha256 of the rehost entrant terms the entry accepts. */
  terms?: string;
}

/** A repository entry's message: its third field is `Repo: <url>`. */
export interface RepoEntryManifest extends EntryManifestFields {
  repo: string;
  bundleSha256?: undefined;
}

/** A source bundle entry's message: its third field is `Source: bundle sha256:<bundleSha256>`. */
export interface BundleEntryManifest extends EntryManifestFields {
  bundleSha256: string;
  repo?: undefined;
}

/** The fields of an entry message: a repository's (`repo`) or an uploaded source bundle's (`bundleSha256`). */
export type EntryManifest = RepoEntryManifest | BundleEntryManifest;

/** One field's line: the key, the line's label, and what a valid value is. */
export interface EntryMessageField {
  readonly key: keyof EntryManifest;
  readonly label: string;
  readonly what: string;
  readonly valid: (v: string) => boolean;
}

/** The fields' lines in order (a repository entry's; a bundle entry's third is ENTRY_SOURCE_FIELD instead). */
export const ENTRY_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField> = Object.freeze([
  { key: 'domain', label: 'Domain', what: "the site's host name (with its port when it has one)", valid: (v: string) => DOMAIN_RE.test(v) },
  { key: 'competition', label: 'Competition', what: "a competition's slug", valid: (v: string) => SLUG_RE.test(v) },
  { key: 'repo', label: 'Repo', what: 'a repository URL', valid: (v: string) => REPO_RE.test(v) },
  { key: 'commit', label: 'Commit', what: 'a full 40-character lowercase commit sha', valid: (v: string) => COMMIT_RE.test(v) },
  { key: 'transcripts', label: 'Transcripts', what: 'a 64-character lowercase hex sha256', valid: (v: string) => SHA256_HEX_RE.test(v) },
  { key: 'wallet', label: 'Wallet', what: 'a base58 Solana address', valid: (v: string) => isAddress(v) },
  { key: 'nonce', label: 'Nonce', what: '8 to 64 letters and digits', valid: (v: string) => ENTRY_NONCE_RE.test(v) },
  { key: 'issuedAt', label: 'Issued At', what: 'an RFC 3339 time in UTC, like 2026-10-27T12:00:00.000Z', valid: (v: string) => ISSUED_AT_RE.test(v) && Number.isFinite(Date.parse(v)) },
] as const);

const WALLET_INDEX = ENTRY_MESSAGE_FIELDS.findIndex((f) => f.key === 'wallet');
const SOURCE_INDEX = ENTRY_MESSAGE_FIELDS.findIndex((f) => f.key === 'repo');

/** A v2 message's two lines after Wallet. */
export const ENTRY_DELEGATION_FIELDS: ReadonlyArray<EntryMessageField> = Object.freeze([
  { key: 'payout', label: 'Payout', what: 'a base58 Solana address', valid: (v: string) => isAddress(v) },
  { key: 'delegation', label: 'Delegation', what: "a delegation message's sha256, 64 lowercase hex", valid: (v: string) => SHA256_HEX_RE.test(v) },
] as const);

/** The lines of a v2 message (a repository entry's): ENTRY_MESSAGE_FIELDS with ENTRY_DELEGATION_FIELDS after Wallet. */
export const ENTRY_V2_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField> = Object.freeze([
  ...ENTRY_MESSAGE_FIELDS.slice(0, WALLET_INDEX + 1),
  ...ENTRY_DELEGATION_FIELDS,
  ...ENTRY_MESSAGE_FIELDS.slice(WALLET_INDEX + 1),
]);

/** v3's last line: the sha256 of the rehost entrant terms the entry accepts. */
export const ENTRY_TERMS_FIELD: EntryMessageField = Object.freeze({
  key: 'terms',
  label: 'Terms',
  what: "the rehost entrant terms' sha256, 64 lowercase hex",
  valid: (v: string) => SHA256_HEX_RE.test(v),
});

/** The lines of a v3 message (a repository entry's): ENTRY_MESSAGE_FIELDS, then ENTRY_TERMS_FIELD. */
export const ENTRY_V3_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField> = Object.freeze([...ENTRY_MESSAGE_FIELDS, ENTRY_TERMS_FIELD]);

/** The lines of a delegated v3 message (a repository entry's): ENTRY_V2_MESSAGE_FIELDS, then ENTRY_TERMS_FIELD. */
export const ENTRY_V3_DELEGATED_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField> = Object.freeze([...ENTRY_V2_MESSAGE_FIELDS, ENTRY_TERMS_FIELD]);

/** A source bundle entry's third field, in place of `Repo`: `Source: bundle sha256:<64 lowercase hex>`. */
export const ENTRY_SOURCE_FIELD: EntryMessageField = Object.freeze({
  key: 'bundleSha256',
  label: 'Source',
  what: "the uploaded source bundle's sha256, 64 lowercase hex",
  valid: (v: string) => SHA256_HEX_RE.test(v),
});

/**
 * The lines a message of this kind and version has, in order: ENTRY_MESSAGE_FIELDS (v2: ENTRY_V2_MESSAGE_FIELDS; v3:
 * ENTRY_V3_MESSAGE_FIELDS, or ENTRY_V3_DELEGATED_MESSAGE_FIELDS when `delegated`), with the Source line in place of
 * Repo for a bundle entry. `delegated` is v3's choice alone: a v1 message never is, a v2 always is.
 */
export function entryMessageFields(kind: 'repo' | 'bundle', version: 1 | 2 | 3 = 1, delegated = false): readonly EntryMessageField[] {
  const fields =
    version === 1 ? ENTRY_MESSAGE_FIELDS : version === 2 ? ENTRY_V2_MESSAGE_FIELDS : delegated ? ENTRY_V3_DELEGATED_MESSAGE_FIELDS : ENTRY_V3_MESSAGE_FIELDS;
  if (kind === 'repo') return fields;
  return fields.map((f, i) => (i === SOURCE_INDEX ? ENTRY_SOURCE_FIELD : f));
}

/** Whether a message is a delegated entry's: it names a Payout or a Delegation (v2, or a delegated v3). */
function isDelegated(m: Pick<EntryManifestFields, 'payout' | 'delegation'>): boolean {
  return m.payout !== undefined || m.delegation !== undefined;
}

/** A message's version: 3 when it names Terms (a rehosted bounty's entry), else 2 when it names a Payout and a Delegation (a delegated entry), else 1. */
export function entryMessageVersion(m: Pick<EntryManifestFields, 'payout' | 'delegation' | 'terms'>): 1 | 2 | 3 {
  return m.terms !== undefined ? 3 : isDelegated(m) ? 2 : 1;
}

/** Each version's header line. */
const HEADERS = { 1: ENTRY_MESSAGE_HEADER, 2: ENTRY_MESSAGE_HEADER_V2, 3: ENTRY_MESSAGE_HEADER_V3 } as const;

/** The wallet an entry pays: a delegated message's Payout (v2, or a delegated v3), else its Wallet (the signer). */
export function payoutOf(m: Pick<EntryManifestFields, 'wallet' | 'payout'>): string {
  return m.payout ?? m.wallet;
}

const lineValue = (f: EntryMessageField, v: string): string => (f === ENTRY_SOURCE_FIELD ? `${BUNDLE_SOURCE_PREFIX}${v}` : v);

/** A manifest that cannot be written as an entry message, or a value that cannot go in one. */
export class EntryManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntryManifestError';
  }
}

/** Which source a manifest names: a repository (`repo`) or an uploaded source bundle (`bundleSha256`), exactly one. */
export function entrySourceKind(m: Pick<EntryManifest, 'repo' | 'bundleSha256'>): 'repo' | 'bundle' {
  const repo = m.repo !== undefined;
  const bundle = m.bundleSha256 !== undefined;
  if (repo === bundle) throw new EntryManifestError(`an entry message names one source, its repo or its uploaded bundle's sha256 (bundleSha256), not ${repo ? 'both' : 'neither'}`);
  return repo ? 'repo' : 'bundle';
}

/**
 * The entry message for `m`, exactly as it is signed: v3 when it names Terms (delegated, with its Payout and
 * Delegation, as v2 is), else v2 when it names a Payout and a Delegation (both, and a Payout other than the Wallet),
 * else v1. Throws EntryManifestError for a field that is not valid.
 */
export function formatEntryMessage(m: EntryManifest): string {
  const version = entryMessageVersion(m);
  const delegated = isDelegated(m);
  if (delegated) {
    if (m.payout === undefined || m.delegation === undefined) throw new EntryManifestError(`a delegated entry message (${ENTRY_MESSAGE_HEADER_V2}, or ${ENTRY_MESSAGE_HEADER_V3} for a rehosted bounty) names both its Payout and its Delegation`);
    if (m.payout === m.wallet) throw new EntryManifestError(`a delegated entry message's Payout is another wallet than its Wallet ${m.wallet}`);
  }
  const lines: string[] = [HEADERS[version]];
  for (const f of entryMessageFields(entrySourceKind(m), version, delegated)) {
    const v = m[f.key];
    if (typeof v !== 'string' || !f.valid(v)) throw new EntryManifestError(`${f.label}: ${JSON.stringify(String(v).slice(0, 80))} is not ${f.what}`);
    lines.push(`${f.label}: ${lineValue(f, v)}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------- the values it names

/** The Domain an entry message names for a site at `siteOrigin`: its host, with its port when it has one. */
export function entryDomain(siteOrigin: string): string {
  return new URL(siteOrigin).host;
}

/**
 * The Domain of a bounty's entry message template (its requirements' how_to_submit
 * entry_message_template, or source_bundle.entry_message_template) for competition `slug`: the
 * site's host, which the API's origin need not be. Throws EntryManifestError for a template that is
 * not an entry message's, names another competition, or names no Domain.
 */
export function templateDomain(template: string, slug: string): string {
  const lines = template.split('\n');
  if (lines[0] !== ENTRY_MESSAGE_HEADER && lines[0] !== ENTRY_MESSAGE_HEADER_V2 && lines[0] !== ENTRY_MESSAGE_HEADER_V3) {
    throw new EntryManifestError(`the entry message template does not start with "${ENTRY_MESSAGE_HEADER}", "${ENTRY_MESSAGE_HEADER_V2}" or "${ENTRY_MESSAGE_HEADER_V3}"`);
  }
  const field = (label: string): string | null => lines.find((l) => l.startsWith(`${label}: `))?.slice(label.length + 2) ?? null;
  const competition = field('Competition');
  if (competition !== slug) throw new EntryManifestError(`the entry message template is for competition ${JSON.stringify(competition)}, not ${slug}`);
  const domain = field('Domain');
  if (domain === null || domain === '' || domain.startsWith('{')) throw new EntryManifestError('the entry message template names no Domain');
  return domain;
}

/**
 * The rehost entrant terms' sha256 a bounty's entry message template names: a rehosted bounty's template is
 * `make.fun entry v3`, its last line `Terms: <sha256>` filled in; any other template's is null (no Terms line).
 * Throws EntryManifestError for a v3 template whose Terms line is missing or not a sha256.
 */
export function templateTerms(template: string): string | null {
  const lines = template.split('\n');
  if (lines[0] !== ENTRY_MESSAGE_HEADER_V3) return null;
  const prefix = `${ENTRY_TERMS_FIELD.label}: `;
  const terms = lines.find((l) => l.startsWith(prefix))?.slice(prefix.length) ?? null;
  if (terms === null || !ENTRY_TERMS_FIELD.valid(terms)) {
    throw new EntryManifestError(`the entry message template is ${ENTRY_MESSAGE_HEADER_V3} (a rehosted bounty's) but names no rehost entrant terms: its Terms line is ${terms === null ? 'missing' : JSON.stringify(terms.slice(0, 80))}, not ${ENTRY_TERMS_FIELD.what}`);
  }
  return terms;
}

const GITHUB_OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const GITHUB_REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

function githubUrl(owner: string, name: string): string {
  if (!GITHUB_OWNER_RE.test(owner)) throw new EntryManifestError(`not a GitHub owner name: ${JSON.stringify(owner.slice(0, 80))}`);
  if (!GITHUB_REPO_RE.test(name) || name === '.' || name === '..' || name.toLowerCase().endsWith('.git')) {
    throw new EntryManifestError(`not a GitHub repository name: ${JSON.stringify(name.slice(0, 120))}`);
  }
  return `https://github.com/${owner}/${name}`;
}

function decodeComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    throw new EntryManifestError('repo URL has a bad percent-escape');
  }
}

/**
 * A repository URL as the server writes it in the Repo line: https://github.com/<owner>/<repo>, no
 * `.git`, from that form or git@github.com:<owner>/<repo>(.git) or ssh://git@github.com/<owner>/<repo>.
 * Throws EntryManifestError for anything else (a source bundle is entered by its sha256 instead).
 */
export function normalizeRepoUrl(input: string): string {
  if (typeof input !== 'string') throw new EntryManifestError('repo URL must be a string');
  const raw = input.trim();
  if (raw === '' || raw.length > 2048) throw new EntryManifestError('repo URL is empty or too long');
  if (/[\s\0]/.test(raw)) throw new EntryManifestError('repo URL contains whitespace or NUL');
  if (/^bundle:/i.test(raw)) throw new EntryManifestError('bundle:<root sha> names an uploaded source bundle, entered with its sha256; the Repo line takes https://github.com/<owner>/<repo>');
  const scp = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(raw);
  if (scp) return githubUrl(scp[1] as string, scp[2] as string);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EntryManifestError(`not a URL: ${JSON.stringify(raw.slice(0, 200))}`);
  }
  const sshOk = url.protocol === 'ssh:' && url.username === 'git' && url.password === '' && url.port === '';
  const httpsOk = url.protocol === 'https:' && url.username === '' && url.password === '' && url.port === '';
  if (!(sshOk || httpsOk) || url.hostname.toLowerCase() !== 'github.com') throw new EntryManifestError('expected https://github.com/<owner>/<repo>');
  if (url.search !== '' || url.hash !== '') throw new EntryManifestError('repo URL must not carry a query or fragment');
  const m = /^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url.pathname);
  if (!m) throw new EntryManifestError('expected https://github.com/<owner>/<repo>');
  return githubUrl(decodeComponent(m[1] as string), decodeComponent(m[2] as string));
}

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** The SHA-256 of `data` (bytes, or text as UTF-8) as lowercase hex, on WebCrypto. */
export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : Uint8Array.from(data);
  return toHex(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)));
}

/** The SHA-256 of a Blob's bytes (a bundle file as it is uploaded) as lowercase hex. */
export async function blobSha256(blob: Blob): Promise<string> {
  return sha256Hex(new Uint8Array(await blob.arrayBuffer()));
}

/**
 * The Transcripts of loose files: sha256 over their sha256s, each lowercase hex, sorted, joined by
 * LF with no trailing LF (no files: the sha256 of the empty text).
 */
export async function looseTranscriptsSha256(sha256s: readonly string[]): Promise<string> {
  for (const s of sha256s) if (!SHA256_HEX_RE.test(s)) throw new EntryManifestError(`not a lowercase hex sha256: ${JSON.stringify(String(s).slice(0, 80))}`);
  return sha256Hex([...sha256s].sort().join('\n'));
}

/**
 * The Transcripts an entry's upload makes: the transcript bundle's own sha256 when one bundle is
 * uploaded, else looseTranscriptsSha256 of the loose files' (none: of the empty list). The SDK enters
 * with a bundle that `makefun bundle` made, which redacts the transcripts on the way in; it takes no
 * loose transcripts, so its entries' Transcripts is that bundle's sha256.
 */
export async function transcriptsSha256(upload: { bundleSha256: string | null; files: readonly { sha256: string }[] | null }): Promise<string> {
  if (upload.bundleSha256 !== null) {
    if (!SHA256_HEX_RE.test(upload.bundleSha256)) throw new EntryManifestError(`not a lowercase hex sha256: ${JSON.stringify(upload.bundleSha256.slice(0, 80))}`);
    return upload.bundleSha256;
  }
  return looseTranscriptsSha256((upload.files ?? []).map((f) => f.sha256));
}

const LONE_SURROGATE_RE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** RFC 8785 canonical JSON (the server's): no whitespace, object keys sorted by UTF-16 code units, arrays in order. */
function canonicalJson(value: unknown, path: string): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new EntryManifestError(`${value} is not a JSON number at ${path}`);
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    if (LONE_SURROGATE_RE.test(value)) throw new EntryManifestError(`lone surrogate in string at ${path}`);
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') throw new EntryManifestError(`${typeof value} is not JSON data at ${path}`);
  if (Array.isArray(value)) return `[${value.map((v, i) => canonicalJson(v, `${path}[${i}]`)).join(',')}]`;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw new EntryManifestError(`not a plain object at ${path}`);
  const o = value as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${canonicalJson(k, `${path}.${k}`)}:${canonicalJson(o[k], `${path}.${k}`)}`)
    .join(',')}}`;
}

/**
 * The sha256 of the rehost entrant terms (GET /api/rehost/terms' `terms`): of their RFC 8785 canonical JSON, as
 * lowercase hex. It is what that route answers as `sha256` and what a rehosted bounty's entry names on its Terms line,
 * so the words a caller reads are the words it signs.
 */
export async function rehostTermsSha256(terms: unknown): Promise<string> {
  return sha256Hex(canonicalJson(terms, '$'));
}

/** A fresh nonce: 16 random bytes as 32 hex characters. */
export function newEntryNonce(): string {
  return toHex(globalThis.crypto.getRandomValues(new Uint8Array(16)));
}

// ---------------------------------------------------------------- the signature

/** The base58 Ed25519 signature `signer` makes over the entry message's UTF-8 bytes: the entry_signature field. */
export async function signEntryMessage(message: string, signer: Pick<Signer, 'signMessage'>): Promise<string> {
  return signTextBase58(signer, message);
}

/** Why a rehosted bounty takes no repository entry: it is a patch bounty, entered with a source bundle alone. */
export function rehostRepositoryRefused(competition: string): EntryManifestError {
  return new EntryManifestError(`${competition} rehosts an upstream bounty, a patch bounty: its entry is a source bundle (sourceBundle, with repoUrl bundle:<root sha>), never a repository, so its patch stays confidential until published`);
}

export interface SignEntryInput {
  /** templateDomain of the bounty's entry message template. */
  domain: string;
  /** The bounty's slug. */
  competition: string;
  /** The repository (normalizeRepoUrl writes it): a repository entry's Repo line. Give it or bundleSha256, not both. */
  repoUrl?: string;
  /** The uploaded source bundle's sha256 (64 hex): a source bundle entry's Source line, in place of Repo. */
  bundleSha256?: string;
  /** The full commit sha. */
  commit: string;
  /** transcriptsSha256 of the upload. */
  transcripts: string;
  signer: Pick<Signer, 'address' | 'signMessage'>;
  /** The account's payout delegation: sign make.fun entry v2 naming its payout wallet and the delegation's sha256. */
  delegation?: { payout: string; sha256: string } | null;
  /**
   * A rehosted bounty's entry: the sha256 of the rehost entrant terms it accepts (GET /api/rehost/terms), signed as
   * make.fun entry v3 on its last line. A rehost's entry is a source bundle (bundleSha256), never a repository.
   */
  terms?: string | null;
  /** Issued At (default now). */
  now?: Date;
  /** Default a fresh one. */
  nonce?: string;
}

export interface SignedEntry {
  manifest: EntryManifest;
  /** entry_message: the text signed (LF line breaks, no trailing newline). */
  message: string;
  /** entry_signature: base58. */
  signature: string;
}

/** The entry message for this request, signed by `signer`. Throws EntryManifestError for a field that cannot go in one. */
export async function signEntry(i: SignEntryInput): Promise<SignedEntry> {
  if ((i.repoUrl === undefined) === (i.bundleSha256 === undefined)) {
    throw new EntryManifestError(`an entry message names one source, the repository (repoUrl) or the uploaded source bundle's sha256 (bundleSha256), not ${i.repoUrl === undefined ? 'neither' : 'both'}`);
  }
  const fields = {
    domain: i.domain,
    competition: i.competition,
    commit: i.commit.trim().toLowerCase(),
    transcripts: i.transcripts,
    wallet: i.signer.address,
    ...(i.delegation === undefined || i.delegation === null ? {} : { payout: i.delegation.payout, delegation: i.delegation.sha256 }),
    nonce: i.nonce ?? newEntryNonce(),
    issuedAt: (i.now ?? new Date()).toISOString(),
    ...(i.terms === undefined || i.terms === null ? {} : { terms: i.terms }),
  };
  const manifest: EntryManifest = i.bundleSha256 !== undefined ? { ...fields, bundleSha256: i.bundleSha256.trim().toLowerCase() } : { ...fields, repo: normalizeRepoUrl(i.repoUrl as string) };
  if (fields.terms !== undefined && manifest.repo !== undefined) throw rehostRepositoryRefused(i.competition);
  const message = formatEntryMessage(manifest);
  return { manifest, message, signature: await signEntryMessage(message, i.signer) };
}
