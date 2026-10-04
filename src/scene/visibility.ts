// SPEC §8.3: a step group is visible when day >= start of the first activity that references it; its opacity ramps
// from 0.35 at start to 1 at end (single-day activities just pop in). Options appear only when toggled on, and
// trade toggles hide groups by the track of the referencing activity.
import type { Window } from "./types";

export type StepState = { visible: boolean; opacity: number };

export const RAMP_FROM = 0.35;

export function stepState(
  day: number,
  window: Window | undefined,
  opts: { trackEnabled: boolean; optionOn?: boolean },
): StepState {
  const hidden = { visible: false, opacity: 0 };
  if (!window || !opts.trackEnabled || opts.optionOn === false) return hidden;
  if (day < window.start) return hidden;
  if (window.end <= window.start || day >= window.end) return { visible: true, opacity: 1 };
  return { visible: true, opacity: RAMP_FROM + (1 - RAMP_FROM) * ((day - window.start) / (window.end - window.start)) };
}
