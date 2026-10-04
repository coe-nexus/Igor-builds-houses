// The lot: perimeter fence with a gate, two camera poles and a tool container (the day-0 state), and the batter
// boards and string lines of the stakeout step. Shared by the steel and wood site scenes.
import { Part } from "./primitives";

export function lotPart(l: number, w: number): Part {
  const lot = new Part("lot");
  const lx = l + 16, lz = w + 16, panelW = 2.4, fh = 2.2;
  const run = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / panelW));
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cz = z0 + (z1 - z0) * t;
      if (cz > lz / 2 - 0.1 && Math.abs(cx) < 2) continue; // gate opening on the +z side
      if (alongX) lot.box("fence", len / n - 0.1, fh, 0.05, cx, fh / 2, cz);
      else lot.box("fence", 0.05, fh, len / n - 0.1, cx, fh / 2, cz);
    }
    for (let i = 0; i <= n; i++) lot.box("pole", 0.08, fh + 0.1, 0.08, x0 + ((x1 - x0) * i) / n, (fh + 0.1) / 2, z0 + ((z1 - z0) * i) / n);
  };
  run(-lx / 2, -lz / 2, lx / 2, -lz / 2);
  run(-lx / 2, lz / 2, lx / 2, lz / 2);
  run(-lx / 2, -lz / 2, -lx / 2, lz / 2);
  run(lx / 2, -lz / 2, lx / 2, lz / 2);
  for (const [sx, sz] of [[1, 1], [-1, -1]] as const) {
    const px = sx * (lx / 2 - 0.6), pz = sz * (lz / 2 - 0.6);
    lot.cyl("pole", 0.07, 4.2, px, 2.1, pz);
    lot.box("camera", 0.34, 0.2, 0.2, px, 4.3, pz);
  }
  lot.box("container", 2.4, 2.6, 6, -lx / 2 + 2, 1.3, -lz / 2 + 4.5);
  return lot;
}

export function stakeoutPart(l: number, w: number): Part {
  const s = new Part("site");
  const ox = l / 2 + 0.9, oz = w / 2 + 0.9;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    s.box("stake", 0.05, 0.8, 0.05, sx * (ox + 0.4), 0.4, sz * oz);
    s.box("stake", 0.05, 0.8, 0.05, sx * ox, 0.4, sz * (oz + 0.4));
    s.box("ply", 1.0, 0.1, 0.02, sx * (ox + 0.4), 0.7, sz * oz);
    s.box("ply", 0.02, 0.1, 1.0, sx * ox, 0.7, sz * (oz + 0.4));
  }
  for (const sz of [1, -1]) s.box("string", 2 * (ox + 0.4), 0.01, 0.01, 0, 0.72, sz * oz);
  for (const sx of [1, -1]) s.box("string", 0.01, 0.01, 2 * (oz + 0.4), sx * ox, 0.72, 0);
  return s;
}
