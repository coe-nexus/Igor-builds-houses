// Derived views over a model's schedule: what is active on a day, crew, hold points, scene-step windows.
import type { Activity, Model, TrackId } from "./types";

export function activitiesOn(model: Model, day: number): Activity[] {
  return model.activities.filter((a) => a.start <= day && day <= a.end);
}

/** Site crew on a day (off-site prefab work excluded). Matches model.crew_by_day. */
export function crewOn(model: Model, day: number): number {
  return activitiesOn(model, day).reduce((sum, a) => (a.offsite ? sum : sum + a.crew), 0);
}

/** Shop crew on a day (off-site prefab work only). */
export function shopCrewOn(model: Model, day: number): number {
  return activitiesOn(model, day).reduce((sum, a) => (a.offsite ? sum + a.crew : sum), 0);
}

/** Hold points that fall on this day: the activity ends today and carries one. */
export function holdPointsOn(model: Model, day: number): Activity[] {
  return model.activities.filter((a) => a.end === day && a.hold_point);
}

/** Activities that reference a scene step, earliest first. */
function activitiesOfStep(model: Model, stepId: string): Activity[] {
  return model.activities
    .filter((a) => a.scene_step === stepId)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

/** First day a scene step appears (SPEC §8.3), or undefined when no activity references it. */
export function stepStartDay(model: Model, stepId: string): number | undefined {
  return activitiesOfStep(model, stepId)[0]?.start;
}

/** The window the step builds in: the earliest referencing activity's start and end. */
export function stepWindow(model: Model, stepId: string): { start: number; end: number } | undefined {
  const a = activitiesOfStep(model, stepId)[0];
  return a ? { start: a.start, end: a.end } : undefined;
}

/** Track of the earliest activity referencing the step: trade toggles hide the step's scene group with its track. */
export function stepTrack(model: Model, stepId: string): TrackId | undefined {
  return activitiesOfStep(model, stepId)[0]?.track;
}

/** Windows for every scene step in both scenes, keyed by step id. */
export function stepWindows(model: Model): Record<string, { start: number; end: number }> {
  const out: Record<string, { start: number; end: number }> = {};
  const ids = [...model.scene.steps, ...(model.scene_factory?.steps ?? [])].map((s) => s.id);
  for (const id of ids) {
    const w = stepWindow(model, id);
    if (w) out[id] = w;
  }
  return out;
}

export function milestonesSorted(model: Model): { key: string; day: number }[] {
  return Object.entries(model.milestones)
    .map(([key, day]) => ({ key, day }))
    .sort((a, b) => a.day - b.day);
}

/** Short bar label: the first clause of the activity text. */
export function shortLabel(text: string, max = 32): string {
  const first = text.split(/[.:;,(]/)[0].trim();
  const s = first.length ? first : text;
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}
