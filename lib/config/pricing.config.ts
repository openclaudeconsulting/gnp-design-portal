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
 * ── PRICING MODEL (2026-06-06, owner-confirmed) ───────────────────────
 *
 * Buildings are quoted as ONE base "building" line item that bundles the
 * kit + labor + ROOF (sheets and install). Whether the build has walls is
 * the primary price driver:
 *
 *   OPEN POLE BARN — roof only, no walls
 *     - Tiered by width because wider trusses need thicker steel
 *     - ≤40' wide:   $6.55/sqft   (kit + labor + roof, installed)
 *     - 41-60' wide: $6.80/sqft
 *     - 61'+ wide:   $7.50/sqft
 *
 *   ENCLOSED — walls + roof + labor
 *     - Flat $14.00/sqft per owner rule of thumb (2026-06-06)
 *     - Already includes the standard exposed-fastener metal roof,
 *       vertical-metal siding, and all installation labor
 *
 * Roof material (standing-seam, shingle) and siding material (board-and-
 * batten, wood-cedar) charge a PREMIUM over those bundled defaults. They
 * are NEVER a separate base line.
 *
 * Foundation is a separate line, per owner rates:
 *   - 4" 3000 PSI slab: $7.50/sqft
 *   - 4" 4000 PSI slab: $8.00/sqft (= base + $0.50 upcharge)
 *   - 6" adds $1.50/sqft over the equivalent 4" depth
 *
 * Calibrated against 58 historical INVOICE *.json sidecars; matches the
 * existing barn-builder.html rates (which were calibrated against 62
 * historical orders 2026-05-19).
 *
 * When the rule of thumb changes, edit THIS file and re-run the build.
 */

export const PRICING = {
  // ────────────────────────────────────────────────────────────────────
  // OPEN POLE BARN — base rate per sqft of FOOTPRINT
  // (kit + labor + roof installed; NO walls)
  // ────────────────────────────────────────────────────────────────────
  OPEN_BUILDING_PER_SQFT_SMALL:  6.55,   // ≤40' wide
  OPEN_BUILDING_PER_SQFT_MEDIUM: 6.80,   // 41-60' wide
  OPEN_BUILDING_PER_SQFT_LARGE:  7.50,   // 61'+ wide

  // ────────────────────────────────────────────────────────────────────
  // ENCLOSED BUILDING — base rate per sqft of FOOTPRINT
  // (kit + labor + roof + standard vertical-metal walls)
  // Owner rule of thumb (2026-06-06): $14/sqft flat
  // ────────────────────────────────────────────────────────────────────
  ENCLOSED_BUILDING_PER_SQFT: 14.00,

  // ────────────────────────────────────────────────────────────────────
  // Structural premiums (applied to footprint)
  // ────────────────────────────────────────────────────────────────────
  CLEAR_SPAN_PREMIUM_PER_SQFT: 1.50,     // no interior support columns
  TWO_STORY_MULTIPLIER: 1.75,            // 2-story = 1.75× the 1-story base
                                          // (less than 2× because foundation
                                          // is shared)

  // ────────────────────────────────────────────────────────────────────
  // Roof material — exposed-fastener metal is BUNDLED.
  // Upgrades charge a per-sqft premium on ROOF AREA (footprint × pitch).
  // ────────────────────────────────────────────────────────────────────
  ROOF_PREMIUM_STANDING_SEAM_PER_SQFT_ROOF: 1.00,
  ROOF_PREMIUM_SHINGLE_PER_SQFT_ROOF: 0.50,   // small upcharge for
                                               // underlayment + nailers
  // (exposed-fastener = $0 premium — it's the default)

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
  // Siding material — vertical-metal is BUNDLED into the enclosed base.
  // Upgrades charge a per-sqft premium on WALL AREA (perim × eave height).
  // Only applies when shell.enclosed = true.
  // ────────────────────────────────────────────────────────────────────
  SIDING_PREMIUM_BOARD_AND_BATTEN_PER_SQFT_WALL: 3.50,
  SIDING_PREMIUM_WOOD_CEDAR_PER_SQFT_WALL: 8.00,
  CEDAR_ACCENT_LUMP_SUM: 2200,

  // ────────────────────────────────────────────────────────────────────
  // Insulation — per sqft of WALL + CEILING area (ceiling ≈ footprint).
  // Only applies when shell.enclosed = true (no walls to insulate).
  // ────────────────────────────────────────────────────────────────────
  INSULATION_VINYL_FACED_FIBERGLASS_PER_SQFT: 1.50,
  INSULATION_SPRAY_FOAM_PER_SQFT: 4.25,
  INSULATION_IMP_PER_SQFT: 6.50,

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
  OVERHEAD_DOOR_BASE: 1800,              // base per overhead door (10×10 typical)
  OVERHEAD_DOOR_PER_SQFT_PREMIUM: 12,    // premium per sqft over 100 sqft
  ENTRY_DOOR_BASE: 850,
  ENTRY_DOOR_DOUBLE_PREMIUM: 600,
  WINDOW_PER_SQFT: 75,                   // standard fixed/hung
  WINDOW_TWO_STORY_WALL_PER_SQFT: 110,   // signature look — large 2-story window walls

  // ────────────────────────────────────────────────────────────────────
  // Additions — placeholder ballparks
  // ────────────────────────────────────────────────────────────────────
  PORCH_PER_SQFT: 35,
  LEAN_TO_PER_SQFT: 28,
  CARPORT_PER_SQFT: 25,
  TIMBER_ON_STONE_POST_UPCHARGE: 850,    // per post for premium post style
  MEZZANINE_PER_SQFT: 45,

  // ────────────────────────────────────────────────────────────────────
  // Interior (residential finish-out) — placeholder
  // ────────────────────────────────────────────────────────────────────
  RESIDENTIAL_FINISH_PER_HEATED_SQFT: 95,   // drywall/floor/HVAC/electrical/plumbing rough
  BATHROOM_BASE: 6500,
  VAULTED_CEILING_PREMIUM_PER_SQFT: 8,

  // ────────────────────────────────────────────────────────────────────
  // Engineering (PE seal — site-specific; rough placeholder)
  // ────────────────────────────────────────────────────────────────────
  ENGINEERING_FEE_BASE: 3500,
  ENGINEERING_FEE_PER_SQFT: 0.50,
  WIND_PREMIUM_OVER_160MPH_PCT: 0.05,    // 5% premium when design wind ≥ 160 mph

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
