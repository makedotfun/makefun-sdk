import { type Signer } from './signer.js';
/** The message's first line: its format and version. */
export declare const ENTRY_MESSAGE_HEADER = "make.fun entry v1";
/** A delegated entry's first line: v1's fields, then Payout and Delegation after Wallet. */
export declare const ENTRY_MESSAGE_HEADER_V2 = "make.fun entry v2";
/** A rehosted bounty's entry's first line: v1's fields (v2's when delegated), then Terms. */
export declare const ENTRY_MESSAGE_HEADER_V3 = "make.fun entry v3";
/** Nonce: 8 to 64 ASCII letters and digits. */
export declare const ENTRY_NONCE_RE: RegExp;
/** What a bundle entry's Source line says before the upload's sha256. */
export declare const BUNDLE_SOURCE_PREFIX = "bundle sha256:";
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
export declare const ENTRY_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField>;
/** A v2 message's two lines after Wallet. */
export declare const ENTRY_DELEGATION_FIELDS: ReadonlyArray<EntryMessageField>;
/** The lines of a v2 message (a repository entry's): ENTRY_MESSAGE_FIELDS with ENTRY_DELEGATION_FIELDS after Wallet. */
export declare const ENTRY_V2_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField>;
/** v3's last line: the sha256 of the rehost entrant terms the entry accepts. */
export declare const ENTRY_TERMS_FIELD: EntryMessageField;
/** The lines of a v3 message (a repository entry's): ENTRY_MESSAGE_FIELDS, then ENTRY_TERMS_FIELD. */
export declare const ENTRY_V3_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField>;
/** The lines of a delegated v3 message (a repository entry's): ENTRY_V2_MESSAGE_FIELDS, then ENTRY_TERMS_FIELD. */
export declare const ENTRY_V3_DELEGATED_MESSAGE_FIELDS: ReadonlyArray<EntryMessageField>;
/** A source bundle entry's third field, in place of `Repo`: `Source: bundle sha256:<64 lowercase hex>`. */
export declare const ENTRY_SOURCE_FIELD: EntryMessageField;
/**
 * The lines a message of this kind and version has, in order: ENTRY_MESSAGE_FIELDS (v2: ENTRY_V2_MESSAGE_FIELDS; v3:
 * ENTRY_V3_MESSAGE_FIELDS, or ENTRY_V3_DELEGATED_MESSAGE_FIELDS when `delegated`), with the Source line in place of
 * Repo for a bundle entry. `delegated` is v3's choice alone: a v1 message never is, a v2 always is.
 */
export declare function entryMessageFields(kind: 'repo' | 'bundle', version?: 1 | 2 | 3, delegated?: boolean): readonly EntryMessageField[];
/** A message's version: 3 when it names Terms (a rehosted bounty's entry), else 2 when it names a Payout and a Delegation (a delegated entry), else 1. */
export declare function entryMessageVersion(m: Pick<EntryManifestFields, 'payout' | 'delegation' | 'terms'>): 1 | 2 | 3;
/** The wallet an entry pays: a delegated message's Payout (v2, or a delegated v3), else its Wallet (the signer). */
export declare function payoutOf(m: Pick<EntryManifestFields, 'wallet' | 'payout'>): string;
/** A manifest that cannot be written as an entry message, or a value that cannot go in one. */
export declare class EntryManifestError extends Error {
    constructor(message: string);
}
/** Which source a manifest names: a repository (`repo`) or an uploaded source bundle (`bundleSha256`), exactly one. */
export declare function entrySourceKind(m: Pick<EntryManifest, 'repo' | 'bundleSha256'>): 'repo' | 'bundle';
/**
 * The entry message for `m`, exactly as it is signed: v3 when it names Terms (delegated, with its Payout and
 * Delegation, as v2 is), else v2 when it names a Payout and a Delegation (both, and a Payout other than the Wallet),
 * else v1. Throws EntryManifestError for a field that is not valid.
 */
export declare function formatEntryMessage(m: EntryManifest): string;
/** The Domain an entry message names for a site at `siteOrigin`: its host, with its port when it has one. */
export declare function entryDomain(siteOrigin: string): string;
/**
 * The Domain of a bounty's entry message template (its requirements' how_to_submit
 * entry_message_template, or source_bundle.entry_message_template) for competition `slug`: the
 * site's host, which the API's origin need not be. Throws EntryManifestError for a template that is
 * not an entry message's, names another competition, or names no Domain.
 */
export declare function templateDomain(template: string, slug: string): string;
/**
 * The rehost entrant terms' sha256 a bounty's entry message template names: a rehosted bounty's template is
 * `make.fun entry v3`, its last line `Terms: <sha256>` filled in; any other template's is null (no Terms line).
 * Throws EntryManifestError for a v3 template whose Terms line is missing or not a sha256.
 */
export declare function templateTerms(template: string): string | null;
/**
 * A repository URL as the server writes it in the Repo line: https://github.com/<owner>/<repo>, no
 * `.git`, from that form or git@github.com:<owner>/<repo>(.git) or ssh://git@github.com/<owner>/<repo>.
 * Throws EntryManifestError for anything else (a source bundle is entered by its sha256 instead).
 */
export declare function normalizeRepoUrl(input: string): string;
/** The SHA-256 of `data` (bytes, or text as UTF-8) as lowercase hex, on WebCrypto. */
export declare function sha256Hex(data: Uint8Array | string): Promise<string>;
/** The SHA-256 of a Blob's bytes (a bundle file as it is uploaded) as lowercase hex. */
export declare function blobSha256(blob: Blob): Promise<string>;
/**
 * The Transcripts of loose files: sha256 over their sha256s, each lowercase hex, sorted, joined by
 * LF with no trailing LF (no files: the sha256 of the empty text).
 */
export declare function looseTranscriptsSha256(sha256s: readonly string[]): Promise<string>;
/**
 * The Transcripts an entry's upload makes: the transcript bundle's own sha256 when one bundle is
 * uploaded, else looseTranscriptsSha256 of the loose files' (none: of the empty list). The SDK enters
 * with a bundle that `makefun bundle` made, which redacts the transcripts on the way in; it takes no
 * loose transcripts, so its entries' Transcripts is that bundle's sha256.
 */
export declare function transcriptsSha256(upload: {
    bundleSha256: string | null;
    files: readonly {
        sha256: string;
    }[] | null;
}): Promise<string>;
/**
 * The sha256 of the rehost entrant terms (GET /api/rehost/terms' `terms`): of their RFC 8785 canonical JSON, as
 * lowercase hex. It is what that route answers as `sha256` and what a rehosted bounty's entry names on its Terms line,
 * so the words a caller reads are the words it signs.
 */
export declare function rehostTermsSha256(terms: unknown): Promise<string>;
/** A fresh nonce: 16 random bytes as 32 hex characters. */
export declare function newEntryNonce(): string;
/** The base58 Ed25519 signature `signer` makes over the entry message's UTF-8 bytes: the entry_signature field. */
export declare function signEntryMessage(message: string, signer: Pick<Signer, 'signMessage'>): Promise<string>;
/** Why a rehosted bounty takes no repository entry: it is a patch bounty, entered with a source bundle alone. */
export declare function rehostRepositoryRefused(competition: string): EntryManifestError;
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
    delegation?: {
        payout: string;
        sha256: string;
    } | null;
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
export declare function signEntry(i: SignEntryInput): Promise<SignedEntry>;
export {};
//# sourceMappingURL=entry-message.d.ts.map