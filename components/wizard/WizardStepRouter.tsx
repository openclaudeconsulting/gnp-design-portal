"use client";

import { StepAdditions } from "./StepAdditions";
import { StepFinishes } from "./StepFinishes";
import { StepFoundation } from "./StepFoundation";
import { StepInterior } from "./StepInterior";
import { StepOpenings } from "./StepOpenings";
import { StepRoof } from "./StepRoof";
import { StepShell } from "./StepShell";
import { useWizard } from "./WizardProvider";

/**
 * Switches the visible step component based on the wizard's stepIndex.
 *
 * Steps not yet implemented (chunk d Site, Review; chunk e Submit) render a
 * "Coming soon" placeholder so the wizard chrome stays exercisable.
 */
export function WizardStepRouter() {
  const { stepIndex, steps } = useWizard();

  switch (stepIndex) {
    case 0:
      return <StepShell />;
    case 1:
      return <StepRoof />;
    case 2:
      return <StepFoundation />;
    case 3:
      return <StepOpenings />;
    case 4:
      return <StepAdditions />;
    case 5:
      return <StepInterior />;
    case 6:
      return <StepFinishes />;
    default:
      return <ComingSoon stepLabel={steps[stepIndex].label} />;
  }
}

function ComingSoon({ stepLabel }: { stepLabel: string }) {
  return (
    <div className="py-16 px-6 text-center border border-dashed border-zinc-700 rounded-lg bg-zinc-950/50">
      <div className="text-xs uppercase tracking-wider text-amber-500/70 font-semibold mb-2">
        Coming in the next build chunk
      </div>
      <p className="text-lg text-zinc-400">
        The{" "}
        <span className="text-zinc-100 font-medium">{stepLabel}</span> step is
        being built.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Use Back / Next to navigate the steps that are available.
      </p>
    </div>
  );
}
