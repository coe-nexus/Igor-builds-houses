import { describe, expect, it } from "vitest";
import { MODEL_ORDER, models } from "./data";
import {
  activitiesOn, crewOn, holdPointsOn, milestonesSorted, shopCrewOn, shortLabel, stepStartDay, stepTrack, stepWindow, stepWindows,
} from "./schedule";

describe("schedule views", () => {
  it.each(MODEL_ORDER)("%s: crewOn matches the generated crew_by_day on every day", (id) => {
    const m = models[id];
    for (let d = 1; d <= m.working_days; d++) expect(crewOn(m, d)).toBe(m.crew_by_day[d - 1]);
  });

  it("the 96 tilt-up day is day 13 with a crew of 8", () => {
    const m = models.k96;
    expect(activitiesOn(m, 13).map((a) => a.id)).toContain("walls_f1");
    expect(crewOn(m, 13)).toBe(8);
    expect(stepStartDay(m, "walls_f1")).toBe(13);
  });

  it("the 64 assembly day is day 12 with an engineer hold point", () => {
    const hp = holdPointsOn(models.k64, 12);
    expect(hp.map((a) => a.id)).toEqual(["assembly"]);
    expect(hp[0].hold_point?.by).toBe("engineer");
  });

  it("the Max has 45 days and hands over on day 45 with the owner", () => {
    const m = models.k144max;
    expect(m.working_days).toBe(45);
    expect(m.crew_by_day).toHaveLength(45);
    expect(holdPointsOn(m, 45)[0].hold_point?.by).toBe("owner");
    expect(stepWindow(m, "walls_f1")).toEqual({ start: 19, end: 20 });
    expect(stepWindow(m, "stair")).toEqual({ start: 27, end: 27 });
  });

  it("splits site and shop crew", () => {
    const m = models.k64;
    expect(shopCrewOn(m, 1)).toBe(8); // fac_setup 2 + panels_fab 6
    expect(crewOn(m, 1)).toBe(2);
    expect(stepWindow(m, "fac_panels")).toEqual({ start: 1, end: 7 });
  });

  it.each(MODEL_ORDER)("%s: every scene step in both scenes has a window and a track", (id) => {
    const m = models[id];
    const ids = [...m.scene.steps, ...(m.scene_factory?.steps ?? [])].map((s) => s.id);
    const windows = stepWindows(m);
    for (const s of ids) {
      expect(windows[s], `${id}:${s}`).toBeDefined();
      expect(stepTrack(m, s), `${id}:${s} track`).toBeDefined();
    }
  });

  it("orders milestones by day and ends on the last day", () => {
    for (const id of MODEL_ORDER) {
      const list = milestonesSorted(models[id]);
      expect(list.at(-1)).toEqual({ key: "handover", day: models[id].working_days });
      expect(list.map((x) => x.day)).toEqual([...list.map((x) => x.day)].sort((a, b) => a - b));
    }
  });

  it("shortens bar labels to the first clause", () => {
    expect(shortLabel("Locação da obra, gabarito, níveis. Câmeras ligadas.")).toBe("Locação da obra");
    expect(shortLabel("Fábrica: painéis de parede")).toBe("Fábrica");
    expect(shortLabel("x".repeat(60), 10)).toHaveLength(10);
  });
});
