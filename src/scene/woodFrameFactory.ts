// The 64's second scene: the factory panel line. SPEC §8.2b. The rack of finished panels grows through the panel
// fabrication window, the trusses stack up, then both load onto a flatbed that leaves the day after packing.
import * as THREE from "three";
import { Part, applyOpacity, finishGroup } from "./primitives";
import type { SceneBuild, Window } from "./types";

export type WoodFrameFactoryParams = {
  /** Wall panels for the house: perimeter / 2.4 m. */
  panelCount: number;
  trussCount: number;
  windows: { panels: Window; trusses: Window; pack: Window };
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function woodFrameFactory(p: WoodFrameFactoryParams): SceneBuild {
  const { panelCount: N, trussCount: M, windows } = p;
  const groups = new Map<string, THREE.Group>();

  // ---- shop floor: slab, frame, two framing tables, saw station
  {
    const f = new Part("fac_floor");
    f.box("shopFloor", 24, 0.1, 14, 0, 0.05, 0);
    for (const x of [-10, -3.3, 3.3, 10]) for (const z of [-6, 6]) f.box("steelDark", 0.25, 4.6, 0.25, x, 2.4, z);
    for (const z of [-6, 6]) f.box("steel", 21, 0.3, 0.2, 0, 4.7, z);
    for (const x of [-10, -3.3, 3.3, 10]) f.box("steel", 0.2, 0.3, 12.2, x, 4.7, 0);
    f.box("fence", 21, 4.3, 0.08, 0, 2.25, -6.3); // back wall
    for (const z of [-2.6, 0.9]) {
      f.box("table", 6, 0.12, 1.3, -6, 0.9, z);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box("steelDark", 0.1, 0.8, 0.1, -6 + sx * 2.8, 0.45, z + sz * 0.5);
    }
    f.box("table", 1.6, 0.1, 0.9, -8.6, 0.85, 4.0); // saw station
    f.box("steel", 0.15, 0.5, 0.15, -8.6, 1.15, 3.7);
    f.box("steel", 1.3, 0.12, 0.12, -8.6, 1.45, 3.9, { ry: 0.3 });
    for (let i = 0; i < 4; i++) f.box("pine", 3.2, 0.12, 0.3, -9 + (i % 2) * 0.3, 0.16 + Math.floor(i / 2) * 0.13, 5.2); // stock
    groups.set("fac_floor", f.build());
  }

  // ---- finished panels leaning in a rack: one child per panel
  const rack: THREE.Group[] = [];
  const rackGroup = new THREE.Group();
  rackGroup.name = "fac_panels";
  for (let i = 0; i < N; i++) {
    const pn = new Part(`panel_${i}`);
    pn.box("osb", 0.05, 2.7, 2.4, 0, 1.4, 0);
    pn.box("pine", 0.1, 0.1, 2.4, 0, 0.08, 0);
    pn.box("pine", 0.1, 0.1, 2.4, 0, 2.72, 0);
    if (i % 2 === 0) {
      pn.box("frame", 0.07, 1.0, 1.0, 0.03, 1.5, 0);
      pn.box("glass", 0.03, 0.9, 0.9, 0.06, 1.5, 0);
    }
    const g = pn.build();
    g.position.set(-2.8 + i * 0.4, 0, -3.0);
    g.rotation.z = -0.16; // leaning on the rack
    rack.push(g);
    rackGroup.add(g);
  }
  const rackFrame = new Part("rack_frame").box("steel", 6.0, 0.15, 0.15, 0, 0.2, -4.4).box("steel", 6.0, 0.15, 0.15, 0, 0.2, -1.6).box("steel", 0.12, 2.0, 0.12, 3.0, 1.0, -4.4).box("steel", 0.12, 2.0, 0.12, 3.0, 1.0, -1.6).build();
  rackGroup.add(rackFrame);
  groups.set("fac_panels", finishGroup(rackGroup));

  // ---- roof trusses stacked flat
  const stack: THREE.Group[] = [];
  const trussGroup = new THREE.Group();
  trussGroup.name = "fac_trusses";
  for (let i = 0; i < M; i++) {
    const t = new Part(`truss_${i}`);
    const a = Math.atan2(1.3, 4.2), len = Math.hypot(4.2, 1.3);
    t.box("pine", 8.4, 0.045, 0.14, 0, 0, 0);
    t.box("pine", len, 0.045, 0.14, -2.1, 0, 0.65, { ry: -a });
    t.box("pine", len, 0.045, 0.14, 2.1, 0, 0.65, { ry: a });
    t.box("pine", 0.14, 0.045, 1.3, 0, 0, 0.65);
    const g = t.build();
    g.position.set(-6, 0.28 + i * 0.1, 4.2);
    stack.push(g);
    trussGroup.add(g);
  }
  groups.set("fac_trusses", finishGroup(trussGroup));

  // ---- flatbed at the door
  const truck = new THREE.Group();
  truck.name = "fac_truck";
  const load: THREE.Group[] = [];
  {
    const t = new Part("truck_body");
    t.box("truck", 8.2, 0.25, 2.6, 0, 1.05, 0); // bed
    t.box("steelDark", 8.2, 0.2, 0.2, 0, 0.8, -0.8).box("steelDark", 8.2, 0.2, 0.2, 0, 0.8, 0.8);
    t.box("truck", 2.0, 2.3, 2.5, 5.3, 1.95, 0); // cab
    t.box("glass", 0.05, 0.9, 2.1, 6.33, 2.3, 0);
    for (const x of [-3, -1.8, 3.8]) for (const z of [-1.3, 1.3]) t.cyl("wheel", 0.5, 0.35, x, 0.5, z, { rx: Math.PI / 2 });
    truck.add(t.build());
    let n = 0;
    for (let i = 0; i < N; i++) {
      const pl = new Part(`load_${i}`).box("osb", 2.7, 0.1, 2.4, 0, 0, 0).build();
      pl.position.set(i % 2 === 0 ? -2.7 : 0.1, 1.23 + Math.floor(i / 2) * 0.12, 0);
      load.push(pl);
      truck.add(pl);
      n++;
    }
    const bundle = new Part("load_trusses").box("pine", 2.6, 0.5, 2.2, 3.0, 1.5, 0).build();
    bundle.visible = false;
    truck.add(bundle);
    load.push(bundle);
    void n;
  }
  truck.position.set(14.2, 0, 0);
  groups.set("fac_truck", finishGroup(truck));

  const update: SceneBuild["update"] = ({ day, states }) => {
    const pa = windows.panels, tr = windows.trusses, pk = windows.pack;
    const loaded = day < pk.start ? 0 : clamp01((day - pk.start + 1) / (pk.end - pk.start + 1)); // share on the truck
    const grown = day < pa.start ? 0 : clamp01((day - pa.start) / Math.max(1, pa.end - pa.start));
    const rackCount = Math.round(N * grown * (1 - loaded));
    rack.forEach((g, i) => (g.visible = i < rackCount));
    const trussGrown = day < tr.start ? 0 : clamp01((day - tr.start + 1) / (tr.end - tr.start + 1));
    const trussCount = Math.round(M * trussGrown * (1 - loaded));
    stack.forEach((g, i) => (g.visible = i < trussCount));

    const loadedPanels = Math.round(N * loaded);
    load.slice(0, N).forEach((g, i) => (g.visible = i < loadedPanels));
    load[N].visible = loaded >= 0.5;

    // the rack, the stack and the truck never fade: their content changes instead
    for (const id of ["fac_panels", "fac_trusses", "fac_truck"]) {
      const g = groups.get(id)!;
      if (states.get(id)?.visible) applyOpacity(g, 1);
    }
    const truckGroup = groups.get("fac_truck")!;
    const baseVisible = states.get("fac_truck")?.visible ?? false;
    truckGroup.visible = baseVisible && day >= pk.start && day <= pk.end + 1; // gone from the day after it leaves
    truckGroup.position.x = day > pk.end ? 28 : 14.2; // leaves the day after packing
  };

  const group = new THREE.Group();
  group.name = "woodFrameFactory";
  for (const g of groups.values()) group.add(g);
  return { group, stepGroups: groups, bounds: { l: 24, w: 14, h: 5 }, framing: { radius: 28, target: [4, 0.8, 0], theta: 0.55, phi: 0.95 }, update };
}
