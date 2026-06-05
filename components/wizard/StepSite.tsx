"use client";

import { useMemo } from "react";

import {
  ComputedField,
  Field,
  NumberInput,
  ToggleGroup,
} from "@/components/ui/inputs";
import { DISCLAIMERS } from "@/lib/config/disclaimer";
import { COUNTY_WIND_TABLE } from "@/lib/config/wind-speeds";
import { siteHazardService } from "@/lib/services/site-hazard";
import type {
  EnclosureClassification,
  ExposureCategory,
  RiskCategory,
} from "@/lib/types/building-config";

import { useWizard } from "./WizardProvider";

// ──────────────────────────────────────────────────────────────────────────
// Static option lists
// ──────────────────────────────────────────────────────────────────────────

const STATE_OPTIONS = Array.from(
  new Set(COUNTY_WIND_TABLE.map((e) => e.state)),
).sort();

const EXPOSURE_OPTIONS: {
  value: ExposureCategory;
  label: string;
  desc: string;
}[] = [
  { value: "B", label: "B", desc: "Urban / suburban / wooded — sheltered" },
  { value: "C", label: "C", desc: "Open terrain — most common default" },
  { value: "D", label: "D", desc: "Coastal flats / open water" },
];

const RISK_OPTIONS: {
  value: RiskCategory;
  label: string;
  desc: string;
}[] = [
  { value: "I", label: "I", desc: "Low hazard (minor storage)" },
  { value: "II", label: "II", desc: "Standard residential / ag" },
  { value: "III", label: "III", desc: "Substantial hazard (assembly)" },
  { value: "IV", label: "IV", desc: "Essential (hospitals, EOC)" },
];

