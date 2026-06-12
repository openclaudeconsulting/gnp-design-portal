"use client";

/**
 * BuildingMesh — procedural three.js geometry generated from BuildingConfig.
 *
 * Renders the building per-bay so customers can pick which bays are
 * enclosed (walls around them) and which are open (roof only). For every
 * enclosed bay we draw a long-wall segment on each side, plus an
 * interior dividing wall wherever an enclosed bay meets an open one.
 * The two gable-end walls (front and back) only render when their
 * respective end bay is enclosed. The roof and bay posts always render.
 *
 * Door + window markers are only drawn on wall segments that actually
 * exist (i.e. their containing bay is enclosed). Openings that land in
 * an open bay are skipped silently.
 *
 * Units: 1 three.js unit = 1 foot. Scene centered at the origin with the
 * building footprint flat on the XZ plane (Y is up). Bays run along Z
 * from -L/2 (front, bay 0) to +L/2 (back, bay N-1).
 */

import { Fragment, useMemo } from "react";
import * as THREE from "three";

import { getEnclosureSummary } from "@/lib/services/enclosure-utils";
import type {
  BuildingConfig,
  OverheadDoor,
  EntryDoor,
  RoofMaterial,
  SidingType,
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

// ── Material lookups ────────────────────────────────────────────────────

interface PbrProps {
  color: string;
  metalness: number;
  roughness: number;
}

function roofMaterialProps(material: RoofMaterial, baseHex: string): PbrProps {
  switch (material) {
    case "standing-seam-metal":
      return { color: baseHex, metalness: 0.88, roughness: 0.22 };
    case "exposed-fastener-metal":
      return { color: baseHex, metalness: 0.78, roughness: 0.4 };
    case "shingle":
      return { color: "#3a3530", metalness: 0.04, roughness: 0.85 };
  }
}

function wallMaterialProps(siding: SidingType, baseHex: string): PbrProps {
  switch (siding) {
    case "vertical-metal":
      return { color: baseHex, metalness: 0.78, roughness: 0.32 };
    case "board-and-batten":
      return { color: baseHex, metalness: 0.04, roughness: 0.72 };
    case "wood-cedar-accent":
      return { color: baseHex, metalness: 0.03, roughness: 0.62 };
  }
}

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
  const N = Math.max(1, shell.numberOfBays);
  const bayLength = L / N;
  const enclosure = getEnclosureSummary(shell.bayEnclosures);

  // Helper — for an opening on a left/right wall at positionFt from the
  // front, return the bay index it sits in. Front/back walls only have
  // one bay's worth (the end bay).
  const bayAtPositionAlongLength = (positionFt: number) => {
    return Math.max(0, Math.min(N - 1, Math.floor(positionFt / bayLength)));
  };
  const isOpeningWallEnclosed = (op: {
    wall: Wall;
    positionFt: number;
    widthFt: number;
  }) => {
    if (op.wall === "front") return shell.bayEnclosures[0] ?? false;
    if (op.wall === "back")
      return shell.bayEnclosures[N - 1] ?? false;
    const center = op.positionFt + op.widthFt / 2;
    return shell.bayEnclosures[bayAtPositionAlongLength(center)] ?? false;
  };

  // Roof geometry — switches per profile
  const roofGeometry = useMemo(
    () => makeRoofGeometry(w, L, ridgeRise, roof.profile),
    [w, L, ridgeRise, roof.profile],
  );

  // Gable-end fill shape
  const gableEndShape = useMemo(
    () => makeGableEndShape(w, ridgeRise, roof.profile),
    [w, ridgeRise, roof.profile],
  );

  // Bay posts along both long walls at numberOfBays intervals
  const postPositions = useMemo(() => {
    const posts: [number, number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const z = -L / 2 + (i / N) * L;
      posts.push([-w / 2, h / 2, z]);
      posts.push([w / 2, h / 2, z]);
    }
    return posts;
  }, [w, L, h, N]);

  // Interior dividing walls — at every boundary where bayEnclosures[i]
  // differs from bayEnclosures[i+1] (an enclosed bay meets an open bay).
  const dividerZPositions = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      if (shell.bayEnclosures[i] !== shell.bayEnclosures[i + 1]) {
        out.push(-L / 2 + (i + 1) * bayLength);
      }
    }
    return out;
  }, [N, L, bayLength, shell.bayEnclosures]);

  const sidingHex = resolveColor(exteriorFinish.sidingColor, "#9ca3af");
  const roofHex = "#2a2a2e";
  const slabHex = "#71717a";

  const wallMat = wallMaterialProps(exteriorFinish.sidingType, sidingHex);
  const roofMat = roofMaterialProps(roof.material, roofHex);
  const postMat: PbrProps = {
    color: "#3a3a40",
    metalness: 0.85,
    roughness: 0.35,
  };

  const dirtPadW = w + 30;
  const dirtPadL = L + 30;
  const grassExtent = Math.max(w, L) * 8;

  // Compact JSX helper for a wall meshStandardMaterial
  const WallMaterial = (
    <meshStandardMaterial
      color={wallMat.color}
      metalness={wallMat.metalness}
      roughness={wallMat.roughness}
      envMapIntensity={1.1}
    />
  );
  const WallMaterialDoubleSide = (
    <meshStandardMaterial
      color={wallMat.color}
      metalness={wallMat.metalness}
      roughness={wallMat.roughness}
      envMapIntensity={1.1}
      side={THREE.DoubleSide}
    />
  );

  // End-bay flags (for gable walls + fills + perimeter openings)
  const frontEndEnclosed = shell.bayEnclosures[0] ?? false;
  const backEndEnclosed = shell.bayEnclosures[N - 1] ?? false;

  return (
    <group>
      {/* Far ground — pasture grass */}
      <mesh
        position={[0, -0.12, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[grassExtent, grassExtent]} />
        <meshStandardMaterial color="#6a7b4a" roughness={1} />
      </mesh>

      {/* Cleared dirt pad */}
      <mesh
        position={[0, -0.05, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[dirtPadW, dirtPadL]} />
        <meshStandardMaterial color="#8a6e4b" roughness={1} />
      </mesh>

      {/* Foundation slab — only when the customer has picked one.
          "none" = bare dirt / gravel pad (open pole barn default). */}
      {config.foundation.type !== "none" && (
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[w, 0.1, L]} />
          <meshStandardMaterial color={slabHex} roughness={0.9} metalness={0.05} />
        </mesh>
      )}

      {/* ── Long-wall segments — one per enclosed bay ──────────────── */}
      {shell.bayEnclosures.map((enclosed, i) => {
        if (!enclosed) return null;
        const zCenter = -L / 2 + (i + 0.5) * bayLength;
        return (
          <Fragment key={`bay-walls-${i}`}>
            {/* Left long wall segment (at x = -w/2) */}
            <mesh
              position={[-w / 2, h / 2, zCenter]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.3, h, bayLength]} />
              {WallMaterial}
            </mesh>
            {/* Right long wall segment (at x = +w/2) */}
            <mesh
              position={[w / 2, h / 2, zCenter]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.3, h, bayLength]} />
              {WallMaterial}
            </mesh>
          </Fragment>
        );
      })}

      {/* ── Front gable wall (z = -L/2) ────────────────────────────── */}
      {frontEndEnclosed && (
        <>
          <mesh position={[0, h / 2, -L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            {WallMaterial}
          </mesh>
          {/* Gable-end fill (triangle/pentagon closing the roof) */}
          <mesh position={[0, h, -L / 2 - 0.05]}>
            <shapeGeometry args={[gableEndShape]} />
            {WallMaterialDoubleSide}
          </mesh>
        </>
      )}

      {/* ── Back gable wall (z = +L/2) ─────────────────────────────── */}
      {backEndEnclosed && (
        <>
          <mesh position={[0, h / 2, L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            {WallMaterial}
          </mesh>
          <mesh
            position={[0, h, L / 2 + 0.05]}
            rotation={[0, Math.PI, 0]}
          >
            <shapeGeometry args={[gableEndShape]} />
            {WallMaterialDoubleSide}
          </mesh>
        </>
      )}

      {/* ── Interior dividing walls (enclosed ↔ open boundaries) ──── */}
      {dividerZPositions.map((z, i) => (
        <mesh
          key={`divider-${i}`}
          position={[0, h / 2, z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w, h, 0.3]} />
          {WallMaterial}
        </mesh>
      ))}

      {/* Roof — covers the WHOLE footprint regardless of enclosure */}
      <mesh
        geometry={roofGeometry}
        position={[0, h, -L / 2 - ROOF_CONSTANTS.GABLE_OVERHANG_FT]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={roofMat.color}
          metalness={roofMat.metalness}
          roughness={roofMat.roughness}
          envMapIntensity={1.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bay posts — always visible */}
      {postPositions.map((pos, i) => (
        <mesh key={`post-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.55, h, 0.55]} />
          <meshStandardMaterial
            color={postMat.color}
            metalness={postMat.metalness}
            roughness={postMat.roughness}
            envMapIntensity={0.9}
          />
        </mesh>
      ))}

      {/* Openings — only render on walls that actually exist */}
      {enclosure.anyEnclosed && (
        <>
          {config.openings.overheadDoors
            .filter(isOpeningWallEnclosed)
            .map((d, i) => (
              <DoorMarker
                key={`oh-${i}`}
                opening={d}
                building={{ w, L, h }}
                color="#0a0a0a"
                variant="overhead"
              />
            ))}
          {config.openings.entryDoors
            .filter(isOpeningWallEnclosed)
            .map((d, i) => (
              <DoorMarker
                key={`ed-${i}`}
                opening={d}
                building={{ w, L, h }}
                color="#3b2418"
                variant="entry"
              />
            ))}
          {config.openings.windows
            .filter(isOpeningWallEnclosed)
            .map((wnd, i) => (
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
// Door + window markers
// ─────────────────────────────────────────────────────────────────────────

interface OpeningGeom {
  position: [number, number, number];
  rotation: [number, number, number];
}

const WALL_OFFSET = 0.18;

function openingTransform(
  wall: Wall,
  positionFt: number,
  widthFt: number,
  heightFt: number,
  b: { w: number; L: number; h: number },
  yLiftFt = 0.5,
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
    0.05,
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[opening.widthFt, opening.heightFt]} />
        <meshStandardMaterial
          color={color}
          metalness={variant === "overhead" ? 0.6 : 0.2}
          roughness={variant === "overhead" ? 0.4 : 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry
          args={[opening.widthFt + 0.4, opening.heightFt + 0.4]}
        />
        <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
      </mesh>
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
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry
          args={[opening.widthFt + 0.3, opening.heightFt + 0.3]}
        />
        <meshStandardMaterial color="#f5f5f5" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.08, opening.heightFt]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Porch / lean-to / carport addition
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
          : "#6b4f3a";

  const postSpacing = 10;
  const postCount = Math.max(2, Math.ceil(pw / postSpacing) + 1);
  const postPositions: [number, number, number][] = [];
  for (let i = 0; i < postCount; i++) {
    const xFrac = postCount === 1 ? 0.5 : i / (postCount - 1);
    const x = -pw / 2 + xFrac * pw;
    postPositions.push([x, porchEaveH / 2, -pd / 2 + 0.2]);
  }

  const showStoneBase = porch.postStyle === "timber-on-stone-base";

  return (
    <group position={groupPos} rotation={groupRot}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[pw, 0.1, pd]} />
        <meshStandardMaterial color="#838383" roughness={0.85} />
      </mesh>

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

      <mesh
        position={[0, porchEaveH, 0]}
        rotation={[Math.PI / 36, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pw + 0.5, roofThickness, pd + 0.5]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
