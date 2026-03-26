'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ShylaModelProps {
  isSpeaking: boolean;
}

function ShylaModel({ isSpeaking }: ShylaModelProps) {
  const { scene } = useGLTF('/Shyla.glb');
  const group = useRef<THREE.Group>(null);

  // We are not sure about the exact morph targets available in this custom GLB yet, 
  // so we will write a generic lip sync stub that attempts to animate any morph targets
  // related to mouth or jaw, or simply add a slight head bobbing as a fallback.
  useFrame((state) => {
    if (group.current) {
      // Basic fallback animation: slight idle breathing or speaking bob
      const targetY = isSpeaking ? Math.sin(state.clock.elapsedTime * 10) * 0.02 : Math.sin(state.clock.elapsedTime * 2) * 0.005;
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetY - 2.1, 0.1);
    }

    // Attempting to find mesh with morph targets
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetInfluences) {
          // If the mesh has a morph target index 0 (often mouth open/jaw), animate it.
          // Real application: sync with audioworklet or phonemes.
          const influence = isSpeaking ? Math.random() * 0.5 + 0.2 : 0;
          if (child.morphTargetInfluences.length > 0) {
            // Smoothly interpolate towards the target influence
            child.morphTargetInfluences[0] = THREE.MathUtils.lerp(
              child.morphTargetInfluences[0],
              influence,
              0.2
            );
          }
        }
      });
    }
  });

  return (
    <group ref={group} dispose={null}>
     <primitive object={scene} scale={4.3} position={[0, -4, 0]} />
    </group>
  );
}

// Preload the model so it loads faster
useGLTF.preload('/Shyla.glb');

function FallbackImage() {
  return (
    <Html center>
      <img src="/Shyla.webp" alt="Shyla Avatar Loading" className="max-w-xs animate-pulse object-contain h-64 rounded-xl shadow-lg border-2 border-moss-blue/20" />
    </Html>
  );
}

export default function Avatar({ isSpeaking = false }: { isSpeaking?: boolean }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0a0c10] to-[#001c38] relative overflow-hidden flex flex-col items-center justify-end">
      <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />
      
      <div className="w-full h-full relative">
        <Canvas 
          camera={{ position: [0, 0.3, 2.2], fov: 50 }}
          className="w-full h-full z-10"
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-5, 5, -5]} intensity={1} color="#e3000f" />
          <spotLight position={[0, 5, 0]} intensity={0.5} />
          <Environment preset="city" />
          
          <Suspense fallback={<FallbackImage />}>
            <ShylaModel isSpeaking={isSpeaking} />
          </Suspense>

          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            target={[0, 0.7, 0]}
            minPolarAngle={Math.PI / 2} 
            maxPolarAngle={Math.PI / 2}
            minAzimuthAngle={-Math.PI / 12}
            maxAzimuthAngle={Math.PI / 12}
          />
        </Canvas>
      </div>

      {/* Fade out bottom to hide mesh cutoff gracefully */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#001c38] to-transparent pointer-events-none z-20" />
    </div>
  );
}
