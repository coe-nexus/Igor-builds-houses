// Helpers for boxes laid on a rectangular building's facade segments (shared by the steel and wood builders).
import type { MatKey } from "./materials";
import type { Part } from "./primitives";

/** One facade segment: `axis` is the direction the facade runs, `side` +1 or -1 the face, `c` the centre along it,
 *  `sw` the segment width and `fixed` the distance of the facade line from the building centre. */
export type Seg = { axis: "x" | "z"; side: 1 | -1; c: number; sw: number; fixed: number };

/** Box on a facade: `off` is the distance outward from the facade line, `lat` the offset along the facade. */
export function faceBox(part: Part, mat: MatKey, s: Seg, off: number, width: number, height: number, thick: number, y: number, lat = 0): void {
  const pos = s.side * (s.fixed + off);
  if (s.axis === "x") part.box(mat, width, height, thick, s.c + lat, y, pos);
  else part.box(mat, thick, height, width, pos, y, s.c + lat);
}

export type Opening = { ow: number; oh: number; y: number };

/** Cladding laid around an opening: a strip each side, plus bands above and below, between heights y0 and y1. */
export function surround(part: Part, mat: MatKey, s: Seg, off: number, thick: number, y0: number, y1: number, o: Opening): void {
  const band = y1 - y0, yc = (y0 + y1) / 2, side = (s.sw - o.ow) / 2;
  faceBox(part, mat, s, off, side, band, thick, yc, -(o.ow / 2 + side / 2));
  faceBox(part, mat, s, off, side, band, thick, yc, o.ow / 2 + side / 2);
  const below = o.y - o.oh / 2 - y0, above = y1 - (o.y + o.oh / 2);
  if (below > 0.01) faceBox(part, mat, s, off, o.ow, below, thick, y0 + below / 2);
  if (above > 0.01) faceBox(part, mat, s, off, o.ow, above, thick, y1 - above / 2);
}

/** Window frame (four bars) and glass on a facade segment. */
export function windowUnit(part: Part, s: Seg, off: number, o: Opening): void {
  const fb = 0.06;
  faceBox(part, "frame", s, off, o.ow, fb, 0.1, o.y + o.oh / 2 - fb / 2);
  faceBox(part, "frame", s, off, o.ow, fb, 0.1, o.y - o.oh / 2 + fb / 2);
  faceBox(part, "frame", s, off, fb, o.oh, 0.1, o.y, -o.ow / 2 + fb / 2);
  faceBox(part, "frame", s, off, fb, o.oh, 0.1, o.y, o.ow / 2 - fb / 2);
  faceBox(part, "glass", s, off, o.ow - 0.1, o.oh - 0.1, 0.03, o.y);
}
