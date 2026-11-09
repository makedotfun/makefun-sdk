// GENERATED from the make.fun API's budget.ts: do not edit, every release regenerates it.
export type RateLimitTier = 'free' | 'registered';

export type RateLimitLane = 'visitor' | 'address' | 'address-ceiling' | 'platform' | 'key' | 'session' | 'keyed-address-ceiling' | 'heavy';

export type RateLimitMode = 'off' | 'observe' | 'enforce';

export interface RateLimitPolicyState {
  name: string;
  lane: RateLimitLane;
  limit: number;
  window_s: number;
  remaining: number;
  resets_at: string;
}

export interface RateLimitKey {
  id: string;
  name: string | null;
  expires_at: string | null;
}

export interface RateLimitLaneState {
  lane: RateLimitLane;
  policies: RateLimitPolicyState[];
}

export interface RateLimitResponse {
  tier: RateLimitTier;
  lane: RateLimitLane | null;
  mode: RateLimitMode;
  exempt: boolean;
  policies: RateLimitPolicyState[];
  key: RateLimitKey | null;
  key_lane?: RateLimitLaneState;
  store_unavailable: boolean;
  draft: string;
  docs_url: string;
}

export interface BudgetRoutes {
  'GET /api/rate-limit': { response: RateLimitResponse };
}
