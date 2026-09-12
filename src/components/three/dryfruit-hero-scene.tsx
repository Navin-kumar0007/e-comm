"use client";

import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { GoldenDustParticles } from "./dryfruit-models";

interface FloatingNutPodProps {
  textureUrl: string;
  position: [number, number, number];
  scale?: number;
  label: string;
  badge: string;
  subtext: string;
  initialRotation?: [number, number, number];
  isCenter?: boolean;
}

function FloatingNutPod({
  textureUrl,
  position,
  scale = 1,
  label,
  badge,
  subtext,
  initialRotation = [0, 0, 0],
  isCenter = false,
}: FloatingNutPodProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(textureUrl);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle subtle 3D breathing wobble
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.x = initialRotation[0] + Math.sin(t * 1.2 + position[0]) * 0.08;
      meshRef.current.rotation.y = initialRotation[1] + Math.cos(t * 1.0 + position[1]) * 0.12;
      meshRef.current.rotation.z = initialRotation[2] + Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group position={position} scale={hovered ? scale * 1.08 : scale}>
      <group
        ref={meshRef}
        rotation={initialRotation}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Luxury Gold Coin / Medallion Rim (faces camera +Z) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.14, 64]} />
          <meshStandardMaterial
            color={hovered ? "#F3CF72" : "#C59B27"}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        {/* Real Dry Fruit Photographic Circle (Faces Camera +Z) */}
        <mesh position={[0, 0, 0.075]}>
          <circleGeometry args={[1.12, 64]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>

        {/* Outer Gold Border Ring */}
        <mesh position={[0, 0, 0.082]}>
          <ringGeometry args={[1.1, 1.2, 64]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.95}
            roughness={0.12}
          />
        </mesh>

        {/* Inner Gold Inlay Ring */}
        <mesh position={[0, 0, 0.083]}>
          <ringGeometry args={[0.98, 1.02, 64]} />
          <meshStandardMaterial
            color="#E5C158"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Floating Interactive 3D Callout */}
      <Html position={[0, isCenter ? -1.15 : -1.05, 0.2]} center zIndexRange={[100, 0]}>
        <div
          className={`pointer-events-none transition-all duration-300 px-2.5 py-1 rounded-full backdrop-blur-md shadow-md border whitespace-nowrap flex items-center gap-1.5 ${
            hovered || isCenter
              ? "bg-[#1E3A2B] text-white border-amber-400/60 scale-102"
              : "bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 border-zinc-200/90"
          }`}
        >
          <span className="text-amber-400 text-[10px]">{badge}</span>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold font-heading leading-tight">{label}</span>
            <span className="text-[9px] text-zinc-300 leading-tight">{subtext}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function ParallaxRig({ children }: { children?: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    // Follow mouse cursor smoothly
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.35, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.25, 0.06);
  });

  return <group ref={group}>{children}</group>;
}

function Scene() {
  return (
    <>
      {/* Brand Jewel Lighting */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 5]} intensity={2.0} castShadow />
      <pointLight position={[-4, 3, 2]} intensity={25} color="#D4AF37" />
      <pointLight position={[3, -2, 2]} intensity={18} color="#1B3B2B" />
      <pointLight position={[0, 0, 4]} intensity={15} color="#FFF8F0" />

      <ParallaxRig>
        {/* Centerpiece: Real Afghan Mamra Almonds */}
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.28}>
          <FloatingNutPod
            textureUrl="https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon"
            position={[0, 0.05, 0.4]}
            initialRotation={[0.05, 0.05, 0]}
            scale={0.62}
            badge="👑"
            label="Afghan Mamra"
            subtext="50% Oil • Brain Tonic"
            isCenter={true}
          />
        </Float>

        {/* Left: Real Goan Jumbo Cashews */}
        <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.32}>
          <FloatingNutPod
            textureUrl="https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon"
            position={[-1.35, -0.15, -0.2]}
            initialRotation={[0.08, -0.12, 0.04]}
            scale={0.48}
            badge="🌿"
            label="King Cashew"
            subtext="W180 Raw"
          />
        </Float>

        {/* Right: Real Kashmiri Walnut Kernels */}
        <Float speed={1.7} rotationIntensity={0.12} floatIntensity={0.32}>
          <FloatingNutPod
            textureUrl="https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon"
            position={[1.35, 0.18, -0.18]}
            initialRotation={[-0.06, 0.14, -0.04]}
            scale={0.50}
            badge="🧠"
            label="Kashmiri Walnut"
            subtext="Omega-3 Rich"
          />
        </Float>

        {/* Swirling Ambient Golden Dust */}
        <GoldenDustParticles count={50} />
      </ParallaxRig>

      {/* Ground Contact Shadow */}
      <ContactShadows position={[0, -2.4, 0]} opacity={0.3} scale={11} blur={2.4} far={4} color="#1B3B2B" />
    </>
  );
}

export default function DryFruitHeroScene() {
  return (
    <div className="relative w-full h-[320px] md:h-[370px] cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 8.2], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.8]}
        className="!absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/50 dark:bg-white/10 backdrop-blur-md text-[11px] font-medium text-white tracking-wide pointer-events-none flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>3D Real Nut Studio • Move cursor to float &amp; tilt</span>
      </div>
    </div>
  );
}
