import type { KeyPairSigner, MessageModifyingSigner, MessagePartialSigner, TransactionModifyingSigner, TransactionPartialSigner } from '@solana/kit';
import { type Signer } from './signer.js';
/** A kit signer fromKitSigner takes: one that signs messages, and optionally transactions (partial or modifying). */
export type KitSigner = (MessagePartialSigner | MessageModifyingSigner) & Partial<Pick<TransactionPartialSigner, 'signTransactions'>> & Partial<Pick<TransactionModifyingSigner, 'modifyAndSignTransactions'>>;
/** The SDK's Signer over a @solana/kit signer: a KeyPairSigner, or a wallet's signer through kit's wallet-standard bridge. */
export declare function fromKitSigner(s: KitSigner): Signer;
/** A kit KeyPairSigner over a solana-keygen JSON keypair file (Node only; the file must be mode 600). */
export declare function kitSignerFromKeypairFile(path: string): Promise<KeyPairSigner>;
//# sourceMappingURL=kit.d.ts.map