/**
 * Quote engine — pure function: BuildingConfig → QuoteBreakdown.
 *
 * Reads pricing constants from lib/config/pricing.config.ts and the matched
 * region from lib/services/site-hazard.ts. Returns an itemized breakdown +
 * a ballpark LOW–HIGH range.
 *
 * Pricing model (see pricing.config.ts header for the full rationale):
 *   - One BASE BUILDING line item bundles kit + labor + ROOF.
 *     - Open: tiered $6.55-$7.50/sqft of footprint
 *     - Enclosed: $14/sqft of footprint (includes walls + roof)
 *   - Roof MATERIAL upgrades (standing-seam, shingle) add a per-sqft
 *     premium over the bundled exposed-fastener default — not a separate
 *     base price.
 *   - Siding MATERIAL upgrades (board-and-batten, wood-cedar) add a
 *     per-sqft wall-area premium over the bundled vertical-metal default.
 *     Only applied when shell.enclosed = true.
 *   - Insulation only applies when shell.enclosed = true.
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
  const wallSqFt =
    2 * (config.shell.widthFt + config.shell.lengthFt) *
    config.shell.eaveHeightFt;
  const items: QuoteLineItem[] = [];

  // ─── Base building (kit + labor + roof, plus walls if enclosed) ──
  const enclosed = config.shell.enclosed;
  let baseRate: number;
  if (enclosed) {
    baseRate = PRICING.ENCLOSED_BUILDING_PER_SQFT;
  } else {
    if (config.shell.widthFt <= 40) {
      baseRate = PRICING.OPEN_BUILDING_PER_SQFT_SMALL;
    } else if (config.shell.widthFt <= 60) {
      baseRate = PRICING.OPEN_BUILDING_PER_SQFT_MEDIUM;
    } else {
      baseRate = PRICING.OPEN_BUILDING_PER_SQFT_LARGE;
    }
  }
  let buildingCost = baseRate * footprintSqFt;
  if (config.shell.stories === 2) {
    buildingCost *= PRICING.TWO_STORY_MULTIPLIER;
  }
  if (config.shell.clearSpan) {
    buildingCost += PRICING.CLEAR_SPAN_PREMIUM_PER_SQFT * footprintSqFt;
  }
  items.push({
    label: enclosed
      ? `Enclosed building (${config.shell.widthFt}×${config.shell.lengthFt}×${config.shell.eaveHeightFt}, ${config.shell.stories}-story — kit + labor + roof + walls)`
      : `Open pole barn (${config.shell.widthFt}×${config.shell.lengthFt}×${config.shell.eaveHeightFt}, ${config.shell.stories}-story — kit + labor + roof, no walls)`,
    amount: round(buildingCost),
    notes: config.shell.clearSpan ? "Includes clear-span truss premium" : undefined,
  });

  // ─── Roof material premium (over bundled exposed-fastener default) ─
  const pitchFactor =
    PRICING.PITCH_TO_ROOF_FACTOR[config.roof.pitch] ?? 1.083;
  const roofSqFt = footprintSqFt * pitchFactor;
  let roofPremium = 0;
  if (config.roof.material === "standing-seam-metal") {
    roofPremium = PRICING.ROOF_PREMIUM_STANDING_SEAM_PER_SQFT_ROOF;
  } else if (config.roof.material === "shingle") {
    roofPremium = PRICING.ROOF_PREMIUM_SHINGLE_PER_SQFT_ROOF;
  }
  // exposed-fastener-metal = $0 premium (bundled default)
  if (roofPremium > 0) {
    items.push({
      label: `Roof material upgrade (${config.roof.material}, ${config.roof.pitch})`,
      amount: round(roofPremium * roofSqFt),
      notes: "Premium over the bundled exposed-fastener metal roof",
    });
  }

  // ─── Siding material premium (only for enclosed builds) ──────────
  if (enclosed) {
    let sidingPremium = 0;
    if (config.exteriorFinish.sidingType === "board-and-batten") {
      sidingPremium = PRICING.SIDING_PREMIUM_BOARD_AND_BATTEN_PER_SQFT_WALL;
    } else if (config.exteriorFinish.sidingType === "wood-cedar-accent") {
      sidingPremium = PRICING.SIDING_PREMIUM_WOOD_CEDAR_PER_SQFT_WALL;
    }
    // vertical-metal = $0 premium (bundled default)
    if (sidingPremium > 0) {
      items.push({
        label: `Siding upgrade (${config.exteriorFinish.sidingType})`,
        amount: round(sidingPremium * wallSqFt),
        notes: "Premium over the bundled vertical-metal siding",
      });
    }
    if (config.exteriorFinish.cedarAccents) {
      items.push({
        label: `Cedar accent pieces${
          config.exteriorFinish.cedarAccentLocations?.length
            ? ` (${config.exteriorFinish.cedarAccentLocations.join(", ")})`
            : ""
        }`,
        amount: PRICING.CEDAR_ACCENT_LUMP_SUM,
      });
    }
  }

  // ─── Insulation (only for enclosed builds) ────────────────────────
  if (enclosed && config.exteriorFinish.insulation !== "none") {
    const insulationRate =
      config.exteriorFinish.insulation === "vinyl-faced-fiberglass"
        ? PRICING.INSULATION_VINYL_FACED_FIBERGLASS_PER_SQFT
        : config.exteriorFinish.insulation === "spray-foam"
          ? PRICING.INSULATION_SPRAY_FOAM_PER_SQFT
          : PRICING.INSULATION_IMP_PER_SQFT;
    // Walls + ceiling (ceiling ≈ footprint for a single-story)
    items.push({
      label: `Insulation (${config.exteriorFinish.insulation})`,
      amount: round(insulationRate * (wallSqFt + footprintSqFt)),
    });
  }

  // ─── Foundation ──────────────────────────────────────────────────
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

  // ─── Openings ────────────────────────────────────────────────────
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

  // ─── Additions ───────────────────────────────────────────────────
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
    additionsCost +=
      PRICING.MEZZANINE_PER_SQFT * config.additions.mezzanine.areaSqFt;
  }
  if (additionsCost > 0) {
    items.push({
      label: `Additions (${config.additions.porches.length} porch/lean-to, mezzanine: ${
        config.additions.mezzanine.enabled ? "yes" : "no"
      })`,
      amount: round(additionsCost),
    });
  }

  // ─── Interior finish (residential build-out) ─────────────────────
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

  // ─── Engineering (PE seal) ───────────────────────────────────────
  let engineeringFee =
    PRICING.ENGINEERING_FEE_BASE +
    PRICING.ENGINEERING_FEE_PER_SQFT * footprintSqFt;
  if ((config.site?.designWindSpeedMph ?? 0) >= 160) {
    engineeringFee *= 1 + PRICING.WIND_PREMIUM_OVER_160MPH_PCT;
  }
  items.push({
    label: `Engineering fee (PE seal, site-specific)`,
    amount: round(engineeringFee),
    notes: "Final fee confirmed by PE.",
  });

  // ─── Subtotal + region multiplier + ballpark range ───────────────
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
