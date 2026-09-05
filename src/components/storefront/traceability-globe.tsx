"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

// Converts Lat/Lon to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

function GlobeModel({ activeOrigin }: { activeOrigin: boolean }) {
  const globeRef = useRef<THREE.Group>(null);
  const radius = 1.6;

  // Generate abstract grid dots representing the continents
  const dotPoints = useMemo(() => {
    const points = [];
    const count = 600;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, [radius]);

  // Specific locations
  const locations = useMemo(() => {
    return [
      { name: "Kerala Farm", lat: 10.8, lon: 76.2, color: "#EAB308" },
      { name: "Nutty World Hub", lat: 13.0, lon: 77.5, color: "#15803d" }
    ];
  }, []);

  const pins = useMemo(() => {
    return locations.map(loc => ({
      position: latLonToVector3(loc.lat, loc.lon, radius),
      color: loc.color,
      name: loc.name
    }));
  }, [locations, radius]);

  // Curve connecting Kerala farm to Bangalore Hub
  const curvePoints = useMemo(() => {
    if (pins.length < 2) return null;
    const start = pins[0].position;
    const end = pins[1].position;
    
    // Elevate the midpoint for a nice arc
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(radius * 1.25); // arch height

    const curve = new THREE.QuadraticBezierCurve3(start, end, mid);
    return curve.getPoints(50);
  }, [pins, radius]);

  // Slow rotation when no active origin, otherwise rotate to center the search origin
  useFrame((state) => {
    if (globeRef.current) {
      if (!activeOrigin) {
        globeRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      } else {
        // Smoothly interpolate rotation to face the active origin pin
        globeRef.current.rotation.y = THREE.MathUtils.lerp(globeRef.current.rotation.y, 2.5, 0.05);
      }
    }
  });

  return (
    <group ref={globeRef}>
      {/* Semi-transparent Earth Sphere */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial 
          color="#0f2c1e" 
          roughness={0.8} 
          metalness={0.1}
          transmission={0.4} 
          transparent 
          opacity={0.3} 
        />
      </mesh>

      {/* Earth Wireframe boundary */}
      <mesh>
        <sphereGeometry args={[radius + 0.01, 16, 16]} />
        <meshBasicMaterial color="#16a34a" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Grid Dots */}
      <group>
        {dotPoints.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>

      {/* Location Pins */}
      {pins.map((pin, i) => (
        <group key={i} position={pin.position}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={pin.color} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.15]} />
            <meshBasicMaterial color={pin.color} />
          </mesh>
        </group>
      ))}

      {/* Curved Journey Path */}
      {curvePoints && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(curvePoints.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#eab308" linewidth={2} />
        </line>
      )}
    </group>
  );
}

export default function TraceabilityGlobe({ activeOrigin }: { activeOrigin: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card rounded-3xl animate-pulse">
        <span className="text-muted-foreground text-xs">Loading Interactive Map...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[350px] relative">
      <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <Environment preset="sunset" />
        <GlobeModel activeOrigin={activeOrigin} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
