import { describe, expect, it } from "vitest";
import {
  ARCHETYPES,
  TOTAL_ONBOARDING_STEPS,
  clampStep,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  progressPercent,
} from "@/lib/onboarding";

describe("onboarding step model", () => {
  it("clamps out-of-range and non-finite input", () => {
    expect(clampStep(-3)).toBe(0);
    expect(clampStep(0)).toBe(0);
    expect(clampStep(TOTAL_ONBOARDING_STEPS + 5)).toBe(TOTAL_ONBOARDING_STEPS - 1);
    expect(clampStep(Number.NaN)).toBe(0);
  });

  it("reports progress across the step range", () => {
    expect(progressPercent(0)).toBe(0);
    expect(progressPercent(TOTAL_ONBOARDING_STEPS - 1)).toBe(100);
    expect(progressPercent(TOTAL_ONBOARDING_STEPS + 9)).toBe(100);
  });

  it("moves between steps without escaping the range", () => {
    expect(nextStep(0)).toBe(1);
    expect(nextStep(TOTAL_ONBOARDING_STEPS - 1)).toBe(TOTAL_ONBOARDING_STEPS - 1);
    expect(previousStep(1)).toBe(0);
    expect(previousStep(0)).toBe(0);
  });

  it("identifies the first and last steps", () => {
    expect(isFirstStep(0)).toBe(true);
    expect(isFirstStep(1)).toBe(false);
    expect(isLastStep(TOTAL_ONBOARDING_STEPS - 1)).toBe(true);
    expect(isLastStep(0)).toBe(false);
  });

  it("aligns the archetype list with the backend DTO", () => {
    expect(ARCHETYPES).toContain("DEVELOPER");
    expect(ARCHETYPES).toContain("GENERAL");
    expect(ARCHETYPES).toHaveLength(9);
  });
});
