"use client";

/**
 * FloorPlanEditor — interactive 2D floor plan canvas built on react-konva.
 *
 * Loaded via next/dynamic with ssr:false from VisualizationPanel because
 * konva needs a real DOM canvas — static-exported HTML can't render it
 * server-side.
 *
 * Interactions:
 *   - Click a room-type chip in the toolbar → enters "add mode"
 *   - Click inside the building outline → drops a room of the chosen
 *     type at that point + selects it
 *   - Click a room → select it (Transformer handles appear)
 *   - Drag a selected room → move (constrained to building bounds)
 *   - Drag a Transformer corner/edge → resize (4 ft minimum)
 *   - "Doorway on side: + north/east/south/west" in the props panel →
 *     add a 3 ft dashed opening on that wall
 *   - Click an opening chip → remove it
 *   - Delete / Backspace key → remove selected room
 *   - Escape → exit add mode / deselect
 */

import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";

import { useWizard } from "@/components/wizard/WizardProvider";
import {
  clampRoomToBuilding,
  makeRoom,
  newId,
} from "@/lib/services/floor-plan-utils";
import type {
  Opening,
  Room,
  RoomSide,
  RoomType,
} from "@/lib/types/floor-plan";
import { ROOM_TYPES } from "@/lib/types/floor-plan";

const TOOLBAR_TYPES: RoomType[] = [
  "bedroom",
  "bathroom",
  "half-bath",
  "kitchen",
  "living",
  "great-room",
  "office",
  "garage",
  "laundry",
  "closet",
  "hallway",
];

const STAGE_PADDING_PX = 24;
const MIN_ROOM_FT = 4;

