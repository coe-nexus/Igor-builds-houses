import { describe, expect, it } from "vitest";
import { stepState } from "./visibility";

const on = { trackEnabled: true };

describe("step visibility (SPEC §8.3)", () => {
  it("is hidden before the first activity starts and without a window", () => {
    expect(stepState(7, { start: 8, end: 8 }, on).visible).toBe(false);
    expect(stepState(0, { start: 1, end: 1 }, on).visible).toBe(false);
    expect(stepState(10, undefined, on).visible).toBe(false);
  });
  it("pops in at full opacity for a single-day activity", () => {
    expect(stepState(13, { start: 13, end: 13 }, on)).toEqual({ visible: true, opacity: 1 });
  });
  it("ramps from 0.35 at start to 1 at end", () => {
    expect(stepState(19, { start: 19, end: 20 }, on).opacity).toBeCloseTo(0.35);
    expect(stepState(20, { start: 19, end: 20 }, on).opacity).toBe(1);
    const mid = stepState(5, { start: 4, end: 6 }, on).opacity;
    expect(mid).toBeGreaterThan(0.35);
    expect(mid).toBeLessThan(1);
  });
  it("stays at full opacity after the window", () => {
    expect(stepState(30, { start: 19, end: 20 }, on)).toEqual({ visible: true, opacity: 1 });
  });
  it("hides groups of a disabled track and options that are off", () => {
    expect(stepState(30, { start: 1, end: 1 }, { trackEnabled: false }).visible).toBe(false);
    expect(stepState(30, { start: 23, end: 25 }, { trackEnabled: true, optionOn: false }).visible).toBe(false);
    expect(stepState(30, { start: 23, end: 25 }, { trackEnabled: true, optionOn: true }).visible).toBe(true);
  });
});
