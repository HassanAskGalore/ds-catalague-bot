'use client';

import React, { Suspense, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ShylaModelProps {
  isSpeaking: boolean;
  currentMouthShape: string;  // Rhubarb shapes: A, B, C, D, E, F, G, H, X
}

function ShylaModel({ isSpeaking, currentMouthShape }: ShylaModelProps) {
  const { scene } = useGLTF('/Shyla.glb');
  const group = useRef<THREE.Group>(null);
  const meshWithMorphTargetsRef = useRef<any>(null);
  const lastBlinkTime = useRef(0);
  const nextBlinkDelay = useRef(3);
  const eyeLookTarget = useRef({ x: 0, y: 0 });
  const nextEyeMoveTime = useRef(0);

  // Find mesh with morph targets on mount
  useEffect(() => {
    if (scene && !meshWithMorphTargetsRef.current) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
          meshWithMorphTargetsRef.current = child;
          console.log(`[Avatar] Found mesh with ${child.morphTargetInfluences.length} morph targets`);
          if (child.morphTargetDictionary) {
            const allMorphs = Object.keys(child.morphTargetDictionary);
            console.log('[Avatar] Total morphs:', allMorphs.length);
            
            // Log phoneme morphs
            const phonemeMorphs = allMorphs.filter(m => 
              ['EE_1', 'Er', 'IH', 'Ah', 'Oh', 'W_OO', 'S_Z', 'Ch_J', 'F_V', 'TH', 'T_L_D_N', 'B_M_P', 'K_G_H_NG', 'AE', 'R'].some(p => m === p)
            );
            console.log('[Avatar] Phoneme morphs:', phonemeMorphs);
            
            // Log mouth morphs
            const mouthMorphs = allMorphs.filter(m => m.startsWith('Mouth_'));
            console.log('[Avatar] Mouth morphs:', mouthMorphs.slice(0, 20));
            
            // Log jaw morphs
            const jawMorphs = allMorphs.filter(m => m.startsWith('Jaw_'));
            console.log('[Avatar] Jaw morphs:', jawMorphs);
          }
        }
      });
    }
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const mesh = meshWithMorphTargetsRef.current;
    
    if (!mesh || !mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;

    // ===== HEAD MOVEMENT =====
    if (group.current) {
      if (isSpeaking) {
        // Natural head movement during speech - NO vertical floating
        group.current.rotation.y = Math.sin(time * 0.8) * 0.05 + Math.sin(time * 2.3) * 0.02;
        group.current.rotation.x = Math.sin(time * 1.2) * 0.03 + Math.cos(time * 1.8) * 0.015;
        group.current.rotation.z = Math.sin(time * 1.5) * 0.01;
        // REMOVED: group.current.position.y animation (was causing floating)
      } else {
        // Subtle idle breathing - NO vertical floating
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(time * 0.5) * 0.01, 0.05);
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, Math.sin(time * 0.7) * 0.008, 0.05);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.05);
        // REMOVED: group.current.position.y animation (was causing floating)
      }
    }

    // ===== EYE BLINKING =====
    const blinkL = mesh.morphTargetDictionary['Eye_Blink_L'];
    const blinkR = mesh.morphTargetDictionary['Eye_Blink_R'];
    
    if (blinkL !== undefined && blinkR !== undefined) {
      if (time - lastBlinkTime.current > nextBlinkDelay.current) {
        // Trigger blink
        lastBlinkTime.current = time;
        nextBlinkDelay.current = 2 + Math.random() * 4; // Random 2-6 seconds
      }
      
      const timeSinceBlink = time - lastBlinkTime.current;
      let blinkValue = 0;
      
      if (timeSinceBlink < 0.1) {
        // Closing (100ms)
        blinkValue = timeSinceBlink / 0.1;
      } else if (timeSinceBlink < 0.2) {
        // Opening (100ms)
        blinkValue = 1 - (timeSinceBlink - 0.1) / 0.1;
      }
      
      mesh.morphTargetInfluences[blinkL] = blinkValue;
      mesh.morphTargetInfluences[blinkR] = blinkValue;
    }

    // ===== EYE MOVEMENT =====
    if (time > nextEyeMoveTime.current) {
      eyeLookTarget.current = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.2
      };
      nextEyeMoveTime.current = time + 2 + Math.random() * 3;
    }

    const eyeLookLeft = mesh.morphTargetDictionary['Eye_L_Look_L'];
    const eyeLookRight = mesh.morphTargetDictionary['Eye_L_Look_R'];
    const eyeLookUp = mesh.morphTargetDictionary['Eye_L_Look_Up'];
    const eyeLookDown = mesh.morphTargetDictionary['Eye_L_Look_Down'];
    const eyeRLookLeft = mesh.morphTargetDictionary['Eye_R_Look_L'];
    const eyeRLookRight = mesh.morphTargetDictionary['Eye_R_Look_R'];
    const eyeRLookUp = mesh.morphTargetDictionary['Eye_R_Look_Up'];
    const eyeRLookDown = mesh.morphTargetDictionary['Eye_R_Look_Down'];

    if (eyeLookLeft !== undefined) {
      const targetX = eyeLookTarget.current.x;
      const targetY = eyeLookTarget.current.y;
      
      // Left eye
      mesh.morphTargetInfluences[eyeLookLeft] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeLookLeft], 
        Math.max(0, -targetX), 
        0.05
      );
      mesh.morphTargetInfluences[eyeLookRight] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeLookRight], 
        Math.max(0, targetX), 
        0.05
      );
      mesh.morphTargetInfluences[eyeLookUp] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeLookUp], 
        Math.max(0, targetY), 
        0.05
      );
      mesh.morphTargetInfluences[eyeLookDown] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeLookDown], 
        Math.max(0, -targetY), 
        0.05
      );
      
      // Right eye
      mesh.morphTargetInfluences[eyeRLookLeft] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeRLookLeft], 
        Math.max(0, -targetX), 
        0.05
      );
      mesh.morphTargetInfluences[eyeRLookRight] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeRLookRight], 
        Math.max(0, targetX), 
        0.05
      );
      mesh.morphTargetInfluences[eyeRLookUp] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeRLookUp], 
        Math.max(0, targetY), 
        0.05
      );
      mesh.morphTargetInfluences[eyeRLookDown] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[eyeRLookDown], 
        Math.max(0, -targetY), 
        0.05
      );
    }

    // ===== FACIAL EXPRESSIONS DURING SPEECH =====
    if (isSpeaking) {
      // Subtle eyebrow raises
      const browRaiseL = mesh.morphTargetDictionary['Brow_Raise_Outer_L'];
      const browRaiseR = mesh.morphTargetDictionary['Brow_Raise_Outer_R'];
      if (browRaiseL !== undefined) {
        const browValue = Math.sin(time * 2) * 0.1 + 0.1;
        mesh.morphTargetInfluences[browRaiseL] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences[browRaiseL], 
          browValue, 
          0.1
        );
        mesh.morphTargetInfluences[browRaiseR] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences[browRaiseR], 
          browValue, 
          0.1
        );
      }
      
      // Slight cheek raise for natural expression
      const cheekRaiseL = mesh.morphTargetDictionary['Cheek_Raise_L'];
      const cheekRaiseR = mesh.morphTargetDictionary['Cheek_Raise_R'];
      if (cheekRaiseL !== undefined) {
        mesh.morphTargetInfluences[cheekRaiseL] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences[cheekRaiseL], 
          0.15, 
          0.1
        );
        mesh.morphTargetInfluences[cheekRaiseR] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences[cheekRaiseR], 
          0.15, 
          0.1
        );
      }
    } else {
      // Reset expression morphs when not speaking
      ['Brow_Raise_Outer_L', 'Brow_Raise_Outer_R', 'Cheek_Raise_L', 'Cheek_Raise_R'].forEach(name => {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
            mesh.morphTargetInfluences[idx], 
            0, 
            0.1
          );
        }
      });
    }

    // ===== LIP SYNC (RHUBARB ONLY) =====
    const morphTargets = getRhubarbMorphTargets(currentMouthShape);
    
    // Debug: Log when we receive a new mouth shape
    if (currentMouthShape !== 'X' && isSpeaking) {
      const activeTargets = Object.keys(morphTargets).filter(k => morphTargets[k] > 0);
      if (activeTargets.length > 0) {
        console.log(`[Rhubarb] Shape ${currentMouthShape}:`, activeTargets.join(', '));
      }
    }
    
    Object.keys(mesh.morphTargetDictionary).forEach((targetName) => {
      const targetIndex = mesh.morphTargetDictionary[targetName];
      
      // Skip eye and brow morphs (handled above)
      if (targetName.includes('Eye_') || targetName.includes('Brow_') || 
          targetName.includes('Cheek_') || targetName.includes('Eyelash_')) {
        return;
      }
      
      if (isSpeaking && morphTargets[targetName] !== undefined) {
        const oldValue = mesh.morphTargetInfluences[targetIndex];
        const targetValue = morphTargets[targetName];
        
        // Apply lip sync morph with fast interpolation
        mesh.morphTargetInfluences[targetIndex] = THREE.MathUtils.lerp(
          oldValue,
          targetValue,
          0.8  // Very fast response for Rhubarb
        );
        
        // Debug: Log significant changes
        if (Math.abs(mesh.morphTargetInfluences[targetIndex] - oldValue) > 0.1) {
          console.log(`[Rhubarb] ${targetName}: ${oldValue.toFixed(2)} → ${mesh.morphTargetInfluences[targetIndex].toFixed(2)}`);
        }
      } else if (isPhonemeTarget(targetName)) {
        // Reset phoneme morphs
        mesh.morphTargetInfluences[targetIndex] = THREE.MathUtils.lerp(
          mesh.morphTargetInfluences[targetIndex],
          0,
          0.5
        );
      }
    });
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={4.3} position={[0, -6, 0]} />
    </group>
  );
}

