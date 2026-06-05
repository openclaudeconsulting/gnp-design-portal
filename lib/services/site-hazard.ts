/**
 * SiteHazardService — abstraction over wind / hazard data lookup.
 *
 * MVP implementation: hardcoded county lookup table
 * (lib/config/wind-speeds.ts) with manual override on the wizard's site step.
 *
 * Future: swap implementation for the ATC Hazards by Location or ASCE 7
 * Hazard Tool API while keeping the same interface — only this file changes.
 */

import {
  COUNTY_WIND_TABLE,
  DEFAULT_WIND_SPEED_MPH,
  DEFAULT_REGION,
  type CountyWindEntry,
} from "@/lib/config/wind-speeds";

export interface SiteHazardLookupResult {
  windSpeedMph: number;
  region: CountyWindEntry["region"];
  source: "county-table" | "default" | "manual-override";
  matched?: CountyWindEntry;
  notes?: string;
}

export interface SiteHazardService {
  lookup(input: { state: string; county: string }): SiteHazardLookupResult;
}

class CountyTableHazardService implements SiteHazardService {
  lookup({
    state,
    county,
  }: {
    state: string;
    county: string;
  }): SiteHazardLookupResult {
    const s = (state || "").trim().toUpperCase();
    const c = (county || "").trim().toLowerCase();
    if (!s || !c) {
      return {
        windSpeedMph: DEFAULT_WIND_SPEED_MPH,
        region: DEFAULT_REGION,
        source: "default",
      };
    }
    const matched = COUNTY_WIND_TABLE.find(
      (e) => e.state.toUpperCase() === s && e.county.toLowerCase() === c
    );
    if (matched) {
      return {
        windSpeedMph: matched.windSpeedMph,
        region: matched.region,
        source: "county-table",
        matched,
        notes: matched.notes,
      };
    }
    return {
      windSpeedMph: DEFAULT_WIND_SPEED_MPH,
      region: DEFAULT_REGION,
      source: "default",
    };
  }
}

export const siteHazardService: SiteHazardService = new CountyTableHazardService();