const ENCLOSURE_OPTIONS: {
  value: EnclosureClassification;
  label: string;
  desc: string;
}[] = [
  {
    value: "enclosed",
    label: "Enclosed",
    desc: "Standard — finished walls all around",
  },
  {
    value: "partially-enclosed",
    label: "Partially enclosed",
    desc: "≥1 wall has large openings (≥1% area)",
  },
  {
    value: "open",
    label: "Open",
    desc: "No walls (carport / hay barn)",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Local text-input helper — keeps step body readable.
// (Not promoted to inputs.tsx yet — used only here.)
// ──────────────────────────────────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <Field label={required ? `${label} *` : label} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
      />
    </Field>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// StepSite
// ──────────────────────────────────────────────────────────────────────────

export function StepSite() {
  const { config, patchSite, patchCustomer } = useWizard();
  const s = config.site;
  const cust = config.customer;

  // Counties available for the currently selected state (alpha-sorted).
  const stateCounties = useMemo(
    () =>
      COUNTY_WIND_TABLE.filter((e) => e.state === s.state)
        .map((e) => e.county)
        .sort(),
    [s.state],
  );

  // Lookup metadata for the inline "matched / default / override" indicator.
  const lookup = useMemo(
    () =>
      siteHazardService.lookup({ state: s.state, county: s.county }),
    [s.state, s.county],
  );

  // When the county changes, refresh the wind speed from the lookup.
  // User can still override after by editing the wind-speed input directly.
  const handleCountyChange = (county: string) => {
    const next = siteHazardService.lookup({ state: s.state, county });
    patchSite({ county, designWindSpeedMph: next.windSpeedMph });
  };

  // When the state changes, clear county so the user re-picks from the new
  // list — and refresh wind speed.
  const handleStateChange = (state: string) => {
    const upper = state.toUpperCase();
    patchSite({
      state: upper,
      county: "",
      designWindSpeedMph: siteHazardService.lookup({
        state: upper,
        county: "",
      }).windSpeedMph,
    });
  };

  const usingCustomCounty =
    !!s.county &&
    s.state !== "OTHER" &&
    !stateCounties.includes(s.county) &&
    s.county !== "__custom__";

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">
        Site address + engineering parameters. Plans are sealed
        site-specifically, so accuracy here matters — wind exposure and county
        drive the structural calc.
      </p>

      {/* ── Build address ───────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Build address</h3>

        <TextField
          label="Street address"
          value={s.siteAddress}
          onChange={(v) => patchSite({ siteAddress: v })}
          placeholder="123 Main St."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TextField
            label="City"
            value={s.city}
            onChange={(v) => patchSite({ city: v })}
          />
          <Field label="State">
            <select
              value={s.state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            >
              {STATE_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="County">
            <select
              value={
                usingCustomCounty
                  ? "__custom__"
                  : s.county || ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom__") {
                  patchSite({ county: "" });
                } else {
                  handleCountyChange(v);
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            >
              <option value="">— Select —</option>
              {stateCounties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">Other (not listed)</option>
            </select>
          </Field>
          <TextField
            label="ZIP"
            value={s.zip}
            onChange={(v) => patchSite({ zip: v })}
            placeholder="33901"
          />
        </div>

        {/* Manual county input when county is unlisted */}
        {(usingCustomCounty ||
          (s.state !== "OTHER" && s.county === "" && stateCounties.length === 0)) && (
          <TextField
            label="Custom county name"
            value={s.county}
            onChange={(v) => patchSite({ county: v })}
            placeholder="e.g. Polk"
            hint="Enter exactly — the PE uses this for the site-specific wind lookup."
          />
        )}

        {/* Lookup-source indicator */}
        {s.county && (
          <div className="text-xs text-zinc-500">
            {lookup.source === "county-table" && (
              <>
                <span className="text-amber-500">●</span> Wind speed auto-filled
                from county table ({lookup.region}
                {lookup.notes ? ` · ${lookup.notes}` : ""}).
              </>
            )}
            {lookup.source === "default" && (
              <>
                <span className="text-zinc-500">●</span> Wind speed using
                default ({lookup.windSpeedMph} mph) — outside primary service
                region. PE will verify.
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Design wind speed ───────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">
          Design wind speed
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Wind speed"
            unit="mph"
            min={90}
            max={200}
            step={5}
            value={s.designWindSpeedMph}
            onChange={(v) => patchSite({ designWindSpeedMph: v })}
            hint="Auto-filled from county; override if PE specifies"
          />
          <ComputedField
            label="Mean roof height"
            value={`${s.meanRoofHeightFt.toFixed(1)} ft`}
            hint="Calculated: (eave + peak) / 2"
          />
        </div>
        {s.designWindSpeedMph >= 160 && (
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
            <strong className="text-amber-300">High-wind zone.</strong>{" "}
            ≥160 mph triggers the high-wind engineering premium (~5% on PE
            fee, baked into the live quote).
          </div>
        )}
      </section>

      {/* ── Engineering parameters ──────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-zinc-100">
          Engineering parameters
        </h3>
        <p className="text-xs text-zinc-500">
          Leave at defaults unless the PE or building official specifies
          different.
        </p>

        <ToggleGroup
          label="Exposure category"
          value={s.exposureCategory}
          onChange={(v) =>
            patchSite({ exposureCategory: v as ExposureCategory })
          }
          options={EXPOSURE_OPTIONS}
        />

        <ToggleGroup
          label="Risk category"
          value={s.riskCategory}
          onChange={(v) => patchSite({ riskCategory: v as RiskCategory })}
          options={RISK_OPTIONS}
          columns={4}
        />

        <ToggleGroup
          label="Enclosure classification"
          value={s.enclosureClassification}
          onChange={(v) =>
            patchSite({
              enclosureClassification: v as EnclosureClassification,
            })
          }
          options={ENCLOSURE_OPTIONS}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Ground snow load"
            unit="psf"
            min={0}
            max={100}
            value={s.groundSnowLoadPsf}
            onChange={(v) => patchSite({ groundSnowLoadPsf: v })}
            hint="0 for most FL builds"
          />
          <NumberInput
            label="Soil bearing (optional)"
            unit="psf"
            min={0}
            max={10000}
            step={100}
            value={s.soilBearingPsf ?? 0}
            onChange={(v) =>
              patchSite({ soilBearingPsf: v > 0 ? v : undefined })
            }
            hint="From soil report, if you have one"
          />
        </div>
      </section>

      {/* ── Customer contact ────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-100">Your contact</h3>
        <p className="text-xs text-zinc-500">
          For follow-up after engineering review. Email is preferred for the
          submittal confirmation.
        </p>

        <TextField
          label="Full name"
          required
          value={cust.name}
          onChange={(v) => patchCustomer({ name: v })}
          placeholder="First and last"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Email"
            type="email"
            value={cust.email ?? ""}
            onChange={(v) =>
              patchCustomer({ email: v || undefined })
            }
            placeholder="you@example.com"
            hint="For submittal confirmation"
          />
          <TextField
            label="Phone"
            type="tel"
            value={cust.phone ?? ""}
            onChange={(v) =>
              patchCustomer({ phone: v || undefined })
            }
            placeholder="(352) 555-0100"
          />
        </div>
      </section>

      {/* Engineering disclaimer */}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90 leading-relaxed">
        <strong className="text-amber-300">Engineering review required.</strong>{" "}
        {DISCLAIMERS.ENGINEERING}
      </div>
    </div>
  );
}
