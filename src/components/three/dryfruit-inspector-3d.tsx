"use client";

import React, { Suspense, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html, Float, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, RotateCw, ShoppingBag } from "lucide-react";

type NutType = "almond" | "cashew" | "walnut";

const NUT_DATA = {
  almond: {
    name: "Afghan Mamra Almond (Super Premium)",
    slug: "premium-afghan-almonds",
    origin: "Kandahar Valley, Afghanistan",
    price: "₹1,050",
    weight: "500g",
    textureUrl: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    hotspots: [
      { pos: [0.75, 0.4, 0.12] as [number, number, number], label: "Natural Oil (Up to 50%)", desc: "Twice the essential fatty acids of California almonds" },
      { pos: [-0.75, -0.3, 0.12] as [number, number, number], label: "Concave Shape", desc: "Signature curve of authentic high-altitude harvest" },
      { pos: [0, -0.9, 0.12] as [number, number, number], label: "Zero Pasteurized", desc: "Raw, unheated, full enzyme vitality intact" },
    ],
  },
  cashew: {
    name: "Goan Jumbo Cashews (King Size W180)",
    slug: "organic-whole-cashews",
    origin: "Organic Coastal Farms, Goa",
    price: "₹799",
    weight: "500g",
    textureUrl: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    hotspots: [
      { pos: [0.75, 0.35, 0.12] as [number, number, number], label: "Grade W180 King Size", desc: "Only top 2% of annual harvest qualifies" },
      { pos: [-0.75, 0.2, 0.12] as [number, number, number], label: "Unroasted & Unbleached", desc: "No sulfur treatment or artificial whitening" },
      { pos: [0.2, -0.85, 0.12] as [number, number, number], label: "Buttery Sweetness", desc: "Naturally rich in copper, magnesium & plant protein" },
    ],
  },
  walnut: {
    name: "Kashmiri Snow-White Walnut Kernels",
    slug: "kashmiri-walnut-kernels",
    origin: "Shopian & Pampore Valleys, Kashmir",
    price: "₹720",
    weight: "400g",
    textureUrl: "https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon",
    hotspots: [
      { pos: [0.75, 0.45, 0.12] as [number, number, number], label: "Plant Omega-3 ALA", desc: "Clinically proven brain & cardiovascular booster" },
      { pos: [-0.75, -0.25, 0.12] as [number, number, number], label: "Zero Bitterness", desc: "Fresh valley cracking preserves mild, creamy taste" },
      { pos: [0, 0.85, 0.12] as [number, number, number], label: "Deep Brain Lobes", desc: "Paper-shell walnut with intact natural oils" },
    ],
  },
};

function NutInspectorMesh({
  textureUrl,
  hotspots,
  activeHotspot,
  onHotspotClick,
}: {
  textureUrl: string;
  hotspots: { pos: [number, number, number]; label: string; desc: string }[];
  activeHotspot: number | null;
  onHotspotClick: (idx: number) => void;
}) {
  const texture = useTexture(textureUrl);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.25;
      groupRef.current.rotation.x = Math.cos(t * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Jewel Bevel Cylinder (faces camera +Z) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.1, 64]} />
        <meshStandardMaterial color="#C59B27" metalness={0.92} roughness={0.18} />
      </mesh>

      {/* Front Face */}
      <mesh position={[0, 0, 0.08]} castShadow receiveShadow>
        <circleGeometry args={[0.86, 64]} />
        <meshStandardMaterial map={texture} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* Back Face */}
      <mesh position={[0, 0, -0.08]} castShadow receiveShadow rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.86, 64]} />
        <meshStandardMaterial map={texture} roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer Gold Border Ring */}
      <mesh position={[0, 0, 0.085]}>
        <ringGeometry args={[0.84, 0.92, 64]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* Inner Accent Ring */}
      <mesh position={[0, 0, 0.086]}>
        <ringGeometry args={[0.74, 0.78, 64]} />
        <meshStandardMaterial color="#F3CF72" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Interactive Quality Hotspots */}
      {hotspots.map((h, i) => (
        <Html key={i} position={h.pos} zIndexRange={[100, 0]}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHotspotClick(i);
            }}
            className="group relative -translate-x-1/2 -translate-y-1/2 focus:outline-none"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white shadow-md text-[9px] font-bold text-white items-center justify-center">
                {i + 1}
              </span>
            </span>
            <span className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex whitespace-nowrap bg-black/90 text-white text-[10px] px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm pointer-events-none z-50 border border-white/20">
              {h.label}
            </span>
          </button>
        </Html>
      ))}
    </group>
  );
}

