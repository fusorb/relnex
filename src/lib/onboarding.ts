// Product-level onboarding model (Relnex's own steps, not SG's identity flow).
// Pure + client-safe so it can drive the wizard and be unit-tested.
//
// Phase B keeps this on Relnex's `onboardingStep` counter (persisted via
// PUT /api/users/me/onboarding). When SovGrant provisions an onboarding flow
// for Relnex's project, the identity steps plug in through facet-sdk
// IdentitySdk (startOnboarding / getOnboardingProgress / advanceOnboarding)
// alongside these product steps.

export interface OnboardingStepDef {
  id: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: "welcome",
    title: "Welcome to Relnex",
    description: "Relnex connects your knowledge instead of just storing it.",
  },
  {
    id: "profile",
    title: "Set up your profile",
    description: "How should you appear across the workspace?",
  },
  {
    id: "archetype",
    title: "How do you think?",
    description: "This tunes the way your graph is organized.",
  },
  {
    id: "done",
    title: "You're ready",
    description: "Create your first resource and start connecting.",
  },
];

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

/** Clamp a step index into the valid range. */
export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  return Math.max(0, Math.min(Math.trunc(step), TOTAL_ONBOARDING_STEPS - 1));
}

/** 0-100 completion for a given step index. */
export function progressPercent(step: number): number {
  return Math.round((clampStep(step) / (TOTAL_ONBOARDING_STEPS - 1)) * 100);
}

export function isFirstStep(step: number): boolean {
  return clampStep(step) === 0;
}

export function isLastStep(step: number): boolean {
  return clampStep(step) === TOTAL_ONBOARDING_STEPS - 1;
}

export function nextStep(step: number): number {
  return clampStep(clampStep(step) + 1);
}

export function previousStep(step: number): number {
  return clampStep(clampStep(step) - 1);
}

export const ARCHETYPES = [
  "STUDENT",
  "RESEARCHER",
  "DEVELOPER",
  "POET",
  "EDUCATOR",
  "CREATOR",
  "THINKER",
  "BUILDER",
  "GENERAL",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];
