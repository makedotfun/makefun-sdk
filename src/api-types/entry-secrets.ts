// GENERATED from the make.fun API's entry-secrets.ts: do not edit, every release regenerates it.
import type { ApiIssue, CompetitionStatus, HarnessKind } from './shared.ts';

export type SecretProvider = 'anthropic' | 'openai' | 'google';

export type EntrySecretLane = 'provider' | 'env';

export type EntrySecretStatus = 'active' | 'replaced' | 'deleted' | 'purged';

export type ProviderKeyCheckState = 'valid' | 'refused' | 'unreachable' | 'unchecked';

interface EntrySecretStateBase {
  name: string;
  bytes: number;
  status: EntrySecretStatus;
  added_at: string;
  used_at: string | null;
}

export interface ProviderSecretState extends EntrySecretStateBase {
  lane: 'provider';
  provider: SecretProvider;
  hint: string;
  check: ProviderKeyCheckState;
  checked_at: string | null;
  listed_models: string[];
}

export interface EnvSecretState extends EntrySecretStateBase {
  lane: 'env';
  provider: null;
  hint: '';
}

export type EntrySecretState = ProviderSecretState | EnvSecretState;

export interface EntrySecretLimits {
  max_secrets: number;
  value_min_chars: number;
  value_max_bytes: number;
  total_max_bytes: number;
  env_file_max_bytes: number;
  env_file_max_lines: number;
  body_max_bytes: number;
}

export type EntrySecretsClosedCode = 'entry_secrets_off' | 'no_entry_code' | 'closed';

export interface EntrySecretsClosed {
  code: EntrySecretsClosedCode;
  reason: string;
  fix: string;
}

export interface EntrySecretsResponse {
  competition: string;
  harness: HarnessKind | null;
  pushing: boolean;
  closed: EntrySecretsClosed | null;
  models: string[];
  providers: SecretProvider[];
  secrets: EntrySecretState[];
  limits: EntrySecretLimits;
}

export interface EntrySecretsBody {
  secrets: Record<string, string>;
}

export interface EntrySecretPreflight {
  check: ProviderKeyCheckState;
  checked_at: string | null;
  listed_models: string[];
  provider_status: number | null;
  reason: string | null;
}

export interface PushedEntrySecret {
  name: string;
  lane: EntrySecretLane;
  provider: SecretProvider | null;
  hint: string;
  bytes: number;
  outcome: 'added' | 'replaced' | 'unchanged';
  preflight: EntrySecretPreflight | null;
}

export type ProviderKeyWarningCause = 'whitespace' | 'other_provider' | 'sign_in_token' | 'shape';

export interface EntrySecretWarning {
  name: string;
  cause: ProviderKeyWarningCause;
  detected: SecretProvider | null;
  reason: string;
  fix: string;
}

export interface EntrySecretErasure {
  sealed_copy: 'erased' | 'kept';
  kept_until: string | null;
  words: string;
}

export interface ReplacedEntrySecret extends EntrySecretErasure {
  name: string;
}

export interface EntrySecretsPushedResponse extends EntrySecretsResponse {
  pushed: PushedEntrySecret[];
  replaced: ReplacedEntrySecret[];
  warnings: EntrySecretWarning[];
}

export interface EntrySecretDeletedResponse extends EntrySecretsResponse {
  deleted: EntrySecretState;
  erasure: EntrySecretErasure;
}

export interface MyEntrySecretsCompetition {
  slug: string;
  title: string;
  status: CompetitionStatus;
  pushing: boolean;
  secrets: EntrySecretState[];
}

export interface EntrySecretsPushable {
  slug: string;
  title: string;
  status: CompetitionStatus;
  harness: HarnessKind;
  deadline: string;
}

export interface MyEntrySecretsResponse {
  competitions: MyEntrySecretsCompetition[];
  pushable: EntrySecretsPushable[];
}

export type EntrySecretCheckId =
  | 'secret_env_parse'
  | 'secret_name'
  | 'secret_reserved_name'
  | 'secret_limits'
  | 'secret_admin_key'
  | 'secret_build_key'
  | 'secret_shared'
  | 'secret_rate_limited'
  | 'committed_secret'
  | 'committed_provider_key';

export type EntrySecretRefusalCode =
  | 'entry_secrets_off'
  | 'no_entry_code'
  | 'closed'
  | 'no_account'
  | 'merged_account'
  | 'secret_rate_limited'
  | 'secrets_refused'
  | 'secret_shared'
  | 'no_active_secret';

export interface EntrySecretProblemCheck {
  name: string | null;
  check: EntrySecretCheckId | EntrySecretRefusalCode;
  status: 'fail';
  reason: string;
  fix: string;
}

export interface EntrySecretsProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  competition: string;
  code: EntrySecretRefusalCode;
  checks: EntrySecretProblemCheck[];
  retry: { allowed: boolean; until: string | null; unchanged_will_fail: boolean };
  retry_after: string | null;
  success: false;
  error: ApiIssue[];
}

export interface EntrySecretRoutes {
  'GET /api/me/secrets': { response: MyEntrySecretsResponse };
  'GET /api/competitions/:slug/secrets': { params: { slug: string }; response: EntrySecretsResponse };
  'PUT /api/competitions/:slug/secrets': { params: { slug: string }; body: EntrySecretsBody; response: EntrySecretsPushedResponse };
  'DELETE /api/competitions/:slug/secrets/:name': { params: { slug: string; name: string }; response: EntrySecretDeletedResponse };
}
