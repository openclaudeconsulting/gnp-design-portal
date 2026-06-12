/**
 * GNP Design Portal — central typed config for a building design.
 *
 * Single source of truth: every wizard step writes into this object, the
 * live quote reads from it, and the engineering submittal package serializes
 * this exact shape (plus a quote snapshot + site/hazard call-out).
 *
 * Engineering note (NON-NEGOTIABLE): the values in this object are
 * SUBMITTED for PE review — they are never themselves "approved," "stamped,"
 * or "wind-rated." A licensed PE seals each job for its specific site.
 */

import { type FloorPlan, EMPTY_FLOOR_PLAN } from "./floor-plan";

// ──────────────────────────────────────────────────────────────────────────
// Job lifecycle
// ──────────────────────────────────────────────────────────────────────────

export type JobStatus =
  | "draft"
  | "submitted-for-engineering"
  | "in-engineering"
  | "sealed"
  | "quoted-final"
  | "won"
  | "lost";

// ──────────────────────────────────────────────────────────────────────────
// Building shell
// ──────────────────────────────────────────────────────────────────────────

export interface BuildingShell {
  widthFt: number;
  lengthFt: number;
  eaveHeightFt: number;
  peakHeightFt: number;        // derived from width + pitch where possible
  baySpacingFt: number;
  numberOfBays: number;        // derived from length / baySpacingFt
  stories: 1 | 2;
  clearSpan: boolean;          // true = no interior support columns
  /**
   * Per-bay enclosure state — one boolean per bay, indexed along the
   * length axis (bay 0 = front/-Z gable end, bay N-1 = back/+Z gable
   * end). `true` = walls around that bay, `false` = open (roof only).
   *
   * Length always matches `numberOfBays`; WizardProvider.derive() resizes
   * the array when the bay count changes (extending with the last value,
   * truncating from the end).
   *
   * Customers commonly want some bays enclosed (workshop / garage / living
   * area) and the rest open (equipment cover / hay storage). Pricing is
   * computed per-bay: enclosed bays use the $14/sqft enclosed rate, open
   * bays use the width-tiered $6.55–$7.50/sqft open rate. See
   * lib/services/enclosure-utils.ts for the helpers and
   * lib/config/pricing.config.ts for the rates.
   */
  bayEnclosures: boolean[];
}

// ──────────────────────────────────────────────────────────────────────────
// Roof
// ──────────────────────────────────────────────────────────────────────────

export type RoofProfile = "gable" | "single-slope" | "gambrel" | "monitor";
export type RoofPitch =
  | "3:12" | "4:12" | "5:12" | "6:12" | "7:12"
  | "8:12" | "9:12" | "10:12" | "11:12" | "12:12";
export type RoofMaterial = "standing-seam-metal" | "exposed-fastener-metal" | "shingle";

export interface RoofConfig {
  profile: RoofProfile;
  pitch: RoofPitch;
  eaveOverhangIn: number;
  gableOverhangIn: number;
  /**
   * Roof material is bundled into the base building cost (exposed-fastener
   * metal is the included default). Standing-seam and shingle add a small
   * per-sqft premium over that baseline.
   */
  material: RoofMaterial;
}

// ──────────────────────────────────────────────────────────────────────────
// Foundation / slab (owner's domain — explicit fields)
// ──────────────────────────────────────────────────────────────────────────

export type FoundationType = "none" | "slab" | "crawlspace" | "stem-wall";
export type SlabThickness = 4 | 6;

