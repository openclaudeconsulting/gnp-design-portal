/**
 * GNP Design Portal — pricing constants
 *
 * ⚠ PLACEHOLDER VALUES. The owner MUST replace these with real numbers
 * before the portal goes live. The quote engine in
 * lib/services/quote-engine.ts reads these constants and returns a BALLPARK
 * range — never a firm contract price.
 *
 * See lib/config/disclaimer.ts for the customer-facing wording that frames
 * the quote as "ballpark" / "subject to PE engineering + material takeoff."
 *
 * Units: USD; per square foot unless noted otherwise.
 */

export const PRICING = {
  // ────────────────────────────────────────────────────────────────────
  // Shell — per sqft of FOOTPRINT (width × length)
  // ────────────────────────────────────────────────────────────────────
  STEEL_PER_SQFT_1STORY: 12.00,
  STEEL_PER_SQFT_2STORY: 18.00,
  CLEAR_SPAN_PREMIUM_PER_SQFT: 1.50,   // added when shell.clearSpan = true

  // ────────────────────────────────────────────────────────────────────
  // Roof — per sqft of ROOF AREA (approximated from footprint × pitch factor)
  // ────────────────────────────────────────────────────────────────────
  ROOF_STANDING_SEAM_PER_SQFT: 8.00,
  ROOF_EXPOSED_FASTENER_PER_SQFT: 5.00,
  ROOF_SHINGLE_PER_SQFT: 4.00,
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
  // ────────────────────────────────────────────────────────────────────
  SLAB_4IN_PER_SQFT: 6.00,
  SLAB_6IN_PER_SQFT: 8.50,
  CRAWLSPACE_PER_SQFT: 12.00,
  STEM_WALL_PER_SQFT: 14.00,
  CONCRETE_4000_PSI_UPCHARGE_PER_SQFT: 1.00,
  THICKENED_EDGES_PER_LINEAR_FT: 8.00,

  // ────────────────────────────────────────────────────────────────────
  // Openings
  // ────────────────────────────────────────────────────────────────────
  OVERHEAD_DOOR_BASE: 1800,            // base per overhead door (10×10 typical)
  OVERHEAD_DOOR_PER_SQFT_PREMIUM: 12,  // premium per sqft over 100 sqft
  ENTRY_DOOR_BASE: 850,
  ENTRY_DOOR_DOUBLE_PREMIUM: 600,
  WINDOW_PER_SQFT: 75,                 // standard fixed/hung
  WINDOW_TWO_STORY_WALL_PER_SQFT: 110, // signature look — large 2-story window walls

  // ────────────────────────────────────────────────────────────────────
  // Additions
  // ────────────────────────────────────────────────────────────────────
  PORCH_PER_SQFT: 35,
  LEAN_TO_PER_SQFT: 28,
  CARPORT_PER_SQFT: 25,
  TIMBER_ON_STONE_POST_UPCHARGE: 850,  // per post for premium post style
  MEZZANINE_PER_SQFT: 45,

  // ────────────────────────────────────────────────────────────────────
  // Interior (when residential-finished out)
  // ────────────────────────────────────────────────────────────────────
  RESIDENTIAL_FINISH_PER_HEATED_SQFT: 95,    // drywall/floor/HVAC/electrical/plumbing rough
  BATHROOM_BASE: 6500,
  VAULTED_CEILING_PREMIUM_PER_SQFT: 8,

  // ────────────────────────────────────────────────────────────────────
  // Exterior finish — per sqft of WALL AREA (perimeter × eave height)
  // ────────────────────────────────────────────────────────────────────
  SIDING_VERTICAL_METAL_PER_SQFT: 7,
  SIDING_BOARD_AND_BATTEN_PER_SQFT: 11,
  SIDING_WOOD_CEDAR_ACCENT_PER_SQFT: 16,
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
