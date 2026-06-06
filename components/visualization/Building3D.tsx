"use client";

/**
 * BuildingMesh — procedural three.js geometry generated from BuildingConfig.
 *
 * Phase 2.1 (current): shell box (when enclosed), gable roof prism, bay
 * posts spaced per shell.numberOfBays, slab + ground reference.
 *
 * Phase 2.2 (next): single-slope/gambrel/monitor roof profiles, door +
 * window cutouts, porches/lean-tos as extending geometry, foundation
 * detail (slab vs crawlspace vs stem-wall).
 *
 * Units: 1 three.js unit = 1 foot. The scene is centered at the origin
 * with the building footprint flat on the XZ plane (Y is up).
 */

import { useMemo } from "react";
import * as THREE from "three";

import type { BuildingConfig } from "@/lib/types/building-config";

import { resolveColor } from "./colors";

interface Props {
  config: BuildingConfig;
}

export function BuildingMesh({ config }: Props) {
  const { shell, exteriorFinish } = config;
  const w = Math.max(4, shell.widthFt);
  const L = Math.max(4, shell.lengthFt);
  const h = Math.max(4, shell.eaveHeightFt);
  const peakH = Math.max(h, shell.peakHeightFt);
  const ridgeRise = Math.max(0.1, peakH - h);

  // Gable roof = triangular prism extruded along the length (Z) axis.
  // Other profiles fall back to gable for the Phase 2.1 scaffold.
  const roofGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 1, 0); // slight overhang each side
    shape.lineTo(0, ridgeRise);
    shape.lineTo(w / 2 + 1, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: L + 2, // gable overhang on the front + back
      bevelEnabled: false,
    });
  }, [w, L, ridgeRise]);

  // Bay posts along both long walls at numberOfBays intervals.
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
  // Roof color — for now hardcoded standard dark metal. Phase 2.2 will
  // wire a roof-color field through the config.
  const roofHex = "#2a2a2e";
  const postHex = "#27272a";
  const slabHex = "#71717a";

  return (
    <group>
      {/* Ground reference — large dark plane so the building isn't floating */}
      <mesh
        position={[0, -0.05, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[w * 3, L * 3]} />
        <meshStandardMaterial color="#0e0e10" />
      </mesh>

      {/* Foundation slab (visible footprint) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w, 0.1, L]} />
        <meshStandardMaterial color={slabHex} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Walls — only rendered when enclosed */}
      {shell.enclosed && (
        <>
          {/* Front wall (z = -L/2) */}
          <mesh position={[0, h / 2, -L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          {/* Back wall (z = +L/2) */}
          <mesh position={[0, h / 2, L / 2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.3]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          {/* Left wall (x = -w/2) */}
          <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, h, L]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>
          {/* Right wall (x = +w/2) */}
          <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, h, L]} />
            <meshStandardMaterial
              color={sidingHex}
              metalness={0.45}
              roughness={0.55}
            />
          </mesh>

          {/* Gable end fills (triangles closing the roof at front + back) */}
          {[-L / 2 - 0.05, L / 2 + 0.05].map((z, i) => (
            <mesh key={`gable-${i}`} position={[0, h, z]}>
              <shapeGeometry
                args={[
                  (() => {
                    const s = new THREE.Shape();
                    s.moveTo(-w / 2, 0);
                    s.lineTo(0, ridgeRise);
                    s.lineTo(w / 2, 0);
                    s.closePath();
                    return s;
                  })(),
                ]}
              />
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

      {/* Roof — gable prism, slight overhang on all four edges */}
      <mesh
        geometry={roofGeometry}
        position={[0, h, -L / 2 - 1]}
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

      {/* Bay posts — always visible (the structural rhythm the customer
          sees as they change the bay count). */}
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
    </group>
  );
}
