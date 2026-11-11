// GENERATED from the make.fun API's quests.ts: do not edit, every release regenerates it.
import type { ExperimentSplitView } from './experiments.ts';

export type QuestKey = 'discord_join';
export type QuestStepKey = 'account' | 'discord_link' | 'discord_join';
export type QuestState = 'off' | 'not_started' | 'in_progress' | 'claimable' | 'claiming' | 'paid' | 'ineligible';
export type QuestIneligibleReason = 'not_in_offer' | 'discord_already_rewarded';

export interface QuestStepView {
  key: QuestStepKey;
  done: boolean;
}

export interface QuestRewardView {
  id: string;
  status: 'approved' | 'claimed' | 'paid';
  usd: string;
  claim_id: string | null;
  tx_signature: string | null;
  explorer_url: string | null;
}

export interface QuestView {
  key: QuestKey;
  on: boolean;
  reward_base_units: string;
  reward_usd: string;
  viewer: 'signed_out' | 'signed_in';
  eligible: boolean | null;
  ineligible_reason: QuestIneligibleReason | null;
  steps: QuestStepView[];
  state: QuestState;
  reward: QuestRewardView | null;
}

export interface QuestsResponse {
  quests: QuestView[];
  experiments: ExperimentSplitView[];
}

export interface QuestRoutes {
  'GET /api/quests': { response: QuestsResponse };
}
