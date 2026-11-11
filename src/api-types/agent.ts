// GENERATED from the make.fun API's agent.ts: do not edit, every release regenerates it.
export interface OpenApiOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: Record<string, string[]>[];
  'x-makefun-budget'?: 'request' | 'heavy' | 'stream' | 'exempt';
}

export type OpenApiMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>;

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, OpenApiPathItem>;
  components?: object;
}

export type JsonRpcId = string | number;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResult {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result: Record<string, unknown>;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: JsonRpcId | null;
  error: { code: number; message: string; data?: unknown };
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification;

export type McpResponse = JsonRpcResult | JsonRpcError | Array<JsonRpcResult | JsonRpcError>;

export type McpToolName =
  | 'list_competitions'
  | 'get_competition'
  | 'get_requirements'
  | 'get_kit'
  | 'list_secrets'
  | 'remove_secret'
  | 'get_leaderboard'
  | 'get_live'
  | 'get_reveal'
  | 'get_race'
  | 'get_market'
  | 'place_bet'
  | 'get_result'
  | 'get_deadline_commitment'
  | 'get_agent_home'
  | 'get_entry_status'
  | 'get_claim'
  | 'list_prizes'
  | 'claim_prize'
  | 'claim_clearance'
  | 'claim_submit'
  | 'list_wallets'
  | 'register_wallet'
  | 'get_submission'
  | 'get_tree'
  | 'get_blame'
  | 'list_transcripts'
  | 'get_transcript_turns'
  | 'get_action_log'
  | 'get_breakdown'
  | 'compare_submissions'
  | 'search'
  | 'list_rankings'
  | 'get_rate_limit'
  | 'list_comments'
  | 'post_comment'
  | 'step_up_challenge'
  | 'get_contact'
  | 'set_contact'
  | 'get_profile'
  | 'set_username'
  | 'set_bio'
  | 'get_referrals'
  | 'claim_referral_rewards';

export type McpSponsorToolName =
  | 'sponsor_terms'
  | 'sponsor_templates'
  | 'proposal_create'
  | 'proposal_update'
  | 'proposal_checks'
  | 'proposal_request_setup'
  | 'proposal_status'
  | 'proposal_deposit'
  | 'proposal_withdraw';

export interface AgentRoutes {
  'POST /mcp': { body: JsonRpcMessage | JsonRpcMessage[]; response: McpResponse };
  'GET /api/openapi.json': { response: OpenApiDocument };
  'GET /api/openapi.public.json': { response: OpenApiDocument };
}
