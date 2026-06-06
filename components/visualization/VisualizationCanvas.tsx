"use client";

/**
 * The r3f <Canvas> wrapper. Imported via next/dynamic with ssr: false from
 * VisualizationPanel so three.js never touches the SSR pass (it needs a
 * real DOM / WebGL context).
 */

import { OrbitControls } from "@react-three/drei";
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

  return (
    <Canvas
      shadows
      camera={{
        position: [camDist, camDist * 0.75, camDist * 1.1],
        fov: 35,
        near: 0.5,
        far: camDist * 6,
      }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#09090b"]} />
      <fog
        attach="fog"
        args={["#09090b", camDist * 1.5, camDist * 5]}
      />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[longestEdge, longestEdge * 1.5, longestEdge * 0.6]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={longestEdge * 5}
        shadow-camera-left={-longestEdge * 1.5}
        shadow-camera-right={longestEdge * 1.5}
        shadow-camera-top={longestEdge * 1.5}
        shadow-camera-bottom={-longestEdge * 1.5}
      />
      {/* Fill light to lift the shadow side a touch */}
      <directionalLight
        position={[-longestEdge, longestEdge * 0.5, -longestEdge * 0.4]}
        intensity={0.4}
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
