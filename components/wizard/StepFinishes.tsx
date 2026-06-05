"use client";

import {
  CheckboxInput,
  ColorInput,
  ToggleGroup,
} from "@/components/ui/inputs";
import type {
  InsulationType,
  SidingType,
} from "@/lib/types/building-config";
import { useWizard } from "./WizardProvider";

const SIDING_TYPES: { value: SidingType; label: string; desc?: string }[] = [
  {
    value: "vertical-metal",
    label: "Vertical metal",
    desc: "Standard ribbed steel panels",
  },
  {
    value: "board-and-batten",
    label: "Board & batten",
    desc: "Vertical boards with cover strips (residential look)",
  },
  {
    value: "wood-cedar-accent",
    label: "Wood / cedar accent",
    desc: "Premium cedar / wood siding (often used as accents)",
  },
];

const INSULATION_TYPES: {
  value: InsulationType;
  label: string;
  desc?: string;
}[] = [
  {
    value: "none",
    label: "None",
    desc: "Bare metal interior (ag/storage)",
  },
  {
    value: "vinyl-faced-fiberglass",
    label: "Vinyl-faced fiberglass",
    desc: "Standard insulation under metal",
  },
  {
    value: "spray-foam",
    label: "Spray foam",
    desc: "Closed-cell; air-seals + R-7/inch",
  },
  {
    value: "imp",
    label: "IMP panels",
    desc: "Insulated metal panels (premium)",
  },
];

const COLOR_PRESETS = [
  "Charcoal",
  "Black",
  "White",
  "Cream",
  "Burnished Slate",
  "Barn Red",
  "Forest Green",
  "Galvalume",
  "Cedar",
];

const ACCENT_LOCATION_PRESETS = [
  "Gable ends",
  "Porch posts",
  "Entry wall",
  "Wainscot",
  "Trim",
];

export function StepFinishes() {
  const { config, patchExteriorFinish } = useWizard();
  const f = config.exteriorFinish;

  const toggleAccentLocation = (loc: string) => {
    const current = f.cedarAccentLocations ?? [];
    const next = current.includes(loc)
      ? current.filter((x) => x !== loc)
      : [...current, loc];
    patchExteriorFinish({ cedarAccentLocations: next });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Siding material, color palette, and insulation. Colors accept any
        named color — the presets below are common GNP picks.
      </p>

      <ToggleGroup
        label="Siding type"
        value={f.sidingType}
        onChange={(v) => patchExteriorFinish({ sidingType: v as SidingType })}
        options={SIDING_TYPES}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ColorInput
          label="Siding color"
          value={f.sidingColor}
          onChange={(v) => patchExteriorFinish({ sidingColor: v })}
          presets={COLOR_PRESETS}
        />
        <ColorInput
          label="Trim color"
          value={f.trimColor}
          onChange={(v) => patchExteriorFinish({ trimColor: v })}
          presets={COLOR_PRESETS}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Cedar accents"
          checked={f.cedarAccents}
          onChange={(v) =>
            patchExteriorFinish({
              cedarAccents: v,
              cedarAccentLocations: v ? (f.cedarAccentLocations ?? []) : [],
            })
          }
          hint="Real cedar accent pieces (gable ends, porch posts, etc.) — adds warmth to the metal look."
        />

        {f.cedarAccents && (
          <div className="ml-7">
            <div className="text-sm font-medium text-zinc-300 mb-2">
              Where (toggle the spots that get cedar):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_LOCATION_PRESETS.map((loc) => {
                const active = (f.cedarAccentLocations ?? []).includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleAccentLocation(loc)}
                    className={[
                      "px-3 py-1.5 text-xs rounded-full transition-colors",
                      active
                        ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ToggleGroup
        label="Insulation"
        value={f.insulation}
        onChange={(v) =>
          patchExteriorFinish({ insulation: v as InsulationType })
        }
        options={INSULATION_TYPES}
      />
    </div>
  );
}
