"use client";

import { NumberInput, ToggleGroup } from "@/components/ui/inputs";
import type {
  RoofMaterial,
  RoofPitch,
  RoofProfile,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const PROFILES: { value: RoofProfile; label: string; desc?: string }[] = [
  {
    value: "gable",
    label: "Gable",
    desc: "Classic peaked roof — most common",
  },
  {
    value: "single-slope",
    label: "Single-slope",
    desc: "Shed-style; modern look, lower cost",
  },
  {
    value: "gambrel",
    label: "Gambrel",
    desc: "Barn-style; double-pitch sides",
  },
  {
    value: "monitor",
    label: "Monitor",
    desc: "Raised center with side wings",
  },
];

const PITCHES: RoofPitch[] = [
  "3:12",
  "4:12",
  "5:12",
  "6:12",
  "7:12",
  "8:12",
  "9:12",
  "10:12",
  "11:12",
  "12:12",
];

const MATERIALS: { value: RoofMaterial; label: string; desc?: string }[] = [
  {
    value: "standing-seam-metal",
    label: "Standing-seam metal",
    desc: "Premium; no exposed fasteners",
  },
  {
    value: "exposed-fastener-metal",
    label: "Exposed-fastener metal",
    desc: "Workhorse; lower cost",
  },
  {
    value: "shingle",
    label: "Architectural shingle",
    desc: "Residential look (cheapest)",
  },
];

export function StepRoof() {
  const { config, patchRoof } = useWizard();
  const r = config.roof;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Profile, pitch, and material drive both the look and the structural
        load. Steeper pitch = more roof area + more wind exposure.
      </p>

      <ToggleGroup
        label="Roof profile"
        value={r.profile}
        onChange={(v) => patchRoof({ profile: v as RoofProfile })}
        options={PROFILES}
      />

      <ToggleGroup
        label="Roof pitch (rise : run)"
        value={r.pitch}
        onChange={(v) => patchRoof({ pitch: v as RoofPitch })}
        options={PITCHES.map((p) => ({ value: p, label: p }))}
        columns={5}
      />

      <ToggleGroup
        label="Roof material"
        value={r.material}
        onChange={(v) => patchRoof({ material: v as RoofMaterial })}
        options={MATERIALS}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput
          label="Eave overhang"
          value={r.eaveOverhangIn}
          onChange={(v) => patchRoof({ eaveOverhangIn: v })}
          min={0}
          max={36}
          unit="in"
          hint="Along the eave (length) walls"
        />
        <NumberInput
          label="Gable overhang"
          value={r.gableOverhangIn}
          onChange={(v) => patchRoof({ gableOverhangIn: v })}
          min={0}
          max={36}
          unit="in"
          hint="Along the gable (width) walls"
        />
      </div>
    </div>
  );
}
