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

/**
 * Bounding range of the enclosed bays along the length axis. Used by
 * the 3D viewport + StepOpenings so that "front" / "back" / "left" /
 * "right" wall labels refer to the ENCLOSED SECTION, not the entire
 * building. With mixed enclosure (e.g. bays 3-5 enclosed, 1-2 open),
 * a customer placing a door on the "front" wall expects it on the
 * front of their enclosed workshop — not on the open-bay equipment
 * cover end.
 *
 * Returns null when no bays are enclosed (no walls exist).
 * For non-contiguous enclosure (rare), returns the OUTER bounding box —
 * the 3D viewport's per-bay opening filter still hides openings whose
 * containing bay happens to be open in the middle of the range.
 */
export interface EnclosedSection {
  firstIdx: number;  // index of first enclosed bay (0-based)
  lastIdx: number;   // index of last enclosed bay (inclusive)
}

export function getEnclosedSection(
  bayEnclosures: boolean[],
): EnclosedSection | null {
  let firstIdx = -1;
  let lastIdx = -1;
  for (let i = 0; i < bayEnclosures.length; i++) {
    if (bayEnclosures[i]) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }
  }
  if (firstIdx === -1) return null;
  return { firstIdx, lastIdx };
}

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
