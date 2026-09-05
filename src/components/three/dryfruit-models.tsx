"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface DryFruitProps {
  scale?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  spinSpeed?: number;
  highlighted?: boolean;
  onClick?: () => void;
}

/**
 * Procedural 3D Afghan Mamra Almond
 * Characterized by a tapered teardrop silhouette and gentle concave curve.
 */
export function MamraAlmond3D({
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  spinSpeed = 0.4,
  highlighted = false,
  onClick,
}: DryFruitProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Deformed sphere geometry to create an authentic almond shape
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Taper the top (+y) into a pointed tip
      if (y > 0) {
        const factor = 1 - (y / 1) * 0.45;
        x *= factor;
        z *= factor;
      }

      // Flatten slightly in depth (z)
      z *= 0.65;

      // Elongate along y
      y *= 1.45;

      // Subtle concave curvature characteristic of genuine Mamra
      const curve = Math.sin((y + 1.45) / 2.9 * Math.PI) * 0.25;
      x += curve;

      // Natural organic surface irregularity
      const noise = (Math.sin(x * 5) * Math.cos(y * 6) * Math.sin(z * 7)) * 0.04;
      x += noise;
      y += noise;
      z += noise;

      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && spinSpeed !== 0) {
      groupRef.current.rotation.y += spinSpeed * delta;
      groupRef.current.rotation.x += spinSpeed * 0.3 * delta;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={highlighted ? "#C57B38" : "#9E5A2A"}
          roughness={0.58}
          metalness={0.08}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
          reflectivity={0.6}
        />
      </mesh>
    </group>
  );
}

/**
 * Procedural 3D Goan Jumbo Cashew (W180 King Size)
 * Characterized by the iconic crescent / kidney bean curve and creamy ivory finish.
 */
export function JumboCashew3D({
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  spinSpeed = 0.35,
  highlighted = false,
  onClick,
}: DryFruitProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Extruded tube along a smooth crescent curve to shape the cashew nut
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, -0.6, 0),
      new THREE.Vector3(-0.9, 0.1, 0.05),
      new THREE.Vector3(-0.4, 0.7, 0),
      new THREE.Vector3(0.4, 0.6, -0.05),
      new THREE.Vector3(0.7, 0.0, 0),
      new THREE.Vector3(0.4, -0.4, 0.05),
    ]);

    const geo = new THREE.TubeGeometry(curve, 48, 0.38, 24, false);
    
    // Taper the tail and head of the cashew
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Organic subtle asymmetry
      const noise = (Math.sin(x * 6) * Math.cos(y * 6)) * 0.025;
      x += noise;
      y += noise;
      z += noise;

      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && spinSpeed !== 0) {
      groupRef.current.rotation.y += spinSpeed * delta;
      groupRef.current.rotation.z += spinSpeed * 0.2 * delta;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={highlighted ? "#FFF8EE" : "#F4EADB"}
          roughness={0.42}
          metalness={0.02}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
          reflectivity={0.4}
        />
      </mesh>
    </group>
  );
}

/**
 * Procedural 3D Kashmiri Snow-White Walnut Kernel
 * Characterized by grooved lobed structures and natural ridges.
 */
export function KashmiriWalnut3D({
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  spinSpeed = 0.3,
  highlighted = false,
  onClick,
}: DryFruitProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Deep grooved dual-lobe kernel structure
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.9, 36, 36);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Deep central cleft between lobes
      const cleft = Math.exp(-Math.pow(x * 2.8, 2)) * 0.32;
      z -= cleft;

      // Brain-like convoluted ridges
      const ridges = (Math.sin(x * 8) * Math.cos(y * 8) + Math.sin(y * 12) * Math.cos(z * 10)) * 0.12;
      x += ridges * (x > 0 ? 0.8 : -0.8);
      y += ridges * 0.5;
      z += ridges * 0.5;

      // Overall plump oval profile
      y *= 1.25;
      x *= 1.15;
      z *= 0.85;

      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && spinSpeed !== 0) {
      groupRef.current.rotation.y += spinSpeed * delta;
      groupRef.current.rotation.x -= spinSpeed * 0.25 * delta;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={highlighted ? "#C29367" : "#A67448"}
          roughness={0.78}
          metalness={0.05}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
        />
      </mesh>
    </group>
  );
}

/**
 * Ambient Golden & Emerald Dust Sparkles
 */
export function GoldenDustParticles({ count = 35 }: { count?: number }) {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      coords[i] = (Math.random() - 0.5) * 8;
      coords[i + 1] = (Math.random() - 0.5) * 6;
      coords[i + 2] = (Math.random() - 0.5) * 4;
    }
    return coords;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.03) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#D4AF37"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
