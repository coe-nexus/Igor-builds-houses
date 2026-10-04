// Builder for the 64: factory wood-frame panels on a radier slab (the site scene). SPEC §8.2.
// The panels arrive finished and are assembled on one day, so `panels` is a single step.
import * as THREE from "three";
import { faceBox, surround, windowUnit, type Seg } from "./facade";
import { lotPart, stakeoutPart } from "./lot";
import { Part } from "./primitives";
import type { SceneBuild } from "./types";

export type WoodFrameParams = { w: number; l: number; ceiling_m: number };

const SLAB = 0.12; // radier top
const PITCH = (18 * Math.PI) / 180;
const MODULE = 2.4; // panel width

export function woodFrame(p: WoodFrameParams): SceneBuild {
  const { w, l, ceiling_m: H } = p;
  const Wh = H + 0.2; // wall height including plates
  const wallTop = SLAB + Wh;
  const FX = l / 2 - 0.06, FZ = w / 2 - 0.06;
  const nx = Math.max(1, Math.round(l / MODULE)), nz = Math.max(1, Math.round(w / MODULE));

  const segs: Seg[] = [];
  for (const side of [1, -1] as const) {
    for (let i = 0; i < nx; i++) segs.push({ axis: "x", side, c: -l / 2 + ((i + 0.5) * l) / nx, sw: l / nx - 0.04, fixed: FZ });
    for (let j = 0; j < nz; j++) segs.push({ axis: "z", side, c: -w / 2 + ((j + 0.5) * w) / nz, sw: w / nz - 0.04, fixed: FX });
  }
  const doorSeg = segs.find((s) => s.axis === "x" && s.side === 1 && s.c === -l / 2 + ((Math.floor(nx / 2) + 0.5) * l) / nx);
  const openingOf = (s: Seg) => {
    const door = s === doorSeg;
    return { ow: door ? 1.0 : Math.min(1.3, s.sw * 0.55), oh: door ? 2.1 : 1.2, y: door ? SLAB + 1.07 : SLAB + 1.5, door };
  };

  const groups = new Map<string, THREE.Group>();
  const add = (id: string, part: Part) => groups.set(id, part.build());
  const lot = lotPart(l, w);
  add("site", stakeoutPart(l, w));

  // radier formwork, then the slab (10 cm with mesh)
  {
    const f = new Part("radier_forms");
    for (const sz of [1, -1]) {
      f.box("wood", l + 0.65, 0.25, 0.03, 0, 0.125, sz * (w / 2 + 0.32));
      for (let x = -l / 2; x <= l / 2 + 0.01; x += 1.2) f.box("stake", 0.05, 0.4, 0.05, x, 0.15, sz * (w / 2 + 0.38));
    }
    for (const sx of [1, -1]) {
      f.box("wood", 0.03, 0.25, w + 0.65, sx * (l / 2 + 0.32), 0.125, 0);
      for (let z = -w / 2; z <= w / 2 + 0.01; z += 1.2) f.box("stake", 0.05, 0.4, 0.05, sx * (l / 2 + 0.38), 0.15, z);
    }
    add("radier_forms", f);
    add("radier", new Part("radier").box("concrete", l + 0.5, SLAB, w + 0.5, 0, SLAB / 2, 0));
  }

  // factory panels (studs, plates, OSB, windows installed) and pine trusses: all appear on assembly day
  {
    const pa = new Part("panels");
    for (const s of segs) {
      faceBox(pa, "osb", s, 0.04, s.sw, Wh, 0.016, SLAB + Wh / 2);
      faceBox(pa, "pine", s, 0, s.sw, 0.045, 0.09, SLAB + 0.0225);
      faceBox(pa, "pine", s, 0, s.sw, 0.045, 0.09, wallTop - 0.0225);
      for (let t = -s.sw / 2 + 0.0225; t <= s.sw / 2; t += 0.4) faceBox(pa, "pine", s, 0, 0.045, Wh - 0.09, 0.09, SLAB + Wh / 2, t);
      const o = openingOf(s);
      faceBox(pa, "opening", s, 0.05, o.ow, o.oh, 0.01, o.y);
      if (o.door) faceBox(pa, "door", s, 0.08, o.ow, o.oh, 0.06, o.y);
      else windowUnit(pa, s, 0.08, o);
    }
    const R = w / 2 + 0.3, rise = R * Math.tan(PITCH), y0 = wallTop + 0.1;
    for (let x = -l / 2 + 0.3; x <= l / 2 - 0.29; x += 0.6) {
      pa.box("pine", 0.045, 0.14, w + 0.6, x, wallTop + 0.07, 0);
      for (const sz of [1, -1]) {
        pa.box("pine", 0.045, 0.14, R / Math.cos(PITCH), x, y0 + (R / 2) * Math.tan(PITCH) + 0.05, (sz * R) / 2, { rx: sz * PITCH });
        const wl = Math.hypot(R / 2, rise);
        pa.box("pine", 0.045, 0.09, wl, x, wallTop + 0.07 + rise / 2, (sz * R) / 4, { rx: sz * Math.atan2(rise, R / 2) });
      }
      pa.box("pine", 0.045, rise, 0.045, x, wallTop + 0.07 + rise / 2, 0);
    }
    const n = 5; // gable-end OSB, stepped
    for (const sx of [1, -1]) for (let i = 0; i < n; i++) pa.box("osb", 0.016, rise / n, (w - 0.1) * (1 - i / n), sx * (l / 2 + 0.0), wallTop + 0.15 + ((i + 0.5) * rise) / n, 0);
    add("panels", pa);
  }

  // roof: fibre cement tiles, ridge and gutters
  {
    const r = new Part("roof_tiles");
    const R = w / 2 + 0.4, slope = R / Math.cos(PITCH), yEave = wallTop + 0.2, yRidge = yEave + R * Math.tan(PITCH);
    for (const sz of [1, -1]) {
      r.box("roofTile", l + 0.8, 0.05, slope, 0, yEave + (R / 2) * Math.tan(PITCH) + 0.08, (sz * R) / 2, { rx: sz * PITCH });
      for (let s = 0.4; s < slope; s += 0.4) r.box("steelDark", l + 0.8, 0.02, 0.03, 0, yRidge - s * Math.sin(PITCH) + 0.12, sz * s * Math.cos(PITCH), { rx: sz * PITCH });
      r.box("gutter", l + 0.8, 0.1, 0.12, 0, yEave + 0.02, sz * (R + 0.02));
    }
    r.box("panelRidge", l + 0.8, 0.08, 0.3, 0, yRidge + 0.12, 0);
    add("roof_tiles", r);
  }

  // cladding: ventilated battens and textured cement board, around the openings
  {
    const c = new Part("cladding");
    for (const s of segs) surround(c, "cement", s, 0.07, 0.04, SLAB, wallTop, openingOf(s));
    add("cladding", c);
  }

  // partitions (framed, pine) and the drywall that closes them, plus the perimeter lining
  type Wall = [number, number, number, number];
  const walls: Wall[] = [];
  {
    const run = (x0: number, z0: number, x1: number, z1: number, gaps: number[]) => {
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, fixed = alongX ? z0 : x0;
      let from = a0;
      for (const g of [...gaps, a1 + 0.4].sort((u, v) => u - v)) {
        const to = Math.min(g - 0.4, a1);
        if (to - from > 0.2) walls.push(alongX ? [from, fixed, to, fixed] : [fixed, from, fixed, to]);
        from = g + 0.4;
      }
    };
    const m = 0.1;
    run(-l / 2 + m, -0.5, l / 2 - m, -0.5, [-l / 3, 0, l / 3]); // back rooms | living and kitchen
    run(-l / 6, -w / 2 + m, -l / 6, -0.5, []); // bedroom | bath
    run(l / 6, -w / 2 + m, l / 6, -0.5, []); // bath | bedroom
    const pt = new Part("partitions");
    for (const [x0, z0, x1, z1] of walls) {
      const len = Math.hypot(x1 - x0, z1 - z0), alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hy = SLAB + (H - 0.05) / 2;
      const dims = (a: number, b: number, c: number) => (alongX ? [a, b, c] : [c, b, a]);
      pt.box("pine", ...(dims(len, 0.045, 0.09) as [number, number, number]), cx, SLAB + 0.0225, cz);
      pt.box("pine", ...(dims(len, 0.045, 0.09) as [number, number, number]), cx, SLAB + H - 0.0725, cz);
      for (let t = 0; t <= len + 0.01; t += 0.4) {
        const u = -len / 2 + Math.min(t, len);
        pt.box("pine", ...(dims(0.045, H - 0.14, 0.09) as [number, number, number]), alongX ? cx + u : cx, hy, alongX ? cz : cz + u);
      }
    }
    add("partitions", pt);

    const li = new Part("interior_lining");
    for (const sz of [1, -1]) li.box("drywall", l - 0.3, H - 0.1, 0.0125, 0, SLAB + H / 2, sz * (FZ - 0.07));
    for (const sx of [1, -1]) li.box("drywall", 0.0125, H - 0.1, w - 0.3, sx * (FX - 0.07), SLAB + H / 2, 0);
    for (const [x0, z0, x1, z1] of walls) {
      const len = Math.hypot(x1 - x0, z1 - z0), alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      for (const side of [1, -1]) {
        if (alongX) li.box("drywall", len, H - 0.1, 0.0125, (x0 + x1) / 2, SLAB + H / 2, z0 + side * 0.0525);
        else li.box("drywall", 0.0125, H - 0.1, len, x0 + side * 0.0525, SLAB + H / 2, (z0 + z1) / 2);
      }
    }
    add("interior_lining", li);

    add("floor_finish", new Part("floor_finish").box("ceramic", l - 0.2, 0.01, w - 0.2, 0, SLAB + 0.006, 0));
  }

  const group = new THREE.Group();
  group.name = "woodFrame";
  group.add(lot.build());
  for (const g of groups.values()) group.add(g);
  return { group, stepGroups: groups, bounds: { l, w, h: wallTop + 0.2 + (w / 2 + 0.4) * Math.tan(PITCH) + 0.4 } };
}
