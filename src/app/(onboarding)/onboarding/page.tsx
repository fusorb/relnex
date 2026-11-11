"use client";

// Console onboarding wizard. Phase B drives Relnex's own product steps
// (onboardingStep via PUT /api/users/me/onboarding) and profile capture
// (PUT /api/users/me/profile).
//
// SG-level identity onboarding plugs in here later through facet-sdk
// IdentitySdk (startOnboarding / getOnboardingProgress / advanceOnboarding)
// once an onboarding flow is provisioned for Relnex's project in SovGrant.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Icon,
  Input,
  Label,
  Progress,
  Textarea,
} from "@fusorb/facet-components";
import { apiClient } from "@/lib/useful/api-client";
import { ME_QUERY_KEY, requiresOnboarding, useMe } from "@/hooks/use-me";
import {
  ARCHETYPES,
  ONBOARDING_STEPS,
  TOTAL_ONBOARDING_STEPS,
  clampStep,
  isLastStep,
  nextStep,
  previousStep,
  progressPercent,
  type Archetype,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resume from the persisted step; also seed the form from any saved profile.
  useEffect(() => {
    if (!me || requiresOnboarding(me)) return;
    setStep(clampStep(me.onboardingStep));
    setDisplayName(me.displayName ?? "");
    setBio(me.bio ?? "");
    if (ARCHETYPES.includes(me.archetype as Archetype)) {
      setArchetype(me.archetype as Archetype);
    }
  }, [me]);

  const current = ONBOARDING_STEPS[clampStep(step)];
  const progress = progressPercent(step);

  async function persistProfile() {
    if (step === 1 && (displayName || bio)) {
      await apiClient("/api/users/me/profile", {
        method: "PUT",
        bodyData: { displayName: displayName || undefined, bio: bio || undefined },
      });
    }
    if (step === 2 && archetype) {
      await apiClient("/api/users/me/profile", {
        method: "PUT",
        bodyData: { archetype },
      });
    }
    // Advance Relnex's own onboarding counter (provisions the User on first call).
    await apiClient("/api/users/me/onboarding", {
      method: "PUT",
      bodyData: { step },
    });
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await persistProfile();
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

      if (isLastStep(step)) {
        router.push("/dashboard");
        return;
      }
      setStep((s) => nextStep(s));
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setSubmitting(true);
    try {
      // Finish onboarding so the user isn't trapped in the wizard.
      await apiClient("/api/users/me/onboarding", {
        method: "PUT",
        bodyData: { step: TOTAL_ONBOARDING_STEPS - 1 },
      });
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Icon name="loader-circle" className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {clampStep(step) + 1} of {TOTAL_ONBOARDING_STEPS}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              className="font-medium hover:text-foreground disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{current.title}</h1>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What do you think about, and what are you connecting?"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-2">
            {ARCHETYPES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setArchetype(a)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                  archetype === a
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {a.toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep((s) => previousStep(s))}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          <Button size="sm" onClick={handleContinue} disabled={submitting}>
            {submitting ? "Saving..." : isLastStep(step) ? "Enter Relnex" : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  );
}
