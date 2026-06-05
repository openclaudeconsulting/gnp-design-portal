/**
 * Design wind speed lookup table — GNP's primary service area.
 *
 * Source: approximate ASCE 7-22 ultimate (3-second gust, Risk Category II,
 * Exposure C) wind speeds in MPH.
 *
 * ⚠ THESE ARE BALLPARK VALUES seeded for the MVP. The owner / PE MUST verify
 * against the ATC Hazards by Location tool (or the ASCE 7 Hazard Tool API)
 * before any plan is stamped. Wind ratings are site-specific.
 *
 * Future: replace this hardcoded table with a live ATC / ASCE 7 lookup —
 * see the SiteHazardService interface in lib/services/site-hazard.ts.
 */

export interface CountyWindEntry {
  state: string;
  county: string;
  windSpeedMph: number;
  region: "SW-FL" | "Central-FL" | "S-GA" | "Other";
  notes?: string;
}

export const COUNTY_WIND_TABLE: CountyWindEntry[] = [
  // ─── SW Florida (primary build region) ────────────────────────────
  { state: "FL", county: "Lee",        windSpeedMph: 170, region: "SW-FL", notes: "Fort Myers / Cape Coral — coastal high-wind zone" },
  { state: "FL", county: "Collier",    windSpeedMph: 170, region: "SW-FL", notes: "Naples / Marco Island" },
  { state: "FL", county: "Charlotte",  windSpeedMph: 165, region: "SW-FL", notes: "Port Charlotte / Punta Gorda" },
  { state: "FL", county: "Sarasota",   windSpeedMph: 160, region: "SW-FL" },
  { state: "FL", county: "Manatee",    windSpeedMph: 160, region: "SW-FL" },
  { state: "FL", county: "Hendry",     windSpeedMph: 150, region: "SW-FL", notes: "Inland — LaBelle / Clewiston" },
  { state: "FL", county: "DeSoto",     windSpeedMph: 150, region: "SW-FL", notes: "Arcadia" },
  { state: "FL", county: "Glades",     windSpeedMph: 150, region: "SW-FL" },

  // ─── Central Florida (Ocala / Gainesville area) ───────────────────
  { state: "FL", county: "Marion",     windSpeedMph: 140, region: "Central-FL", notes: "Ocala" },
  { state: "FL", county: "Levy",       windSpeedMph: 140, region: "Central-FL", notes: "Chiefland" },
  { state: "FL", county: "Alachua",    windSpeedMph: 140, region: "Central-FL", notes: "Gainesville" },
  { state: "FL", county: "Citrus",     windSpeedMph: 145, region: "Central-FL" },
  { state: "FL", county: "Sumter",     windSpeedMph: 140, region: "Central-FL" },

  // ─── South Georgia (Valdosta corridor) ────────────────────────────
  { state: "GA", county: "Lowndes",    windSpeedMph: 140, region: "S-GA", notes: "Valdosta" },
  { state: "GA", county: "Brooks",     windSpeedMph: 135, region: "S-GA" },
  { state: "GA", county: "Echols",     windSpeedMph: 140, region: "S-GA" },
  { state: "GA", county: "Cook",       windSpeedMph: 135, region: "S-GA" },
  { state: "GA", county: "Lanier",     windSpeedMph: 135, region: "S-GA" },
  { state: "GA", county: "Berrien",    windSpeedMph: 135, region: "S-GA" },
  { state: "GA", county: "Atkinson",   windSpeedMph: 135, region: "S-GA" },
  { state: "GA", county: "Clinch",     windSpeedMph: 140, region: "S-GA" },
];

export const DEFAULT_WIND_SPEED_MPH = 150;
export const DEFAULT_REGION = "Other" as const;
