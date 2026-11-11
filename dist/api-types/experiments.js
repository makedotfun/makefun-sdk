// GENERATED from the make.fun API's experiments.ts: do not edit, every release regenerates it.
export const TUTORIAL_EXPERIMENT = 'tutorial';
export const AD_LANDING_EXPERIMENT = 'ad_landing';
export const TUTORIAL_ARMS = ['control', 'quick_tour', 'full_tour'];
export const TUTORIAL_TOUR_ARMS = ['quick_tour', 'full_tour'];
export const TUTORIAL_COOKIE = 'mf_ab_tutorial';
export const AD_LANDING_ARMS = ['control', 'contest_feed'];
export const AD_LANDING_COOKIE = 'mf_ab_ad_landing';
export const EXPERIMENT_DEFS = {
    [TUTORIAL_EXPERIMENT]: { cookie: TUTORIAL_COOKIE, arms: TUTORIAL_ARMS },
    [AD_LANDING_EXPERIMENT]: { cookie: AD_LANDING_COOKIE, arms: AD_LANDING_ARMS },
};
export const EXPERIMENT_BROWSER_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
//# sourceMappingURL=experiments.js.map