'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { SpiceJar } from './spice-jar';

/** Group that gently follows the pointer for a parallax/tilt feel. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.35, 0.05);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -pointer.y * 0.2, 0.05);
  });
  return <group ref={ref}>{children}</group>;
}

function Scene() {
  return (
    <>
      {/* Brand-tuned lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
      <pointLight position={[-4, 2, -2]} intensity={30} color="#c59b27" />
      <pointLight position={[3, -2, 3]} intensity={18} color="#1e7a52" />

      <ParallaxRig>
        <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.8}>
          <group position={[0, 0.1, 0]} scale={1.15}>
            <SpiceJar spiceColor="#6b4423" spin={0.3} bobOffset={0} textureUrl="https://placehold.co/800x600/f4f3ea/052c1e?text=Image+Coming+Soon" productName="Tandoori Chai Masala" />
          </group>
        </Float>

        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <group position={[-2.4, -0.6, -1.2]} scale={0.7}>
            <SpiceJar spiceColor="#d97706" spin={0.25} bobOffset={1.5} textureUrl="" productName="Lakadong Turmeric" />
          </group>
        </Float>

        <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1}>
          <group position={[2.3, 0.5, -1]} scale={0.62}>
            <SpiceJar spiceColor="#78350f" spin={0.28} bobOffset={3} textureUrl="" productName="Traditional Garam Masala" />
          </group>
        </Float>
      </ParallaxRig>

      {/* Ambient golden dust */}
      <Sparkles count={40} scale={[8, 5, 4]} size={2.5} speed={0.3} color="#c59b27" opacity={0.5} />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.8]}
      className="!absolute inset-0"
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