// Helper to identify phoneme morph targets
function isPhonemeTarget(name: string): boolean {
  const phonemes = ['EE_1', 'Er', 'IH', 'Ah', 'Oh', 'W_OO', 'S_Z', 'Ch_J', 
                    'F_V', 'TH', 'T_L_D_N', 'B_M_P', 'K_G_H_NG', 'AE', 'R'];
  return phonemes.some(p => name.startsWith(p)) || 
         name.startsWith('Mouth_') || 
         name.startsWith('Jaw_');
}


// Map Rhubarb mouth shapes (A-H, X) to Shyla's 711 morph targets
function getRhubarbMorphTargets(shape: string): { [key: string]: number } {
  const shapeMap: { [key: string]: { [key: string]: number } } = {
    'A': {  // Closed mouth - P, B, M
      'B_M_P': 1.0,
      'Mouth_Press_L': 0.4,
      'Mouth_Press_R': 0.4
    },
    
    'B': {  // Slightly open, clenched teeth - K, S, T, EE
      'S_Z': 0.6,
      'EE_1': 0.5,
      'Mouth_Stretch_L': 0.4,
      'Mouth_Stretch_R': 0.4,
      'Jaw_Open': 0.2
    },
    
    'C': {  // Open mouth - EH, AE
      'AE': 0.9,
      'Jaw_Open': 0.5,
      'Mouth_Open': 0.5,
      'Mouth_Stretch_L': 0.3,
      'Mouth_Stretch_R': 0.3
    },
    
    'D': {  // Wide open mouth - AA (father)
      'Ah': 1.0,
      'Jaw_Open': 0.9,
      'Mouth_Open': 0.8
    },
    
    'E': {  // Slightly rounded - AO, ER (off, bird)
      'Er': 0.8,
      'Oh': 0.6,
      'Mouth_Funnel_Up_L': 0.4,
      'Mouth_Funnel_Up_R': 0.4,
      'Jaw_Open': 0.4
    },
    
    'F': {  // Puckered lips - UW, OW, W (you, show)
      'W_OO': 1.0,
      'Mouth_Pucker_Up_L': 0.9,
      'Mouth_Pucker_Up_R': 0.9,
      'Mouth_Funnel_Up_L': 0.5,
      'Mouth_Funnel_Up_R': 0.5
    },
    
    'G': {  // Upper teeth on lower lip - F, V
      'F_V': 1.0,
      'Mouth_Lower_Down_L': 0.5,
      'Mouth_Lower_Down_R': 0.5
    },
    
    'H': {  // Tongue raised - long L
      'T_L_D_N': 0.9,
      'Jaw_Open': 0.3,
      'Mouth_Open': 0.3
    },
    
    'X': {}  // Rest position - all morphs at 0
  };

  return shapeMap[shape] || {};
}


useGLTF.preload('/Shyla.glb');

function FallbackImage() {
  return (
    <Html center>
      <img src="/Shyla.webp" alt="Shyla Avatar Loading" className="max-w-xs animate-pulse object-contain h-64 rounded-xl shadow-lg border-2 border-moss-blue/20" />
    </Html>
  );
}

export interface AvatarHandle {
  setMouthShape: (shape: string) => void;  // Rhubarb shapes: A, B, C, D, E, F, G, H, X
  reset: () => void;
}

interface AvatarProps {
  isSpeaking?: boolean;
}

const AvatarWithLipSync = forwardRef<AvatarHandle, AvatarProps>(({ isSpeaking = false }, ref) => {
  const [currentMouthShape, setCurrentMouthShape] = React.useState('X');

  useImperativeHandle(ref, () => ({
    setMouthShape: (shape: string) => {
      setCurrentMouthShape(shape);
    },
    reset: () => {
      setCurrentMouthShape('X');
    }
  }));

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
            <ShylaModel isSpeaking={isSpeaking} currentMouthShape={currentMouthShape} />
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
});

AvatarWithLipSync.displayName = 'AvatarWithLipSync';

export default AvatarWithLipSync;
