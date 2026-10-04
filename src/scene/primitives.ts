// Geometry collector. Builders add boxes (and a few cylinders) to a Part; build() merges everything of one material
// into a single mesh, so a four-floor Max is a few dozen draw calls instead of about a thousand (SPEC §8.4).
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createMaterial, type MatKey } from "./materials";

type Rot = { rx?: number; ry?: number; rz?: number };

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const ONE = new THREE.Vector3(1, 1, 1);

function matrixOf(x: number, y: number, z: number, rot?: Rot): THREE.Matrix4 {
  tmpEuler.set(rot?.rx ?? 0, rot?.ry ?? 0, rot?.rz ?? 0, "YXZ");
  tmpQuat.setFromEuler(tmpEuler);
  return new THREE.Matrix4().compose(tmpPos.set(x, y, z), tmpQuat, ONE);
}

export class Part {
  private items = new Map<MatKey, THREE.BufferGeometry[]>();
  constructor(readonly name: string) {}

  private push(mat: MatKey, geo: THREE.BufferGeometry, m: THREE.Matrix4) {
    geo.applyMatrix4(m);
    const list = this.items.get(mat);
    if (list) list.push(geo);
    else this.items.set(mat, [geo]);
  }

  /** Box of size w x h x d centred on (x, y, z). */
  box(mat: MatKey, w: number, h: number, d: number, x: number, y: number, z: number, rot?: Rot): this {
    this.push(mat, new THREE.BoxGeometry(w, h, d), matrixOf(x, y, z, rot));
    return this;
  }

  /** Vertical cylinder (or rotated, via rot) centred on (x, y, z). */
  cyl(mat: MatKey, r: number, h: number, x: number, y: number, z: number, rot?: Rot): this {
    this.push(mat, new THREE.CylinderGeometry(r, r, h, 14), matrixOf(x, y, z, rot));
    return this;
  }

  /** I-beam along local X (flanges and web as three boxes, from the carcaça). `y` is the bottom of the beam. */
  iBeam(mat: MatKey, len: number, depth: number, x: number, y: number, z: number, ry = 0): this {
    const base = matrixOf(x, y, z, { ry });
    const fw = 0.2, ft = 0.017, wt = 0.011;
    const parts: [number, number, number, number][] = [
      [len, ft, fw, depth - ft / 2], // top flange
      [len, ft, fw, ft / 2], // bottom flange
      [len, depth - 2 * ft, wt, depth / 2], // web
    ];
    for (const [w, h, d, py] of parts) {
      this.push(mat, new THREE.BoxGeometry(w, h, d), base.clone().multiply(new THREE.Matrix4().makeTranslation(0, py, 0)));
    }
    return this;
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  /** One mesh per material, each with its own material instance so a step can fade independently. */
  build(): THREE.Group {
    const group = new THREE.Group();
    group.name = this.name;
    for (const [key, geos] of this.items) {
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      group.add(new THREE.Mesh(merged, createMaterial(key)));
    }
    this.items.clear();
    return finishGroup(group);
  }
}

/** Cache the group's materials so fades and disposal do not traverse the tree every frame. */
export function finishGroup(group: THREE.Group): THREE.Group {
  const mats = new Set<THREE.Material>();
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => mats.add(m));
  });
  group.userData.materials = [...mats];
  return group;
}

/** Fade a group: base opacity of each material times `opacity`. */
export function applyOpacity(group: THREE.Object3D, opacity: number): void {
  const mats = (group.userData.materials ?? []) as THREE.Material[];
  for (const m of mats) {
    const base = (m.userData.baseOpacity as number | undefined) ?? 1;
    const o = base * opacity;
    const transparent = base < 1 || o < 0.999;
    if (m.transparent !== transparent) {
      m.transparent = transparent;
      m.needsUpdate = true;
    }
    m.opacity = o;
    m.depthWrite = !transparent || (base >= 1 && o >= 0.5);
  }
}

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
  });
}
