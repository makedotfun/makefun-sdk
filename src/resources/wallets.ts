// client.wallets: the caller's account's wallets, and one more added by that wallet's own signature, so an agent
// signing entries with a wallet the account does not hold yet can put it there itself.
//
//   list            GET /api/me/wallets    every wallet of the account, linked first (they sign in), then registered
//                                          (added by their signature), then agent (connected agents', paid only the
//                                          rewards of the entries they sign); and the register block a registration
//                                          message names (its Domain and Account)
//   register        list() (or the register block of a list already read, input.register), then the registration
//                   message for the signer's wallet issued now (../wallet-message.ts), signed by the signer, then
//                   POST /api/me/wallets: 201 added (or the account's agent wallet made registered: it then signs the
//                   account's entries and can be paid any of its rewards; it never signs in), 200 already a linked or
//                   registered wallet of the account (`already` true). The answer must name the signer's own wallet:
//                   one that names no wallet, or another, is a MakefunError (status null, the answer its body)
//   registerSigned  POST /api/me/wallets with a message and signature made elsewhere (a hardware wallet's)
//
// A refusal is thrown as a MakefunError (its `code` the API's): 409 WALLET_ON_OTHER_ACCOUNT, the wallet is another
// account's; 403 AGENT_SCOPE, a connected agent's key without the profile scope (the message names where its person
// allows it); 400 or 422, a message or signature the server will not take.

import type { AccountWalletList, WalletRegistered, WalletRegisterRequest } from '../api-types/community.ts';
import type { CallOptions, MakefunClient } from '../client.ts';
import { MakefunError } from '../errors.ts';
import type { Signer } from '../signer.ts';
import { formatWalletMessage, signWalletMessage, WALLET_MESSAGE_HEADER, WALLET_NAME_MAX, WalletMessageError } from '../wallet-message.ts';

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

/** The label trimmed, or a WalletMessageError for one the server will not take. */
function labelOf(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  const t = name.trim();
  if (t === '' || t.length > WALLET_NAME_MAX) throw new WalletMessageError(`name: a label of 1 to ${WALLET_NAME_MAX} characters`);
  return t;
}

/** `answer` when it is POST /api/me/wallets's answer for `wallet`, else a MakefunError naming what it answered. */
function registeredAs(answer: WalletRegistered, wallet: string): WalletRegistered {
  const named = (answer as Partial<WalletRegistered> | null)?.wallet as Partial<WalletRegistered['wallet']> | null | undefined;
  if (typeof named !== 'object' || named === null || typeof named.wallet !== 'string' || typeof answer.already !== 'boolean') {
    throw new MakefunError('POST /api/me/wallets answered no registered wallet', { status: null, body: answer });
  }
  if (named.wallet !== wallet) throw new MakefunError(`POST /api/me/wallets answered wallet ${named.wallet}, not the signer's ${wallet}`, { status: null, body: answer });
  return answer;
}

export function walletsResource(client: MakefunClient): WalletsResource {
  const list = (options?: CallOptions): Promise<AccountWalletList> => client.request('GET /api/me/wallets', { ...options });
  const registerSigned = async (request: WalletRegisterRequest, options?: CallOptions): Promise<WalletRegistered> => {
    const name = labelOf(request.name);
    const body: WalletRegisterRequest = { message: request.message, signature: request.signature.trim(), ...(name === undefined ? {} : { name }) };
    return client.request('POST /api/me/wallets', { ...options, body });
  };
  return {
    list,
    registerSigned,
    async register(input, options) {
      const name = labelOf(input.name);
      const register = input.register ?? (await list(options)).register;
      if (typeof register !== 'object' || register === null) throw new WalletMessageError('GET /api/me/wallets answered no register block: no wallet message can be written');
      if (register.header !== WALLET_MESSAGE_HEADER) {
        throw new WalletMessageError(`the site asks for wallet messages headed ${JSON.stringify(register.header)}, and this SDK writes ${WALLET_MESSAGE_HEADER}: update @makedotfun/sdk`);
      }
      const message = formatWalletMessage({ domain: register.domain, account: register.account, wallet: input.signer.address, issuedAt: input.now ?? new Date() });
      const signature = await signWalletMessage(message, input.signer);
      return registeredAs(await registerSigned({ message, signature, ...(name === undefined ? {} : { name }) }, options), input.signer.address);
    },
  };
}
