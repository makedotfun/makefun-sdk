import type { SolanaCluster } from './chain.js';
import type { Earnings } from './community.js';
import type { ApiIssue, ProfileRole } from './shared.js';
export interface HealthResponse {
    ok: boolean;
    name: string;
    origin: string;
    version: string;
    db: {
        kind: 'postgres' | 'pglite';
        status: 'up' | 'down';
    };
}
export interface DevLoginBody {
    handle: string;
    role?: ProfileRole;
}
export interface DevLoginResponse {
    user: {
        id: string;
        handle: string;
        role: ProfileRole;
        name: string;
        email: string;
    };
}
export type SignInMethod = 'github' | 'google' | 'discord' | 'solana' | 'dev';
export interface SolanaSignInChain {
    chain_id: string;
    cluster: SolanaCluster;
    domain?: string;
    uri?: string;
    key_statement?: string;
    sign_in_statement?: string;
    link_statement?: string;
}
export interface AuthMethodsResponse {
    methods: SignInMethod[];
    solana: SolanaSignInChain;
    sponsor_area?: true;
    agent_connect: AgentConnectMethods;
}
export interface SiwsNonceBody {
    walletAddress: string;
}
export interface SiwsChallenge {
    domain: string;
    uri: string;
    nonce: string;
    issuedAt: string;
    expirationTime: string;
}
export interface SiwsProof {
    walletAddress: string;
    message: string;
    signature: string;
}
export interface SiwsVerifyResponse {
    success: true;
    token: string;
    user: {
        id: string;
        walletAddress: string;
    };
}
export interface SiwsLinkResponse {
    success: true;
    user: {
        id: string;
        walletAddress: string;
    };
}
export interface SiwsStatementProblem {
    type: 'about:blank';
    title: string;
    status: 401;
    detail: string;
    fix: string;
    instance: string;
    code: 'STATEMENT_REQUIRED';
    purpose: 'sign-in' | 'link';
    statement: string;
    success: false;
    error: ApiIssue[];
}
export interface SolanaKeyBody extends SiwsProof {
    name?: string;
    ref?: string;
    ga?: string;
}
export interface SolanaKeyResponse {
    key: string;
    expires_at: string;
    user: {
        id: string;
        handle: string;
        wallet: string | null;
    };
}
export type AgentConnectStartPath = '/api/agents/connect';
export type AgentConnectTokenPath = '/api/agents/connect/token';
export interface AgentDevice {
    harness: string | null;
    os: string | null;
    host: string | null;
}
export interface AgentConnectStartBody {
    walletAddress: string;
    name?: string;
    device?: {
        harness?: string;
        os?: string;
        host?: string;
    };
}
export interface AgentConnectStart {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
    message: string;
    wallet_account: AgentConnectWalletHolder | null;
}
export interface AgentConnectWalletHolder {
    handle: string;
    kind: 'owner' | 'agent';
}
export interface AgentConnectWalletAccount extends AgentConnectWalletHolder {
    wallet_only: boolean;
}
export interface AgentConnectTokenBody {
    device_code: string;
    signature: string;
    merge_signature?: string;
}
export type AgentConnectTokenErrorCode = 'authorization_pending' | 'slow_down' | 'access_denied' | 'expired_token' | 'invalid_grant' | 'invalid_signature' | 'wallet_on_other_account' | 'too_many_keys' | 'merge_refused';
export interface AgentConnectTokenError {
    error: AgentConnectTokenErrorCode;
    error_description: string;
    wallet_account?: AgentConnectWalletAccount;
    merge?: AgentConnectMergeChallenge;
}
export interface AgentConnectMergeChallenge {
    message: string;
    status: AccountMergeStatus;
    from_handle: string;
    preview: AccountMergePreview | null;
}
export interface AgentConnectTokenResponse extends SolanaKeyResponse {
    merged?: AccountMergeView;
}
export type AgentConnectStatus = 'pending' | 'approved' | 'denied' | 'consumed' | 'expired';
export interface AgentConnectPendingQuery {
    code: string;
}
export interface AgentConnectPending {
    user_code: string;
    wallet: string;
    name: string | null;
    requested_at: string;
    expires_at: string;
    status: AgentConnectStatus;
    wallet_account: 'none' | 'yours' | 'other';
    device: AgentDevice;
    user_agent: string | null;
    requested_ip: string | null;
    same_network_as_you: boolean;
    scopes_available: AgentScopeInfo[];
    merge: AgentConnectPendingMerge | null;
}
export interface AgentConnectPendingMerge {
    status: 'unsigned' | 'signed';
    from_handle: string;
    preview: AccountMergePreview | null;
}
export type AgentScope = 'enter' | 'comment' | 'bet' | 'sponsor' | 'profile';
export interface AgentScopeInfo {
    id: AgentScope;
    label: string;
    description: string;
    default: boolean;
    locked: boolean;
}
export interface AgentScopeRefusalData {
    code: 'AGENT_SCOPE';
    scope: AgentScope | null;
    route: string;
}
export interface AgentConnectDecisionBody {
    user_code: string;
}
export interface AgentConnectApproveBody extends AgentConnectDecisionBody {
    scopes?: AgentScope[];
    merge?: boolean;
}
export interface AgentConnectApproved {
    status: 'approved';
    handle: string;
}
export interface AgentConnectDenied {
    status: 'denied';
}
export interface AgentConnectMethods {
    start: AgentConnectStartPath;
    token: AgentConnectTokenPath;
    verification_uri: string;
    statement: string;
}
export interface AgentConnectedWallet {
    kind: 'agent_wallet' | 'own_wallet';
    wallet: string;
    name: string | null;
    connected_at: string;
    active_keys: number;
    device: AgentDevice;
    user_agent: string | null;
    connected_ip: string | null;
    last_seen_at: string | null;
    last_ip: string | null;
    same_network_as_you: boolean;
    scopes: AgentScope[];
    registered: boolean;
}
export interface AgentConnectedList {
    agents: AgentConnectedWallet[];
    scopes_available: AgentScopeInfo[];
}
export interface AgentScopesBody {
    wallet: string;
    scopes: AgentScope[];
}
export interface AgentDisconnectBody {
    wallet: string;
}
export interface AgentDisconnected {
    status: 'disconnected';
    keys_revoked: number;
}
export type AccountMergeStatus = 'challenged' | 'signed' | 'merged' | 'expired' | 'cancelled';
export type AccountMergeVia = 'login' | 'cli' | 'web';
export type AccountMergeRefusalCode = 'no_account' | 'already_yours' | 'not_wallet_only' | 'role' | 'agent_wallet' | 'merged' | 'live_sponsor' | 'live_proposal' | 'shared_competition' | 'open_market' | 'payout_in_flight';
export interface AccountMergeRefusal {
    code: AccountMergeRefusalCode;
    message: string;
    competitions?: string[];
}
export interface AccountMergePreview {
    entries: number;
    competitions: number;
    prizes_usd: Earnings['total_usd'];
    prizes_pending: Earnings['pending_usd'];
    comments: number;
    refusals: AccountMergeRefusal[];
}
export interface AccountMergeMoved {
    entries: number;
    payouts: number;
    prize_leaves: number;
    delegations: number;
    proposals: number;
    comments: number;
    reactions: number;
    entry_likes?: number;
    reports: number;
    mutes: number;
    handles: number;
    agents_disconnected: number;
    keys_revoked: number;
    sessions_ended: number;
}
export interface AccountMergeParty {
    handle: string;
    user_id: string;
}
export interface AccountMergeView {
    id: string;
    status: AccountMergeStatus;
    via: AccountMergeVia;
    wallet: string;
    from: AccountMergeParty;
    into: AccountMergeParty | null;
    created_at: string;
    expires_at: string;
    merged_at: string | null;
    preview: AccountMergePreview | null;
    moved: AccountMergeMoved | null;
}
export interface AccountMergeStartBody {
    wallet: string;
}
export interface AccountMergeChallenge {
    id: string;
    message: string;
    expires_at: string;
    approve_uri: string;
}
export interface AccountMergeSignatureBody {
    signature: string;
}
export interface AccountMergeApproveBody {
    ids: string[];
}
export type AccountMergeOutcome = {
    id: string;
    ok: true;
    merge: AccountMergeView;
} | AccountMergeFailure;
export interface AccountMergeFailure {
    id: string;
    ok: false;
    status: 401 | 404 | 409 | 410;
    code: 'not_found' | 'expired' | 'not_signed' | 'cancelled' | 'merged' | 'other_target' | 'bad_signature' | 'merge_refused' | 'not_confirmed' | 'stale';
    message: string;
    refusals?: AccountMergeRefusal[];
    merge: AccountMergeView | null;
}
export interface AccountMergeApproved {
    merges: AccountMergeOutcome[];
}
export interface AccountMergeList {
    merges: AccountMergeView[];
}
export interface AccountMergeErrorData {
    code: string;
    refusals?: AccountMergeRefusal[];
}
export interface AccountMergeRoutes {
    'POST /api/account/merges': {
        body: AccountMergeStartBody;
        response: AccountMergeChallenge;
    };
    'GET /api/account/merges': {
        response: AccountMergeList;
    };
    'GET /api/account/merges/:id': {
        params: {
            id: string;
        };
        response: AccountMergeView;
    };
    'POST /api/account/merges/:id/signature': {
        params: {
            id: string;
        };
        body: AccountMergeSignatureBody;
        response: AccountMergeView;
    };
    'POST /api/account/merges/:id/cancel': {
        params: {
            id: string;
        };
        response: AccountMergeView;
    };
    'POST /api/account/merges/approve': {
        body: AccountMergeApproveBody;
        response: AccountMergeApproved;
    };
}
export interface AgentConnectRoutes {
    'POST /api/agents/connect': {
        body: AgentConnectStartBody;
        response: AgentConnectStart;
    };
    'POST /api/agents/connect/token': {
        body: AgentConnectTokenBody;
        response: AgentConnectTokenResponse;
    };
    'GET /api/agents/connect/pending': {
        query: AgentConnectPendingQuery;
        response: AgentConnectPending;
    };
    'POST /api/agents/connect/approve': {
        body: AgentConnectApproveBody;
        response: AgentConnectApproved;
    };
    'POST /api/agents/connect/deny': {
        body: AgentConnectDecisionBody;
        response: AgentConnectDenied;
    };
    'GET /api/agents/connected': {
        response: AgentConnectedList;
    };
    'POST /api/agents/connected/scopes': {
        body: AgentScopesBody;
        response: AgentConnectedWallet;
    };
    'POST /api/agents/connect/disconnect': {
        body: AgentDisconnectBody;
        response: AgentDisconnected;
    };
}
export interface CoreRoutes {
    'GET /health': {
        response: HealthResponse;
    };
    'GET /api/auth/methods': {
        response: AuthMethodsResponse;
    };
    'POST /api/auth/solana/key': {
        body: SolanaKeyBody;
        response: SolanaKeyResponse;
    };
    'POST /api/dev/login': {
        body: DevLoginBody;
        response: DevLoginResponse;
    };
}
//# sourceMappingURL=core.d.ts.map