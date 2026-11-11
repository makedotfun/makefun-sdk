// client.entries: entering a bounty, and reading an entry back.
//
//   submit            POST /api/competitions/:slug/submissions   multipart/form-data (see submit below)
//   status            GET  /api/submissions/:id/status           the entry's stage, checks, next steps, deadlines
//   get               GET  /api/submissions/:id                  the entry's archive: receipt, files, transcripts
//   list / iterate    GET  /api/competitions/:slug/submissions   a bounty's entries
//   rehostTerms       GET  /api/rehost/terms                     the rehost entrant terms a rehosted bounty's entry accepts
//
// submit fetches the bounty's requirements first. Where its entry message template is not null (the prizes are
// escrowed), and for every source bundle entry, the entry is signed: the message (./entry-message.ts, the server's
// own format byte for byte) names the template's Domain, the bounty, the repository (or the source bundle's sha256),
// the commit, the Transcripts (the transcript bundle's sha256) and the signer's wallet, which is the entry's payout
// wallet and must be on the account. An account whose payouts an owner's wallet pinned (a payout delegation) signs
// `make.fun entry v2` with the delegation's agent wallet, naming the payout wallet and the delegation's sha256.
//
// Before it signs, submit makes sure the signer's wallet is on the account (client.wallets): GET /api/me/wallets, and
// a wallet the list does not name is added first by its own signature (wallets.register, with the same signer and the
// register block just read, so the list is read once). A refused registration is thrown as it came (a 409
// WALLET_ON_OTHER_ACCOUNT, a 403 AGENT_SCOPE…, or an answer naming another wallet) before anything is uploaded: the
// entry would be refused for that wallet. A site without the route (404), or a list that does not load otherwise (no
// wallets, or no register block), is gone on from, the entry's own check then answering for the wallet. The answer's
// walletCheck says which it was. An entry signed under a payout delegation skips it: a wallet added by its signature
// can be paid any of the account's rewards, which the pin keeps for the payout wallet alone.
//
// A rehosted bounty (its template `make.fun entry v3`, naming the rehost entrant terms' sha256 on a Terms line) is
// entered only by a caller that accepts those terms knowingly: submit refuses one without acceptTerms, or with other
// terms than the bounty names, before anything is uploaded; it then reads GET /api/rehost/terms, checks that the terms
// served hash to that sha256 (rehostTermsSha256), and signs make.fun entry v3 (delegated or not) ending in that line.
// A rehost is a patch bounty, so its entry is a source bundle, never a repository.

import type { AccountWallet, AccountWalletList, WalletRegistered } from '../api-types/community.ts';
import type { QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import { blobSha256, EntryManifestError, rehostRepositoryRefused, rehostTermsSha256, signEntry, templateDomain, templateTerms, transcriptsSha256 } from '../entry-message.ts';
import { FeatureUnavailableError, MakefunError } from '../errors.ts';
import { fileNameOf, routePath } from '../http.ts';
import type { PageItem } from '../paging.ts';
import type { Signer } from '../signer.ts';

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
  acceptTerms?: { sha256: string };
  /** The message's Issued At (default now; the server takes it for ten minutes). */
  now?: Date;
}

/** What submit found of its signer's wallet on the account before signing (see the header). */
export type EntryWalletCheck =
  /** The account's wallets name it: nothing was done. */
  | { action: 'listed'; wallet: AccountWallet }
  /** It was not on the account, and was added to it now by its own signature (client.wallets.register's answer). */
  | { action: 'added'; added: WalletRegistered }
  /** The site has no GET /api/me/wallets (404): nothing was done. */
  | { action: 'no_route' }
  /** The account's wallets did not load otherwise: nothing was done, and the entry was signed all the same; why. */
  | { action: 'unread'; reason: string };

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

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const COMMIT_RE = /^[0-9a-f]{40}$/;
const BUNDLE_URL_RE = /^bundle:/i;
/** The longest entry title the server takes. */
export const MAX_TITLE_CHARS = 200;

/**
 * The delegation `signer` signs under: `d` when there is one and it is usable (its agent the signer, not expired, its
 * scope the competition's), else null. Throws EntryManifestError for one that cannot be used: the server refuses an
 * entry of a pinned account signed any other way.
 */
