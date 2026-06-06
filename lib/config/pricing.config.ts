/**
 * GNP Design Portal — pricing constants
 *
 * The quote engine in lib/services/quote-engine.ts reads these constants
 * and returns a BALLPARK range — never a firm contract price.
 *
 * See lib/config/disclaimer.ts for the customer-facing wording that frames
 * the quote as "ballpark" / "subject to PE engineering + material takeoff."
 *
 * Units: USD; per square foot unless noted otherwise.
 *
 * ── CALIBRATION (2026-06-06) ──────────────────────────────────────────
 *
 * Target — enclosed-barn rule of thumb from the owner:
 *   $14/sqft of footprint for the BUILDING (kit + labor combined),
 *   plus a separate slab line: $7.50/sqft for 3000 PSI 4", $8.00/sqft
 *   for 4000 PSI 4". Openings, additions, interior finish, and PE
 *   engineering fee layer on top.
 *
 * The "building" portion = STEEL + ROOF + SIDING. With the rates below,
 * a standard 40×60×12 (2400 sqft footprint) lands at:
 *   - Steel:  $6.75 × 2400               = $16,200
 *   - Roof:   $3.00 × 2400 × 1.083 (5:12) = $7,798
 *   - Siding: $4.00 × 2400 wall sqft     = $9,600
 *   ────────────────────────────────── total $33,598 = $14.00/sqft ✓
 *
 * Sanity-checked against 58 historical INVOICE *.json sidecars:
 *   - 52 open quotes: median $6.66/sqft (≤40' wide), $7.17/sqft (41-60')
 *   - 4 enclosed quotes: median $9.40/sqft — historically UNDER-priced
 *     relative to the $14/sqft going-forward rule; that gap is the
 *     owner-elected price uplift
 *   - 4 of 5 slab quotes were exactly $7.00/sqft; new rates ($7.50/$8)
 *     are a modest bump.
 *
 * When the rule of thumb changes, edit THIS file and re-run the build
 * (the marketing site auto-deploys on push to main).
 */

