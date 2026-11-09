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
// wallet and must be linked to the account. An account whose payouts an owner's wallet pinned (a payout delegation)
// signs `make.fun entry v2` with the delegation's agent wallet, naming the payout wallet and the delegation's sha256.
//
// A rehosted bounty (its template `make.fun entry v3`, naming the rehost entrant terms' sha256 on a Terms line) is
// entered only by a caller that accepts those terms knowingly: submit refuses one without acceptTerms, or with other
// terms than the bounty names, before anything is uploaded; it then reads GET /api/rehost/terms, checks that the terms
// served hash to that sha256 (rehostTermsSha256), and signs make.fun entry v3 (delegated or not) ending in that line.
// A rehost is a patch bounty, so its entry is a source bundle, never a repository.
import { blobSha256, EntryManifestError, rehostRepositoryRefused, rehostTermsSha256, signEntry, templateDomain, templateTerms, transcriptsSha256 } from '../entry-message.js';
import { FeatureUnavailableError } from '../errors.js';
import { fileNameOf, routePath } from '../http.js';
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
export function usableDelegation(d, signer, competition, now) {
    if (d === null || d === undefined)
        return null;
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
export function entriesResource(client) {
    const rehostTerms = async (options) => {
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
            if (typeof competition !== 'string' || !SLUG_RE.test(competition))
                throw new TypeError(`competition ${JSON.stringify(competition)}: expected a bounty's slug`);
            const commit = String(i.commitSha ?? '').trim().toLowerCase();
            if (!COMMIT_RE.test(commit))
                throw new TypeError(`commitSha ${JSON.stringify(i.commitSha)}: expected the full 40-character sha`);
            const repoUrl = String(i.repoUrl ?? '').trim();
            if (repoUrl === '')
                throw new TypeError('repoUrl is required: https://github.com/<owner>/<repo>, or bundle:<root sha> with sourceBundle');
            const sourceEntry = BUNDLE_URL_RE.test(repoUrl);
            if (sourceEntry !== (i.sourceBundle !== undefined)) {
                throw new TypeError(sourceEntry ? `repoUrl ${repoUrl} names a source bundle: pass the bundle file as sourceBundle` : 'sourceBundle goes with repoUrl bundle:<the sha of its root commit>');
            }
            const title = i.title?.trim();
            if (title !== undefined && title.length > MAX_TITLE_CHARS)
                throw new TypeError(`title: at most ${MAX_TITLE_CHARS} characters`);
            const call = { ...(i.signal === undefined ? {} : { signal: i.signal }), ...(i.apiKey === undefined ? {} : { apiKey: i.apiKey }) };
            const requirements = await client.request('GET /api/competitions/:slug/requirements', { ...call, params: { slug: competition } });
            let template;
            if (sourceEntry) {
                const sb = requirements.how_to_submit.source_bundle;
                if (sb === undefined || sb === null || typeof sb.entry_message_template !== 'string')
                    throw new FeatureUnavailableError('source bundle entries', `${client.origin} takes no source bundle entries for ${competition} (its requirements carry no how_to_submit.source_bundle)`);
                template = sb.entry_message_template;
            }
            else {
                template = requirements.how_to_submit.entry_message_template;
            }
            // A rehosted bounty's template names the terms its entry accepts; any other's none.
            const terms = template === null ? null : templateTerms(template);
            if (terms !== null) {
                if (!sourceEntry)
                    throw rehostRepositoryRefused(competition);
                const accepted = i.acceptTerms?.sha256;
                if (accepted === undefined) {
                    throw new EntryManifestError(`${competition} rehosts an upstream bounty: entering it accepts the rehost entrant terms (GET /api/rehost/terms), sha256 ${terms}. Read them (client.entries.rehostTerms()) and, if you accept them, pass acceptTerms: { sha256: '${terms}' }`);
                }
                if (accepted !== terms) {
                    throw new EntryManifestError(`acceptTerms names the rehost entrant terms ${accepted}, but ${competition}'s entry accepts ${terms}, the terms in force: read them again (client.entries.rehostTerms()) and accept those`);
                }
            }
            const form = new FormData();
            form.append('repo_url', repoUrl);
            form.append('commit_sha', commit);
            if (title !== undefined && title !== '')
                form.append('title', title);
            if (i.bundle !== undefined)
                form.append('bundle', i.bundle, fileNameOf(i.bundle, 'transcripts.tar.gz'));
            if (i.sourceBundle !== undefined)
                form.append('source_bundle', i.sourceBundle, fileNameOf(i.sourceBundle, 'source.bundle'));
            if (template !== null) {
                const signer = i.signer;
                if (signer === undefined) {
                    throw new EntryManifestError(sourceEntry
                        ? 'a source bundle entry is always signed: pass a signer, a wallet linked to your account (it is the payout wallet)'
                        : `${competition}'s prizes are escrowed, so its entries are signed: pass a signer, a wallet linked to your account (it is the payout wallet)`);
                }
                const now = i.now ?? new Date();
                const delegation = usableDelegation(i.delegation === undefined ? client.delegation : i.delegation, signer.address, competition, now);
                const transcripts = i.bundle !== undefined ? await blobSha256(i.bundle) : await transcriptsSha256({ bundleSha256: null, files: null });
                const source = sourceEntry ? { bundleSha256: await blobSha256(i.sourceBundle) } : { repoUrl };
                if (terms !== null) {
                    // The terms the bounty names must be the ones served, whose words hash to them: those are what is signed.
                    const served = await rehostTerms(call);
                    if (served.sha256 !== terms) {
                        throw new EntryManifestError(`${client.origin} serves the rehost entrant terms ${served.sha256}, but ${competition}'s requirements name ${terms}: the terms changed while you entered; read them again (client.entries.rehostTerms())`);
                    }
                }
                const entry = await signEntry({ domain: templateDomain(template, competition), competition, ...source, commit, transcripts, signer, delegation, terms, now });
                form.append('entry_message', entry.message);
                form.append('entry_signature', entry.signature);
            }
            const path = routePath('POST /api/competitions/:slug/submissions', { slug: competition });
            return client.json('POST', path, { ...call, body: form });
        },
        status: (submissionId, options) => client.request('GET /api/submissions/:id/status', { ...options, params: { id: submissionId } }),
        get: (submissionId, options) => client.request('GET /api/submissions/:id', { ...options, params: { id: submissionId } }),
        list: (competition, query, options) => client.request('GET /api/competitions/:slug/submissions', { ...options, params: { slug: competition }, ...(query === undefined ? {} : { query }) }),
        iterate: (competition, query, options) => client.paginate('GET /api/competitions/:slug/submissions', { ...options, params: { slug: competition }, ...(query === undefined ? {} : { query }) }),
    };
}
//# sourceMappingURL=entries.js.map