export interface FoundationConfig {
  type: FoundationType;
  slabThicknessIn: SlabThickness;
  concretePsi: 3000 | 4000;
  thickenedEdges: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Openings (doors + windows)
// ──────────────────────────────────────────────────────────────────────────

export type Wall = "front" | "back" | "left" | "right";

export type OverheadDoorType = "overhead" | "rollup" | "sliding" | "bifold";
export interface OverheadDoor {
  widthFt: number;
  heightFt: number;
  type: OverheadDoorType;
  wall: Wall;
  positionFt: number;           // distance from left edge of wall
}

export type EntryDoorType = "single" | "double" | "french-double";
export interface EntryDoor {
  widthFt: number;
  heightFt: number;
  type: EntryDoorType;
  wall: Wall;
  positionFt: number;
}

export type WindowType =
  | "fixed"
  | "single-hung"
  | "double-hung"
  | "casement"
  | "two-story-wall"     // signature look — large two-story window walls
  | "gable-end";         // signature look — gable-end glass
export interface Window {
  widthFt: number;
  heightFt: number;
  type: WindowType;
  wall: Wall;
  positionFt: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Additions
// ──────────────────────────────────────────────────────────────────────────

export type PorchType = "covered-porch" | "lean-to" | "carport";
export type PostStyle = "wood-square" | "timber-on-stone-base" | "metal" | "cedar";

export interface Porch {
  type: PorchType;
  widthFt: number;
  depthFt: number;
  wall: Wall;
  postStyle: PostStyle;
}

export interface Mezzanine {
  enabled: boolean;
  areaSqFt: number;             // 0 when disabled
}

// ──────────────────────────────────────────────────────────────────────────
// Interior layout
// ──────────────────────────────────────────────────────────────────────────

export interface InteriorConfig {
  heatedSqFt: number;
  bedrooms: number;
  bathrooms: number;
  openConceptGreatRoom: boolean;
  vaultedCeiling: boolean;
}

// ──────────────────────────────────────────────────────────────────────────
// Exterior finishes — only meaningful when shell.enclosed = true
// ──────────────────────────────────────────────────────────────────────────

export type SidingType = "vertical-metal" | "board-and-batten" | "wood-cedar-accent";
export type InsulationType = "none" | "vinyl-faced-fiberglass" | "spray-foam" | "imp";

export interface ExteriorFinishConfig {
  /**
   * Vertical metal is bundled into the enclosed $14/sqft base. Board-and-
   * batten and wood-cedar add per-sqft premiums over that baseline.
   */
  sidingType: SidingType;
  sidingColor: string;          // hex or named color; UI converts as needed
  trimColor: string;
  cedarAccents: boolean;
  cedarAccentLocations?: string[];
  insulation: InsulationType;
}

// ──────────────────────────────────────────────────────────────────────────
// Use & occupancy (drives engineering scope)
// ──────────────────────────────────────────────────────────────────────────

export type UseType = "residential-dwelling" | "ag-storage" | "mixed";
// residential-dwelling triggers full residential engineering vs. ag building.

// ──────────────────────────────────────────────────────────────────────────
// Site / hazard — REQUIRED before submit (drives PE engineering)
// ──────────────────────────────────────────────────────────────────────────

export type ExposureCategory = "B" | "C" | "D";
export type RiskCategory = "I" | "II" | "III" | "IV";
export type EnclosureClassification = "enclosed" | "partially-enclosed" | "open";

export interface SiteHazardConfig {
  siteAddress: string;
  city: string;
  county: string;
  state: string;                // 2-letter abbreviation (FL, GA, etc.)
  zip: string;
  designWindSpeedMph: number;   // auto-filled from county table, user-editable
  exposureCategory: ExposureCategory;
  riskCategory: RiskCategory;
  meanRoofHeightFt: number;     // derived from eave + roof pitch
  /**
   * ASCE 7 enclosure class for the wind calc — closely related to but
   * distinct from shell.enclosed (which is the customer-facing "are there
   * walls" intent). A wall building with large openings might still be
   * "partially-enclosed" for the wind calc.
   */
  enclosureClassification: EnclosureClassification;
  groundSnowLoadPsf: number;    // ~0 for FL
  soilBearingPsf?: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Customer contact (collected on the site/review step)
// ──────────────────────────────────────────────────────────────────────────

export interface CustomerContact {
  name: string;
  email?: string;
  phone?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Top-level config — the single source of truth
// ──────────────────────────────────────────────────────────────────────────

export interface BuildingConfig {
  shell: BuildingShell;
  roof: RoofConfig;
  foundation: FoundationConfig;
  openings: {
    overheadDoors: OverheadDoor[];
    entryDoors: EntryDoor[];
    windows: Window[];
  };
  additions: {
    porches: Porch[];
    mezzanine: Mezzanine;
  };
  interior: InteriorConfig;
  exteriorFinish: ExteriorFinishConfig;
  /**
   * Customer-drawn interior floor plan (2D editor on the visualization
   * panel). When non-empty, the wizard derives interior.heatedSqFt /
   * bedrooms / bathrooms from the room list. When empty, the customer's
   * manual inputs on the Interior step are used instead.
   */
  floorPlan: FloorPlan;
  useType: UseType;
  site: SiteHazardConfig;
  customer: CustomerContact;
}

// ──────────────────────────────────────────────────────────────────────────
// Sensible defaults for a fresh wizard session
// ──────────────────────────────────────────────────────────────────────────

export const DEFAULT_BUILDING_CONFIG: BuildingConfig = {
  shell: {
    widthFt: 40,
    lengthFt: 60,
    eaveHeightFt: 12,
    peakHeightFt: 22,
    baySpacingFt: 12,
    numberOfBays: 5,
    stories: 1,
    clearSpan: true,
    // Default = open pole barn (no walls anywhere). Customers click the
    // "Convert to Barndominium" CTA on Step Shell to flip every bay to
    // enclosed + add a slab in one step. Many customers DON'T want a
    // barndominium — equipment covers, hay storage, etc.
    bayEnclosures: [false, false, false, false, false],
  },
  roof: {
    profile: "gable",
    pitch: "5:12",
    eaveOverhangIn: 12,
    gableOverhangIn: 12,
    material: "exposed-fastener-metal",   // the bundled standard
  },
  foundation: {
    // Default = no foundation. Open pole barns commonly skip the slab
    // (gravel pad or bare dirt for ag use). Slab is added automatically
    // when the customer clicks "Convert to Barndominium" on Step Shell,
    // and can be picked manually on Step Foundation.
    type: "none",
    slabThicknessIn: 4,
    concretePsi: 3000,
    thickenedEdges: true,
  },
  openings: {
    overheadDoors: [],
    entryDoors: [],
    windows: [],
  },
  additions: {
    porches: [],
    mezzanine: { enabled: false, areaSqFt: 0 },
  },
  interior: {
    heatedSqFt: 0,
    bedrooms: 0,
    bathrooms: 0,
    openConceptGreatRoom: false,
    vaultedCeiling: false,
  },
  floorPlan: EMPTY_FLOOR_PLAN,
  exteriorFinish: {
    sidingType: "vertical-metal",   // bundled standard for enclosed
    sidingColor: "charcoal",
    trimColor: "white",
    cedarAccents: false,
    insulation: "none",
  },
  useType: "residential-dwelling",
  site: {
    siteAddress: "",
    city: "",
    county: "",
    state: "FL",
    zip: "",
    designWindSpeedMph: 150,
    exposureCategory: "C",
    riskCategory: "II",
    meanRoofHeightFt: 17,
    enclosureClassification: "enclosed",
    groundSnowLoadPsf: 0,
  },
  customer: {
    name: "",
  },
};
