// Materials ported from reference/carcaca-12x8.jsx (steel, weld, wood, plywood, SPC, sandwich panel) plus the
// ones the 96 to 144 Max and the 64 need. The polycarbonate wall of the carcaça is not shown on any page.
import * as THREE from "three";

export type MatKey =
  | "steel" | "steelDark" | "weld" | "concrete" | "gravel" | "wood" | "woodLight" | "ply" | "copaiba" | "osb" | "pine" | "spc"
  | "panel" | "panelRidge" | "roofTile" | "wrap" | "gutter" | "siding" | "cement" | "glass" | "frame" | "door" | "drywall" | "lining"
  | "ceramic" | "opening" | "deck" | "solar" | "water" | "coping" | "fence" | "pole" | "camera" | "stake" | "string" | "truck"
  | "wheel" | "shopFloor" | "table" | "container" | "shaft";

type Def = { color: number; metalness?: number; roughness?: number; emissive?: number; emissiveIntensity?: number; opacity?: number };

const DEFS: Record<MatKey, Def> = {
  steel: { color: 0x4a5560, metalness: 0.75, roughness: 0.45 },
  steelDark: { color: 0x39424b, metalness: 0.75, roughness: 0.5 },
  weld: { color: 0xff8a3d, metalness: 0.4, roughness: 0.5, emissive: 0x903c00, emissiveIntensity: 0.35 },
  concrete: { color: 0x8d94a3, roughness: 0.9 },
  gravel: { color: 0x5b6169, roughness: 1 },
  wood: { color: 0xa9793f, roughness: 0.85 },
  woodLight: { color: 0xc79a5b, roughness: 0.85 },
  ply: { color: 0xd8b981, roughness: 0.8 },
  copaiba: { color: 0xa66a3f, roughness: 0.8 },
  osb: { color: 0xc9a46a, roughness: 0.9 },
  pine: { color: 0xbf9560, roughness: 0.85 },
  spc: { color: 0x8a6a4e, roughness: 0.55 },
  panel: { color: 0xe8eaec, metalness: 0.15, roughness: 0.6 },
  panelRidge: { color: 0xd4d7da, roughness: 0.6 },
  roofTile: { color: 0x8c5a4c, roughness: 0.75 },
  wrap: { color: 0xf1eee6, roughness: 0.85 },
  gutter: { color: 0x2a3038, metalness: 0.5, roughness: 0.5 },
  siding: { color: 0xb9b3a5, roughness: 0.7 },
  cement: { color: 0xd3cdc0, roughness: 0.85 },
  glass: { color: 0xbfe3ff, metalness: 0.1, roughness: 0.1, opacity: 0.3 },
  frame: { color: 0xf2f4f6, metalness: 0.3, roughness: 0.45 },
  door: { color: 0x2a3038, metalness: 0.3, roughness: 0.4 },
  drywall: { color: 0xd8d2c4, roughness: 0.9 },
  lining: { color: 0xdcc190, roughness: 0.8 },
  ceramic: { color: 0xcfc6b6, roughness: 0.5 },
  opening: { color: 0xe3b98a, roughness: 0.8 },
  deck: { color: 0x9a7b4f, roughness: 0.8 },
  solar: { color: 0x1c2b4a, metalness: 0.6, roughness: 0.3 },
  water: { color: 0x66c6e8, roughness: 0.2, opacity: 0.7 },
  coping: { color: 0xd8d2c4, roughness: 0.7 },
  fence: { color: 0x3b4655, roughness: 0.8 },
  pole: { color: 0x2a3038, metalness: 0.4, roughness: 0.6 },
  camera: { color: 0xe8e4da, roughness: 0.5 },
  stake: { color: 0xc9a227, roughness: 0.8 },
  string: { color: 0xe8e4da, roughness: 0.9 },
  truck: { color: 0x6f7f96, roughness: 0.7 },
  wheel: { color: 0x14181f, roughness: 0.9 },
  shopFloor: { color: 0x2b3139, roughness: 0.95 },
  table: { color: 0x8a6a3e, roughness: 0.8 },
  container: { color: 0x3d6b5a, roughness: 0.7 },
  shaft: { color: 0x9fc9e8, roughness: 0.4, opacity: 0.18 },
};

export function createMaterial(key: MatKey): THREE.MeshStandardMaterial {
  const d = DEFS[key];
  const opacity = d.opacity ?? 1;
  const m = new THREE.MeshStandardMaterial({
    color: d.color,
    metalness: d.metalness ?? 0,
    roughness: d.roughness ?? 0.8,
    emissive: d.emissive ?? 0x000000,
    emissiveIntensity: d.emissiveIntensity ?? 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
  });
  m.userData.baseOpacity = opacity;
  return m;
}
