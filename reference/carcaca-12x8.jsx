import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ---------- build sequence ----------
const STEPS = [
  { label: "Vigas W250", note: "Four W250 steel beams form the 12 × 8 m base ring" },
  { label: "Quadro de madeira", note: "Wood rim frame sits inside the steel box" },
  { label: "Barrotes @ 60 cm", note: "Wood cross rafters span the short direction" },
  { label: "Compensado naval", note: "Plywood deck ties the frame together" },
  { label: "Piso SPC", note: "Finish floor covers all steel and wood framing" },
  { label: "Pilares soldados", note: "Upright posts welded directly to the carcass" },
  { label: "Vigas de topo", note: "Top ring beams close the cube" },
  { label: "Terças", note: "Cross purlins ready to carry the roof" },
  { label: "Painel sanduíche", note: "Sandwich panel roof drops on" },
  { label: "Policarbonato", note: "Polycarbonate walls click in. House done." },
];

// ---------- dimensions (meters) ----------
const L = 12, W = 8, H = 3;
const STEEL_D = 0.25; // W250 depth

export default function App() {
  const mountRef = useRef(null);
  const groupsRef = useRef([]);
  const [step, setStep] = useState(STEPS.length - 1);
  const stepRef = useRef(step);

  useEffect(() => { stepRef.current = step; syncVisibility(step); }, [step]);

  function syncVisibility(s) {
    groupsRef.current.forEach((g, i) => { if (g) g.visible = i <= s; });
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x14171b);
    scene.fog = new THREE.Fog(0x14171b, 45, 90);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ---------- lights ----------
    scene.add(new THREE.HemisphereLight(0xcfd8e3, 0x2a2620, 0.9));
    const sun = new THREE.DirectionalLight(0xfff1de, 0.95);
    sun.position.set(14, 20, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb3d9, 0.3);
    fill.position.set(-10, 6, -12);
    scene.add(fill);

    // ---------- materials ----------
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a5560, metalness: 0.75, roughness: 0.45 });
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x39424b, metalness: 0.75, roughness: 0.5 });
    const weld = new THREE.MeshStandardMaterial({ color: 0xff8a3d, metalness: 0.4, roughness: 0.5, emissive: 0x903c00, emissiveIntensity: 0.35 });
    const wood = new THREE.MeshStandardMaterial({ color: 0xa9793f, roughness: 0.85 });
    const woodLight = new THREE.MeshStandardMaterial({ color: 0xc79a5b, roughness: 0.85 });
    const ply = new THREE.MeshStandardMaterial({ color: 0xd8b981, roughness: 0.8 });
    const spc = new THREE.MeshStandardMaterial({ color: 0x8a6a4e, roughness: 0.55 });
    const panel = new THREE.MeshStandardMaterial({ color: 0xe8eaec, metalness: 0.15, roughness: 0.6 });
    const poly = new THREE.MeshPhongMaterial({
      color: 0xbfe3ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide,
      shininess: 90, specular: 0x99ccff, depthWrite: false,
    });

    const box = (w, h, d, mat, x, y, z, parent) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    // I-beam along local X, length len, depth STEEL_D
    const iBeam = (len, mat) => {
      const g = new THREE.Group();
      const fw = 0.2, ft = 0.017, wt = 0.011;
      box(len, ft, fw, mat, 0, STEEL_D - ft / 2, 0, g); // top flange
      box(len, ft, fw, mat, 0, ft / 2, 0, g);           // bottom flange
      box(len, STEEL_D - 2 * ft, wt, mat, 0, STEEL_D / 2, 0, g); // web
      return g;
    };

    // ---------- ground ----------
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x1a1e23, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);
    const grid = new THREE.GridHelper(120, 60, 0x2c333b, 0x22282e);
    grid.position.y = 0;
    scene.add(grid);

    // ---------- step groups ----------
    const groups = STEPS.map(() => new THREE.Group());
    groups.forEach((g) => scene.add(g));
    groupsRef.current = groups;

    // 0 — W250 steel ring
    const inset = 0.1;
    const beamF = iBeam(L, steel); beamF.position.set(0, 0, -(W / 2 - inset)); groups[0].add(beamF);
    const beamB = iBeam(L, steel); beamB.position.set(0, 0, W / 2 - inset); groups[0].add(beamB);
    const beamL = iBeam(W - 0.42, steel); beamL.rotation.y = Math.PI / 2; beamL.position.set(-(L / 2 - inset), 0, 0); groups[0].add(beamL);
    const beamR = iBeam(W - 0.42, steel); beamR.rotation.y = Math.PI / 2; beamR.position.set(L / 2 - inset, 0, 0); groups[0].add(beamR);

    // 1 — wood rim frame inside steel
    const rimT = 0.045, rimH = 0.22, ri = 0.24;
    box(L - 2 * ri, rimH, rimT, wood, 0, STEEL_D - rimH / 2, -(W / 2 - ri), groups[1]);
    box(L - 2 * ri, rimH, rimT, wood, 0, STEEL_D - rimH / 2, W / 2 - ri, groups[1]);
    box(rimT, rimH, W - 2 * ri, wood, -(L / 2 - ri), STEEL_D - rimH / 2, 0, groups[1]);
    box(rimT, rimH, W - 2 * ri, wood, L / 2 - ri, STEEL_D - rimH / 2, 0, groups[1]);

    // 2 — joists @ 60 cm spanning short direction
    for (let x = -L / 2 + 0.6; x < L / 2 - 0.29; x += 0.6) {
      box(rimT, rimH, W - 2 * ri - 0.1, woodLight, x, STEEL_D - rimH / 2, 0, groups[2]);
    }

    // 3 — plywood deck
    box(L - 0.1, 0.018, W - 0.1, ply, 0, STEEL_D + 0.009, 0, groups[3]);

    // 4 — SPC finish floor
    box(L, 0.008, W, spc, 0, STEEL_D + 0.018 + 0.004, 0, groups[4]);

    // 5 — welded columns
    const colXs = [-(L / 2 - inset), -3, 0, 3, L / 2 - inset];
    const colZs = [-(W / 2 - inset), W / 2 - inset];
    const colPts = [];
    colXs.forEach((x) => colZs.forEach((z) => colPts.push([x, z])));
    colPts.push([-(L / 2 - inset), 0], [L / 2 - inset, 0]); // mid posts on short sides
    colPts.forEach(([x, z]) => {
      box(0.1, H, 0.1, steelDark, x, STEEL_D + H / 2, z, groups[5]);
      box(0.15, 0.035, 0.15, weld, x, STEEL_D + 0.018, z, groups[5]); // weld collar
    });

    // 6 — top ring beams
    const topY = STEEL_D + H + 0.075;
    box(L, 0.15, 0.1, steel, 0, topY, -(W / 2 - inset), groups[6]);
    box(L, 0.15, 0.1, steel, 0, topY, W / 2 - inset, groups[6]);
    box(0.1, 0.15, W - 0.2, steel, -(L / 2 - inset), topY, 0, groups[6]);
    box(0.1, 0.15, W - 0.2, steel, L / 2 - inset, topY, 0, groups[6]);

    // 7 — roof purlins
    const purlinY = STEEL_D + H + 0.2;
    for (let x = -L / 2 + 0.75; x < L / 2; x += 1.5) {
      box(0.06, 0.1, W - 0.15, steelDark, x, purlinY, 0, groups[7]);
    }

    // 8 — sandwich panel roof
    const roofY = STEEL_D + H + 0.25 + 0.055;
    box(L + 0.7, 0.1, W + 0.7, panel, 0, roofY, 0, groups[8]);
    for (let z = -W / 2 - 0.2; z <= W / 2 + 0.2; z += 1.0) {
      box(L + 0.7, 0.02, 0.06, new THREE.MeshStandardMaterial({ color: 0xd4d7da, roughness: 0.6 }), 0, roofY + 0.06, z, groups[8]);
    }

    // 9 — polycarbonate walls
    const wallY = STEEL_D + H / 2;
    const mkWall = (w, h, x, z, rotY) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), poly);
      m.position.set(x, wallY, z);
      m.rotation.y = rotY;
      groups[9].add(m);
      // multiwall rib lines
      const ribMat = new THREE.LineBasicMaterial({ color: 0x9fc9e8, transparent: true, opacity: 0.35 });
      for (let u = -w / 2 + 0.5; u < w / 2; u += 0.5) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(u, -h / 2, 0), new THREE.Vector3(u, h / 2, 0),
        ]);
        const line = new THREE.Line(geo, ribMat);
        line.position.copy(m.position);
        line.rotation.y = rotY;
        groups[9].add(line);
      }
    };
    mkWall(L - 0.1, H, 0, -(W / 2 - inset - 0.06), 0);
    mkWall(L - 0.1, H, 0, W / 2 - inset - 0.06, 0);
    mkWall(W - 0.2, H, -(L / 2 - inset - 0.06), 0, Math.PI / 2);
    mkWall(W - 0.2, H, L / 2 - inset - 0.06, 0, Math.PI / 2);

    syncVisibility(stepRef.current);

    // ---------- camera orbit ----------
    const target = new THREE.Vector3(0, 1.4, 0);
    let theta = 0.7, phi = 1.15, radius = 19;
    let autoRotate = true;
    const applyCam = () => {
      const sp = Math.sin(phi), cp = Math.cos(phi);
      camera.position.set(
        target.x + radius * sp * Math.sin(theta),
        target.y + radius * cp,
        target.z + radius * sp * Math.cos(theta)
      );
      camera.lookAt(target);
    };

    const pointers = new Map();
    let lastPinch = 0;
    const el = renderer.domElement;
    el.style.touchAction = "none";

    const onDown = (e) => {
      autoRotate = false;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        theta -= (e.clientX - prev.x) * 0.006;
        phi = Math.max(0.15, Math.min(1.5, phi - (e.clientY - prev.y) * 0.005));
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (lastPinch) radius = Math.max(8, Math.min(45, radius * (lastPinch / d)));
        lastPinch = d;
      }
    };
    const onUp = (e) => { pointers.delete(e.pointerId); lastPinch = 0; };
    const onWheel = (e) => {
      e.preventDefault();
      autoRotate = false;
      radius = Math.max(8, Math.min(45, radius * (1 + e.deltaY * 0.001)));
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let raf;
    const tick = () => {
      if (autoRotate) theta += 0.0022;
      applyCam();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      mount.removeChild(el);
      renderer.dispose();
    };
  }, []);

  const s = STEPS[step];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#14171b",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#e8e4da",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 14, left: 16, right: 16, zIndex: 2, pointerEvents: "none" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "#ff8a3d" }}>CARCAÇA · 12 × 8 M</div>
        <div style={{ fontSize: 15, marginTop: 3, color: "#f4f1ea" }}>Steel + wood floor, welded cube, one-click walls</div>
      </div>

      <div ref={mountRef} style={{ flex: 1, minHeight: 0 }} />

      <div style={{
        padding: "12px 16px 18px", background: "rgba(17,20,24,0.92)",
        borderTop: "1px solid #2a3038", backdropFilter: "blur(6px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 14, color: "#ff8a3d" }}>
            {String(step + 1).padStart(2, "0")} · {s.label}
          </span>
          <span style={{ fontSize: 11, color: "#8a919b" }}>drag to orbit · pinch to zoom</span>
        </div>
        <div style={{ fontSize: 12, color: "#b9bec6", marginBottom: 10, minHeight: 16 }}>{s.note}</div>
        <input
          type="range" min={0} max={STEPS.length - 1} value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#ff8a3d", height: 28 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b727c", marginTop: 2 }}>
          <span>vigas</span><span>piso</span><span>pilares</span><span>teto</span><span>casa</span>
        </div>
      </div>
    </div>
  );
}
