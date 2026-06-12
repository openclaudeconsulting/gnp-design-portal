/**
 * Per-bay enclosure helpers.
 *
 * Buildings can now have a mixed enclosure: some bays walled in (e.g.
 * the customer's workshop/living section) and others left open (e.g. a
 * lean-to-style equipment cover). The truth is one boolean per bay,
 * indexed along the length axis from the −Z gable end (bay 0) to the +Z
 * gable end (bay N-1).
 *
 * Everything in the wizard derives from BuildingShell.bayEnclosures:
 *   - 3D viewport: per-bay wall segments, gable-end walls only at
 *     enclosed end bays, interior dividing walls at enclosed↔open
 *     boundaries
 *   - Quote engine: mixed pricing (enclosed sqft × $14, open sqft ×
 *     tier rate)
 *   - UI gates: siding / insulation steps appear when ANY bay is
 *     enclosed
 *   - Submit summary: enclosure breakdown for the PE / Carson
 */

export interface EnclosureSummary {
  /** All N bays are enclosed (walls all around). */
  fullyEnclosed: boolean;
  /** No bays are enclosed (roof only). */
  fullyOpen: boolean;
  /** Some enclosed + some open (mixed). */
  mixed: boolean;
  closedCount: number;
  openCount: number;
  total: number;
  /** Convenience: any bay is enclosed (used to gate siding/insulation). */
  anyEnclosed: boolean;
}

export function getEnclosureSummary(
  bayEnclosures: boolean[],
): EnclosureSummary {
  const total = bayEnclosures.length;
  const closedCount = bayEnclosures.filter(Boolean).length;
  const openCount = total - closedCount;
  return {
    fullyEnclosed: total > 0 && closedCount === total,
    fullyOpen: closedCount === 0,
    mixed: closedCount > 0 && openCount > 0,
    closedCount,
    openCount,
    total,
    anyEnclosed: closedCount > 0,
  };
}

/**
 * When the bay count changes (because the customer changed length or
 * bay spacing), resize the bayEnclosures array.
 *  - Same length → unchanged
 *  - Growing  → extend with the most-recent (last) value, or `true` if empty
 *  - Shrinking → truncate from the end
 */
export function resizeBayEnclosures(
  prev: boolean[],
  newLength: number,
): boolean[] {
  if (newLength <= 0) return [];
  if (prev.length === newLength) return prev;
  if (prev.length === 0) return Array(newLength).fill(true);
  if (newLength > prev.length) {
    const tailValue = prev[prev.length - 1] ?? true;
    return [...prev, ...Array(newLength - prev.length).fill(tailValue)];
  }
  return prev.slice(0, newLength);
}

/**
 * Short human-readable label like "All enclosed", "All open", or
 * "3 of 5 bays enclosed" — used in the Review screen + submit summary.
 */
export function enclosureLabel(summary: EnclosureSummary): string {
  if (summary.total === 0) return "(no bays)";
  if (summary.fullyEnclosed) return "All enclosed";
  if (summary.fullyOpen) return "All open";
  return `${summary.closedCount} of ${summary.total} bays enclosed`;
}
