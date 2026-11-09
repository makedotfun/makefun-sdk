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
];
export const RANK_KINDS = ['ranked', 'rank_up', 'took_lead', 'overtaken', 'dethroned'];
export const RESULT_KINDS = ['winners_selected', 'won'];
export const ACCOUNT_KINDS = ['referral_approved', 'referral_paid'];
export const NOTIFICATION_TOPICS = ['new_contests', 'results', 'rewards'];
export const TOPIC_KINDS = {
    new_contests: ['new_contest'],
    results: ['winners_selected', 'won'],
    rewards: ['prize_ready', 'referral_approved', 'referral_paid'],
};
export function topicOf(kind) {
    for (const topic of NOTIFICATION_TOPICS)
        if (TOPIC_KINDS[topic].includes(kind))
            return topic;
    return null;
}
export const OUTBOUND_KINDS = NOTIFICATION_KINDS.filter((kind) => topicOf(kind) !== null);
export const CONTACT_OUTBOUND_CHANNELS = ['email', 'sms'];
export const OUTBOUND_CHANNELS = [...CONTACT_OUTBOUND_CHANNELS, 'discord'];
export const DISCORD_KINDS = ['referral_approved'];
export function channelCarries(channel, kind) {
    if (topicOf(kind) === null)
        return false;
    return channel !== 'discord' || DISCORD_KINDS.includes(kind);
}
export const topicsOn = (channel) => NOTIFICATION_TOPICS.filter((topic) => TOPIC_KINDS[topic].some((kind) => channelCarries(channel, kind)));
export const contactChannelOf = (channel) => (channel === 'sms' ? 'phone' : 'email');
export const outboundChannelOf = (channel) => (channel === 'phone' ? 'sms' : 'email');
export const SUPPRESSION_REASONS = ['bounce', 'complaint', 'stop'];
//# sourceMappingURL=notifications.js.map