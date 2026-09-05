'use client';

import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface SpiceJarProps {
  /** Spice fill color, e.g. turmeric gold, chili red, mint green. */
  spiceColor?: string;
  /** Base rotation speed (radians/sec). Set 0 to disable idle spin. */
  spin?: number;
  scale?: number;
  /** Subtle vertical bob amplitude. */
  bob?: number;
  bobOffset?: number;
  textureUrl?: string;
  productName?: string;
}

/**
 * A fully procedural glass spice jar — no external .glb asset required, so it
 * renders reliably offline. Glass body uses a physical (transmissive) material;
 * the interior fill is tinted to the product's spice color, topped with a
 * wooden lid and a gold-rimmed label band.
 */
export function SpiceJar({
  spiceColor = '#c59b27',
  spin = 0.35,
  scale = 1,
  bob = 0.06,
  bobOffset = 0,
  textureUrl,
  productName,
}: SpiceJarProps) {
  const group = useRef<THREE.Group>(null);
  
  const texture = useLoader(THREE.TextureLoader, '/logo.png');
  
  // Clone the texture so we don't mutate the global cache for different jars if they needed different settings
  // But here we can just configure it
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.offset.set(0, -0.15); // Adjust vertical offset to center the logo perfectly


  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y += spin * 0.016;
    group.current.position.y = Math.sin(t * 0.8 + bobOffset) * bob;
  });

  return (
    <group ref={group} scale={scale}>
      {/* Glass body */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.86, 2.2, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.92}
          thickness={0.6}
          roughness={0.12}
          ior={1.45}
          metalness={0}
          transparent
          opacity={0.85}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Spice contents (fills lower ~60% of the jar) */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.84, 0.8, 1.35, 64]} />
        <meshStandardMaterial color={spiceColor} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Rounded spice surface */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.83, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={spiceColor} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Neck ring */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.78, 0.9, 0.18, 64]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.85} roughness={0.2} transparent opacity={0.8} />
      </mesh>

      {/* Wooden lid */}
      <mesh castShadow position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.86, 0.82, 0.4, 64]} />
        <meshStandardMaterial color="#6b4423" roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.63, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 48]} />
        <meshStandardMaterial color="#4a2f18" roughness={0.6} />
      </mesh>

      {/* Gold label band */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.94, 0.9, 0.7, 64, 1, true]} />
        <meshStandardMaterial
          color="#ffffff"
          map={texture}
          roughness={0.6}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Gold rim accents on the label */}
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.93, 0.02, 16, 64]} />
        <meshStandardMaterial color="#c59b27" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, -0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 16, 64]} />
        <meshStandardMaterial color="#c59b27" roughness={0.3} metalness={0.7} />
      </mesh>

      {productName && (
        <Html position={[0, -1.4, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-xl border border-white/40 whitespace-nowrap font-heading tracking-wide">
            {productName}
          </div>
        </Html>
      )}
    </group>

  );
}
