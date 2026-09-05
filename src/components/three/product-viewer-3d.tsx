'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import { SpiceJar } from './spice-jar';

interface ProductViewer3DProps {
  spiceColor?: string;
}

function Scene({ spiceColor }: { spiceColor?: string }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={1.6} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={22} color="#c59b27" />
      <pointLight position={[2, -1, 3]} intensity={14} color="#1e7a52" />

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <group position={[0, -0.2, 0]} scale={1.25}>
          <SpiceJar spiceColor={spiceColor} spin={0} />
        </group>
      </Float>

      <ContactShadows position={[0, -1.9, 0]} opacity={0.35} scale={8} blur={2.6} far={4} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

export default function ProductViewer3D({ spiceColor = '#c59b27' }: ProductViewer3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 5.5], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.8]}
      className="!h-full !w-full"
    >
      <Suspense fallback={null}>
        <Scene spiceColor={spiceColor} />
      </Suspense>
    </Canvas>
  );
}
