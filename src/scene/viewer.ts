// One WebGL canvas: renderer, lights, ground, orbit rig and the render loop. Plain TypeScript, no React.
// Performance (SPEC §8.4): pixel ratio capped at 2, no shadows, the loop stops while the canvas is off-screen or the
// tab is hidden, and with prefers-reduced-motion nothing rotates by itself (it renders on demand only).
import * as THREE from "three";
import { OrbitRig } from "./rig";
import { disposeObject } from "./primitives";
import type { SceneBuild } from "./types";

const AUTO_ROTATE_SPEED = 0.13; // rad/s

export class SceneViewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  private readonly rig: OrbitRig;
  private readonly ground: THREE.Mesh;
  private readonly grid: THREE.GridHelper;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersection: IntersectionObserver;
  private raf = 0;
  private last = 0;
  private dirty = true;
  private onScreen = true;
  private disposed = false;
  private readonly onVisibility = () => this.sync();
  private readonly onLost = (e: Event) => e.preventDefault();
  private readonly onRestored = () => this.invalidate();

  /** Throws when WebGL is unavailable; the caller shows a fallback message. */
  constructor(private readonly container: HTMLElement, private readonly build: SceneBuild, opts: { background: string; reducedMotion: boolean }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = this.renderer.domElement;
    canvas.className = "scene-canvas";
    container.appendChild(canvas);

    const bg = new THREE.Color(opts.background);
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(bg, 70, 150);
    this.scene.add(new THREE.HemisphereLight(0xcfd8e3, 0x2a2620, 0.9));
    const sun = new THREE.DirectionalLight(0xfff1de, 0.95);
    sun.position.set(14, 20, 8);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8fb3d9, 0.3);
    fill.position.set(-10, 6, -12);
    this.scene.add(fill);

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: 0x1a1e23, roughness: 1 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.scene.add(this.ground);
    this.grid = new THREE.GridHelper(160, 80, 0x2c333b, 0x22282e);
    this.scene.add(this.grid);
    this.scene.add(build.group);

    const { l, w, h } = build.bounds;
    const framing: NonNullable<SceneBuild["framing"]> = build.framing ?? { radius: 1.15 * Math.hypot(l, w, h) + 6, target: [0, h * 0.4, 0] as [number, number, number] };
    this.rig = new OrbitRig({ radius: framing.radius, target: new THREE.Vector3(...framing.target), autoRotate: !opts.reducedMotion });
    if (framing.theta !== undefined) this.rig.theta = framing.theta;
    if (framing.phi !== undefined) this.rig.phi = framing.phi;
    this.rig.attach(canvas, () => this.invalidate());

    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersection = new IntersectionObserver((entries) => {
      this.onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
      this.sync();
    });
    this.intersection.observe(container);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resize();
    this.sync();
  }

  /** Ask for a new frame (state changed). */
  invalidate(): void {
    this.dirty = true;
    this.sync();
  }

  private get active(): boolean {
    return !this.disposed && this.onScreen && !document.hidden;
  }

  /** Start or stop the loop: nothing runs while the canvas is hidden. Never render a hidden canvas. */
  private sync(): void {
    if (this.active && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!this.active && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private readonly tick = (now: number) => {
    this.raf = 0;
    if (!this.active) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.rig.autoRotate) {
      this.rig.theta += AUTO_ROTATE_SPEED * dt;
      this.dirty = true;
    }
    if (this.dirty) {
      this.dirty = false;
      this.rig.apply(this.camera);
      this.renderer.render(this.scene, this.camera);
    }
    // keep ticking only while something can change the picture (auto-rotate); otherwise wait for invalidate()
    if (this.rig.autoRotate) this.raf = requestAnimationFrame(this.tick);
  };

  private resize(): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("webglcontextlost", this.onLost);
    canvas.removeEventListener("webglcontextrestored", this.onRestored);
    this.rig.detach();
    disposeObject(this.build.group);
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.grid.geometry.dispose();
    (this.grid.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}
