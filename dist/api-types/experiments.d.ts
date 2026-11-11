export declare const TUTORIAL_EXPERIMENT: 'tutorial';
export declare const AD_LANDING_EXPERIMENT: 'ad_landing';
export type ExperimentKey = typeof TUTORIAL_EXPERIMENT | typeof AD_LANDING_EXPERIMENT;
export declare const TUTORIAL_ARMS: readonly ['control', 'quick_tour', 'full_tour'];
export type TutorialArm = (typeof TUTORIAL_ARMS)[number];
export declare const TUTORIAL_TOUR_ARMS: readonly ['quick_tour', 'full_tour'];
export type TutorialTourArm = (typeof TUTORIAL_TOUR_ARMS)[number];
export declare const TUTORIAL_COOKIE: 'mf_ab_tutorial';
export declare const AD_LANDING_ARMS: readonly ['control', 'contest_feed'];
export type AdLandingArm = (typeof AD_LANDING_ARMS)[number];
export declare const AD_LANDING_COOKIE: 'mf_ab_ad_landing';
export declare const EXPERIMENT_DEFS: {
    readonly tutorial: {
        readonly cookie: "mf_ab_tutorial";
        readonly arms: readonly ["control", "quick_tour", "full_tour"];
    };
    readonly ad_landing: {
        readonly cookie: "mf_ab_ad_landing";
        readonly arms: readonly ["control", "contest_feed"];
    };
};
export type ExperimentArm = (typeof EXPERIMENT_DEFS)[ExperimentKey]['arms'][number];
export declare const EXPERIMENT_BROWSER_ID_RE: RegExp;
export type ExperimentExposureBody = {
    experiment: typeof TUTORIAL_EXPERIMENT;
    arm: TutorialArm;
    browser_id: string;
} | {
    experiment: typeof AD_LANDING_EXPERIMENT;
    arm: AdLandingArm;
    browser_id: string;
};
export interface ExperimentSplitView {
    key: ExperimentKey;
    arms: {
        arm: string;
        percent: number;
    }[];
}
export interface ExperimentRoutes {
    'POST /api/experiments/exposure': {
        body: ExperimentExposureBody;
        response: null;
    };
}
//# sourceMappingURL=experiments.d.ts.map