"use client";

/**
 * The r3f <Canvas> wrapper. Imported via next/dynamic with ssr: false from
 * VisualizationPanel so three.js never touches the SSR pass (it needs a
 * real DOM / WebGL context).
 */

import { OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import type { BuildingConfig } from "@/lib/types/building-config";

import { BuildingMesh } from "./Building3D";

interface Props {
  config: BuildingConfig;
}

export default function VisualizationCanvas({ config }: Props) {
  // Camera distance scales with building size so the initial framing
  // doesn't crop a 60×80 building or shoot past a 16×20 one.
  const longestEdge = Math.max(
    config.shell.widthFt,
    config.shell.lengthFt,
    20,
  );
  const camDist = longestEdge * 1.5;

  // Sun position — high right, late-morning angle. The directional
  // light is placed at the same world position so shadows align with
  // where the sun visibly is in the sky.
  const sunPos: [number, number, number] = [
    longestEdge * 1.2,
    longestEdge * 1.6,
    longestEdge * 0.8,
  ];

  return (
    <Canvas
      shadows
      camera={{
        position: [camDist, camDist * 0.55, camDist * 1.1],
        fov: 38,
        near: 0.5,
        far: camDist * 8,
      }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Outdoor site lighting */}
      {/* Procedural sky background — gradient from horizon to zenith */}
      <Sky
        distance={45000}
        sunPosition={sunPos}
        inclination={0.49}
        azimuth={0.25}
        turbidity={6}
        rayleigh={1.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Horizon fog — matches a hazy outdoor day so distant edges fade
          softly instead of clipping hard against the sky */}
      <fog attach="fog" args={["#c9d4e4", camDist * 3, camDist * 7]} />

      {/* Ambient: outdoor sun-on-grass-and-sand-bounce fill */}
      <ambientLight intensity={0.7} color="#fff5e1" />

      {/* Hemisphere light — adds the soft warm-sky-vs-cool-ground gradient
          that makes the scene feel like it's really outside */}
      <hemisphereLight
        args={["#a8c8ec", "#8b6f47", 0.55]}
      />

      {/* Direct sun (matches Sky's sunPosition) */}
      <directionalLight
        position={sunPos}
        intensity={1.6}
        color="#fff4d6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={longestEdge * 8}
        shadow-camera-left={-longestEdge * 1.8}
        shadow-camera-right={longestEdge * 1.8}
        shadow-camera-top={longestEdge * 1.8}
        shadow-camera-bottom={-longestEdge * 1.8}
        shadow-bias={-0.0005}
      />

      <Suspense fallback={null}>
        <BuildingMesh config={config} />
      </Suspense>

      <OrbitControls
        target={[0, config.shell.eaveHeightFt / 2, 0]}
        minDistance={Math.max(15, longestEdge * 0.5)}
        maxDistance={longestEdge * 4}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