export const PRICING = {
  // ────────────────────────────────────────────────────────────────────
  // Shell — per sqft of FOOTPRINT (width × length)
  // Sized so STEEL + ROOF + SIDING ≈ $14/sqft on a typical build.
  // ────────────────────────────────────────────────────────────────────
  STEEL_PER_SQFT_1STORY: 6.75,
  STEEL_PER_SQFT_2STORY: 12.00,        // ~2x to account for upper-floor framing
  CLEAR_SPAN_PREMIUM_PER_SQFT: 1.50,   // added when shell.clearSpan = true

  // ────────────────────────────────────────────────────────────────────
  // Roof — per sqft of ROOF AREA (footprint × pitch factor)
  // ────────────────────────────────────────────────────────────────────
  ROOF_STANDING_SEAM_PER_SQFT: 3.00,
  ROOF_EXPOSED_FASTENER_PER_SQFT: 2.00,
  ROOF_SHINGLE_PER_SQFT: 1.50,
  // Multipliers for converting footprint sqft → roof sqft (rough ballpark)
  PITCH_TO_ROOF_FACTOR: {
    "3:12": 1.031,
    "4:12": 1.054,
    "5:12": 1.083,
    "6:12": 1.118,
    "7:12": 1.158,
    "8:12": 1.202,
    "9:12": 1.250,
    "10:12": 1.302,
    "11:12": 1.357,
    "12:12": 1.414,
  } as Record<string, number>,

  // ────────────────────────────────────────────────────────────────────
  // Foundation — per sqft of FOOTPRINT
  // Owner rates (2026-06-06):
  //   - 4" 3000 PSI: $7.50/sqft
  //   - 4" 4000 PSI: $8.00/sqft  (= 4" base + $0.50 4000-PSI upcharge)
  //   - 6" adds $1.50/sqft over 4" of same PSI
  // ────────────────────────────────────────────────────────────────────
  SLAB_4IN_PER_SQFT: 7.50,
  SLAB_6IN_PER_SQFT: 9.00,
  CONCRETE_4000_PSI_UPCHARGE_PER_SQFT: 0.50,
  THICKENED_EDGES_PER_LINEAR_FT: 8.00,
  CRAWLSPACE_PER_SQFT: 12.00,
  STEM_WALL_PER_SQFT: 14.00,

  // ────────────────────────────────────────────────────────────────────
  // Openings — placeholder ballparks (not yet calibrated to historical)
  // ────────────────────────────────────────────────────────────────────
  OVERHEAD_DOOR_BASE: 1800,            // base per overhead door (10×10 typical)
  OVERHEAD_DOOR_PER_SQFT_PREMIUM: 12,  // premium per sqft over 100 sqft
  ENTRY_DOOR_BASE: 850,
  ENTRY_DOOR_DOUBLE_PREMIUM: 600,
  WINDOW_PER_SQFT: 75,                 // standard fixed/hung
  WINDOW_TWO_STORY_WALL_PER_SQFT: 110, // signature look — large 2-story window walls

  // ────────────────────────────────────────────────────────────────────
  // Additions — placeholder ballparks
  // ────────────────────────────────────────────────────────────────────
  PORCH_PER_SQFT: 35,
  LEAN_TO_PER_SQFT: 28,
  CARPORT_PER_SQFT: 25,
  TIMBER_ON_STONE_POST_UPCHARGE: 850,  // per post for premium post style
  MEZZANINE_PER_SQFT: 45,

  // ────────────────────────────────────────────────────────────────────
  // Interior (residential finish-out) — placeholder
  // ────────────────────────────────────────────────────────────────────
  RESIDENTIAL_FINISH_PER_HEATED_SQFT: 95,    // drywall/floor/HVAC/electrical/plumbing rough
  BATHROOM_BASE: 6500,
  VAULTED_CEILING_PREMIUM_PER_SQFT: 8,

  // ────────────────────────────────────────────────────────────────────
  // Exterior siding — per sqft of WALL AREA (perimeter × eave height)
  // Calibrated so SHELL + ROOF + (vertical-metal) SIDING ≈ $14/sqft
  // ────────────────────────────────────────────────────────────────────
  SIDING_VERTICAL_METAL_PER_SQFT: 4.00,
  SIDING_BOARD_AND_BATTEN_PER_SQFT: 7.00,
  SIDING_WOOD_CEDAR_ACCENT_PER_SQFT: 12.00,
  CEDAR_ACCENT_LUMP_SUM: 2200,
  INSULATION_VINYL_FACED_FIBERGLASS_PER_SQFT: 1.50,
  INSULATION_SPRAY_FOAM_PER_SQFT: 4.25,
  INSULATION_IMP_PER_SQFT: 6.50,

  // ────────────────────────────────────────────────────────────────────
  // Engineering (PE seal — site-specific; rough placeholder)
  // ────────────────────────────────────────────────────────────────────
  ENGINEERING_FEE_BASE: 3500,
  ENGINEERING_FEE_PER_SQFT: 0.50,
  WIND_PREMIUM_OVER_160MPH_PCT: 0.05,   // 5% premium when design wind ≥ 160 mph

  // ────────────────────────────────────────────────────────────────────
  // Regional adjustment — multiplied against the line-item subtotal
  // ────────────────────────────────────────────────────────────────────
  REGION_MULTIPLIER: {
    "SW-FL": 1.00,        // baseline (Fort Myers / Charlotte / Sarasota / Collier)
    "Central-FL": 0.97,   // Ocala / Gainesville area
    "S-GA": 0.93,         // Valdosta corridor
    "Other": 1.05,        // outside primary service area — premium for travel + logistics
  } as Record<string, number>,

  // ────────────────────────────────────────────────────────────────────
  // Ballpark spread — quotes are presented as a LOW–HIGH range
  // ────────────────────────────────────────────────────────────────────
  BALLPARK_LOW_FACTOR: 0.90,
  BALLPARK_HIGH_FACTOR: 1.15,
} as const;
