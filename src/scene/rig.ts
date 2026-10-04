// Orbit, pinch and wheel zoom, optional auto-rotate (ported from the carcaça file, minus React).
import * as THREE from "three";

export class OrbitRig {
  theta = 0.7;
  phi = 1.15;
  radius: number;
  autoRotate: boolean;
  readonly target: THREE.Vector3;
  private readonly minR: number;
  private readonly maxR: number;
  private pointers = new Map<number, { x: number; y: number }>();
  private lastPinch = 0;
  private cleanup: (() => void) | null = null;

  constructor(opts: { radius: number; target: THREE.Vector3; autoRotate: boolean }) {
    this.radius = opts.radius;
    this.target = opts.target;
    this.autoRotate = opts.autoRotate;
    this.minR = Math.max(5, opts.radius * 0.35);
    this.maxR = opts.radius * 2.4;
  }

  attach(el: HTMLElement, onChange: () => void): void {
    el.style.touchAction = "none";
    const onDown = (e: PointerEvent) => {
      this.autoRotate = false;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this.theta -= (e.clientX - prev.x) * 0.006;
        this.phi = Math.max(0.15, Math.min(1.5, this.phi - (e.clientY - prev.y) * 0.005));
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.lastPinch) this.radius = Math.max(this.minR, Math.min(this.maxR, this.radius * (this.lastPinch / d)));
        this.lastPinch = d;
      }
      onChange();
    };
    const onUp = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      this.lastPinch = 0;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.autoRotate = false;
      this.radius = Math.max(this.minR, Math.min(this.maxR, this.radius * (1 + e.deltaY * 0.001)));
      onChange();
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    this.cleanup = () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }

  detach(): void {
    this.cleanup?.();
    this.cleanup = null;
  }

  apply(camera: THREE.PerspectiveCamera): void {
    const sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    camera.position.set(
      this.target.x + this.radius * sp * Math.sin(this.theta),
      this.target.y + this.radius * cp,
      this.target.z + this.radius * sp * Math.cos(this.theta),
    );
    camera.lookAt(this.target);
  }
}
