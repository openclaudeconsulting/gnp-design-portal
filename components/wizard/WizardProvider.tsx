"use client";

/**
 * Wizard state — the BuildingConfig + step index, plus derived live quote.
 *
 * Every step is a client component that reads from / writes to this context.
 * The `derive()` helper keeps internal-consistency fields (peakHeightFt,
 * numberOfBays, meanRoofHeightFt) in sync on every change.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type BuildingConfig,
  DEFAULT_BUILDING_CONFIG,
} from "@/lib/types/building-config";
import {
  buildQuote,
  type QuoteBreakdown,
} from "@/lib/services/quote-engine";

// ──────────────────────────────────────────────────────────────────────────
// Step list (single source of truth for the wizard chrome)
// ──────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { id: "shell",      label: "Shell" },
  { id: "roof",       label: "Roof" },
  { id: "foundation", label: "Foundation" },
  { id: "openings",   label: "Openings" },
  { id: "additions",  label: "Additions" },
  { id: "interior",   label: "Interior" },
  { id: "finishes",   label: "Finishes" },
  { id: "site",       label: "Site" },
  { id: "review",     label: "Review" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

// ──────────────────────────────────────────────────────────────────────────
// Derived-field maintenance
// ──────────────────────────────────────────────────────────────────────────

/**
 * Recompute fields whose value follows from other inputs:
 *  - peakHeightFt   = eaveHeight + (width / 2) × roof slope
 *  - numberOfBays   = round(length / baySpacing)
 *  - meanRoofHeight = (eave + peak) / 2  (used by the wind-load calc)
 *
 * Keeps the BuildingConfig internally consistent so the quote engine and the
 * eventual PE submittal never read stale derived values.
 */
function derive(c: BuildingConfig): BuildingConfig {
  const [rise, run] = c.roof.pitch.split(":").map(Number);
  const slope = rise / Math.max(1, run);
  const peakHeightFt = +(
    c.shell.eaveHeightFt +
    (c.shell.widthFt / 2) * slope
  ).toFixed(1);
  const numberOfBays = Math.max(
    1,
    Math.round(c.shell.lengthFt / Math.max(1, c.shell.baySpacingFt)),
  );
  const meanRoofHeightFt = +(
    (c.shell.eaveHeightFt + peakHeightFt) /
    2
  ).toFixed(1);
  return {
    ...c,
    shell: { ...c.shell, peakHeightFt, numberOfBays },
    site: { ...c.site, meanRoofHeightFt },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────────────────

interface WizardContextValue {
  config: BuildingConfig;
  setConfig: (
    updater: BuildingConfig | ((prev: BuildingConfig) => BuildingConfig),
  ) => void;
  /** Convenience patch helpers — keep per-section updates concise in steps. */
  patchShell:          (patch: Partial<BuildingConfig["shell"]>) => void;
  patchRoof:           (patch: Partial<BuildingConfig["roof"]>) => void;
  patchFoundation:     (patch: Partial<BuildingConfig["foundation"]>) => void;
  patchOpenings:       (patch: Partial<BuildingConfig["openings"]>) => void;
  patchAdditions:      (patch: Partial<BuildingConfig["additions"]>) => void;
  patchInterior:       (patch: Partial<BuildingConfig["interior"]>) => void;
  patchExteriorFinish: (patch: Partial<BuildingConfig["exteriorFinish"]>) => void;
  patchSite:           (patch: Partial<BuildingConfig["site"]>) => void;
  patchCustomer:       (patch: Partial<BuildingConfig["customer"]>) => void;
  /** Live, memoized quote. */
  quote: QuoteBreakdown;
  stepIndex: number;
  setStepIndex: (i: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  steps: typeof STEPS;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<BuildingConfig>(() =>
    derive(DEFAULT_BUILDING_CONFIG),
  );
  const [stepIndex, setStepIndex] = useState(0);

  const setConfig = useCallback<WizardContextValue["setConfig"]>((updater) => {
    setConfigState((prev) => {
      const next =
        typeof updater === "function"
          ? (updater as (p: BuildingConfig) => BuildingConfig)(prev)
          : updater;
      return derive(next);
    });
  }, []);

  // Section patchers — all follow the same pattern: merge a partial into the
  // matching sub-object.
  const patchShell = useCallback(
    (patch: Partial<BuildingConfig["shell"]>) => {
      setConfig((c) => ({ ...c, shell: { ...c.shell, ...patch } }));
    },
    [setConfig],
  );
  const patchRoof = useCallback(
    (patch: Partial<BuildingConfig["roof"]>) => {
      setConfig((c) => ({ ...c, roof: { ...c.roof, ...patch } }));
    },
    [setConfig],
  );
  const patchFoundation = useCallback(
    (patch: Partial<BuildingConfig["foundation"]>) => {
      setConfig((c) => ({
        ...c,
        foundation: { ...c.foundation, ...patch },
      }));
    },
    [setConfig],
  );
  const patchOpenings = useCallback(
    (patch: Partial<BuildingConfig["openings"]>) => {
      setConfig((c) => ({ ...c, openings: { ...c.openings, ...patch } }));
    },
    [setConfig],
  );
  const patchAdditions = useCallback(
    (patch: Partial<BuildingConfig["additions"]>) => {
      setConfig((c) => ({ ...c, additions: { ...c.additions, ...patch } }));
    },
    [setConfig],
  );
  const patchInterior = useCallback(
    (patch: Partial<BuildingConfig["interior"]>) => {
      setConfig((c) => ({ ...c, interior: { ...c.interior, ...patch } }));
    },
    [setConfig],
  );
  const patchExteriorFinish = useCallback(
    (patch: Partial<BuildingConfig["exteriorFinish"]>) => {
      setConfig((c) => ({
        ...c,
        exteriorFinish: { ...c.exteriorFinish, ...patch },
      }));
    },
    [setConfig],
  );
  const patchSite = useCallback(
    (patch: Partial<BuildingConfig["site"]>) => {
      setConfig((c) => ({ ...c, site: { ...c.site, ...patch } }));
    },
    [setConfig],
  );
  const patchCustomer = useCallback(
    (patch: Partial<BuildingConfig["customer"]>) => {
      setConfig((c) => ({ ...c, customer: { ...c.customer, ...patch } }));
    },
    [setConfig],
  );

  const quote = useMemo(() => buildQuote(config), [config]);

  const nextStep = useCallback(
    () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1)),
    [],
  );
  const prevStep = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  return (
    <WizardContext.Provider
      value={{
        config,
        setConfig,
        patchShell,
        patchRoof,
        patchFoundation,
        patchOpenings,
        patchAdditions,
        patchInterior,
        patchExteriorFinish,
        patchSite,
        patchCustomer,
        quote,
        stepIndex,
        setStepIndex,
        nextStep,
        prevStep,
        steps: STEPS,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard() must be used inside <WizardProvider>");
  }
  return ctx;
}
