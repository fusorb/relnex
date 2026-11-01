import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import { OnboardingStepDto } from "../user.dto";
import { UserRepository }    from "../user.repository";

const TOTAL_STEPS = 5;

export const processOnboardingStepFlow: Flow<z.infer<typeof OnboardingStepDto>> = {
  name: "user:onboarding-step", inputSchema: OnboardingStepDto,
  async execute(input, ctx) {
    const repo = new UserRepository(ctx.db);
    const user = await repo.update(ctx.userId!, {
      onboardingStep: Math.min(input.step + 1, TOTAL_STEPS),
    });
    const completed = user.onboardingStep >= TOTAL_STEPS;
    return { user, completed, nextStep: completed ? null : user.onboardingStep };
  },
};
