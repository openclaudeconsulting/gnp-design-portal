/**
 * Roof geometry generators — one per RoofProfile.
 *
 * Each profile produces:
 *   - makeRoofShape: a 2D cross-section in the XY plane that gets
 *     extruded along Z to form the actual roof prism
 *   - makeRoofGeometry: the extruded BufferGeometry
 *   - makeGableEndShape: same 2D cross-section, used for the front/back
 *     wall fills so the closed shell follows the roof line exactly
 *
 * All coordinates are in FEET. Origin (0, 0) of the shape sits at the
 * EAVE midline — the bottom edge of the cross-section is y=0, with the
 * peak at y=ridgeRise.
 */

import * as THREE from "three";

import type { RoofProfile } from "@/lib/types/building-config";

const EAVE_OVERHANG_FT = 1.0;
const GABLE_OVERHANG_FT = 1.0;

export function makeRoofCrossSection(
  widthFt: number,
  ridgeRiseFt: number,
  profile: RoofProfile,
): THREE.Shape {
  const w = Math.max(4, widthFt);
  const rise = Math.max(0.1, ridgeRiseFt);
  const ox = EAVE_OVERHANG_FT;
  const shape = new THREE.Shape();

  switch (profile) {
    case "gable": {
      // Symmetric triangle peak at center
      shape.moveTo(-w / 2 - ox, 0);
      shape.lineTo(0, rise);
      shape.lineTo(w / 2 + ox, 0);
      shape.closePath();
      break;
    }

    case "single-slope": {
      // Monoslope wedge: high on left, low eave on right.
      // Cross-section is a right triangle with the vertical side on
      // the left.
      shape.moveTo(-w / 2 - ox, 0);
      shape.lineTo(-w / 2 - ox, rise);
      shape.lineTo(w / 2 + ox, 0);
      shape.closePath();
      break;
    }

    case "gambrel": {
      // Barn-style four-sided roof: steeper lower pitch, shallower
      // upper pitch, with knee/break points on each side.
      const kneeX = w * 0.32; // distance from center to break point
      const kneeY = rise * 0.6; // height at break point
      shape.moveTo(-w / 2 - ox, 0);
      shape.lineTo(-kneeX, kneeY);
      shape.lineTo(0, rise);
      shape.lineTo(kneeX, kneeY);
      shape.lineTo(w / 2 + ox, 0);
      shape.closePath();
      break;
    }

    case "monitor": {
      // Raised center gable with two lower side wings (shed-like).
      // Cross-section has three plateaus.
      const shoulderX = w * 0.28; // half-width of the center monitor
      const shoulderY = rise * 0.55; // shoulder (wing top) height
      const peakX = shoulderX * 0.5; // half-width at the peak
      shape.moveTo(-w / 2 - ox, 0);
      shape.lineTo(-shoulderX, shoulderY);
      shape.lineTo(-peakX, rise);
      shape.lineTo(peakX, rise);
      shape.lineTo(shoulderX, shoulderY);
      shape.lineTo(w / 2 + ox, 0);
      shape.closePath();
      break;
    }
  }

  return shape;
}

/**
 * Extruded roof prism — the actual surface that gets rendered. The
 * shape is extruded along the local +Z axis by (lengthFt + 2 ·
 * GABLE_OVERHANG_FT), so the roof overhangs each gable end by
 * GABLE_OVERHANG_FT feet.
 */
export function makeRoofGeometry(
  widthFt: number,
  lengthFt: number,
  ridgeRiseFt: number,
  profile: RoofProfile,
): THREE.ExtrudeGeometry {
  const shape = makeRoofCrossSection(widthFt, ridgeRiseFt, profile);
  return new THREE.ExtrudeGeometry(shape, {
    depth: lengthFt + 2 * GABLE_OVERHANG_FT,
    bevelEnabled: false,
  });
}

/**
 * Gable-end shape — used for the front and back wall fills so the
 * closed building's silhouette matches the roof line.
 *
 * This is the SAME cross-section as makeRoofCrossSection but WITHOUT
 * the eave overhang on the left/right, so it lines up with the wall
 * panels (which have no overhang).
 */
export function makeGableEndShape(
  widthFt: number,
  ridgeRiseFt: number,
  profile: RoofProfile,
): THREE.Shape {
  const w = Math.max(4, widthFt);
  const rise = Math.max(0.1, ridgeRiseFt);
  const shape = new THREE.Shape();

  switch (profile) {
    case "gable": {
      shape.moveTo(-w / 2, 0);
      shape.lineTo(0, rise);
      shape.lineTo(w / 2, 0);
      shape.closePath();
      break;
    }
    case "single-slope": {
      shape.moveTo(-w / 2, 0);
      shape.lineTo(-w / 2, rise);
      shape.lineTo(w / 2, 0);
      shape.closePath();
      break;
    }
    case "gambrel": {
      const kneeX = w * 0.32;
      const kneeY = rise * 0.6;
      shape.moveTo(-w / 2, 0);
      shape.lineTo(-kneeX, kneeY);
      shape.lineTo(0, rise);
      shape.lineTo(kneeX, kneeY);
      shape.lineTo(w / 2, 0);
      shape.closePath();
      break;
    }
    case "monitor": {
      const shoulderX = w * 0.28;
      const shoulderY = rise * 0.55;
      const peakX = shoulderX * 0.5;
      shape.moveTo(-w / 2, 0);
      shape.lineTo(-shoulderX, shoulderY);
      shape.lineTo(-peakX, rise);
      shape.lineTo(peakX, rise);
      shape.lineTo(shoulderX, shoulderY);
      shape.lineTo(w / 2, 0);
      shape.closePath();
      break;
    }
  }

  return shape;
}

export const ROOF_CONSTANTS = {
  EAVE_OVERHANG_FT,
  GABLE_OVERHANG_FT,
} as const;
