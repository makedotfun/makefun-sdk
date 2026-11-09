// `@makedotfun/sdk/kit`: @solana/kit 8.5 signers as the SDK's Signer (an optional peer dependency;
// nothing else in the SDK imports kit).
//
// kit's signers sign in batches and answer signature dictionaries keyed by address: a partial
// signer's signMessages takes SignableMessage[] ({content, signatures}) and signTransactions takes
// decoded Transaction[] ({messageBytes, signatures}); a modifying signer (a wallet behind kit's
// wallet-standard bridge) answers the signed messages or transactions themselves. fromKitSigner turns
// either into one message's 64 signature bytes, and one wire transaction into the same wire
// transaction with this signer's signature in its slot.

import { createKeyPairSignerFromBytes, getTransactionDecoder, getTransactionEncoder } from '@solana/kit';
import type {
  Address,
  KeyPairSigner,
  MessageModifyingSigner,
  MessagePartialSigner,
  SignatureBytes,
  Transaction,
  TransactionModifyingSigner,
  TransactionPartialSigner,
  TransactionWithinSizeLimit,
  TransactionWithLifetime,
} from '@solana/kit';
import { SignerError, type Signer } from './signer.ts';

/** A kit signer fromKitSigner takes: one that signs messages, and optionally transactions (partial or modifying). */
export type KitSigner = (MessagePartialSigner | MessageModifyingSigner) &
  Partial<Pick<TransactionPartialSigner, 'signTransactions'>> &
  Partial<Pick<TransactionModifyingSigner, 'modifyAndSignTransactions'>>;

const hasMethod = <K extends string>(value: object, name: K): value is Record<K, (...args: never[]) => unknown> =>
  typeof (value as Record<string, unknown>)[name] === 'function';

function signatureOf(signatures: Readonly<Record<Address, SignatureBytes | null>> | undefined, address: Address, what: string): Uint8Array {
  const signature = signatures?.[address];
  if (!(signature instanceof Uint8Array) || signature.length !== 64) throw new SignerError(`the kit signer ${address} answered no 64-byte signature for the ${what}`);
  return Uint8Array.from(signature);
}

const sameBytes = (a: ArrayLike<number>, b: ArrayLike<number>): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/** The SDK's Signer over a @solana/kit signer: a KeyPairSigner, or a wallet's signer through kit's wallet-standard bridge. */
export function fromKitSigner(s: KitSigner): Signer {
  const address = s.address;
  const signMessage = async (bytes: Uint8Array): Promise<Uint8Array> => {
    const content = Uint8Array.from(bytes);
    if (hasMethod(s, 'signMessages')) {
      const [signatures] = await (s as MessagePartialSigner).signMessages([{ content, signatures: {} }]);
      return signatureOf(signatures, address, 'message');
    }
    if (hasMethod(s, 'modifyAndSignMessages')) {
      const [signed] = await (s as MessageModifyingSigner).modifyAndSignMessages([{ content, signatures: {} }]);
      if (signed === undefined || !sameBytes(signed.content, content)) throw new SignerError(`the kit signer ${address} changed the message it signed`);
      return signatureOf(signed.signatures, address, 'message');
    }
    throw new SignerError(`the kit signer ${address} signs no messages (it has neither signMessages nor modifyAndSignMessages)`);
  };
  const canSignTransactions = hasMethod(s, 'signTransactions') || hasMethod(s, 'modifyAndSignTransactions');
  const signTransaction = async (wire: Uint8Array): Promise<Uint8Array> => {
    const tx = getTransactionDecoder().decode(wire);
    if (!Object.hasOwn(tx.signatures, address)) throw new SignerError(`${address} is not one of the transaction's required signers`);
    // A transaction the wire carries has its lifetime inside its message bytes and fits a packet: what kit's types ask for.
    const signable = tx as Transaction & TransactionWithinSizeLimit & TransactionWithLifetime;
    let signed: Transaction;
    if (hasMethod(s, 'signTransactions')) {
      const [signatures] = await (s as TransactionPartialSigner).signTransactions([signable]);
      const signature = signatureOf(signatures, address, 'transaction');
      signed = { ...tx, signatures: { ...tx.signatures, [address]: signature as SignatureBytes } };
    } else {
      const [modified] = await (s as TransactionModifyingSigner).modifyAndSignTransactions([signable]);
      if (modified === undefined || !sameBytes(modified.messageBytes, tx.messageBytes)) throw new SignerError(`the kit signer ${address} changed the transaction it signed`);
      const signature = signatureOf(modified.signatures, address, 'transaction');
      signed = { ...tx, signatures: { ...tx.signatures, [address]: signature as SignatureBytes } };
    }
    return Uint8Array.from(getTransactionEncoder().encode(signed));
  };
  return Object.freeze({ address, signMessage, ...(canSignTransactions ? { signTransaction } : {}) });
}

/** A kit KeyPairSigner over a solana-keygen JSON keypair file (Node only; the file must be mode 600). */
export async function kitSignerFromKeypairFile(path: string): Promise<KeyPairSigner> {
  // Loaded on use, so a browser bundle of fromKitSigner never pulls in node:fs.
  const { readKeypairBytes } = await import('./node.ts');
  const bytes = await readKeypairBytes(path);
  try {
    return await createKeyPairSignerFromBytes(bytes);
  } catch (err) {
    throw new SignerError(`keypair ${path} does not hold a valid Ed25519 keypair (its public half does not match its seed)`, { cause: err });
  } finally {
    bytes.fill(0);
  }
}
