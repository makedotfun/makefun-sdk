// client.proposals: proposing a bounty as its sponsor, where the site runs the sponsor area. Every call first asks
// GET /api/auth/methods (once per client) whether it does, `sponsor_area: true`, and throws FeatureUnavailableError
// when it does not (the field absent: a server without the sponsor area, or one from before the field).
//
//   terms                GET   /api/sponsor/terms                          the terms a deposit accepts, and their version
//   list / iterate       GET   /api/sponsor/proposals                      the caller's proposals
//   create               POST  /api/sponsor/proposals                      a draft, from the proposal as written
//   get                  GET   /api/sponsor/proposals/:id
//   update               PATCH /api/sponsor/proposals/:id                  an RFC 7386 merge patch of the proposal
//   checks               POST  /api/sponsor/proposals/:id/checks           run the checks a deposit needs passed
//   requestSetup         POST  /api/sponsor/proposals/:id/request-setup    ask the team for a custom scoring setup
//   deposit              POST  /api/sponsor/proposals/:id/deposit          the cleared deposit transaction (base64),
//                                                                          signed by the curator, the wallet's signature
//                                                                          still missing
//   submitDeposit        POST  /api/sponsor/proposals/:id/deposit/submit   relay it signed by the wallet
//   fund                 deposit, the signer's signature, submitDeposit: one call
//   withdraw             POST  /api/sponsor/proposals/:id/withdraw         close_proposal (base64, unsigned) for the
//                                                                          wallet to sign as authority and fee payer
//                                                                          and send itself, through its own RPC
import { FeatureUnavailableError } from '../errors.js';
import { decodeBase64, encodeBase64 } from '../http.js';
import { SignerError } from '../signer.js';
export function proposalsResource(client) {
    let detected = null;
    const available = (options = {}) => {
        detected ??= client.request('GET /api/auth/methods', { ...(options.signal === undefined ? {} : { signal: options.signal }) }).then((methods) => methods.sponsor_area === true, (err) => {
            detected = null; // a failed probe is asked again next time
            throw err;
        });
        return detected;
    };
    const ensure = async (options) => {
        if (!(await available(options))) {
            throw new FeatureUnavailableError('proposals', `${client.origin} does not run the sponsor area (GET /api/auth/methods names no sponsor_area), so it takes no bounty proposals`);
        }
    };
    const self = {
        available,
        terms: async (options) => (await ensure(options), client.request('GET /api/sponsor/terms', { ...options })),
        list: async (query, options) => (await ensure(options), client.request('GET /api/sponsor/proposals', { ...options, ...(query === undefined ? {} : { query }) })),
        async *iterate(query, options) {
            await ensure(options);
            yield* client.paginate('GET /api/sponsor/proposals', { ...options, ...(query === undefined ? {} : { query }) });
        },
        create: async (body, options) => (await ensure(options), client.request('POST /api/sponsor/proposals', { ...options, body })),
        get: async (id, options) => (await ensure(options), client.request('GET /api/sponsor/proposals/:id', { ...options, params: { id } })),
        update: async (id, body, options) => (await ensure(options), client.request('PATCH /api/sponsor/proposals/:id', { ...options, params: { id }, body })),
        checks: async (id, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/checks', { ...options, params: { id } })),
        requestSetup: async (id, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/request-setup', { ...options, params: { id } })),
        deposit: async (id, body, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/deposit', { ...options, params: { id }, body: body ?? {} })),
        submitDeposit: async (id, body, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/deposit/submit', { ...options, params: { id }, body })),
        async fund(id, options) {
            const { signer, terms_version, ...call } = options;
            if (typeof signer.signTransaction !== 'function')
                throw new SignerError(`the signer ${signer.address} cannot sign transactions (it has no signTransaction)`);
            const cleared = await self.deposit(id, terms_version === undefined ? {} : { terms_version }, call);
            const signed = await signer.signTransaction(decodeBase64(cleared.transaction));
            return self.submitDeposit(id, { transaction: encodeBase64(signed) }, call);
        },
        withdraw: async (id, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/withdraw', { ...options, params: { id } })),
    };
    return self;
}
//# sourceMappingURL=proposals.js.map