export function usableDelegation(d: EntryDelegation | null | undefined, signer: string, competition: string, now: Date): { payout: string; sha256: string } | null {
  if (d === null || d === undefined) return null;
  if (d.agent !== undefined && d.agent !== signer) {
    throw new EntryManifestError(`the account's payouts are pinned to ${d.payout} by delegation ${d.sha256}, whose agent is ${d.agent}, but the signer is ${signer}: sign with the delegation's agent wallet`);
  }
  if (d.expires_at !== undefined && !(Date.parse(d.expires_at) > now.getTime())) {
    throw new EntryManifestError(`the account's payout delegation ${d.sha256} expired at ${d.expires_at}: have ${d.payout} sign a new one; the account stays pinned to ${d.payout}`);
  }
  if (d.competitions !== undefined && d.competitions !== '*' && !d.competitions.includes(competition)) {
    throw new EntryManifestError(`the account's payout delegation ${d.sha256} covers ${d.competitions.join(', ')}, not ${competition}: have ${d.payout} sign one that does`);
  }
  return { payout: d.payout, sha256: d.sha256 };
}

/**
 * The signer's wallet on the account before it signs an entry (see the header): listed, or added now; nothing done on a
 * site without the route or when the list does not load. A refused registration is thrown as it came.
 */
async function walletOnAccount(client: MakefunClient, signer: Pick<Signer, 'address' | 'signMessage'>, now: Date, call: CallOptions): Promise<EntryWalletCheck> {
  let wallets: unknown;
  let register: unknown;
  try {
    ({ wallets, register } = await client.wallets.list(call));
  } catch (err) {
    if (err instanceof MakefunError && err.status === 404) return { action: 'no_route' };
    if (err instanceof MakefunError) return { action: 'unread', reason: err.message };
    throw err;
  }
  if (!Array.isArray(wallets)) return { action: 'unread', reason: 'GET /api/me/wallets answered no wallet list' };
  const block = register as Partial<AccountWalletList['register']> | null | undefined;
  if (typeof block !== 'object' || block === null || typeof block.header !== 'string' || typeof block.domain !== 'string' || typeof block.account !== 'string') {
    return { action: 'unread', reason: 'GET /api/me/wallets answered no register block' };
  }
  const listed = (wallets as AccountWallet[]).find((w) => w?.wallet === signer.address);
  if (listed !== undefined) return { action: 'listed', wallet: listed };
  return { action: 'added', added: await client.wallets.register({ signer, now, register: block as AccountWalletList['register'] }, call) };
}

