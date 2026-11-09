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

import type { BodyOf, PublicRoute, QueryOf, ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import { FeatureUnavailableError } from '../errors.ts';
import { decodeBase64, encodeBase64 } from '../http.ts';
import type { PageItem } from '../paging.ts';
import { SignerError, type Signer } from '../signer.ts';

type Res<K extends PublicRoute> = Promise<ResponseOf<K>>;

export interface FundOptions extends CallOptions {
  /** The wallet that funds the deposit (the proposal's), able to sign transactions. */
  signer: Pick<Signer, 'address' | 'signTransaction'>;
  /** The sponsor terms version accepted with the deposit (terms().terms.version); absent: the one already accepted. */
  terms_version?: string;
}

export interface ProposalsResource {
  /** Whether this site runs the sponsor area (GET /api/auth/methods sponsor_area), asked once per client. */
  available(options?: CallOptions): Promise<boolean>;
  terms(options?: CallOptions): Res<'GET /api/sponsor/terms'>;
  list(query?: QueryOf<'GET /api/sponsor/proposals'>, options?: CallOptions): Res<'GET /api/sponsor/proposals'>;
  iterate(query?: QueryOf<'GET /api/sponsor/proposals'>, options?: CallOptions): AsyncGenerator<PageItem<'GET /api/sponsor/proposals'>, void, undefined>;
  create(body: BodyOf<'POST /api/sponsor/proposals'>, options?: CallOptions): Res<'POST /api/sponsor/proposals'>;
  get(id: string, options?: CallOptions): Res<'GET /api/sponsor/proposals/:id'>;
  update(id: string, body: BodyOf<'PATCH /api/sponsor/proposals/:id'>, options?: CallOptions): Res<'PATCH /api/sponsor/proposals/:id'>;
  checks(id: string, options?: CallOptions): Res<'POST /api/sponsor/proposals/:id/checks'>;
  requestSetup(id: string, options?: CallOptions): Res<'POST /api/sponsor/proposals/:id/request-setup'>;
  deposit(id: string, body?: BodyOf<'POST /api/sponsor/proposals/:id/deposit'>, options?: CallOptions): Res<'POST /api/sponsor/proposals/:id/deposit'>;
  submitDeposit(id: string, body: BodyOf<'POST /api/sponsor/proposals/:id/deposit/submit'>, options?: CallOptions): Res<'POST /api/sponsor/proposals/:id/deposit/submit'>;
  /** deposit, then the signer's signature on its transaction, then submitDeposit: the relay's answer. */
  fund(id: string, options: FundOptions): Res<'POST /api/sponsor/proposals/:id/deposit/submit'>;
  withdraw(id: string, options?: CallOptions): Res<'POST /api/sponsor/proposals/:id/withdraw'>;
}

export function proposalsResource(client: MakefunClient): ProposalsResource {
  let detected: Promise<boolean> | null = null;
  const available = (options: CallOptions = {}): Promise<boolean> => {
    detected ??= client.request('GET /api/auth/methods', { ...(options.signal === undefined ? {} : { signal: options.signal }) }).then(
      (methods) => methods.sponsor_area === true,
      (err: unknown) => {
        detected = null; // a failed probe is asked again next time
        throw err;
      },
    );
    return detected;
  };
  const ensure = async (options?: CallOptions): Promise<void> => {
    if (!(await available(options))) {
      throw new FeatureUnavailableError('proposals', `${client.origin} does not run the sponsor area (GET /api/auth/methods names no sponsor_area), so it takes no bounty proposals`);
    }
  };
  const self: ProposalsResource = {
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
      if (typeof signer.signTransaction !== 'function') throw new SignerError(`the signer ${signer.address} cannot sign transactions (it has no signTransaction)`);
      const cleared = await self.deposit(id, terms_version === undefined ? {} : { terms_version }, call);
      const signed = await signer.signTransaction(decodeBase64(cleared.transaction));
      return self.submitDeposit(id, { transaction: encodeBase64(signed) }, call);
    },
    withdraw: async (id, options) => (await ensure(options), client.request('POST /api/sponsor/proposals/:id/withdraw', { ...options, params: { id } })),
  };
  return self;
}
