"use client";

import { CheckboxInput, ToggleGroup } from "@/components/ui/inputs";
import type {
  FoundationType,
  SlabThickness,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const TYPES: { value: FoundationType; label: string; desc?: string }[] = [
  {
    value: "slab",
    label: "Slab on grade",
    desc: '4" or 6" reinforced concrete (most common)',
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

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Foundation choice + slab spec are owner-set and feed straight into the
        PE submittal. Slab-specific options only appear when slab is selected.
      </p>

      <ToggleGroup
        label="Foundation type"
        value={f.type}
        onChange={(v) => patchFoundation({ type: v as FoundationType })}
        options={TYPES}
      />

      {isSlab && (
        <>
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
