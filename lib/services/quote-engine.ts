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
 *     - Mixed (some bays enclosed, some open): pro-rated by bay count
 *       — closedCount/total of footprint priced at enclosed rate, the
 *       rest at the open tier rate.
 *   - Roof MATERIAL upgrades (standing-seam, shingle) add a per-sqft
 *     premium over the bundled exposed-fastener default — not a separate
 *     base price.
 *   - Siding MATERIAL upgrades (board-and-batten, wood-cedar) add a
 *     per-sqft wall-area premium on the ENCLOSED portion only.
 *   - Insulation only applies to the ENCLOSED portion.
 *
 * NEVER present the result as a firm contract price. See DISCLAIMERS.QUOTE.
 */

import { PRICING } from "@/lib/config/pricing.config";
import { getEnclosureSummary } from "@/lib/services/enclosure-utils";
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

function openRateForWidth(widthFt: number): number {
  if (widthFt <= 40) return PRICING.OPEN_BUILDING_PER_SQFT_SMALL;
  if (widthFt <= 60) return PRICING.OPEN_BUILDING_PER_SQFT_MEDIUM;
  return PRICING.OPEN_BUILDING_PER_SQFT_LARGE;
}

export function buildQuote(config: BuildingConfig): QuoteBreakdown {
  const footprintSqFt = config.shell.widthFt * config.shell.lengthFt;
  const items: QuoteLineItem[] = [];

  const enclosure = getEnclosureSummary(config.shell.bayEnclosures);

  // Fraction of footprint covered by enclosed bays vs open bays.
  // (Pro-rate by bay count — every bay has the same footprint span.)
  const enclosedFrac =
    enclosure.total > 0 ? enclosure.closedCount / enclosure.total : 0;
  const openFrac = 1 - enclosedFrac;
  const enclosedFootprint = footprintSqFt * enclosedFrac;
  const openFootprint = footprintSqFt * openFrac;

  // Wall area applies ONLY to enclosed portion — long-wall segments for
  // enclosed bays + gable end walls if the corresponding end bay is
  // enclosed. Approximation: scale total perimeter wall area by
  // enclosedFrac (the long walls are perfectly bay-proportional; gable
  // ends are a small fraction of total perimeter, so the error is tiny).
  const fullPerimeterWallSqFt =
    2 *
    (config.shell.widthFt + config.shell.lengthFt) *
    config.shell.eaveHeightFt;
  const enclosedWallSqFt = fullPerimeterWallSqFt * enclosedFrac;

  // ─── Base building (kit + labor + roof, plus walls for enclosed bays) ─
  const openRate = openRateForWidth(config.shell.widthFt);
  let buildingCost =
    enclosedFootprint * PRICING.ENCLOSED_BUILDING_PER_SQFT +
    openFootprint * openRate;
  if (config.shell.stories === 2) {
    buildingCost *= PRICING.TWO_STORY_MULTIPLIER;
  }
  if (config.shell.clearSpan) {
    buildingCost += PRICING.CLEAR_SPAN_PREMIUM_PER_SQFT * footprintSqFt;
  }

  const dims = `${config.shell.widthFt}×${config.shell.lengthFt}×${config.shell.eaveHeightFt}`;
  const storyTag = `${config.shell.stories}-story`;
  let baseLabel: string;
  let baseNote: string | undefined;
  if (enclosure.fullyEnclosed) {
    baseLabel = `Enclosed building (${dims}, ${storyTag} — kit + labor + roof + walls)`;
  } else if (enclosure.fullyOpen) {
    baseLabel = `Open pole barn (${dims}, ${storyTag} — kit + labor + roof, no walls)`;
  } else {
    baseLabel = `Mixed-enclosure building (${dims}, ${storyTag} — ${enclosure.closedCount} of ${enclosure.total} bays enclosed)`;
    baseNote = `${enclosure.closedCount} enclosed bays @ $${PRICING.ENCLOSED_BUILDING_PER_SQFT}/sqft + ${enclosure.openCount} open bays @ $${openRate.toFixed(2)}/sqft`;
  }
  if (config.shell.clearSpan) {
    baseNote = baseNote
      ? `${baseNote} · includes clear-span truss premium`
      : "Includes clear-span truss premium";
  }
  items.push({
    label: baseLabel,
    amount: round(buildingCost),
    notes: baseNote,
  });

  // ─── Roof material premium (over bundled exposed-fastener default) ─
  // Roof covers the WHOLE footprint regardless of enclosure.
  const pitchFactor =
    PRICING.PITCH_TO_ROOF_FACTOR[config.roof.pitch] ?? 1.083;
  const roofSqFt = footprintSqFt * pitchFactor;
  let roofPremium = 0;
  if (config.roof.material === "standing-seam-metal") {
    roofPremium = PRICING.ROOF_PREMIUM_STANDING_SEAM_PER_SQFT_ROOF;
  } else if (config.roof.material === "shingle") {
    roofPremium = PRICING.ROOF_PREMIUM_SHINGLE_PER_SQFT_ROOF;
  }
  if (roofPremium > 0) {
    items.push({
      label: `Roof material upgrade (${config.roof.material}, ${config.roof.pitch})`,
      amount: round(roofPremium * roofSqFt),
      notes: "Premium over the bundled exposed-fastener metal roof",
    });
  }

  // ─── Siding material premium (only for enclosed portion) ─────────
  if (enclosure.anyEnclosed) {
    let sidingPremium = 0;
    if (config.exteriorFinish.sidingType === "board-and-batten") {
      sidingPremium = PRICING.SIDING_PREMIUM_BOARD_AND_BATTEN_PER_SQFT_WALL;
    } else if (config.exteriorFinish.sidingType === "wood-cedar-accent") {
      sidingPremium = PRICING.SIDING_PREMIUM_WOOD_CEDAR_PER_SQFT_WALL;
    }
    if (sidingPremium > 0) {
      items.push({
        label: `Siding upgrade (${config.exteriorFinish.sidingType})`,
        amount: round(sidingPremium * enclosedWallSqFt),
        notes: enclosure.mixed
          ? `Premium over vertical metal · applied to ${enclosure.closedCount} of ${enclosure.total} enclosed bays`
          : "Premium over the bundled vertical-metal siding",
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

  // ─── Insulation (only for enclosed portion) ───────────────────────
  if (enclosure.anyEnclosed && config.exteriorFinish.insulation !== "none") {
    const insulationRate =
      config.exteriorFinish.insulation === "vinyl-faced-fiberglass"
        ? PRICING.INSULATION_VINYL_FACED_FIBERGLASS_PER_SQFT
        : config.exteriorFinish.insulation === "spray-foam"
          ? PRICING.INSULATION_SPRAY_FOAM_PER_SQFT
          : PRICING.INSULATION_IMP_PER_SQFT;
    // Walls + ceiling, scaled by enclosed fraction
    items.push({
      label: `Insulation (${config.exteriorFinish.insulation})`,
      amount: round(
        insulationRate * (enclosedWallSqFt + enclosedFootprint),
      ),
      notes: enclosure.mixed
        ? `Applied to ${enclosure.closedCount} of ${enclosure.total} enclosed bays`
        : undefined,
    });
  }

  // ─── Foundation ──────────────────────────────────────────────────
  // "none" = no foundation line at all (open pole barn on dirt / gravel
  // pad). The other three add their respective line item.
  if (config.foundation.type === "slab") {
    const slabRate =
      config.foundation.slabThicknessIn === 6
        ? PRICING.SLAB_6IN_PER_SQFT
        : PRICING.SLAB_4IN_PER_SQFT;

    // Slab coverage — full footprint, or only under enclosed bays.
    // "enclosed-only" pro-rates by bay count (same approximation used
    // for siding / insulation: every bay covers an equal footprint
    // share, and gable / dividing walls are a small share of total
    // perimeter so the linear-foot edge calc is close enough).
    const coverageFrac =
      config.foundation.slabCoverage === "enclosed-only"
        ? enclosedFrac
        : 1;
    const slabSqFt = footprintSqFt * coverageFrac;

    if (slabSqFt > 0) {
      let slabCost = slabRate * slabSqFt;
      if (config.foundation.concretePsi === 4000) {
        slabCost += PRICING.CONCRETE_4000_PSI_UPCHARGE_PER_SQFT * slabSqFt;
      }
      if (config.foundation.thickenedEdges) {
        const perimeter = 2 * (config.shell.widthFt + config.shell.lengthFt);
        slabCost +=
          PRICING.THICKENED_EDGES_PER_LINEAR_FT * perimeter * coverageFrac;
      }
      const coverageNote =
        config.foundation.slabCoverage === "enclosed-only"
          ? ` · enclosed bays only (${enclosure.closedCount} of ${enclosure.total})`
          : "";
      items.push({
        label: `Slab (${config.foundation.slabThicknessIn}", ${config.foundation.concretePsi} PSI${coverageNote})`,
        amount: round(slabCost),
      });
    }
    // (If enclosed-only AND no bays are enclosed → no slab line.)
  } else if (config.foundation.type === "crawlspace") {
    items.push({
      label: "Crawlspace foundation",
      amount: round(PRICING.CRAWLSPACE_PER_SQFT * footprintSqFt),
    });
  } else if (config.foundation.type === "stem-wall") {
    items.push({
      label: "Stem wall foundation",
      amount: round(PRICING.STEM_WALL_PER_SQFT * footprintSqFt),
    });
  }
  // "none" → no foundation line; skip

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
