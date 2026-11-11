// @makedotfun/sdk: the make.fun API from TypeScript, in Node 22.13+ and current browsers. Node-only helpers (a
// keypair file's signer, the credentials file, a client from the environment) are @makedotfun/sdk/node; the
// @solana/kit signer adapter is @makedotfun/sdk/kit.

export { createClient, userAgent } from './client.ts';
export type { CallOptions, ClientOptions, FetchLike, Format, MakefunClient, RawRequestOptions, RequestArgs, RequestOptions, RequestResult } from './client.ts';
export { decodeBase64, encodeBase64, routeMethod, routePath, toFormData, withQuery } from './http.ts';
export type { FetchBody, HttpMethod } from './http.ts';
export { paginate, pages } from './paging.ts';
export type { PagedRoute, PageItem } from './paging.ts';
export { parseEventStream, stream } from './stream.ts';
export type { RawSseEvent, StreamEventOf, StreamOptions, StreamRoute, StreamRoutes } from './stream.ts';

export {
  codeOf,
  errorText,
  FeatureUnavailableError,
  InvalidApiKeyError,
  isEntryProblem,
  isProblem,
  isQuotaProblem,
  issuesOf,
  KEY_RENEWAL_HINT,
  KeyExpiredError,
  MakefunError,
  parseRetryAfter,
  QUOTA_PROBLEM_PATH,
  QuotaExceededError,
  toMakefunError,
} from './errors.ts';
export type { ApiIssue, MakefunErrorInit, ProblemDetails, QuotaExceededInit, RequestContext } from './errors.ts';

export { ED25519_PKCS8_PREFIX, isSigner, SignerError, signerFromCryptoKey, signerFromKeypairBytes, signTextBase58 } from './signer.ts';
export type { Signer, WebCryptoKey } from './signer.ts';
export { base58, decodeBase58, encodeBase58, isAddress } from './base58.ts';
export {
  blobSha256,
  BUNDLE_SOURCE_PREFIX,
  ENTRY_MESSAGE_HEADER,
  ENTRY_MESSAGE_HEADER_V2,
  ENTRY_MESSAGE_HEADER_V3,
  ENTRY_NONCE_RE,
  ENTRY_TERMS_FIELD,
  entryDomain,
  EntryManifestError,
  entryMessageFields,
  entryMessageVersion,
  entrySourceKind,
  formatEntryMessage,
  looseTranscriptsSha256,
  newEntryNonce,
  normalizeRepoUrl,
  payoutOf,
  rehostTermsSha256,
  sha256Hex,
  signEntry,
  signEntryMessage,
  templateDomain,
  templateTerms,
  transcriptsSha256,
} from './entry-message.ts';
export type { BundleEntryManifest, EntryManifest, EntryMessageField, RepoEntryManifest, SignedEntry, SignEntryInput } from './entry-message.ts';

export { GA_MAX, KEY_NAME_MAX, keyStatementOf, mintWithWallet, REF_MAX, SIGN_IN_STATEMENT, siwsMessage } from './keys.ts';
export type { MintedApiKey, MintOptions } from './keys.ts';

export { MAX_TITLE_CHARS, usableDelegation } from './resources/entries.ts';
export type { EntriesResource, EntryDelegation, EntryWalletCheck, SubmitEntryInput, SubmittedEntry } from './resources/entries.ts';
export type { BountiesResource, KitOptions } from './resources/bounties.ts';
export type { AgentResource } from './resources/agent.ts';
export type { RankingsResource } from './resources/rankings.ts';
export type { ProfilesResource } from './resources/profiles.ts';
export type { FundOptions, ProposalsResource } from './resources/proposals.ts';
export type { RegisterWalletInput, WalletsResource } from './resources/wallets.ts';
export {
  ACCOUNT_WALLETS_PATH,
  formatWalletMessage,
  MAX_WALLET_MESSAGE_BYTES,
  parseWalletMessage,
  signWalletMessage,
  WALLET_MESSAGE_HEADER,
  WALLET_MESSAGE_MAX_AGE_MS,
  WALLET_MESSAGE_MAX_SKEW_MS,
  WALLET_NAME_MAX,
  WalletMessageError,
} from './wallet-message.ts';
export type { ParsedWalletMessage, WalletManifest } from './wallet-message.ts';

export { API_KEY_HEADER, DEFAULT_ORIGIN } from './constants.ts';
export { SDK_VERSION } from './version.ts';
export { BUDGET_POLICIES, DRAFT_REVISION, pacingDelayMs, parseRateLimitHeaders } from './budget-policy.ts';
export type { BudgetPolicy, ParsedBudget, PolicyName, Tier } from './budget-policy.ts';

export type * from './types.ts';
