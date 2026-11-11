import type { AccountWalletList, WalletRegistered, WalletRegisterRequest } from '../api-types/community.js';
import type { CallOptions, MakefunClient } from '../client.js';
import type { Signer } from '../signer.js';
export interface RegisterWalletInput {
    /** The wallet to add: it signs the registration message. */
    signer: Pick<Signer, 'address' | 'signMessage'>;
    /** Its label (1 to WALLET_NAME_MAX characters). */
    name?: string;
    /** The message's Issued At (default now). */
    now?: Date;
    /**
     * The register block of the account's wallet list, when it was just read (`(await client.wallets.list()).register`):
     * register then reads no list of its own.
     */
    register?: AccountWalletList['register'];
}
export interface WalletsResource {
    list(options?: CallOptions): Promise<AccountWalletList>;
    register(input: RegisterWalletInput, options?: CallOptions): Promise<WalletRegistered>;
    registerSigned(request: WalletRegisterRequest, options?: CallOptions): Promise<WalletRegistered>;
}
export declare function walletsResource(client: MakefunClient): WalletsResource;
//# sourceMappingURL=wallets.d.ts.map