/**
 * Floor-plan helpers — pure functions that derive InteriorConfig values
 * from a customer-drawn FloorPlan + manage room IDs.
 */

import {
  type FloorPlan,
  type Room,
  type RoomType,
  ROOM_TYPES,
} from "@/lib/types/floor-plan";

export interface DerivedInterior {
  heatedSqFt: number;
  bedrooms: number;
  bathrooms: number;
}

/**
 * Sum up the customer's floor plan into the InteriorConfig fields the
 * quote engine consumes. When the FloorPlan is empty (no rooms), returns
 * all-zeros — the wizard then falls back to whatever the customer entered
 * on the Interior step manually.
 */
export function deriveInterior(plan: FloorPlan): DerivedInterior {
  let heatedSqFt = 0;
  let bedrooms = 0;
  let bathrooms = 0;
  for (const room of plan.rooms) {
    const area = Math.max(0, room.widthFt) * Math.max(0, room.heightFt);
    const meta = ROOM_TYPES[room.type];
    if (meta.countsAsHeated) heatedSqFt += area;
    if (meta.isBedroom) bedrooms += 1;
    bathrooms += meta.bathContribution;
  }
  return {
    heatedSqFt: Math.round(heatedSqFt),
    bedrooms,
    bathrooms,
  };
}

let _idCounter = 0;
/** Stable, in-session ID for new rooms / openings. */
export function newId(prefix = "id"): string {
  _idCounter += 1;
  return `${prefix}-${_idCounter}`;
}

/** Create a room of the given type at the given top-left corner. */
export function makeRoom(
  type: RoomType,
  xFt: number,
  yFt: number,
  customLabel?: string,
): Room {
  const meta = ROOM_TYPES[type];
  return {
    id: newId("room"),
    type,
    label: customLabel ?? meta.label,
    xFt,
    yFt,
    widthFt: meta.defaultWidthFt,
    heightFt: meta.defaultHeightFt,
    openings: [],
  };
}

/**
 * Clamp a room rectangle into the building footprint. Used after the
 * shell dimensions change to keep rooms inside the building outline.
 */
export function clampRoomToBuilding(
  room: Room,
  buildingW: number,
  buildingL: number,
): Room {
  let w = Math.min(room.widthFt, buildingW);
  let h = Math.min(room.heightFt, buildingL);
  let x = Math.max(0, Math.min(room.xFt, buildingW - w));
  let y = Math.max(0, Math.min(room.yFt, buildingL - h));
  if (
    w === room.widthFt &&
    h === room.heightFt &&
    x === room.xFt &&
    y === room.yFt
  ) {
    return room;
  }
  return { ...room, xFt: x, yFt: y, widthFt: w, heightFt: h };
}
