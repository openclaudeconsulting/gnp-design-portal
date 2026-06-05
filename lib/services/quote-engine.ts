/**
 * Quote engine — pure function: BuildingConfig → QuoteBreakdown.
 *
 * Reads pricing constants from lib/config/pricing.config.ts and the matched
 * region from lib/services/site-hazard.ts. Returns an itemized breakdown +
 * a ballpark LOW–HIGH range.
 *
 * NEVER present the result as a firm contract price. See DISCLAIMERS.QUOTE.
 */

import { PRICING } from "@/lib/config/pricing.config";
import { siteHazardService } from "@/lib/services/site-hazard";
import type { BuildingConfig } from "@/lib/types/building-config";

export interface QuoteLineItem {
  label: string;
  amount: number;
  notes?: string;
}

export interface QuoteBreakdown {
  lineItems: QuoteLineItem[];
  subtotal: number;
  regionMultiplier: number;
  region: string;
  adjustedSubtotal: number;
  ballparkLow: number;
  ballparkHigh: number;
  windSpeedMph: number;
}

export function buildQuote(config: BuildingConfig): QuoteBreakdown {
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;
  const items: QuoteLineItem[] = [];

  // ─── Shell ──────────────────────────────────────────────────────
  const shellPerSqFt =
    config.shell.stories === 2
      ? PRICING.STEEL_PER_SQFT_2STORY
      : PRICING.STEEL_PER_SQFT_1STORY;
  let shellCost = shellPerSqFt * footprintSqFt * config.shell.stories;
  if (config.shell.clearSpan) {
    shellCost += PRICING.CLEAR_SPAN_PREMIUM_PER_SQFT * footprintSqFt;
  }
  items.push({
    label: `Steel shell (${config.shell.widthFt}×${config.shell.lengthFt}×${config.shell.eaveHeightFt}, ${config.shell.stories}-story)`,
    amount: round(shellCost),
  });

  // ─── Roof ───────────────────────────────────────────────────────
  const pitchFactor = PRICING.PITCH_TO_ROOF_FACTOR[config.roof.pitch] ?? 1.083;
  const roofSqFt = footprintSqFt * pitchFactor;
  const roofRate =
    config.roof.material === "standing-seam-metal"
      ? PRICING.ROOF_STANDING_SEAM_PER_SQFT
      : config.roof.material === "exposed-fastener-metal"
        ? PRICING.ROOF_EXPOSED_FASTENER_PER_SQFT
        : PRICING.ROOF_SHINGLE_PER_SQFT;
  items.push({
    label: `Roof (${config.roof.material}, ${config.roof.pitch})`,
    amount: round(roofRate * roofSqFt),
  });

  // ─── Foundation ─────────────────────────────────────────────────
  if (config.foundation.type === "slab") {
    const slabRate =
      config.foundation.slabThicknessIn === 6
        ? PRICING.SLAB_6IN_PER_SQFT
        : PRICING.SLAB_4IN_PER_SQFT;
    let slabCost = slabRate * footprintSqFt;
    if (config.foundation.concretePsi === 4000) {
      slabCost += PRICING.CONCRETE_4000_PSI_UPCHARGE_PER_SQFT * footprintSqFt;
    }
    if (config.foundation.thickenedEdges) {
      const perimeter = 2 * (config.shell.widthFt + config.shell.lengthFt);
      slabCost += PRICING.THICKENED_EDGES_PER_LINEAR_FT * perimeter;
    }
    items.push({
      label: `Slab (${config.foundation.slabThicknessIn}", ${config.foundation.concretePsi} PSI)`,
      amount: round(slabCost),
    });
  } else if (config.foundation.type === "crawlspace") {
    items.push({
      label: "Crawlspace foundation",
      amount: round(PRICING.CRAWLSPACE_PER_SQFT * footprintSqFt),
    });
  } else {
    items.push({
      label: "Stem wall foundation",
      amount: round(PRICING.STEM_WALL_PER_SQFT * footprintSqFt),
    });
  }

  // ─── Openings ───────────────────────────────────────────────────
  let openingsCost = 0;
  for (const d of config.openings.overheadDoors) {
    const sqFt = d.widthFt * d.heightFt;
    openingsCost +=
      PRICING.OVERHEAD_DOOR_BASE +
      Math.max(0, sqFt - 100) * PRICING.OVERHEAD_DOOR_PER_SQFT_PREMIUM;
  }
  for (const d of config.openings.entryDoors) {
    openingsCost +=
      PRICING.ENTRY_DOOR_BASE +
      (d.type === "double" || d.type === "french-double"
        ? PRICING.ENTRY_DOOR_DOUBLE_PREMIUM
        : 0);
  }
  for (const w of config.openings.windows) {
    const sqFt = w.widthFt * w.heightFt;
    openingsCost +=
      sqFt *
      (w.type === "two-story-wall"
        ? PRICING.WINDOW_TWO_STORY_WALL_PER_SQFT
        : PRICING.WINDOW_PER_SQFT);
  }
  if (openingsCost > 0) {
    items.push({
      label: `Openings (${config.openings.overheadDoors.length} OH doors, ${config.openings.entryDoors.length} entry, ${config.openings.windows.length} windows)`,
      amount: round(openingsCost),
    });
  }

  // ─── Additions ──────────────────────────────────────────────────
  let additionsCost = 0;
  for (const p of config.additions.porches) {
    const rate =
      p.type === "covered-porch"
        ? PRICING.PORCH_PER_SQFT
        : p.type === "lean-to"
          ? PRICING.LEAN_TO_PER_SQFT
          : PRICING.CARPORT_PER_SQFT;
    additionsCost += rate * p.widthFt * p.depthFt;
    if (p.postStyle === "timber-on-stone-base") {
      const numPosts = Math.max(2, Math.ceil(p.widthFt / 10) + 1);
      additionsCost += PRICING.TIMBER_ON_STONE_POST_UPCHARGE * numPosts;
    }
  }
  if (config.additions.mezzanine.enabled) {
    additionsCost += PRICING.MEZZANINE_PER_SQFT * config.additions.mezzanine.areaSqFt;
  }
  if (additionsCost > 0) {
    items.push({
      label: `Additions (${config.additions.porches.length} porch/lean-to, mezzanine: ${config.additions.mezzanine.enabled ? "yes" : "no"})`,
      amount: round(additionsCost),
    });
  }

  // ─── Interior finish ────────────────────────────────────────────
  if (config.interior.heatedSqFt > 0) {
    let interiorCost =
      PRICING.RESIDENTIAL_FINISH_PER_HEATED_SQFT * config.interior.heatedSqFt;
    interiorCost += PRICING.BATHROOM_BASE * config.interior.bathrooms;
    if (config.interior.vaultedCeiling) {
      interiorCost +=
        PRICING.VAULTED_CEILING_PREMIUM_PER_SQFT * config.interior.heatedSqFt;
    }
    items.push({
      label: `Interior residential finish (${config.interior.heatedSqFt} sqft, ${config.interior.bedrooms} BR / ${config.interior.bathrooms} BA)`,
      amount: round(interiorCost),
    });
  }

  // ─── Exterior finish ────────────────────────────────────────────
  const wallSqFt =
    2 * (config.shell.widthFt + config.shell.lengthFt) * config.shell.eaveHeightFt;
  const sidingRate =
    config.exteriorFinish.sidingType === "vertical-metal"
      ? PRICING.SIDING_VERTICAL_METAL_PER_SQFT
      : config.exteriorFinish.sidingType === "board-and-batten"
        ? PRICING.SIDING_BOARD_AND_BATTEN_PER_SQFT
        : PRICING.SIDING_WOOD_CEDAR_ACCENT_PER_SQFT;
  let exteriorCost = sidingRate * wallSqFt;
  if (config.exteriorFinish.cedarAccents) {
    exteriorCost += PRICING.CEDAR_ACCENT_LUMP_SUM;
  }
  if (config.exteriorFinish.insulation !== "none") {
    const insulationRate =
      config.exteriorFinish.insulation === "vinyl-faced-fiberglass"
        ? PRICING.INSULATION_VINYL_FACED_FIBERGLASS_PER_SQFT
        : config.exteriorFinish.insulation === "spray-foam"
          ? PRICING.INSULATION_SPRAY_FOAM_PER_SQFT
          : PRICING.INSULATION_IMP_PER_SQFT;
    exteriorCost += insulationRate * (wallSqFt + footprintSqFt);
  }
  items.push({
    label: `Exterior finish (${config.exteriorFinish.sidingType}, ${config.exteriorFinish.insulation} insulation)`,
    amount: round(exteriorCost),
  });

  // ─── Engineering (PE seal) ──────────────────────────────────────
  let engineeringFee =
    PRICING.ENGINEERING_FEE_BASE + PRICING.ENGINEERING_FEE_PER_SQFT * footprintSqFt;
  if ((config.site?.designWindSpeedMph ?? 0) >= 160) {
    engineeringFee *= 1 + PRICING.WIND_PREMIUM_OVER_160MPH_PCT;
  }
  items.push({
    label: `Engineering fee (PE seal, site-specific)`,
    amount: round(engineeringFee),
    notes: "Final fee confirmed by PE.",
  });

  // ─── Subtotal + region multiplier + ballpark range ──────────────
  const subtotal = items.reduce((s, it) => s + it.amount, 0);

  const region =
    config.site?.state && config.site?.county
      ? siteHazardService.lookup({
          state: config.site.state,
          county: config.site.county,
        }).region
      : "Other";
  const regionMultiplier =
    PRICING.REGION_MULTIPLIER[region] ?? PRICING.REGION_MULTIPLIER.Other;

  const adjustedSubtotal = subtotal * regionMultiplier;
  const ballparkLow = round(adjustedSubtotal * PRICING.BALLPARK_LOW_FACTOR);
  const ballparkHigh = round(adjustedSubtotal * PRICING.BALLPARK_HIGH_FACTOR);

  return {
    lineItems: items,
    subtotal: round(subtotal),
    regionMultiplier,
    region,
    adjustedSubtotal: round(adjustedSubtotal),
    ballparkLow,
    ballparkHigh,
    windSpeedMph: config.site?.designWindSpeedMph ?? 0,
  };
}

function round(n: number): number {
  return Math.round(n);
}
