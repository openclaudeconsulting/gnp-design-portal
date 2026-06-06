"use client";

/**
 * BuildingMesh — procedural three.js geometry generated from BuildingConfig.
 *
 * Phase 2.2 (current): all four roof profiles (gable / single-slope /
 * gambrel / monitor), door + window markers on walls, porches/lean-tos
 * as extending geometry.
 *
 * Phase 2.3 (next): 2D floor plan editor on the sibling tab.
 *
 * Units: 1 three.js unit = 1 foot. Scene centered at the origin with the
 * building footprint flat on the XZ plane (Y is up).
 */

import { useMemo } from "react";
import * as THREE from "three";

import type {
  BuildingConfig,
  OverheadDoor,
  EntryDoor,
  Window as Wnd,
  Porch,
  Wall,
} from "@/lib/types/building-config";

import { resolveColor } from "./colors";
import {
  makeGableEndShape,
  makeRoofGeometry,
  ROOF_CONSTANTS,
} from "./roofGeometry";

interface Props {
  config: BuildingConfig;
}

export function BuildingMesh({ config }: Props) {
  const { shell, roof, exteriorFinish } = config;
  const w = Math.max(4, shell.widthFt);
  const L = Math.max(4, shell.lengthFt);
  const h = Math.max(4, shell.eaveHeightFt);
  const peakH = Math.max(h, shell.peakHeightFt);
  const ridgeRise = Math.max(0.1, peakH - h);

  // Roof geometry — switches per profile (gable / single-slope / gambrel / monitor)
  const roofGeometry = useMemo(
    () => makeRoofGeometry(w, L, ridgeRise, roof.profile),
    [w, L, ridgeRise, roof.profile],
  );

  // Gable-end fill shape — same cross-section, without the eave overhang
  const gableEndShape = useMemo(
    () => makeGableEndShape(w, ridgeRise, roof.profile),
    [w, ridgeRise, roof.profile],
  );

  // Bay posts along both long walls at numberOfBays intervals
  const postPositions = useMemo(() => {
    const posts: [number, number, number][] = [];
    const intervals = Math.max(1, shell.numberOfBays);
    for (let i = 0; i <= intervals; i++) {
      const z = -L / 2 + (i / intervals) * L;
      posts.push([-w / 2, h / 2, z]);
      posts.push([w / 2, h / 2, z]);
    }
    return posts;
  }, [w, L, h, shell.numberOfBays]);

  const sidingHex = resolveColor(exteriorFinish.sidingColor, "#9ca3af");
  // Roof color — Phase 2.3+ will read a roof-color field from config.
  // For now use a standard dark metal.
  const roofHex = "#2a2a2e";
  const postHex = "#27272a";
  const slabHex = "#71717a";

  // Ground sizing — large enough that the customer never sees the edge
  // when orbiting around a 60×80 building. Cleared dirt pad (cleared
  // build site) sits directly under the footprint with a slight halo;
  // grass ring extends beyond that to the horizon.
  const dirtPadW = w + 30;
  const dirtPadL = L + 30;
  const grassExtent = Math.max(w, L) * 8;

  return (
    <group>
      {/* Far ground — natural grass / pasture extending to the horizon */}
      <mesh
        position={[0, -0.12, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[grassExtent, grassExtent]} />
        <meshStandardMaterial color="#6a7b4a" roughness={1} />
      </mesh>

      {/* Cleared dirt pad — where the building sits (resembles cleared land
          ready for the build, what the customer would actually see on
          their property after site prep) */}
      <mesh
        position={[0, -0.05, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[dirtPadW, dirtPadL]} />
        <meshStandardMaterial color="#8a6e4b" roughness={1} />
      </mesh>

      {/* Foundation slab (visible footprint) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w, 0.1, L]} />
        <meshStandardMaterial color={slabHex} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Walls — only rendered when enclosed */}
      {shell.enclosed && (
        <>
          {/* Long walls (front + back, along X axis) */}
          <mesh position={[0, h / 2, -L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[0, h / 2, L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          {/* Side walls (left + right, along Z axis) */}
          <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, h, L]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, h, L]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>

          {/* Gable-end fills — triangles/pentagons closing the roof at front + back */}
          {[-L / 2 - 0.05, L / 2 + 0.05].map((z, i) => (
            <mesh
              key={`gable-${i}`}
              position={[0, h, z]}
              rotation={[0, i === 1 ? Math.PI : 0, 0]}
            >
              <shapeGeometry args={[gableEndShape]} />
              <meshStandardMaterial
                color={sidingHex}
                metalness={0.45}
                roughness={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </>
      )}

      {/* Roof — profile-specific extruded prism */}
      <mesh
        geometry={roofGeometry}
        position={[0, h, -L / 2 - ROOF_CONSTANTS.GABLE_OVERHANG_FT]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={roofHex}
          metalness={0.6}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bay posts — always visible (structural rhythm marker) */}
      {postPositions.map((pos, i) => (
        <mesh key={`post-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.55, h, 0.55]} />
          <meshStandardMaterial
            color={postHex}
            metalness={0.7}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Openings — door + window markers on the wall surfaces */}
      {shell.enclosed && (
        <>
          {config.openings.overheadDoors.map((d, i) => (
            <DoorMarker
              key={`oh-${i}`}
              opening={d}
              building={{ w, L, h }}
              color="#0a0a0a"
              variant="overhead"
            />
          ))}
          {config.openings.entryDoors.map((d, i) => (
            <DoorMarker
              key={`ed-${i}`}
              opening={d}
              building={{ w, L, h }}
              color="#3b2418"
              variant="entry"
            />
          ))}
          {config.openings.windows.map((wnd, i) => (
            <WindowMarker
              key={`wn-${i}`}
              opening={wnd}
              building={{ w, L, h }}
            />
          ))}
        </>
      )}

      {/* Additions — porches / lean-tos / carports */}
      {config.additions.porches.map((p, i) => (
        <PorchAddition
          key={`porch-${i}`}
          porch={p}
          building={{ w, L, h }}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Door + window markers — colored rectangles on wall surfaces.
// (Real CSG cutouts are Phase 3 territory — for 2.2 surface markers
// give customers a clear sense of door/window placement without the
// boolean-geometry complexity.)
// ─────────────────────────────────────────────────────────────────────────

interface OpeningGeom {
  position: [number, number, number];
  rotation: [number, number, number];
}

const WALL_OFFSET = 0.18; // distance the marker sits in front of the wall surface

function openingTransform(
  wall: Wall,
  positionFt: number,
  widthFt: number,
  heightFt: number,
  b: { w: number; L: number; h: number },
  yLiftFt = 0.5, // distance above the slab
): OpeningGeom {
  const xCenter = positionFt + widthFt / 2;
  const yCenter = yLiftFt + heightFt / 2;

  switch (wall) {
    case "front":
      return {
        position: [-b.w / 2 + xCenter, yCenter, -b.L / 2 - WALL_OFFSET],
        rotation: [0, 0, 0],
      };
    case "back":
      return {
        position: [b.w / 2 - xCenter, yCenter, b.L / 2 + WALL_OFFSET],
        rotation: [0, Math.PI, 0],
      };
    case "left":
      return {
        position: [-b.w / 2 - WALL_OFFSET, yCenter, b.L / 2 - xCenter],
        rotation: [0, -Math.PI / 2, 0],
      };
    case "right":
      return {
        position: [b.w / 2 + WALL_OFFSET, yCenter, -b.L / 2 + xCenter],
        rotation: [0, Math.PI / 2, 0],
      };
  }
}

function DoorMarker({
  opening,
  building,
  color,
  variant,
}: {
  opening: OverheadDoor | EntryDoor;
  building: { w: number; L: number; h: number };
  color: string;
  variant: "overhead" | "entry";
}) {
  const { position, rotation } = openingTransform(
    opening.wall,
    opening.positionFt,
    opening.widthFt,
    opening.heightFt,
    building,
    0.05, // doors start at the slab
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Door face */}
      <mesh>
        <planeGeometry args={[opening.widthFt, opening.heightFt]} />
        <meshStandardMaterial
          color={color}
          metalness={variant === "overhead" ? 0.6 : 0.2}
          roughness={variant === "overhead" ? 0.4 : 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Frame trim (slightly larger, lighter color) */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry
          args={[opening.widthFt + 0.4, opening.heightFt + 0.4]}
        />
        <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
      </mesh>
      {/* Horizontal panel divisions for overhead doors */}
      {variant === "overhead" &&
        [0.25, 0.5, 0.75].map((frac) => (
          <mesh
            key={`pnl-${frac}`}
            position={[0, opening.heightFt / 2 - opening.heightFt * frac, 0.005]}
          >
            <planeGeometry args={[opening.widthFt - 0.1, 0.05]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}
    </group>
  );
}

function WindowMarker({
  opening,
  building,
}: {
  opening: Wnd;
  building: { w: number; L: number; h: number };
}) {
  // Windows sit higher up the wall (~3.5 ft to bottom by default) unless
  // they're a two-story or gable-end signature window.
  const isSignature =
    opening.type === "two-story-wall" || opening.type === "gable-end";
  const yLift = isSignature ? 1.5 : 3.5;

  const { position, rotation } = openingTransform(
    opening.wall,
    opening.positionFt,
    opening.widthFt,
    opening.heightFt,
    building,
    yLift,
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Glass pane */}
      <mesh>
        <planeGeometry args={[opening.widthFt, opening.heightFt]} />
        <meshStandardMaterial
          color="#7fb4d8"
          metalness={0.4}
          roughness={0.15}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry
          args={[opening.widthFt + 0.3, opening.heightFt + 0.3]}
        />
        <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
      </mesh>
      {/* Mullion (vertical divider) */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.08, opening.heightFt]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Porch / lean-to / carport addition — extends from one of the four walls.
// ─────────────────────────────────────────────────────────────────────────

function PorchAddition({
  porch,
  building,
}: {
  porch: Porch;
  building: { w: number; L: number; h: number };
}) {
  const { w, L, h } = building;
  const pw = Math.max(2, porch.widthFt);
  const pd = Math.max(2, porch.depthFt);
  const porchEaveH = Math.max(1, h - 1.5);
  const roofThickness = 0.2;

  // Compute the group transform per wall: porch extends OUT from the wall
  // by `pd` feet, centered along the wall.
  let groupPos: [number, number, number];
  let groupRot: [number, number, number] = [0, 0, 0];
  switch (porch.wall) {
    case "front":
      groupPos = [0, 0, -L / 2 - pd / 2];
      break;
    case "back":
      groupPos = [0, 0, L / 2 + pd / 2];
      groupRot = [0, Math.PI, 0];
      break;
    case "left":
      groupPos = [-w / 2 - pd / 2, 0, 0];
      groupRot = [0, Math.PI / 2, 0];
      break;
    case "right":
      groupPos = [w / 2 + pd / 2, 0, 0];
      groupRot = [0, -Math.PI / 2, 0];
      break;
  }

  const postStyleColor =
    porch.postStyle === "cedar"
      ? "#a37b5c"
      : porch.postStyle === "metal"
        ? "#3f3f46"
        : porch.postStyle === "timber-on-stone-base"
          ? "#5a4632"
          : "#6b4f3a"; // wood-square default

  // Posts at 4 corners + intermediate (every ~10ft along the porch width)
  const postSpacing = 10;
  const postCount = Math.max(2, Math.ceil(pw / postSpacing) + 1);
  const postPositions: [number, number, number][] = [];
  for (let i = 0; i < postCount; i++) {
    const xFrac = postCount === 1 ? 0.5 : i / (postCount - 1);
    const x = -pw / 2 + xFrac * pw;
    // Outer edge posts only (porch extends outward, so outer edge is at z = -pd/2 in local space)
    postPositions.push([x, porchEaveH / 2, -pd / 2 + 0.2]);
  }

  // Stone base (for timber-on-stone post style) — short cylinder at base
  const showStoneBase = porch.postStyle === "timber-on-stone-base";

  return (
    <group position={groupPos} rotation={groupRot}>
      {/* Porch slab */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[pw, 0.1, pd]} />
        <meshStandardMaterial color="#838383" roughness={0.85} />
      </mesh>

      {/* Outer-edge posts */}
      {postPositions.map((pos, i) => (
        <group key={`post-${i}`} position={pos}>
          {showStoneBase && (
            <mesh position={[0, -porchEaveH / 2 + 0.5, 0]}>
              <cylinderGeometry args={[0.4, 0.5, 1.0, 12]} />
              <meshStandardMaterial color="#5a5a5a" roughness={0.95} />
            </mesh>
          )}
          <mesh castShadow>
            <boxGeometry args={[0.5, porchEaveH, 0.5]} />
            <meshStandardMaterial color={postStyleColor} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Shed-style roof slab — slopes slightly outward */}
      <mesh
        position={[0, porchEaveH, 0]}
        rotation={[Math.PI / 36, 0, 0]} // ~5° tilt outward
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pw + 0.5, roofThickness, pd + 0.5]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
