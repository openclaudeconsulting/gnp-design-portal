"use client";

import {
  CheckboxInput,
  ComputedField,
  NumberInput,
  ToggleGroup,
} from "@/components/ui/inputs";
import { getEnclosureSummary } from "@/lib/services/enclosure-utils";

import { useWizard } from "./WizardProvider";

export function StepShell() {
  const { config, patchShell, setConfig } = useWizard();
  const s = config.shell;
  const f = config.foundation;

  const summary = getEnclosureSummary(s.bayEnclosures);
  const preset: "all" | "none" | "custom" = summary.fullyEnclosed
    ? "all"
    : summary.fullyOpen
      ? "none"
      : "custom";

  // "Barndominium package" = fully enclosed + a concrete slab. The CTA
  // is hidden when the customer is already in that state.
  const isBarndominium =
    summary.fullyEnclosed && f.type === "slab";

  const convertToBarndominium = () => {
    setConfig((c) => ({
      ...c,
      shell: {
        ...c.shell,
        bayEnclosures: Array(c.shell.numberOfBays).fill(true),
      },
      foundation: {
        ...c.foundation,
        type: "slab",
      },
    }));
  };

  const setAllEnclosed = (enclosed: boolean) =>
    patchShell({ bayEnclosures: Array(s.numberOfBays).fill(enclosed) });

  const toggleBay = (i: number) => {
    const next = [...s.bayEnclosures];
    next[i] = !next[i];
    patchShell({ bayEnclosures: next });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Overall building dimensions and structural strategy. Width is capped at
        80 ft (above that, the steel truss spec jumps tiers).
      </p>

      {/* ── Convert-to-barndominium preset ────────────────────── */}
      {!isBarndominium && (
        <button
          type="button"
          onClick={convertToBarndominium}
          className="w-full text-left rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400 px-4 py-3 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-amber-200">
                Convert to Barndominium
              </div>
              <div className="text-xs text-amber-100/70 mt-0.5">
                Enclose every bay with walls + add a 4&quot; concrete slab
                foundation in one click. Fine-tune below after.
              </div>
            </div>
            <div className="text-amber-300 text-xl font-light shrink-0">→</div>
          </div>
        </button>
      )}

      {/* ── Enclosure preset (primary price driver) ─────────────── */}
      <ToggleGroup
        label="Wall enclosure"
        value={preset}
        onChange={(v) => {
          if (v === "all") setAllEnclosed(true);
          else if (v === "none") setAllEnclosed(false);
          // "custom" — leave bayEnclosures as-is; customer toggles bays below
        }}
        options={[
          {
            value: "all",
            label: "All enclosed",
            desc: "Walls around every bay — barndominium / workshop / garage ($14/sqft)",
          },
          {
            value: "none",
            label: "All open",
            desc: "Roof only, no walls anywhere — ag / equipment / hay cover ($6.55-$7.50/sqft)",
          },
          {
            value: "custom",
            label: "Custom (mixed)",
            desc: "Pick bay-by-bay below — some enclosed, some open",
          },
        ]}
        columns={3}
      />

      {/* ── Per-bay picker ─────────────────────────────────────── */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950/40 px-4 py-3">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm font-medium text-zinc-300">
            Bays ({summary.closedCount} of {summary.total} enclosed)
          </div>
          <div className="text-xs text-zinc-500">
            Click any bay to toggle enclosed / open
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-1.5">
          {s.bayEnclosures.map((enclosed, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleBay(i)}
              className={[
                "px-2 py-2 rounded-md text-xs font-medium border transition-colors text-left",
                enclosed
                  ? "border-amber-500 bg-amber-500/10 text-amber-100 ring-1 ring-amber-500/30"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600",
              ].join(" ")}
            >
              <div className="font-mono text-[10px] text-zinc-500">
                Bay {i + 1}
              </div>
              <div className="mt-0.5">{enclosed ? "Enclosed" : "Open"}</div>
            </button>
          ))}
        </div>
        {summary.mixed && (
          <p className="mt-2 text-[11px] text-zinc-500">
            Mixed enclosure — quote pro-rates by bay count. Interior dividing
            walls are added wherever an enclosed bay meets an open one.
          </p>
        )}
      </div>

      {/* ── Dimensions ────────────────────────────────────────── */}
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
            desc: "Adds upper floor + heavier engineering (×1.75 base)",
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

      {summary.fullyOpen && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
          <strong className="text-amber-300">All-open pole barn.</strong>{" "}
          Roof sheets and labor to install them are included in the base
          building rate. Siding, insulation, and interior finish steps will
          not affect the quote (no walls to put them on).
        </div>
      )}
    </div>
  );
}
