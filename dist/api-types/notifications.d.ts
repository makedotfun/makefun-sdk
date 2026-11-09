import type { ContactChannel } from './community.js';
import type { BoardCategory } from './competitions.js';
import type { PageQuery, PhaseKey } from './shared.js';
export declare const NOTIFICATION_KINDS: readonly ['new_contest', 'ranked', 'rank_up', 'took_lead', 'overtaken', 'dethroned', 'contest_ended', 'winners_selected', 'won', 'prize_ready', 'referral_approved', 'referral_paid', 'proposal_setup', 'entry_secret_held'];
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export declare const RANK_KINDS: readonly ["ranked", "rank_up", "took_lead", "overtaken", "dethroned"];
export type RankKind = (typeof RANK_KINDS)[number];
export declare const RESULT_KINDS: readonly ["winners_selected", "won"];
export type ResultKind = (typeof RESULT_KINDS)[number];
export declare const ACCOUNT_KINDS: readonly ["referral_approved", "referral_paid"];
export type AccountKind = (typeof ACCOUNT_KINDS)[number];
export declare const NOTIFICATION_TOPICS: readonly ['new_contests', 'results', 'rewards'];
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];
export declare const TOPIC_KINDS: {
    readonly new_contests: readonly ["new_contest"];
    readonly results: readonly ["winners_selected", "won"];
    readonly rewards: readonly ["prize_ready", "referral_approved", "referral_paid"];
};
export declare function topicOf(kind: NotificationKind): NotificationTopic | null;
export declare const OUTBOUND_KINDS: readonly NotificationKind[];
export declare const CONTACT_OUTBOUND_CHANNELS: readonly ['email', 'sms'];
export type ContactOutboundChannel = (typeof CONTACT_OUTBOUND_CHANNELS)[number];
export declare const OUTBOUND_CHANNELS: readonly ["email", "sms", "discord"];
export type OutboundChannel = (typeof OUTBOUND_CHANNELS)[number];
export declare const DISCORD_KINDS: readonly ["referral_approved"];
export declare function channelCarries(channel: OutboundChannel, kind: NotificationKind): boolean;
export declare const topicsOn: (channel: OutboundChannel) => NotificationTopic[];
export declare const contactChannelOf: (channel: ContactOutboundChannel) => ContactChannel;
export declare const outboundChannelOf: (channel: ContactChannel) => ContactOutboundChannel;
export declare const SUPPRESSION_REASONS: readonly ['bounce', 'complaint', 'stop'];
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
    submission_id?: string;
    payout_id?: string;
    prize?: 'placement' | 'efficiency';
    claim_deadline?: string | null;
    settled?: boolean;
    proposal_id?: string;
    setup?: 'finished' | 'returned' | 'noted';
    note?: string | null;
    category?: {
        from: BoardCategory | null;
        to: BoardCategory;
    };
    rules?: 'kept' | 'replaced';
    funded?: boolean;
    phase?: PhaseKey;
    providers?: NotificationSecretProvider[];
    held_until?: string | null;
    reward?: string | null;
    deadline?: string | null;
    usd?: string;
    count?: number;
    reward_ids?: string[];
    signature?: string | null;
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
export type NotificationReadBody = {
    ids: string[];
} | {
    all: true;
};
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
    keys: {
        p256dh: string;
        auth: string;
    };
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
        data: {
            id: string;
            kind: NotificationKind;
            url: string;
        };
    };
}
export interface NotificationsRoutes {
    'GET /api/notifications': {
        query: PageQuery;
        response: NotificationList;
    };
    'GET /api/notifications/unread': {
        response: NotificationUnread;
    };
    'POST /api/notifications/read': {
        body: NotificationReadBody;
        response: NotificationUnread;
    };
    'GET /api/notifications/settings': {
        response: NotificationSettings;
    };
    'PUT /api/notifications/settings': {
        body: NotificationSettingsBody;
        response: NotificationSettings;
    };
    'POST /api/notifications/push': {
        body: PushSubscriptionBody;
        response: PushSubscriptions;
    };
    'DELETE /api/notifications/push': {
        body: PushUnsubscribeBody;
        response: null;
    };
    'POST /api/notifications/unsubscribe': {
        body: NotificationUnsubscribeBody;
        response: NotificationUnsubscribeResult;
    };
}
//# sourceMappingURL=notifications.d.ts.map