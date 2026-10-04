import type * as THREE from "three";
import type { StepState } from "./visibility";

/** What a builder returns. Builders are pure: no React, no DOM, no globals. */
export type SceneBuild = {
  group: THREE.Group;
  /** One group per scene step id (SPEC §8). Steps a model does not list are hidden by the viewer. */
  stepGroups: Map<string, THREE.Group>;
  /** Overall size in metres, for framing the camera: x = length, z = width, y = height. */
  bounds: { l: number; w: number; h: number };
  /** Camera framing override; by default the viewer derives it from bounds. */
  framing?: { radius: number; target: [number, number, number]; theta?: number; phi?: number };
  /** Optional per-frame-of-day hook for dynamic parts (the factory rack and truck). Runs after step visibility. */
  update?: (ctx: { day: number; states: Map<string, StepState> }) => void;
};

export type Window = { start: number; end: number };
