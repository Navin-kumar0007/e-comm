'use client';
import { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import React from 'react';
import { useSpring, animated } from '@react-spring/three';

function ImagePlane({ url, hovered }: { url: string, hovered: boolean }) {
  const meshRef = useRef<any>(null);
  
  // Need to handle missing textures gracefully
  let texture;
  try {
    texture = useLoader(TextureLoader, url);
  } catch (e) {
    return <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="gray" /></mesh>;
  }

  const { scale, rotation } = useSpring({
    scale: hovered ? 1.05 : 1,
    rotation: hovered ? [0.1, 0.1, 0] : [0, 0, 0],
    config: { mass: 1, tension: 170, friction: 26 }
  });

  useFrame((state) => {
    if (meshRef.current && hovered) {
      // Gentle floating when hovered
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.rotation.x = (state.pointer.y * Math.PI) / 10;
      meshRef.current.rotation.y = (state.pointer.x * Math.PI) / 10;
    } else if (meshRef.current) {
      meshRef.current.position.y = 0;
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.y = 0;
    }
  });

  return (
    <animated.mesh ref={meshRef} scale={scale}>
      <planeGeometry args={[2.5, 2.5]} />
      <meshStandardMaterial map={texture} roughness={0.2} metalness={0.1} />
    </animated.mesh>
  );
}

export function Product3DImage({ src, alt }: { src: string, alt: string }) {
  const [hovered, setHovered] = useState(false);

  // Fallback to normal image if no src or src is invalid
  if (!src || src.startsWith('data:')) {
    return <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />;
  }

  return (
    <div 
      className="w-full h-full absolute inset-0 cursor-pointer"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} frameloop="demand">
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, 5]} intensity={0.5} />
        <React.Suspense fallback={null}>
           <ImagePlane url={src} hovered={hovered} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
