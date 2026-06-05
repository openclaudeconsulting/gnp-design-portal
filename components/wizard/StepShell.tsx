"use client";

import {
  CheckboxInput,
  ComputedField,
  NumberInput,
  ToggleGroup,
} from "@/components/ui/inputs";
import { useWizard } from "./WizardProvider";

export function StepShell() {
  const { config, patchShell } = useWizard();
  const s = config.shell;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Overall building dimensions and structural strategy. Width is capped at
        80 ft (above that, the steel truss spec jumps tiers).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NumberInput
          label="Width"
          value={s.widthFt}
          onChange={(v) => patchShell({ widthFt: v })}
          min={16}
          max={80}
          unit="ft"
          hint="16-80 ft"
        />
        <NumberInput
          label="Length"
          value={s.lengthFt}
          onChange={(v) => patchShell({ lengthFt: v })}
          min={20}
          max={200}
          unit="ft"
          hint="20-200 ft"
        />
        <NumberInput
          label="Eave height"
          value={s.eaveHeightFt}
          onChange={(v) => patchShell({ eaveHeightFt: v })}
          min={8}
          max={24}
          unit="ft"
          hint="8-24 ft"
        />
        <NumberInput
          label="Bay spacing"
          value={s.baySpacingFt}
          onChange={(v) => patchShell({ baySpacingFt: v })}
          min={10}
          max={14}
          unit="ft"
          hint="10/12/14 ft"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComputedField
          label="Number of bays"
          value={`${s.numberOfBays}`}
          hint="Calculated: length / bay spacing"
        />
        <ComputedField
          label="Peak height"
          value={`${s.peakHeightFt.toFixed(1)} ft`}
          hint="Calculated: eave + (width / 2) × roof slope"
        />
      </div>

      <ToggleGroup
        label="Stories"
        value={s.stories}
        onChange={(v) => patchShell({ stories: v as 1 | 2 })}
        options={[
          {
            value: 1,
            label: "Single-story",
            desc: "Ground floor only",
          },
          {
            value: 2,
            label: "Two-story",
            desc: "Adds upper floor + heavier engineering",
          },
        ]}
        columns={2}
      />

      <CheckboxInput
        label="Clear-span trusses (no interior support columns)"
        checked={s.clearSpan}
        onChange={(v) => patchShell({ clearSpan: v })}
        hint="GNP's signature: open floor plan with no center posts. Adds a per-sqft premium; required for the wide-open great-room look."
      />
    </div>
  );
}
