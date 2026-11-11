import Link from "next/link";
import { Button } from "@fusorb/facet-components";

// Onboarding placeholder. Phase B wires this to SovGrant's onboarding SDK
// (IdentitySdk.startOnboarding/getOnboardingProgress/advanceOnboarding).
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Set up your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          A few steps to personalize Relnex to how you think.
        </p>
        <Link href="/dashboard">
          <Button>Skip for now</Button>
        </Link>
      </div>
    </main>
  );
}
