// GENERATED from the make.fun API's experiments.ts: do not edit, every release regenerates it.
export const TUTORIAL_EXPERIMENT = 'tutorial' as const;
export const AD_LANDING_EXPERIMENT = 'ad_landing' as const;
export type ExperimentKey = typeof TUTORIAL_EXPERIMENT | typeof AD_LANDING_EXPERIMENT;

export const TUTORIAL_ARMS = ['control', 'quick_tour', 'full_tour'] as const;
export type TutorialArm = (typeof TUTORIAL_ARMS)[number];
export const TUTORIAL_TOUR_ARMS = ['quick_tour', 'full_tour'] as const;
export type TutorialTourArm = (typeof TUTORIAL_TOUR_ARMS)[number];

export const TUTORIAL_COOKIE = 'mf_ab_tutorial' as const;

export const AD_LANDING_ARMS = ['control', 'contest_feed'] as const;
export type AdLandingArm = (typeof AD_LANDING_ARMS)[number];

export const AD_LANDING_COOKIE = 'mf_ab_ad_landing' as const;

export const EXPERIMENT_DEFS = {
  [TUTORIAL_EXPERIMENT]: { cookie: TUTORIAL_COOKIE, arms: TUTORIAL_ARMS },
  [AD_LANDING_EXPERIMENT]: { cookie: AD_LANDING_COOKIE, arms: AD_LANDING_ARMS },
} as const;

export type ExperimentArm = (typeof EXPERIMENT_DEFS)[ExperimentKey]['arms'][number];

export const EXPERIMENT_BROWSER_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

export type ExperimentExposureBody =
  | {
      experiment: typeof TUTORIAL_EXPERIMENT;
      arm: TutorialArm;
      browser_id: string;
    }
  | {
      experiment: typeof AD_LANDING_EXPERIMENT;
      arm: AdLandingArm;
      browser_id: string;
    };

export interface ExperimentSplitView {
  key: ExperimentKey;
  arms: { arm: string; percent: number }[];
}

export interface ExperimentRoutes {
  'POST /api/experiments/exposure': { body: ExperimentExposureBody; response: null };
}
