"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type StockItem = { id: string; name: string; stock: number; price: number; alertAt: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const kind = (p: StockItem) => (p.stock <= 0 ? "out" : p.stock <= p.alertAt ? "low" : "ok");
const COLOR = { ok: 0xe9c987, low: 0xf4a62a, out: 0xff6b6b } as const;
const LABEL = { ok: "In stock", low: "Low", out: "Out" } as const;

/**
 * Every active product as a glowing column on a ring around a gold jar; height = jars on the shelf.
 * Drag to turn, hover for numbers, click a column to edit that product. three.js loads only on this page.
 */
export function StockSkyline({ items }: { items: StockItem[] }) {
  const host = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [tip, setTip] = useState<{ x: number; y: number; p: StockItem } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || !items.length) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const key = new THREE.PointLight(0xffd9a0, 3.2, 90, 0);
      key.position.set(0, 16, 8);
      scene.add(key);
      const rim = new THREE.PointLight(0x2ec4b6, 1.6, 80, 0);
      rim.position.set(-18, 7, -14);
      scene.add(rim);

      // soft round glow texture for sprites and dust
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 128;
      const gx = glowCanvas.getContext("2d")!;
      const grad = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.25, "rgba(255,255,255,.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      gx.fillStyle = grad;
      gx.fillRect(0, 0, 128, 128);
      const glowTex = new THREE.CanvasTexture(glowCanvas);
      glowTex.colorSpace = THREE.SRGBColorSpace;
      const glow = (hex: number, s: number, opacity = 0.9) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
        sp.scale.set(s, s, 1);
        return sp;
      };

      // the ring grows with the catalogue
      const R = Math.max(8.5, (items.length * 1.5) / (Math.PI * 2));
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(R + 5.4, R + 5.8, 0.4, 96), new THREE.MeshStandardMaterial({ color: 0x1b0810, metalness: 0.6, roughness: 0.3 }));
      floor.position.y = -0.2;
      scene.add(floor);
      const edge = new THREE.Mesh(new THREE.TorusGeometry(R + 5.6, 0.07, 8, 160), new THREE.MeshBasicMaterial({ color: 0xe9c987 }));
      edge.rotation.x = Math.PI / 2;
      scene.add(edge);
      [0.4, 0.7, 1.3, 1.5].forEach((f, i) => {
        const ring = new THREE.Mesh(new THREE.RingGeometry(R * f - 0.02, R * f + 0.02, 128), new THREE.MeshBasicMaterial({ color: 0xe9c987, transparent: true, opacity: 0.12 + i * 0.03, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        scene.add(ring);
      });

      // centre: a jar with a gold lid
      const jar = new THREE.Group();
      scene.add(jar);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.4, 48), new THREE.MeshStandardMaterial({ color: 0x8a4b26, roughness: 0.35, metalness: 0.2, emissive: 0x3a1406, emissiveIntensity: 0.4 }));
      body.position.y = 1.9;
      const label = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 1.5, 48), new THREE.MeshStandardMaterial({ color: 0xfbf3e4, roughness: 0.5, emissive: 0x8a7a60, emissiveIntensity: 0.25 }));
      label.position.y = 1.95;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.68, 0.6, 48), new THREE.MeshStandardMaterial({ color: 0xe9c987, metalness: 0.9, roughness: 0.22, emissive: 0x6a4a18, emissiveIntensity: 0.35 }));
      lid.position.y = 3.9;
      const halo = glow(0xffc861, 9, 0.5);
      halo.position.y = 2.2;
      jar.add(body, label, lid, halo);

      // one column per product
      const maxStock = Math.max(20, ...items.map((p) => p.stock));
      const bars: Array<{ mesh: THREE.Mesh; cap: THREE.Sprite; ring?: THREE.Mesh; h: number; p: StockItem; k: "ok" | "low" | "out"; i: number; base: number }> = [];
      items.forEach((p, i) => {
        const a = (i / items.length) * Math.PI * 2;
        const k = kind(p);
        const h = p.stock > 0 ? 0.6 + (p.stock / maxStock) * 7.5 : 0.35;
        const g = new THREE.Group();
        g.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
        scene.add(g);
        const base = k === "ok" ? 0.2 : 0.6;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1, 0.78), new THREE.MeshStandardMaterial({ color: COLOR[k], metalness: 0.35, roughness: 0.25, emissive: COLOR[k], emissiveIntensity: base, transparent: true, opacity: 0.92 }));
        mesh.scale.y = reduce ? h : 0.001;
        mesh.position.y = mesh.scale.y / 2;
        mesh.userData.i = i;
        g.add(mesh);
        const cap = glow(COLOR[k], k === "ok" ? 1.6 : 3, k === "ok" ? 0.5 : 0.95);
        cap.position.y = mesh.scale.y + 0.15;
        g.add(cap);
        let ring: THREE.Mesh | undefined;
        if (k !== "ok") {
          ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 40), new THREE.MeshBasicMaterial({ color: COLOR[k], transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.02;
          g.add(ring);
        }
        bars.push({ mesh, cap, ring, h, p, k, i, base });
      });

      // gold dust
      const n = 500;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = 4 + Math.random() * (R + 12);
        const a = Math.random() * Math.PI * 2;
        pos.set([Math.cos(a) * r, Math.random() * 16, Math.sin(a) * r], i * 3);
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xffd9a0, size: 0.35, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(dust);

      // camera orbit, drag, hover, click
      const orbit = { a: 0.6, e: 0.5, d: 31, ta: 0.6, te: 0.5 };
      let auto = !reduce;
      const size = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
        orbit.d = (R * 2.5 + 11) * Math.max(1, 1.2 / cam.aspect);
      };
      const ro = new ResizeObserver(size);
      ro.observe(el);
      size();

      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const meshes = bars.map((b) => b.mesh);
      const pick = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, cam);
        const hit = ray.intersectObjects(meshes)[0];
        return hit ? bars[hit.object.userData.i as number] : null;
      };
      let hovered: (typeof bars)[number] | null = null;
      const setHover = (b: typeof hovered) => {
        if (hovered && hovered !== b) (hovered.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered.base;
        hovered = b;
        if (b) (b.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
        renderer.domElement.style.cursor = b ? "pointer" : "";
      };
      let drag: { x: number; y: number; a: number; e: number; moved: boolean } | null = null;
      const onDown = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, a: orbit.ta, e: orbit.te, moved: false }; auto = false; };
      const onMove = (e: PointerEvent) => {
        if (drag) {
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
          orbit.ta = drag.a - dx * 0.006;
          orbit.te = Math.max(0.12, Math.min(1.1, drag.e + dy * 0.004));
          return;
        }
        if (e.target !== renderer.domElement) return;
        const b = pick(e);
        setHover(b);
        const r = el.getBoundingClientRect();
        setTip(b ? { x: e.clientX - r.left, y: e.clientY - r.top, p: b.p } : null);
      };
      const onUp = (e: PointerEvent) => {
        if (!drag) return;
        const click = !drag.moved;
        drag = null;
        if (click && e.target === renderer.domElement) {
          const b = pick(e);
          if (b) router.push(`/admin/products/edit/${b.p.id}`);
        }
      };
      const onLeave = () => { setHover(null); setTip(null); };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerleave", onLeave);
      addEventListener("pointermove", onMove);
      addEventListener("pointerup", onUp);

      // grow the columns in (elastic), then idle
      const t0 = performance.now();
      const ease = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x) * Math.cos(x * 10 * 0.62));
      let visible = true;
      const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
      io.observe(el);
      const clock = new THREE.Clock();
      const look = new THREE.Vector3(0, 2.2, 0);
      let raf = 0;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) { clock.getDelta(); return; }
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        if (!reduce) {
          const now = performance.now();
          for (const b of bars) {
            const x = Math.max(0, (now - t0 - 300 - b.i * 30) / 1400);
            const y = Math.max(0.001, b.h * ease(x));
            b.mesh.scale.y = y;
            b.mesh.position.y = y / 2;
            b.cap.position.y = y + 0.15;
            if (b.ring) (b.ring.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.4 * Math.sin(t * 4 + b.i);
          }
          jar.rotation.y = t * 0.4;
          jar.position.y = Math.sin(t * 1.3) * 0.15;
          dust.rotation.y = t * 0.02;
          if (auto) orbit.ta += dt * 0.08;
        }
        orbit.a += (orbit.ta - orbit.a) * 0.08;
        orbit.e += (orbit.te - orbit.e) * 0.08;
        cam.position.set(Math.sin(orbit.a) * Math.cos(orbit.e) * orbit.d, Math.sin(orbit.e) * orbit.d + 2, Math.cos(orbit.a) * Math.cos(orbit.e) * orbit.d);
        cam.lookAt(look);
        renderer.render(scene, cam);
      };
      frame();
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        removeEventListener("pointermove", onMove);
        removeEventListener("pointerup", onUp);
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          const mat = m.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose();
        });
        glowTex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [items, router]);

  if (!items.length) return <div className="cc-empty">No active products yet.</div>;
  return (
    <div ref={host} className="cc-canvas">
      {!ready && <div className="cc-loading">Building the 3D shelf…</div>}
      {tip && (
        <div className="cc-tip" style={{ left: tip.x, top: tip.y }}>
          <b>{tip.p.name}</b>
          {tip.p.stock} in stock · {LABEL[kind(tip.p)]} · {inr(tip.p.price)}
          <br />
          <span style={{ color: "var(--cc-gold)" }}>Click to edit</span>
        </div>
      )}
    </div>
  );
}
