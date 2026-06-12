"use client";

import { CheckboxInput, ToggleGroup } from "@/components/ui/inputs";
import { getEnclosureSummary } from "@/lib/services/enclosure-utils";
import type {
  FoundationType,
  SlabCoverage,
  SlabThickness,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const TYPES: { value: FoundationType; label: string; desc?: string }[] = [
  {
    value: "none",
    label: "None",
    desc: "No concrete — bare dirt or gravel pad (open pole barn default)",
  },
  {
    value: "slab",
    label: "Slab on grade",
    desc: '4" or 6" reinforced concrete (most common for enclosed builds)',
  },
  {
    value: "crawlspace",
    label: "Crawlspace",
    desc: "Raised; utilities run under the floor",
  },
  {
    value: "stem-wall",
    label: "Stem wall",
    desc: "Block perimeter with fill (flood-prone sites)",
  },
];

const SLAB_THICKNESS: {
  value: SlabThickness;
  label: string;
  desc?: string;
}[] = [
  { value: 4, label: '4"', desc: "Standard for ag / storage" },
  {
    value: 6,
    label: '6"',
    desc: "Recommended for residential / heavy floor loads",
  },
];

const CONCRETE: { value: 3000 | 4000; label: string; desc?: string }[] = [
  { value: 3000, label: "3000 PSI", desc: "Standard residential" },
  {
    value: 4000,
    label: "4000 PSI",
    desc: "Higher strength (heavier loads / coastal sites)",
  },
];

export function StepFoundation() {
  const { config, patchFoundation } = useWizard();
  const f = config.foundation;
  const isSlab = f.type === "slab";
  const isNone = f.type === "none";
  const enclosure = getEnclosureSummary(config.shell.bayEnclosures);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Foundation choice + slab spec feed straight into the PE submittal.
        Default is &quot;None&quot; — open pole barns commonly skip the slab.
        Slab-specific options appear when slab is selected.
      </p>

      <ToggleGroup
        label="Foundation type"
        value={f.type}
        onChange={(v) => patchFoundation({ type: v as FoundationType })}
        options={TYPES}
      />

      {isNone && (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-400">
          <strong className="text-zinc-200">No foundation in the quote.</strong>{" "}
          Bay posts sit on simple concrete footings at each pole (priced into
          the kit). Pick a slab / crawlspace / stem-wall above if you want a
          full foundation included in the quote.
        </div>
      )}

      {isSlab && (
        <>
          <ToggleGroup
            label="Slab coverage"
            value={f.slabCoverage}
            onChange={(v) =>
              patchFoundation({ slabCoverage: v as SlabCoverage })
            }
            options={[
              {
                value: "full",
                label: "Whole footprint",
                desc: "Pour slab under the entire building (default).",
              },
              {
                value: "enclosed-only",
                label: "Enclosed bays only",
                desc: enclosure.mixed
                  ? `Slab under the ${enclosure.closedCount} enclosed bays only; open bays stay on dirt/gravel.`
                  : enclosure.fullyOpen
                    ? "No enclosed bays — slab will not appear in the quote."
                    : "Slab under enclosed bays only (currently identical to whole footprint — all bays are enclosed).",
              },
            ]}
            columns={2}
          />

          {f.slabCoverage === "enclosed-only" && enclosure.fullyOpen && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
              <strong className="text-amber-300">
                No enclosed bays detected.
              </strong>{" "}
              The slab will not appear in the quote until you mark at least
              one bay as enclosed on Step Shell.
            </div>
          )}

          <ToggleGroup
            label="Slab thickness"
            value={f.slabThicknessIn}
            onChange={(v) =>
              patchFoundation({ slabThicknessIn: v as SlabThickness })
            }
            options={SLAB_THICKNESS}
            columns={2}
          />

          <ToggleGroup
            label="Concrete strength"
            value={f.concretePsi}
            onChange={(v) =>
              patchFoundation({ concretePsi: v as 3000 | 4000 })
            }
            options={CONCRETE}
            columns={2}
          />

          <CheckboxInput
            label="Thickened-edge perimeter footing"
            checked={f.thickenedEdges}
            onChange={(v) => patchFoundation({ thickenedEdges: v })}
            hint="Continuous thickened edge along the perimeter (typical for steel post bases)."
          />
        </>
      )}
    </div>
  );
}
