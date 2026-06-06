/**
 * Floor-plan schema — the customer-drawn interior layout for a building.
 *
 * Each Room is a rectangle (axis-aligned for v1) positioned inside the
 * building footprint. Rooms can have openings on any of their four sides
 * — these render as dashed segments in the 2D editor.
 *
 * Coordinates are in FEET, measured from the building's top-left corner
 * (top = north = -Z in the 3D scene, left = west = -X).
 *
 * The 2D editor (FloorPlanEditor) writes into this object on every
 * change; the WizardProvider derives interior.heatedSqFt / bedrooms /
 * bathrooms from the room list so the existing quote engine + Step
 * Interior summary stay consistent.
 */

export type RoomType =
  | "bedroom"
  | "bathroom"
  | "half-bath"
  | "kitchen"
  | "living"
  | "dining"
  | "great-room"
  | "office"
  | "laundry"
  | "garage"
  | "closet"
  | "hallway"
  | "other";

export type RoomSide = "north" | "south" | "east" | "west";

export type OpeningKind = "door" | "archway" | "opening";

export interface Opening {
  /** Stable ID for React reconciliation. */
  id: string;
  /** Which wall of the room this opening sits on. */
  side: RoomSide;
  /** Distance in feet from the LEFT-most (or TOP-most) edge of that wall. */
  positionFt: number;
  /** Width of the opening, in feet. Default 3 ft (standard door). */
  widthFt: number;
  /** Visual type — door (full-height) vs archway (taller / open). */
  kind: OpeningKind;
}

export interface Room {
  /** Stable ID for React reconciliation + Konva node lookup. */
  id: string;
  /** Room classification — drives the room color + the derived counts. */
  type: RoomType;
  /** User-editable display name. */
  label: string;
  /** Top-left corner X in feet (from building origin). */
  xFt: number;
  /** Top-left corner Y in feet (from building origin). */
  yFt: number;
  /** Width (X dimension) in feet. */
  widthFt: number;
  /** Height (Y dimension) in feet. */
  heightFt: number;
  /** Openings (doorways / archways) on this room's walls. */
  openings: Opening[];
}

export interface FloorPlan {
  rooms: Room[];
}

export const EMPTY_FLOOR_PLAN: FloorPlan = {
  rooms: [],
};

// ─────────────────────────────────────────────────────────────────────────
// Per-room-type visual + counting metadata.
// ─────────────────────────────────────────────────────────────────────────

export interface RoomTypeMeta {
  label: string;
  /** Solid wall fill color (translucent-ish for legibility) in the 2D editor. */
  fillHex: string;
  /** Border color (wall line color) in the 2D editor. */
  strokeHex: string;
  /** Default dimensions when added via "+ <Type>" button. */
  defaultWidthFt: number;
  defaultHeightFt: number;
  /** Whether this room counts toward conditioned/heated sqft. */
  countsAsHeated: boolean;
  /** Whether this room contributes to bedroom count. */
  isBedroom: boolean;
  /** Bathroom contribution (1 for full bath, 0.5 for half-bath). */
  bathContribution: number;
}

export const ROOM_TYPES: Record<RoomType, RoomTypeMeta> = {
  bedroom: {
    label: "Bedroom",
    fillHex: "rgba(124, 92, 199, 0.18)",
    strokeHex: "#a78bfa",
    defaultWidthFt: 12,
    defaultHeightFt: 12,
    countsAsHeated: true,
    isBedroom: true,
    bathContribution: 0,
  },
  bathroom: {
    label: "Bathroom",
    fillHex: "rgba(64, 175, 174, 0.18)",
    strokeHex: "#5eead4",
    defaultWidthFt: 8,
    defaultHeightFt: 10,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 1,
  },
  "half-bath": {
    label: "Half bath",
    fillHex: "rgba(64, 175, 174, 0.12)",
    strokeHex: "#5eead4",
    defaultWidthFt: 5,
    defaultHeightFt: 6,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0.5,
  },
  kitchen: {
    label: "Kitchen",
    fillHex: "rgba(251, 191, 36, 0.18)",
    strokeHex: "#fbbf24",
    defaultWidthFt: 14,
    defaultHeightFt: 12,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  living: {
    label: "Living",
    fillHex: "rgba(251, 146, 60, 0.18)",
    strokeHex: "#fb923c",
    defaultWidthFt: 18,
    defaultHeightFt: 16,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  dining: {
    label: "Dining",
    fillHex: "rgba(251, 146, 60, 0.18)",
    strokeHex: "#fb923c",
    defaultWidthFt: 12,
    defaultHeightFt: 12,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  "great-room": {
    label: "Great room",
    fillHex: "rgba(251, 146, 60, 0.22)",
    strokeHex: "#fbbf24",
    defaultWidthFt: 28,
    defaultHeightFt: 20,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  office: {
    label: "Office",
    fillHex: "rgba(96, 165, 250, 0.18)",
    strokeHex: "#60a5fa",
    defaultWidthFt: 10,
    defaultHeightFt: 10,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  laundry: {
    label: "Laundry",
    fillHex: "rgba(94, 234, 212, 0.14)",
    strokeHex: "#5eead4",
    defaultWidthFt: 6,
    defaultHeightFt: 8,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  garage: {
    label: "Garage",
    fillHex: "rgba(113, 113, 122, 0.18)",
    strokeHex: "#9ca3af",
    defaultWidthFt: 22,
    defaultHeightFt: 22,
    countsAsHeated: false,
    isBedroom: false,
    bathContribution: 0,
  },
  closet: {
    label: "Closet",
    fillHex: "rgba(113, 113, 122, 0.14)",
    strokeHex: "#71717a",
    defaultWidthFt: 5,
    defaultHeightFt: 6,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  hallway: {
    label: "Hallway",
    fillHex: "rgba(113, 113, 122, 0.12)",
    strokeHex: "#71717a",
    defaultWidthFt: 4,
    defaultHeightFt: 12,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
  other: {
    label: "Other",
    fillHex: "rgba(161, 161, 170, 0.16)",
    strokeHex: "#a1a1aa",
    defaultWidthFt: 10,
    defaultHeightFt: 10,
    countsAsHeated: true,
    isBedroom: false,
    bathContribution: 0,
  },
};
