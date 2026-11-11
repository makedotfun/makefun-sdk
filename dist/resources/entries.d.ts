import type { AccountWallet, WalletRegistered } from '../api-types/community.js';
import type { QueryOf, ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { PageItem } from '../paging.js';
import type { Signer } from '../signer.js';
/**
 * An account's payout delegation, as entries.submit signs under it: the payout wallet and the delegation message's
 * sha256, and (as the credentials file keeps it) the agent wallet that signs, the bounties it covers and its expiry,
 * each checked before anything is uploaded when given.
 */
export interface EntryDelegation {
    /** The payout wallet (the owner's), base58. */
    payout: string;
    /** The delegation message's sha256: the Delegation line of every v2 entry. */
    sha256: string;
    /** The agent's wallet that signs the entries. */
    agent?: string;
    /** The bounties it covers: '*' for all. */
    competitions?: '*' | readonly string[];
    /** ISO 8601. */
    expires_at?: string;
}
export interface SubmitEntryInput extends Omit<CallOptions, 'headers'> {
    /** The bounty's slug. */
    competition: string;
    /**
     * The repository: https://github.com/<owner>/<repo> at `commitSha`; or, for a source bundle entry (no GitHub at all),
     * bundle:<the sha of its root commit>, with `sourceBundle`.
     */
    repoUrl: string;
    /** The full 40-character commit sha. */
    commitSha: string;
    /**
     * The transcript bundle: the .tar.gz `makefun bundle` writes (run from inside the unpacked kit), uploaded as it is.
     * Loose transcript files are not taken here: redacting them (credentials, e-mail addresses, home directories, the
     * names they reveal) is the command line's work, done when it makes the bundle, so make one with it first. A File
     * keeps its name (which must end .tar.gz or .tgz); any other Blob goes up as transcripts.tar.gz.
     */
    bundle?: Blob;
    /**
     * A source bundle entry's code: one v2 git bundle of the repository's history at the commit (`git bundle create`
     * of refs/heads/submission; `makefun submit --source` makes it and checks it), with repoUrl bundle:<root sha>.
     * Always signed: the message's Source line names this file's sha256.
     */
    sourceBundle?: Blob;
    /** The entry's public name (at most 200 characters); without one the site names it with two generated words. */
    title?: string;
    /**
     * The wallet that signs the entry message: required where the entry must be signed. It must be on the account, and
     * submit adds it first when it is not (see walletCheck).
     */
    signer?: Pick<Signer, 'address' | 'signMessage'>;
    /** The payout delegation to sign under (v2); default the client's (ClientOptions.delegation); null: none. */
    delegation?: EntryDelegation | null;
    /**
     * The rehost entrant terms you accept, by their sha256 (`(await client.entries.rehostTerms()).sha256`, once you have
     * read them): required to enter a rehosted bounty, whose entry message signs them on its Terms line; ignored by any
     * other bounty. Entering a rehost without it, or with other terms than the bounty names, is refused before anything
     * is uploaded.
     */
    acceptTerms?: {
        sha256: string;
    };
    /** The message's Issued At (default now; the server takes it for ten minutes). */
    now?: Date;
}
/** What submit found of its signer's wallet on the account before signing (see the header). */
export type EntryWalletCheck = 
/** The account's wallets name it: nothing was done. */
{
    action: 'listed';
    wallet: AccountWallet;
}
/** It was not on the account, and was added to it now by its own signature (client.wallets.register's answer). */
 | {
    action: 'added';
    added: WalletRegistered;
}
/** The site has no GET /api/me/wallets (404): nothing was done. */
 | {
    action: 'no_route';
}
/** The account's wallets did not load otherwise: nothing was done, and the entry was signed all the same; why. */
 | {
    action: 'unread';
    reason: string;
};
/** submit's answer: the site's 202 answer, and what was done about the signer's wallet. */
export type SubmittedEntry = ResponseOf<'POST /api/competitions/:slug/submissions'> & {
    /** Set when the entry was signed without a payout delegation (see the header); absent for an unsigned or delegated entry. */
    walletCheck?: EntryWalletCheck;
};
export interface EntriesResource {
    /** Enter `competition` (see the header): its 202 answer, the claim code included (store it: it is shown here once). */
    submit(input: SubmitEntryInput): Promise<SubmittedEntry>;
    status(submissionId: string, options?: CallOptions): Promise<ResponseOf<'GET /api/submissions/:id/status'>>;
    get(submissionId: string, options?: CallOptions): Promise<ResponseOf<'GET /api/submissions/:id'>>;
    list(competition: string, query?: QueryOf<'GET /api/competitions/:slug/submissions'>, options?: CallOptions): Promise<ResponseOf<'GET /api/competitions/:slug/submissions'>>;
    iterate(competition: string, query?: QueryOf<'GET /api/competitions/:slug/submissions'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/competitions/:slug/submissions'>, void, undefined>;
    /**
     * The rehost entrant terms in force (GET /api/rehost/terms): what entering a rehosted bounty accepts, with their
     * sha256, checked against the terms' own canonical JSON (EntryManifestError when they differ). Pass the sha256 as
     * submit's acceptTerms once you accept them.
     */
    rehostTerms(options?: CallOptions): Promise<ResponseOf<'GET /api/rehost/terms'>>;
}
/** The longest entry title the server takes. */
export declare const MAX_TITLE_CHARS = 200;
/**
 * The delegation `signer` signs under: `d` when there is one and it is usable (its agent the signer, not expired, its
 * scope the competition's), else null. Throws EntryManifestError for one that cannot be used: the server refuses an
 * entry of a pinned account signed any other way.
 */
export declare function usableDelegation(d: EntryDelegation | null | undefined, signer: string, competition: string, now: Date): {
    payout: string;
    sha256: string;
} | null;
export declare function entriesResource(client: MakefunClient): EntriesResource;
//# sourceMappingURL=entries.d.ts.map