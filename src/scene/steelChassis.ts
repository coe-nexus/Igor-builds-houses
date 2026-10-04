// Parametric builder for the steel models (96, 96 Pro, 144 Pro, 144 Max). SPEC §8.1.
// Axes: x runs along the length (l), z across the width (w), y is up. Every step id the models use gets its own
// group; the viewer shows the ones listed in model.scene.steps.
import * as THREE from "three";
import type { MatKey } from "./materials";
import { faceBox, surround, windowUnit, type Seg } from "./facade";
import { lotPart, stakeoutPart } from "./lot";
import { Part } from "./primitives";
import type { SceneBuild } from "./types";

export type SteelChassisParams = { w: number; l: number; floors: number; ceiling_m: number; bay_m: number };

const D = 0.25; // beam depth (W250)
const BASE = 0.12; // underside of the baldrame ring, above the gravel pad
const INSET = 0.1; // facade line inside the footprint edge
const ROOF_PITCH = (6 * Math.PI) / 180;

export function steelChassis(p: SteelChassisParams): SceneBuild {
  const { w, l, floors: F, ceiling_m: H, bay_m: bay } = p;
  const FF = H + D; // floor to floor
  const yF = (f: number) => BASE + (f - 1) * FF; // underside of the beams of floor f
  const yDeck = (f: number) => yF(f) + D; // top of the beams of floor f
  const yTop = BASE + F * FF;
  const nx = Math.max(1, Math.round(l / bay));
  const nz = Math.max(1, Math.round(w / bay));
  const gx = (i: number) => (i === 0 ? -l / 2 + INSET : i === nx ? l / 2 - INSET : -l / 2 + (i * l) / nx);
  const gz = (j: number) => (j === 0 ? -w / 2 + INSET : j === nz ? w / 2 - INSET : -w / 2 + (j * w) / nz);
  const gridX = Array.from({ length: nx + 1 }, (_, i) => gx(i));
  const gridZ = Array.from({ length: nz + 1 }, (_, j) => gz(j));
  const FX = l / 2 - INSET; // facade lines
  const FZ = w / 2 - INSET;

  const segs: Seg[] = [];
  for (const side of [1, -1] as const) {
    for (let i = 0; i < nx; i++) segs.push({ axis: "x", side, c: (gridX[i] + gridX[i + 1]) / 2, sw: gridX[i + 1] - gridX[i] - 0.1, fixed: FZ });
    for (let j = 0; j < nz; j++) segs.push({ axis: "z", side, c: (gridZ[j] + gridZ[j + 1]) / 2, sw: gridZ[j + 1] - gridZ[j] - 0.1, fixed: FX });
  }
  // The entrance door sits in the middle segment of the +z facade on the ground floor.
  const doorMid = Math.floor(nx / 2);
  const doorSeg = segs.find((s) => s.axis === "x" && s.side === 1 && s.c === (gridX[doorMid] + gridX[doorMid + 1]) / 2);

  const face = faceBox;
  const openingOf = (s: Seg, f: number) => {
    const isDoor = f === 1 && s === doorSeg;
    const ow = isDoor ? 1.0 : Math.min(1.8, s.sw * 0.62);
    const oh = isDoor ? 2.1 : 1.35;
    return { ow, oh, y: isDoor ? yDeck(1) + oh / 2 + 0.02 : yDeck(f) + 1.55, isDoor };
  };
  const wallY = (f: number) => yDeck(f) + H / 2;

  const gridPoints: [number, number][] = [];
  for (const x of gridX) for (const z of gridZ) gridPoints.push([x, z]);

  const groups = new Map<string, THREE.Group>();
  const add = (id: string, part: Part) => groups.set(id, part.build());

  const lot = lotPart(l, w); // always visible: the day-0 state

  add("site", stakeoutPart(l, w));

  // ---------------------------------------------------------------- foundation
  {
    const f = new Part("found_points");
    for (const [x, z] of gridPoints) {
      f.box("concrete", 0.9, 0.5, 0.9, x, BASE - 0.25, z);
      for (const [dx, dz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) f.box("steelDark", 0.03, 0.12, 0.03, x + dx, BASE + 0.06, z + dz);
    }
    add("found_points", f);
    const g = new Part("gravel");
    g.box("gravel", l + 1.4, 0.1, w + 1.4, 0, 0.05, 0);
    for (const sz of [1, -1]) g.box("concrete", l + 2.8, 0.04, 0.3, 0, 0.02, sz * (w / 2 + 1.1));
    for (const sx of [1, -1]) g.box("concrete", 0.3, 0.04, w + 2.2, sx * (l / 2 + 1.4), 0.02, 0);
    add("gravel", g);
  }

  // ---------------------------------------------------------------- floors: ring, joists, deck, columns
  const ringOf = (name: string, f: number) => {
    const r = new Part(name);
    const y = yF(f);
    for (const sz of [1, -1]) r.iBeam("steel", l, D, 0, y, sz * FZ);
    for (const sx of [1, -1]) r.iBeam("steel", w - 0.42, D, sx * FX, y, 0, Math.PI / 2);
    for (let j = 1; j < nz; j++) r.iBeam("steel", l - 0.42, D, 0, y, gridZ[j]); // interior lines along the length
    return r;
  };
  const joistsOf = (part: Part, f: number) => {
    for (let x = -l / 2 + 0.6; x < l / 2 - 0.29; x += 0.6) part.box("steelDark", 0.05, 0.2, w - 0.45, x, yF(f) + 0.12, 0);
  };
  const columnsOf = (part: Part, f: number) => {
    for (const [x, z] of gridPoints) {
      part.box("steelDark", 0.1, H, 0.1, x, yDeck(f) + H / 2, z);
      part.box("weld", 0.15, 0.035, 0.15, x, yDeck(f) + 0.018, z);
    }
  };
  add("ring", ringOf("ring", 1));
  {
    const j = new Part("joists_f1");
    joistsOf(j, 1);
    add("joists_f1", j);
    add("deck_f1", new Part("deck_f1").box("ply", l - 0.1, 0.018, w - 0.1, 0, yDeck(1) + 0.009, 0));
  }
  if (F === 1) {
    const c = new Part("columns_f1");
    columnsOf(c, 1);
    add("columns_f1", c);
  } else {
    for (let k = 1; k < F; k++) {
      const c = new Part(`columns_f${k}`);
      columnsOf(c, k);
      add(`columns_f${k}`, c);
    }
  }
  for (let k = 2; k <= F; k++) {
    add(`ring_f${k}`, ringOf(`ring_f${k}`, k));
    const d = new Part(`deck_f${k}`);
    joistsOf(d, k);
    d.box("ply", l - 0.1, 0.018, w - 0.1, 0, yDeck(k) + 0.009, 0);
    add(`deck_f${k}`, d);
  }

  // ---------------------------------------------------------------- top ring and purlins
  {
    const t = new Part("top_ring");
    if (F >= 2) columnsOf(t, F); // the top floor's columns arrive with the top ring
    for (const sz of [1, -1]) t.box("steel", l, 0.15, 0.1, 0, yTop + 0.075, sz * FZ);
    for (const sx of [1, -1]) t.box("steel", 0.1, 0.15, w - 0.2, sx * FX, yTop + 0.075, 0);
    add("top_ring", t);
    const pu = new Part("purlins");
    for (let x = -l / 2 + 0.75; x < l / 2; x += 1.5) pu.box("steelDark", 0.06, 0.1, w - 0.15, x, yTop + 0.2, 0);
    add("purlins", pu);
  }

  // ---------------------------------------------------------------- walls (tilt-up panels), one group per floor
  for (let f = 1; f <= F; f++) {
    const wl = new Part(`walls_f${f}`);
    for (const s of segs) {
      face(wl, "copaiba", s, 0, s.sw, H - 0.04, 0.12, wallY(f));
      const o = openingOf(s, f);
      face(wl, "opening", s, 0, o.ow, o.oh, 0.14, o.y); // the lighter rectangle implies the window cut-out
    }
    add(`walls_f${f}`, wl);
  }

  // ---------------------------------------------------------------- roof: low gable, small overhang
  const R = w / 2 + 0.35;
  const yEave = yTop + 0.255;
  const yRidge = yEave + R * Math.tan(ROOF_PITCH);
  {
    const r = new Part("roof_panels");
    const slope = R / Math.cos(ROOF_PITCH);
    for (const sz of [1, -1]) {
      r.box("panel", l + 0.7, 0.1, slope, 0, yEave + (R / 2) * Math.tan(ROOF_PITCH) + 0.05, (sz * R) / 2, { rx: sz * ROOF_PITCH });
      for (let s = 0.5; s < slope; s += 1.0) {
        r.box("panelRidge", l + 0.7, 0.02, 0.06, 0, yRidge - s * Math.sin(ROOF_PITCH) + 0.11, sz * s * Math.cos(ROOF_PITCH), { rx: sz * ROOF_PITCH });
      }
    }
    r.box("panelRidge", l + 0.7, 0.08, 0.3, 0, yRidge + 0.1, 0);
    const n = 5, y0 = yTop + 0.15, rise = yRidge - y0;
    for (const sx of [1, -1]) for (let i = 0; i < n; i++) r.box("panel", 0.1, rise / n, (w - 0.1) * (1 - i / n), sx * (l / 2 - 0.05), y0 + ((i + 0.5) * rise) / n, 0);
    add("roof_panels", r);
  }

  // ---------------------------------------------------------------- envelope: wrap, windows, siding
  {
    const wr = new Part("wrap");
    for (let f = 1; f <= F; f++) {
      for (const sz of [1, -1]) wr.box("wrap", l - 0.1, H - 0.02, 0.02, 0, wallY(f), sz * (FZ + 0.07));
      for (const sx of [1, -1]) wr.box("wrap", 0.02, H - 0.02, w - 0.1, sx * (FX + 0.07), wallY(f), 0);
    }
    for (const sz of [1, -1]) wr.box("gutter", l + 0.7, 0.1, 0.12, 0, yEave - 0.04, sz * (R + 0.02)); // gutters and flashings
    add("wrap", wr);

    const wi = new Part("windows");
    for (let f = 1; f <= F; f++) {
      for (const s of segs) {
        const o = openingOf(s, f);
        if (o.isDoor) {
          face(wi, "door", s, 0.07, o.ow, o.oh, 0.1, o.y);
          continue;
        }
        windowUnit(wi, s, 0.07, o);
      }
    }
    add("windows", wi);

    const sd = new Part("siding");
    for (let f = 1; f <= F; f++) {
      for (const s of segs) surround(sd, "siding", s, 0.1, 0.04, yF(f), yF(f) + FF, openingOf(s, f));
    }
    add("siding", sd);
  }

  // ---------------------------------------------------------------- interior: partitions, stair, lining, floor
  {
    const pt = new Part("partitions");
    const wall = (x0: number, z0: number, x1: number, z1: number, f: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = yDeck(f) + (H - 0.05) / 2 + 0.02;
      if (alongX) pt.box("drywall", len, H - 0.05, 0.1, cx, y, cz);
      else pt.box("drywall", 0.1, H - 0.05, len, cx, y, cz);
    };
    for (let f = 1; f <= F; f++) {
      const x0 = -l / 2 + 0.5, x1 = l / 2 - 0.5, gap = 0.45;
      const q1 = x0 + (x1 - x0) * 0.25, q3 = x0 + (x1 - x0) * 0.75; // doorways in the spine
      wall(x0, 0, q1 - gap, 0, f);
      wall(q1 + gap, 0, q3 - gap, 0, f);
      wall(q3 + gap, 0, x1, 0, f);
      for (const cx of [-l / 6, l / 6]) {
        wall(cx, -w / 2 + 0.5, cx, -gap, f);
        wall(cx, gap, cx, w / 2 - 0.5, f);
      }
    }
    add("partitions", pt);

    const st = new Part("stair");
    if (F > 1) {
      const n = Math.round(FF / 0.18), rise = FF / n, tread = 0.26, run = n * tread, z = -w / 2 + 1.3;
      for (let k = 1; k < F; k++) {
        const dir = k % 2 === 1 ? 1 : -1;
        const xs = dir > 0 ? -l / 2 + 1.8 : -l / 2 + 1.8 + run;
        for (let i = 0; i < n; i++) st.box("steelDark", tread, 0.04, 1.0, xs + dir * (i + 0.5) * tread, yDeck(k) + 0.018 + (i + 1) * rise - 0.02, z);
        const ang = Math.atan2(FF, run), len = Math.hypot(run, FF);
        for (const dz of [-0.5, 0.5]) st.box("steel", len, 0.2, 0.05, xs + (dir * run) / 2, yDeck(k) + FF / 2 - 0.05, z + dz, { rz: dir * ang });
      }
      if (F >= 4) st.box("shaft", 2.0, yTop - BASE, 2.0, l / 2 - 1.6, BASE + (yTop - BASE) / 2, -w / 2 + 1.6); // elevator shaft volume
    }
    add("stair", st);

    const li = new Part("interior_lining");
    for (let f = 1; f <= F; f++) {
      for (const sz of [1, -1]) li.box("lining", l - 0.4, H - 0.06, 0.012, 0, wallY(f), sz * (FZ - 0.065));
      for (const sx of [1, -1]) li.box("lining", 0.012, H - 0.06, w - 0.4, sx * (FX - 0.065), wallY(f), 0);
    }
    add("interior_lining", li);

    const fl = new Part("floor_finish");
    for (let f = 1; f <= F; f++) fl.box("spc", l - 0.2, 0.008, w - 0.2, 0, yDeck(f) + 0.022, 0);
    add("floor_finish", fl);
  }

  // ---------------------------------------------------------------- options: terrace, carport, solar, pool
  const td = 17 / w; // a 17 m² covered terrace on one short side
  {
    const tr = new Part("terrace");
    const cx = l / 2 + td / 2;
    tr.box("deck", td, 0.1, w, cx, BASE + 0.05, 0);
    for (const z of [-w / 2 + 0.2, 0, w / 2 - 0.2]) tr.box("steelDark", 0.12, FF - 0.1, 0.12, l / 2 + td - 0.1, BASE + 0.05 + (FF - 0.1) / 2, z);
    tr.box("steel", 0.1, 0.15, w, l / 2 + td - 0.1, BASE + FF - 0.05, 0);
    tr.box("panel", td + 0.35, 0.1, w + 0.3, cx + 0.12, BASE + FF + 0.05, 0);
    add("terrace", tr);

    const cp = new Part("carport"); // two-bay pergola beside the house
    const cz = w / 2 + 1.3 + 2.75, len = 6, depth = 5.5, ph = 2.6;
    for (const x of [-len / 2, 0, len / 2]) for (const z of [cz - depth / 2, cz + depth / 2]) cp.box("steel", 0.12, ph, 0.12, x, ph / 2, z);
    for (const z of [cz - depth / 2, cz + depth / 2]) cp.box("steel", len + 0.4, 0.15, 0.1, 0, ph + 0.07, z);
    for (let x = -len / 2; x <= len / 2 + 0.01; x += 0.45) cp.box("steelDark", 0.05, 0.08, depth + 0.4, x, ph + 0.18, cz);
    add("carport", cp);

    const so = new Part("solar"); // 12 panels, about 5 kWp, on the +z slope
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
      const s = 0.9 + r * 1.85, x = (c - 2.5) * 1.15;
      so.box("solar", 1.1, 0.04, 1.75, x, yRidge - s * Math.sin(ROOF_PITCH) + 0.17, s * Math.cos(ROOF_PITCH), { rx: ROOF_PITCH });
    }
    add("solar", so);

    const po = new Part("pool"); // fibreglass 6 x 3 m with a deck, beside the terrace
    const px = l / 2 + td + 0.8 + 3;
    po.box("coping", 6.5, 0.1, 3.5, px, 0.05, 0);
    po.box("water", 6, 0.04, 3, px, 0.1, 0);
    add("pool", po);
  }

  const group = new THREE.Group();
  group.name = "steelChassis";
  group.add(lot.build());
  for (const g of groups.values()) group.add(g);
  return { group, stepGroups: groups, bounds: { l, w, h: yTop + 0.8 } };
}
