import type { BodyOf, PublicRoute, QueryOf, ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { PageItem } from '../paging.js';
import { type Signer } from '../signer.js';
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
export declare function proposalsResource(client: MakefunClient): ProposalsResource;
export {};
//# sourceMappingURL=proposals.d.ts.map