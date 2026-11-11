// GENERATED from the make.fun API's notifications.ts: do not edit, every release regenerates it.
import type { ContactChannel } from './community.ts';
import type { BoardCategory } from './competitions.ts';
import type { PageQuery, PhaseKey } from './shared.ts';

export const NOTIFICATION_KINDS = [
  'new_contest',
  'ranked',
  'rank_up',
  'took_lead',
  'overtaken',
  'dethroned',
  'contest_ended',
  'winners_selected',
  'won',
  'prize_ready',
  'referral_approved',
  'referral_paid',
  'proposal_setup',
  'entry_secret_held',
  'entry_liked',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const RANK_KINDS = ['ranked', 'rank_up', 'took_lead', 'overtaken', 'dethroned'] as const satisfies readonly NotificationKind[];
export type RankKind = (typeof RANK_KINDS)[number];

export const RESULT_KINDS = ['winners_selected', 'won'] as const satisfies readonly NotificationKind[];
export type ResultKind = (typeof RESULT_KINDS)[number];

export const ACCOUNT_KINDS = ['referral_approved', 'referral_paid'] as const satisfies readonly NotificationKind[];
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export const NOTIFICATION_TOPICS = ['new_contests', 'results', 'rewards'] as const;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];

export const TOPIC_KINDS = {
  new_contests: ['new_contest'],
  results: ['winners_selected', 'won'],
  rewards: ['prize_ready', 'referral_approved', 'referral_paid'],
} as const satisfies Record<NotificationTopic, readonly NotificationKind[]>;

export function topicOf(kind: NotificationKind): NotificationTopic | null {
  for (const topic of NOTIFICATION_TOPICS) if ((TOPIC_KINDS[topic] as readonly NotificationKind[]).includes(kind)) return topic;
  return null;
}

export const OUTBOUND_KINDS: readonly NotificationKind[] = NOTIFICATION_KINDS.filter((kind) => topicOf(kind) !== null);

export const CONTACT_OUTBOUND_CHANNELS = ['email', 'sms'] as const;
export type ContactOutboundChannel = (typeof CONTACT_OUTBOUND_CHANNELS)[number];

export const OUTBOUND_CHANNELS = [...CONTACT_OUTBOUND_CHANNELS, 'discord'] as const;
export type OutboundChannel = (typeof OUTBOUND_CHANNELS)[number];

export const DISCORD_KINDS = ['referral_approved'] as const satisfies readonly NotificationKind[];

export function channelCarries(channel: OutboundChannel, kind: NotificationKind): boolean {
  if (topicOf(kind) === null) return false;
  return channel !== 'discord' || (DISCORD_KINDS as readonly NotificationKind[]).includes(kind);
}

export const topicsOn = (channel: OutboundChannel): NotificationTopic[] =>
  NOTIFICATION_TOPICS.filter((topic) => (TOPIC_KINDS[topic] as readonly NotificationKind[]).some((kind) => channelCarries(channel, kind)));

export const contactChannelOf = (channel: ContactOutboundChannel): ContactChannel => (channel === 'sms' ? 'phone' : 'email');

export const outboundChannelOf = (channel: ContactChannel): ContactOutboundChannel => (channel === 'phone' ? 'sms' : 'email');

export const SUPPRESSION_REASONS = ['bounce', 'complaint', 'stop'] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

export type NotificationSecretProvider = 'anthropic' | 'openai' | 'google';

export interface NotificationCompetition {
  slug: string;
  title: string;
}

export interface NotificationData {
  rank?: number;
  previous_rank?: number | null;
  entrants?: number;
  by_handle?: string | null;
  placement?: number | null;
  prize_usd?: string | null;
  previous_prize_usd?: string | null;
  submission_id?: string;
  payout_id?: string;
  prize?: 'placement' | 'efficiency';
  claim_deadline?: string | null;
  settled?: boolean;
  proposal_id?: string;
  setup?: 'finished' | 'returned' | 'noted';
  note?: string | null;
  category?: { from: BoardCategory | null; to: BoardCategory };
  rules?: 'kept' | 'replaced';
  funded?: boolean;
  phase?: PhaseKey;
  providers?: NotificationSecretProvider[];
  held_until?: string | null;
  reward?: string | null;
  deadline?: string | null;
  usd?: string;
  quest_usd?: string;
  count?: number;
  reward_ids?: string[];
  signature?: string | null;
  likes?: number;
  liked_by?: string | null;
}

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string;
  competition: NotificationCompetition | null;
  data: NotificationData;
  created_at: string;
  read: boolean;
}

export interface NotificationList {
  items: NotificationItem[];
  unread: number;
  next_cursor: string | null;
}

export interface NotificationUnread {
  unread: number;
}

export type NotificationReadBody = { ids: string[] } | { all: true };

export interface NotificationSettings {
  push: {
    available: boolean;
    public_key: string | null;
    subscriptions: number;
  };
  muted: NotificationKind[];
  outbound: Record<NotificationTopic, Record<OutboundChannel, boolean>>;
  channels: Record<OutboundChannel, OutboundChannelState>;
}

export type OutboundContactState = 'none' | 'unverified' | 'verified' | 'suppressed' | 'linked';

export interface OutboundChannelState {
  available: boolean;
  contact: OutboundContactState;
  suppressed: SuppressionReason | null;
}

export interface NotificationOutboundChange {
  topic: NotificationTopic;
  channel: OutboundChannel;
  on: boolean;
}

export interface NotificationSettingsBody {
  muted?: NotificationKind[];
  outbound?: NotificationOutboundChange[];
}

export interface PushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expiration_time?: number | null;
}

export interface PushSubscriptions {
  subscriptions: number;
}

export interface PushUnsubscribeBody {
  endpoint: string;
}

export interface NotificationUnsubscribeBody {
  token: string;
  all?: boolean;
}

export interface NotificationUnsubscribeResult {
  topic: NotificationTopic;
  all: boolean;
}

export interface WebPushPayload {
  web_push: 8030;
  notification: {
    title: string;
    body: string;
    navigate: string;
    tag: string;
    lang: 'en';
    dir: 'ltr';
    silent: false;
    app_badge: string;
    data: { id: string; kind: NotificationKind; url: string };
  };
}

export interface NotificationsRoutes {
  'GET /api/notifications': { query: PageQuery; response: NotificationList };
  'GET /api/notifications/unread': { response: NotificationUnread };
  'POST /api/notifications/read': { body: NotificationReadBody; response: NotificationUnread };
  'GET /api/notifications/settings': { response: NotificationSettings };
  'PUT /api/notifications/settings': { body: NotificationSettingsBody; response: NotificationSettings };
  'POST /api/notifications/push': { body: PushSubscriptionBody; response: PushSubscriptions };
  'DELETE /api/notifications/push': { body: PushUnsubscribeBody; response: null };
  'POST /api/notifications/unsubscribe': { body: NotificationUnsubscribeBody; response: NotificationUnsubscribeResult };
}
