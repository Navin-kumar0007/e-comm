"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Float } from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

function FloatingSpices({ count = 35 }) {
  const pointsRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    const colors = ["#EAB308", "#DC2626", "#9A3412", "#B45309", "#86EFAC"];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 5;
      const z = (Math.random() - 0.5) * 5;
      const size = Math.random() * 0.05 + 0.02;
      const speed = Math.random() * 0.2 + 0.1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      temp.push({ x, y, z, size, speed, color });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <group ref={pointsRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <dodecahedronGeometry args={[p.size]} />
          <meshStandardMaterial color={p.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function PremiumJar() {
  const jarRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (jarRef.current) {
      jarRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <group ref={jarRef} position={[0, -0.2, 0]}>
      {/* Wooden Lid */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.25, 32]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.25, 32]} />
        <meshPhysicalMaterial
          transmission={0.9}
          roughness={0.1}
          thickness={0.3}
          ior={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Glass Body */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2.2, 32]} />
        <meshPhysicalMaterial
          transmission={0.9}
          roughness={0.1}
          thickness={0.3}
          ior={1.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Gold Ring Accents */}
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[0.81, 0.02, 16, 100]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <torusGeometry args={[0.81, 0.02, 16, 100]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Spice Layer 1: Turmeric */}
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.77, 0.77, 0.8, 32]} />
        <meshStandardMaterial color="#EAB308" roughness={0.95} />
      </mesh>
      {/* Spice Layer 2: Chili */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.77, 0.77, 0.6, 32]} />
        <meshStandardMaterial color="#DC2626" roughness={0.95} />
      </mesh>
      {/* Spice Layer 3: Cardamom */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.77, 0.77, 0.6, 32]} />
        <meshStandardMaterial color="#86EFAC" roughness={0.95} />
      </mesh>
    </group>
  );
}

function SceneContent() {
  useFrame((state) => {
    // Smooth camera tilt based on pointer
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 0.8 + 0.5, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, -2]} intensity={0.5} />
      <Environment preset="sunset" />
      <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.6}>
        <PremiumJar />
        <FloatingSpices count={40} />
      </Float>
      <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={5} blur={1.5} far={3} />
    </>
  );
}

export default function Hero3DScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-secondary/5 rounded-3xl animate-pulse">
        <span className="text-muted-foreground text-sm">Preparing 3D Canvas...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] relative">
      <Canvas camera={{ position: [0, 0.5, 4.2], fov: 45 }}>
        <SceneContent />
      </Canvas>
    </div>
  );
}