function InspectorScene({
  type,
  activeHotspot,
  onHotspotClick,
}: {
  type: NutType;
  activeHotspot: number | null;
  onHotspotClick: (idx: number) => void;
}) {
  const current = NUT_DATA[type];

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={2.0} castShadow />
      <pointLight position={[-4, 2, 2]} intensity={25} color="#D4AF37" />
      <pointLight position={[3, -2, 2]} intensity={18} color="#1B3B2B" />
      <pointLight position={[0, 0, 4]} intensity={15} color="#FFF8F0" />

      <Float speed={1.4} rotationIntensity={0.1} floatIntensity={0.25}>
        <NutInspectorMesh
          textureUrl={current.textureUrl}
          hotspots={current.hotspots}
          activeHotspot={activeHotspot}
          onHotspotClick={onHotspotClick}
        />
      </Float>

      <ContactShadows position={[0, -2.1, 0]} opacity={0.3} scale={8} blur={2.2} far={4} color="#1B3B2B" />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.2}
        maxDistance={7}
        autoRotate
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
      />
    </>
  );
}

export function DryFruitInspector3D() {
  const [activeNut, setActiveNut] = useState<NutType>("almond");
  const [activeHotspot, setActiveHotspot] = useState<number | null>(0);
  const data = NUT_DATA[activeNut];

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 p-4 md:p-6 shadow-xl flex flex-col gap-6">
      
      {/* Nut Type Switcher Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#C85B43] font-mono">
            360° Real Macro Texture &amp; Quality Inspection
          </span>
          <h3 className="text-xl md:text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-50">
            Interactive Nut Inspector
          </h3>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
          {(["almond", "cashew", "walnut"] as NutType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveNut(type);
                setActiveHotspot(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                activeNut === type
                  ? "bg-[#1E3A2B] text-white shadow"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Canvas Area with Real Photographic Medallion */}
      <div className="relative w-full h-[250px] md:h-[290px] rounded-2xl bg-[#FAF7F2] dark:bg-zinc-950/60 overflow-hidden border border-zinc-200/60 dark:border-zinc-800 cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 0, 5.8], fov: 32 }}>
          <Suspense fallback={null}>
            <InspectorScene
              type={activeNut}
              activeHotspot={activeHotspot}
              onHotspotClick={(idx) => setActiveHotspot(idx)}
            />
          </Suspense>
        </Canvas>

        {/* 360 Drag Hint */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 shadow-sm pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
          <span>Drag 360° to Rotate Real Nut Studio</span>
        </div>

        {/* Origin Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 shadow-sm">
          📍 {data.origin}
        </div>
      </div>

      {/* Interactive Quality Hotspot Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.hotspots.map((h, idx) => (
          <button
            key={idx}
            onClick={() => setActiveHotspot(idx)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              activeHotspot === idx
                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-sm"
                : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {h.label}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {h.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{data.name}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[#C85B43]">{data.price}</span>
            <span className="text-xs text-zinc-500">per {data.weight} Glass Jar</span>
          </div>
        </div>

        <Link href={`/product/${data.slug}`}>
          <Button size="lg" className="bg-[#1E3A2B] hover:bg-[#15291E] text-white rounded-full px-7 font-semibold text-xs shadow-md flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Order This Grade ({data.weight})</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
