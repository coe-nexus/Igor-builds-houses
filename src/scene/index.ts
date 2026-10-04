// Glue between a model's data and the pure builders: which builder, with which parameters, and how the day,
// trade toggles and options map onto step groups.
import { options } from "../lib/data";
import { stepTrack, stepWindow } from "../lib/schedule";
import type { Model } from "../lib/types";
import { applyOpacity } from "./primitives";
import { steelChassis } from "./steelChassis";
import type { SceneBuild } from "./types";
import { stepState, type StepState } from "./visibility";
import { woodFrame } from "./woodFrame";
import { woodFrameFactory } from "./woodFrameFactory";

export type SceneKind = "site" | "factory";

export function buildScene(model: Model, kind: SceneKind): SceneBuild {
  const fp = model.footprint;
  if (kind === "factory") {
    const w = (id: string) => stepWindow(model, id) ?? { start: 1, end: 1 };
    return woodFrameFactory({
      panelCount: Math.round((2 * (fp.w + fp.l)) / 2.4),
      trussCount: 7,
      windows: { panels: w("fac_panels"), trusses: w("fac_trusses"), pack: w("fac_truck") },
    });
  }
  if (model.scene.builder === "woodFrame") return woodFrame({ w: fp.w, l: fp.l, ceiling_m: fp.ceiling_m });
  return steelChassis({ w: fp.w, l: fp.l, floors: fp.floors, ceiling_m: fp.ceiling_m, bay_m: fp.bay_m });
}

/** option id by the scene step it reveals (terrace, carport, solar, pool) */
const OPTION_OF_STEP = new Map(options.items.filter((o) => o.scene_step).map((o) => [o.scene_step as string, o.id]));

export type SceneInputs = { day: number; enabledTracks: Record<string, boolean>; enabledOptions: Record<string, boolean> };

/** Show, hide and fade every step group for the current day, trade toggles and options. */
export function applySceneState(build: SceneBuild, model: Model, kind: SceneKind, input: SceneInputs): void {
  const steps = kind === "factory" ? (model.scene_factory?.steps ?? []) : model.scene.steps;
  const listed = new Set(steps.map((s) => s.id));
  const states = new Map<string, StepState>();
  for (const [id, group] of build.stepGroups) {
    if (!listed.has(id)) {
      group.visible = false;
      continue;
    }
    const track = stepTrack(model, id);
    const optionId = OPTION_OF_STEP.get(id);
    const optionOn = track === "options" ? (optionId ? !!input.enabledOptions[optionId] : false) : undefined;
    const st = stepState(input.day, stepWindow(model, id), { trackEnabled: track ? input.enabledTracks[track] !== false : false, optionOn });
    states.set(id, st);
    group.visible = st.visible;
    if (st.visible) applyOpacity(group, st.opacity);
  }
  build.update?.({ day: input.day, states });
}