export default function FloorPlanEditor() {
  const { config, patchFloorPlan } = useWizard();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<RoomType | null>(null);

  const rooms = config.floorPlan.rooms;
  const selectedRoom = rooms.find((r) => r.id === selectedId) ?? null;
  const buildingW = Math.max(8, config.shell.widthFt);
  const buildingL = Math.max(8, config.shell.lengthFt);

  // ResizeObserver — re-measure the canvas container on window resize.
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      setSize({
        width: e.contentRect.width,
        height: e.contentRect.height,
      });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Pixels-per-foot that fits the building inside the canvas with padding.
  const { pxPerFt, originX, originY } = useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return { pxPerFt: 10, originX: 24, originY: 24 };
    }
    const availW = size.width - STAGE_PADDING_PX * 2;
    const availH = size.height - STAGE_PADDING_PX * 2;
    const pf = Math.max(2, Math.min(availW / buildingW, availH / buildingL));
    const usedW = buildingW * pf;
    const usedH = buildingL * pf;
    return {
      pxPerFt: pf,
      originX: (size.width - usedW) / 2,
      originY: (size.height - usedH) / 2,
    };
  }, [size, buildingW, buildingL]);

  // Keep the Konva Transformer attached to the currently-selected room.
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (selectedId) {
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedId, rooms.length]);

  // Keyboard shortcuts — Delete to remove selection, Esc to exit add mode.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        patchFloorPlan({ rooms: rooms.filter((r) => r.id !== selectedId) });
        setSelectedId(null);
        e.preventDefault();
      } else if (e.key === "Escape") {
        setAddMode(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, rooms, patchFloorPlan]);

  // Stage click — add room in add mode, otherwise deselect.
  // Handler covers both mouse (onClick) and touch (onTap) — same logic.
  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (!clickedOnEmpty) return;
    if (addMode) {
      const stage = stageRef.current;
      const pt = stage?.getPointerPosition();
      if (!pt) return;
      const xFt = (pt.x - originX) / pxPerFt;
      const yFt = (pt.y - originY) / pxPerFt;
      const meta = ROOM_TYPES[addMode];
      const candidate = makeRoom(
        addMode,
        Math.max(0, xFt - meta.defaultWidthFt / 2),
        Math.max(0, yFt - meta.defaultHeightFt / 2),
      );
      const clamped = clampRoomToBuilding(candidate, buildingW, buildingL);
      patchFloorPlan({ rooms: [...rooms, clamped] });
      setSelectedId(clamped.id);
      setAddMode(null);
    } else {
      setSelectedId(null);
    }
  };

  const updateRoom = useCallback(
    (id: string, updates: Partial<Room>) => {
      patchFloorPlan({
        rooms: rooms.map((r) => {
          if (r.id !== id) return r;
          return clampRoomToBuilding(
            { ...r, ...updates },
            buildingW,
            buildingL,
          );
        }),
      });
    },
    [rooms, patchFloorPlan, buildingW, buildingL],
  );

  const deleteRoom = useCallback(
    (id: string) => {
      patchFloorPlan({ rooms: rooms.filter((r) => r.id !== id) });
      setSelectedId(null);
    },
    [rooms, patchFloorPlan],
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <Toolbar
        addMode={addMode}
        onSetAddMode={setAddMode}
        hasSelection={!!selectedRoom}
        onDeleteSelection={() => selectedRoom && deleteRoom(selectedRoom.id)}
      />

      {/* ── Konva canvas ────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 bg-zinc-950/60 relative overflow-hidden"
        style={{ cursor: addMode ? "crosshair" : "default" }}
      >
        {size.width > 0 && size.height > 0 && (
          <Stage
            ref={stageRef}
            width={size.width}
            height={size.height}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              {/* Building outline */}
              <Rect
                x={originX}
                y={originY}
                width={buildingW * pxPerFt}
                height={buildingL * pxPerFt}
                fill="rgba(0,0,0,0.30)"
                stroke="#fbbf24"
                strokeWidth={3}
                listening={false}
              />
              {/* Building label */}
              <Text
                x={originX}
                y={originY - 18}
                text={`${buildingW}' × ${buildingL}' building footprint`}
                fill="#fbbf24"
                fontSize={11}
                fontStyle="bold"
                listening={false}
              />

              {/* Rooms */}
              {rooms.map((room) => (
                <RoomNode
                  key={room.id}
                  room={room}
                  originX={originX}
                  originY={originY}
                  pxPerFt={pxPerFt}
                  buildingW={buildingW}
                  buildingL={buildingL}
                  selected={room.id === selectedId}
                  onSelect={() => setSelectedId(room.id)}
                  onChange={(u) => updateRoom(room.id, u)}
                />
              ))}

              {/* Transformer (attached to selected room) */}
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                anchorSize={9}
                anchorStroke="#fbbf24"
                anchorFill="#fbbf24"
                anchorCornerRadius={2}
                borderStroke="#fbbf24"
                borderDash={[6, 4]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (
                    newBox.width < pxPerFt * MIN_ROOM_FT ||
                    newBox.height < pxPerFt * MIN_ROOM_FT
                  ) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        )}

        {/* Empty-state hint */}
        {rooms.length === 0 && size.width > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6">
              <p className="text-zinc-400 font-medium text-sm">
                Start by adding a room
              </p>
              <p className="text-zinc-500 text-xs mt-1 max-w-xs">
                Pick a room type from the toolbar, then click inside the
                amber building outline.
              </p>
            </div>
          </div>
        )}

        {/* Add-mode indicator */}
        {addMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium ring-1 ring-amber-500/40 backdrop-blur">
            Click inside the building to place a{" "}
            {ROOM_TYPES[addMode].label.toLowerCase()}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddMode(null);
              }}
              className="ml-2 text-amber-300 hover:text-amber-100"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Room properties panel ───────────────────────────── */}
      {selectedRoom && (
        <RoomPropertiesPanel
          room={selectedRoom}
          onChange={(u) => updateRoom(selectedRoom.id, u)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────────────────

function Toolbar(props: {
  addMode: RoomType | null;
  onSetAddMode: (t: RoomType | null) => void;
  hasSelection: boolean;
  onDeleteSelection: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-2 bg-zinc-950/60 border-b border-zinc-800 overflow-x-auto shrink-0">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold shrink-0">
        Add room
      </span>
      {TOOLBAR_TYPES.map((type) => {
        const meta = ROOM_TYPES[type];
        const active = props.addMode === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => props.onSetAddMode(active ? null : type)}
            className={[
              "shrink-0 px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap",
              active
                ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700",
            ].join(" ")}
            style={{
              borderLeftWidth: 3,
              borderLeftStyle: "solid",
              borderLeftColor: meta.strokeHex,
            }}
          >
            {meta.label}
          </button>
        );
      })}
      <div className="flex-1" />
      {props.hasSelection && (
        <button
          type="button"
          onClick={props.onDeleteSelection}
          className="shrink-0 px-2 py-1 text-[11px] font-medium rounded-md bg-red-500/15 text-red-300 hover:bg-red-500/25 ring-1 ring-red-500/30"
        >
          Delete room
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Room node (Konva)
// ─────────────────────────────────────────────────────────────────────────

function RoomNode(props: {
  room: Room;
  originX: number;
  originY: number;
  pxPerFt: number;
  selected: boolean;
  buildingW: number;
  buildingL: number;
  onSelect: () => void;
  onChange: (u: Partial<Room>) => void;
}) {
  const {
    room,
    originX,
    originY,
    pxPerFt,
    selected,
    buildingW,
    buildingL,
  } = props;
  const meta = ROOM_TYPES[room.type];
  const w = room.widthFt * pxPerFt;
  const h = room.heightFt * pxPerFt;
  const groupRef = useRef<Konva.Group | null>(null);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const bx = originX;
    const by = originY;
    const maxX = originX + buildingW * pxPerFt - w;
    const maxY = originY + buildingL * pxPerFt - h;
    if (node.x() < bx) node.x(bx);
    if (node.y() < by) node.y(by);
    if (node.x() > maxX) node.x(maxX);
    if (node.y() > maxY) node.y(maxY);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = (e.target.x() - originX) / pxPerFt;
    const newY = (e.target.y() - originY) / pxPerFt;
    props.onChange({ xFt: Math.max(0, newX), yFt: Math.max(0, newY) });
  };

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const newWidth = Math.max(pxPerFt * MIN_ROOM_FT, w * scaleX);
    const newHeight = Math.max(pxPerFt * MIN_ROOM_FT, h * scaleY);
    props.onChange({
      xFt: Math.max(0, (node.x() - originX) / pxPerFt),
      yFt: Math.max(0, (node.y() - originY) / pxPerFt),
      widthFt: newWidth / pxPerFt,
      heightFt: newHeight / pxPerFt,
    });
  };

  const wallSegments = useMemo(
    () => buildWallSegments(room, w, h),
    [room, w, h],
  );

  const labelFontSize = Math.max(9, Math.min(13, pxPerFt * 1.0));

  return (
    <Group
      ref={groupRef}
      id={room.id}
      x={originX + room.xFt * pxPerFt}
      y={originY + room.yFt * pxPerFt}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={(e) => {
        e.cancelBubble = true;
        props.onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        props.onSelect();
      }}
    >
      {/* Fill rect (hit detection + room color) */}
      <Rect width={w} height={h} fill={meta.fillHex} cornerRadius={2} />

      {/* Walls + openings (solid + dashed segments) */}
      {wallSegments.map((seg, i) => (
        <Line
          key={`seg-${i}`}
          points={seg.points}
          stroke={meta.strokeHex}
          strokeWidth={selected ? 4 : 3}
          dash={seg.dashed ? [Math.max(4, pxPerFt * 0.8), Math.max(3, pxPerFt * 0.5)] : undefined}
          lineCap="square"
          listening={false}
        />
      ))}

      {/* Label */}
      <Text
        x={5}
        y={5}
        text={`${room.label}\n${Math.round(room.widthFt)}'×${Math.round(room.heightFt)}' (${Math.round(room.widthFt * room.heightFt)} sf)`}
        fill={selected ? "#fff" : "#e5e7eb"}
        fontSize={labelFontSize}
        lineHeight={1.25}
        listening={false}
      />
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Wall + opening segment computation
// ─────────────────────────────────────────────────────────────────────────

interface WallSegment {
  points: number[];
  dashed: boolean;
}

function buildWallSegments(
  room: Room,
  wPx: number,
  hPx: number,
): WallSegment[] {
  const segments: WallSegment[] = [];

  const sideSpec: Record<
    RoomSide,
    { lengthFt: number; start: [number, number]; end: [number, number] }
  > = {
    north: { lengthFt: room.widthFt, start: [0, 0], end: [wPx, 0] },
    east: { lengthFt: room.heightFt, start: [wPx, 0], end: [wPx, hPx] },
    south: { lengthFt: room.widthFt, start: [0, hPx], end: [wPx, hPx] },
    west: { lengthFt: room.heightFt, start: [0, 0], end: [0, hPx] },
  };

  const sides: RoomSide[] = ["north", "east", "south", "west"];
  for (const side of sides) {
    const { lengthFt, start, end } = sideSpec[side];
    const openings = room.openings
      .filter((o) => o.side === side)
      .sort((a, b) => a.positionFt - b.positionFt);

    if (openings.length === 0) {
      segments.push({ points: [...start, ...end], dashed: false });
      continue;
    }

    let cursorFt = 0;
    for (const op of openings) {
      const startFt = Math.max(0, Math.min(lengthFt, op.positionFt));
      const endFt = Math.max(startFt, Math.min(lengthFt, op.positionFt + op.widthFt));

      if (startFt > cursorFt) {
        segments.push({
          points: [
            ...lerp(start, end, cursorFt / lengthFt),
            ...lerp(start, end, startFt / lengthFt),
          ],
          dashed: false,
        });
      }
      // Opening (dashed)
      segments.push({
        points: [
          ...lerp(start, end, startFt / lengthFt),
          ...lerp(start, end, endFt / lengthFt),
        ],
        dashed: true,
      });
      cursorFt = endFt;
    }
    if (cursorFt < lengthFt) {
      segments.push({
        points: [
          ...lerp(start, end, cursorFt / lengthFt),
          ...end,
        ],
        dashed: false,
      });
    }
  }

  return segments;
}

function lerp(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ─────────────────────────────────────────────────────────────────────────
// Room properties panel — HTML overlay below the canvas
// ─────────────────────────────────────────────────────────────────────────

function RoomPropertiesPanel(props: {
  room: Room;
  onChange: (u: Partial<Room>) => void;
}) {
  const { room, onChange } = props;

  const addOpening = (side: RoomSide) => {
    const wallLength =
      side === "north" || side === "south" ? room.widthFt : room.heightFt;
    const newOp: Opening = {
      id: newId("op"),
      side,
      positionFt: Math.max(0, wallLength / 2 - 1.5),
      widthFt: 3,
      kind: "door",
    };
    onChange({ openings: [...room.openings, newOp] });
  };

  const removeOpening = (id: string) => {
    onChange({ openings: room.openings.filter((o) => o.id !== id) });
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/70 px-3 py-2 shrink-0 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Type
          </span>
          <select
            value={room.type}
            onChange={(e) =>
              onChange({ type: e.target.value as RoomType })
            }
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
          >
            {Object.entries(ROOM_TYPES).map(([t, m]) => (
              <option key={t} value={t}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Name
          </span>
          <input
            type="text"
            value={room.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Width (ft)
          </span>
          <input
            type="number"
            value={Math.round(room.widthFt)}
            onChange={(e) =>
              onChange({ widthFt: Math.max(MIN_ROOM_FT, Number(e.target.value) || MIN_ROOM_FT) })
            }
            min={MIN_ROOM_FT}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 font-mono"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Depth (ft)
          </span>
          <input
            type="number"
            value={Math.round(room.heightFt)}
            onChange={(e) =>
              onChange({ heightFt: Math.max(MIN_ROOM_FT, Number(e.target.value) || MIN_ROOM_FT) })
            }
            min={MIN_ROOM_FT}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 font-mono"
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 lg:min-w-[200px]">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Doorway on side
        </span>
        <div className="flex gap-1 flex-wrap">
          {(["north", "east", "south", "west"] as RoomSide[]).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => addOpening(side)}
              className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 capitalize"
            >
              + {side}
            </button>
          ))}
        </div>
        {room.openings.length > 0 && (
          <div className="text-[10px] text-zinc-500 flex flex-wrap gap-1 items-center">
            <span>{room.openings.length} opening{room.openings.length !== 1 ? "s" : ""}:</span>
            {room.openings.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => removeOpening(op.id)}
                className="px-1.5 py-0.5 rounded bg-zinc-800/70 text-zinc-400 hover:bg-red-500/20 hover:text-red-300 font-mono"
                title="Click to remove this opening"
              >
                {op.side[0].toUpperCase()} @ {op.positionFt.toFixed(0)}-{(op.positionFt + op.widthFt).toFixed(0)}ft ×
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