export function entriesResource(client: MakefunClient): EntriesResource {
  const rehostTerms: EntriesResource['rehostTerms'] = async (options) => {
    const served = await client.request('GET /api/rehost/terms', { ...options });
    const hashed = await rehostTermsSha256(served.terms);
    if (served.sha256 !== hashed) {
      throw new EntryManifestError(`${client.origin} answers the rehost entrant terms with sha256 ${served.sha256}, but the terms it sends hash to ${hashed}: they cannot be accepted by that sha256`);
    }
    return served;
  };
  return {
    rehostTerms,
    async submit(i) {
      const competition = i.competition;
      if (typeof competition !== 'string' || !SLUG_RE.test(competition)) throw new TypeError(`competition ${JSON.stringify(competition)}: expected a bounty's slug`);
      const commit = String(i.commitSha ?? '').trim().toLowerCase();
      if (!COMMIT_RE.test(commit)) throw new TypeError(`commitSha ${JSON.stringify(i.commitSha)}: expected the full 40-character sha`);
      const repoUrl = String(i.repoUrl ?? '').trim();
      if (repoUrl === '') throw new TypeError('repoUrl is required: https://github.com/<owner>/<repo>, or bundle:<root sha> with sourceBundle');
      const sourceEntry = BUNDLE_URL_RE.test(repoUrl);
      if (sourceEntry !== (i.sourceBundle !== undefined)) {
        throw new TypeError(sourceEntry ? `repoUrl ${repoUrl} names a source bundle: pass the bundle file as sourceBundle` : 'sourceBundle goes with repoUrl bundle:<the sha of its root commit>');
      }
      const title = i.title?.trim();
      if (title !== undefined && title.length > MAX_TITLE_CHARS) throw new TypeError(`title: at most ${MAX_TITLE_CHARS} characters`);
      const call = { ...(i.signal === undefined ? {} : { signal: i.signal }), ...(i.apiKey === undefined ? {} : { apiKey: i.apiKey }) };

      const requirements = await client.request('GET /api/competitions/:slug/requirements', { ...call, params: { slug: competition } });
      let template: string | null;
      if (sourceEntry) {
        const sb = (requirements.how_to_submit as { source_bundle?: { entry_message_template?: unknown } | null }).source_bundle;
        if (sb === undefined || sb === null || typeof sb.entry_message_template !== 'string') throw new FeatureUnavailableError('source bundle entries', `${client.origin} takes no source bundle entries for ${competition} (its requirements carry no how_to_submit.source_bundle)`);
        template = sb.entry_message_template;
      } else {
        template = requirements.how_to_submit.entry_message_template;
      }
      // A rehosted bounty's template names the terms its entry accepts; any other's none.
      const terms = template === null ? null : templateTerms(template);
      if (terms !== null) {
        if (!sourceEntry) throw rehostRepositoryRefused(competition);
        const accepted = i.acceptTerms?.sha256;
        if (accepted === undefined) {
          throw new EntryManifestError(
            `${competition} rehosts an upstream bounty: entering it accepts the rehost entrant terms (GET /api/rehost/terms), sha256 ${terms}. Read them (client.entries.rehostTerms()) and, if you accept them, pass acceptTerms: { sha256: '${terms}' }`,
          );
        }
        if (accepted !== terms) {
          throw new EntryManifestError(`acceptTerms names the rehost entrant terms ${accepted}, but ${competition}'s entry accepts ${terms}, the terms in force: read them again (client.entries.rehostTerms()) and accept those`);
        }
      }

      const form = new FormData();
      let walletCheck: EntryWalletCheck | undefined;
      form.append('repo_url', repoUrl);
      form.append('commit_sha', commit);
      if (title !== undefined && title !== '') form.append('title', title);
      if (i.bundle !== undefined) form.append('bundle', i.bundle, fileNameOf(i.bundle, 'transcripts.tar.gz'));
      if (i.sourceBundle !== undefined) form.append('source_bundle', i.sourceBundle, fileNameOf(i.sourceBundle, 'source.bundle'));

      if (template !== null) {
        const signer = i.signer;
        if (signer === undefined) {
          throw new EntryManifestError(
            sourceEntry
              ? 'a source bundle entry is always signed: pass a signer, the payout wallet (submit adds it to your account when it is not on it yet)'
              : `${competition}'s prizes are escrowed, so its entries are signed: pass a signer, the payout wallet (submit adds it to your account when it is not on it yet)`,
          );
        }
        const now = i.now ?? new Date();
        const delegation = usableDelegation(i.delegation === undefined ? client.delegation : i.delegation, signer.address, competition, now);
        const transcripts = i.bundle !== undefined ? await blobSha256(i.bundle) : await transcriptsSha256({ bundleSha256: null, files: null });
        const source = sourceEntry ? { bundleSha256: await blobSha256(i.sourceBundle as Blob) } : { repoUrl };
        if (terms !== null) {
          // The terms the bounty names must be the ones served, whose words hash to them: those are what is signed.
          const served = await rehostTerms(call);
          if (served.sha256 !== terms) {
            throw new EntryManifestError(`${client.origin} serves the rehost entrant terms ${served.sha256}, but ${competition}'s requirements name ${terms}: the terms changed while you entered; read them again (client.entries.rehostTerms())`);
          }
        }
        if (delegation === null) walletCheck = await walletOnAccount(client, signer, now, call);
        const entry = await signEntry({ domain: templateDomain(template, competition), competition, ...source, commit, transcripts, signer, delegation, terms, now });
        form.append('entry_message', entry.message);
        form.append('entry_signature', entry.signature);
      }
      const path = routePath('POST /api/competitions/:slug/submissions', { slug: competition });
      const created = await client.json<ResponseOf<'POST /api/competitions/:slug/submissions'>>('POST', path, { ...call, body: form });
      return walletCheck === undefined ? created : { ...created, walletCheck };
    },
    status: (submissionId, options) => client.request('GET /api/submissions/:id/status', { ...options, params: { id: submissionId } }),
    get: (submissionId, options) => client.request('GET /api/submissions/:id', { ...options, params: { id: submissionId } }),
    list: (competition, query, options) => client.request('GET /api/competitions/:slug/submissions', { ...options, params: { slug: competition }, ...(query === undefined ? {} : { query }) }),
    iterate: (competition, query, options) => client.paginate('GET /api/competitions/:slug/submissions', { ...options, params: { slug: competition }, ...(query === undefined ? {} : { query }) }),
  };
}
