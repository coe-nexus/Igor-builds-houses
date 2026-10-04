import { describe, expect, it } from "vitest";
import { models } from "../lib/data";
import { applySceneState, buildScene, type SceneKind } from "./index";
import type { ModelId } from "../lib/types";
import { TRACK_IDS } from "../lib/types";

const allOn = Object.fromEntries(TRACK_IDS.map((t) => [t, true]));
function visibleSteps(id: ModelId, kind: SceneKind, day: number, opts: { tracks?: Record<string, boolean>; options?: Record<string, boolean> } = {}) {
  const model = models[id];
  const build = buildScene(model, kind);
  applySceneState(build, model, kind, { day, enabledTracks: opts.tracks ?? allOn, enabledOptions: opts.options ?? {} });
  return { build, ids: [...build.stepGroups].filter(([, g]) => g.visible).map(([k]) => k).sort() };
}

describe("scene builders and visibility on the real data (SPEC §17 P3)", () => {
  it("builds a group for every step of every model", () => {
    for (const id of Object.keys(models) as ModelId[]) {
      const m = models[id];
      for (const kind of (m.scene_factory ? ["site", "factory"] : ["site"]) as SceneKind[]) {
        const build = buildScene(m, kind);
        const steps = kind === "factory" ? m.scene_factory!.steps : m.scene.steps;
        for (const s of steps) expect(build.stepGroups.has(s.id), `${id}/${kind}/${s.id}`).toBe(true);
      }
    }
  });

  it("96 at day 8 shows only the footings, the gravel pad and the W ring (plus the stakeout)", () => {
    expect(visibleSteps("k96", "site", 8).ids).toEqual(["found_points", "gravel", "ring", "site"]);
  });

  it("96 at day 13 has the panels up and no roof yet; at day 30 everything but the options", () => {
    const d13 = visibleSteps("k96", "site", 13).ids;
    expect(d13).toContain("walls_f1");
    expect(d13).not.toContain("roof_panels");
    const d30 = visibleSteps("k96", "site", 30).ids;
    for (const s of models.k96.scene.steps.map((x) => x.id).filter((x) => !["terrace", "carport", "solar"].includes(x))) expect(d30).toContain(s);
    expect(d30).not.toContain("terrace");
  });

  it("144 Max at day 26 has four floors of panels and no stair; the stair arrives on day 27", () => {
    const d26 = visibleSteps("k144max", "site", 26).ids;
    for (const f of [1, 2, 3, 4]) expect(d26).toContain(`walls_f${f}`);
    expect(d26).not.toContain("stair");
    expect(visibleSteps("k144max", "site", 27).ids).toContain("stair");
  });

  it("the 64 at day 7: a slab on site and a full rack in the factory; at day 12 the rack is empty and the house stands", () => {
    expect(visibleSteps("k64", "site", 7).ids).toEqual(["radier", "radier_forms", "site"]);
    const rackCount = (day: number) => visibleSteps("k64", "factory", day).build.stepGroups.get("fac_panels")!.children.filter((c) => c.visible && c.name.startsWith("panel_")).length;
    expect(rackCount(1)).toBe(0);
    expect(rackCount(7)).toBe(Math.round((2 * (8 + 8)) / 2.4));
    expect(rackCount(12)).toBe(0);
    expect(visibleSteps("k64", "site", 12).ids).toContain("panels");
  });

  it("the truck is on site on days 9 to 11 and gone from day 12", () => {
    const truck = (day: number) => visibleSteps("k64", "factory", day).build.stepGroups.get("fac_truck")!.visible;
    expect([8, 9, 10, 11, 12, 13].map(truck)).toEqual([false, true, true, true, false, false]);
  });

  it("options appear only when toggled on, from their start day", () => {
    expect(visibleSteps("k96", "site", 30, { options: { terrace: true } }).ids).toContain("terrace");
    expect(visibleSteps("k96", "site", 22, { options: { terrace: true } }).ids).not.toContain("terrace");
    expect(visibleSteps("k96", "site", 30, { options: { terrace: false } }).ids).not.toContain("terrace");
    // the Max now has the carport option too
    expect(visibleSteps("k144max", "site", 45, { options: { carport: true } }).ids).toContain("carport");
  });

  it("a trade toggle hides the groups of its track", () => {
    const ids = visibleSteps("k96", "site", 30, { tracks: { ...allOn, structure: false } }).ids;
    expect(ids).not.toContain("ring");
    expect(ids).toContain("walls_f1");
  });

  it("keeps draw calls low: the Max is a few dozen meshes, not a thousand", () => {
    const { build } = visibleSteps("k144max", "site", 45, { options: { terrace: true, carport: true, solar: true, pool: true } });
    let meshes = 0;
    build.group.traverse((o) => ((o as { isMesh?: boolean }).isMesh ? meshes++ : 0));
    expect(meshes).toBeLessThan(200);
  });
});
