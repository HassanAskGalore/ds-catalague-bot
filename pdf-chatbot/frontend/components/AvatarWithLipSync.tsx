'use client';

import React, { Suspense, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface ShaylaModelProps {
  isSpeaking: boolean;
  currentMouthShape: string;
}

// Rhubarb to Shayla viseme mapping
const corresponding = {
  A: "V_p1",
  B: "EE",
  C: "V_i1",
  D: "Ah",
  E: "V_o1",
  F: "V_u1",
  G: "V_f1",
  H: "V_s2",
  X: "Er"
};

function ShaylaModel({ isSpeaking, currentMouthShape }: ShaylaModelProps) {
  const { nodes, materials, scene } = useGLTF('/Shayla_Changes(Visemes).glb');
  const { animations } = useGLTF('/working.glb');
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, group);
  const lastBlinkTime = useRef(0);
  const nextBlinkDelay = useRef(3);
  const morphTargetsInitialized = useRef(false);

  useEffect(() => {
    // Play the Talking animation
    if (actions['Talking']) {
      actions['Talking']?.reset().fadeIn(0.5).play();
    }
    return () => {
      if (actions['Talking']) {
        actions['Talking']?.fadeOut(0.5);
      }
    };
  }, [actions]);

  // Debug morph targets on mount
  useEffect(() => {
    if (!morphTargetsInitialized.current) {
      console.log('[Avatar] Initializing morph targets...');
      scene.traverse((child: any) => {
        if (child.isSkinnedMesh && child.morphTargetDictionary) {
          console.log('[Avatar] Found mesh:', child.name);
          console.log('[Avatar] Morph targets:', Object.keys(child.morphTargetDictionary).slice(0, 20));
          
          // Check if visemes exist
          const visemes = ['V_p1', 'EE', 'V_i1', 'Ah', 'V_o1', 'V_u1', 'V_f1', 'V_s2', 'Er'];
          visemes.forEach(v => {
            if (child.morphTargetDictionary[v] !== undefined) {
              console.log(`[Avatar] ✓ Found viseme: ${v} at index ${child.morphTargetDictionary[v]}`);
            }
          });
        }
      });
      morphTargetsInitialized.current = true;
    }
  }, [scene]);

  const lerpMorphTarget = (target: string, value: number, speed: number = 0.15) => {
    let found = false;
    scene.traverse((child: any) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const index = child.morphTargetDictionary[target];
        if (index !== undefined) {
          const current = child.morphTargetInfluences[index];
          child.morphTargetInfluences[index] = THREE.MathUtils.lerp(current, value, speed);
          found = true;
        }
      }
    });
    
    // Log if morph target not found (only occasionally to avoid spam)
    if (!found && Math.random() < 0.01) {
      console.warn(`[Avatar] Morph target not found: ${target}`);
    }
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ===== BLINKING =====
    if (time - lastBlinkTime.current > nextBlinkDelay.current) {
      lastBlinkTime.current = time;
      nextBlinkDelay.current = 2 + Math.random() * 4;
    }

    const timeSinceBlink = time - lastBlinkTime.current;
    let blinkValue = 0;
    if (timeSinceBlink < 0.1) {
      blinkValue = timeSinceBlink / 0.1;
    } else if (timeSinceBlink < 0.2) {
      blinkValue = 1 - (timeSinceBlink - 0.1) / 0.1;
    }

    lerpMorphTarget('Eye_Blink_L', blinkValue, 0.5);
    lerpMorphTarget('Eye_Blink_R', blinkValue, 0.5);

    // ===== LIP SYNC =====
    if (isSpeaking && currentMouthShape !== 'X') {
      const morphName = corresponding[currentMouthShape as keyof typeof corresponding];
      if (morphName) {
        // Log every 30 frames (roughly once per second at 60fps)
        if (Math.random() < 0.05) {
          console.log(`[Avatar] Applying viseme: ${currentMouthShape} → ${morphName} (value: 0.8)`);
        }
        
        lerpMorphTarget(morphName, 0.8, 0.4);
        
        // Reset other visemes
        Object.values(corresponding).forEach((otherMorph) => {
          if (otherMorph !== morphName) {
            lerpMorphTarget(otherMorph, 0, 0.3);
          }
        });
      }
    } else {
      // Reset to neutral
      lerpMorphTarget(corresponding.X, 0.2, 0.2);
      Object.values(corresponding).forEach((morphName) => {
        if (morphName !== corresponding.X) {
          lerpMorphTarget(morphName, 0, 0.2);
        }
      });
    }

    // ===== FACIAL EXPRESSION =====
    if (isSpeaking) {
      lerpMorphTarget('Mouth_Smile_L', 0.1, 0.05);
      lerpMorphTarget('Mouth_Smile_R', 0.1, 0.05);
      lerpMorphTarget('Brow_Raise_Outer_L', 0.15, 0.05);
      lerpMorphTarget('Brow_Raise_Outer_R', 0.15, 0.05);
    } else {
      lerpMorphTarget('Mouth_Smile_L', 0, 0.05);
      lerpMorphTarget('Mouth_Smile_R', 0, 0.05);
      lerpMorphTarget('Brow_Raise_Outer_L', 0, 0.05);
      lerpMorphTarget('Brow_Raise_Outer_R', 0, 0.05);
    }
  });

  return (
   <group ref={group} dispose={null} position={[0, -2.1, 0]} scale={[2.2, 2.2, 2.2]}>
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes as any).glb_bg_1?.geometry}
        material={(materials as any)['glb_bg 1']}
        position={[0, 1.456, -0.197]}
        rotation={[1.523, 0, 0]}
      />
      <skinnedMesh
        geometry={(nodes as any).Bang?.geometry}
        material={(materials as any)['Hair_Transparency.003']}
        skeleton={(nodes as any).Bang?.skeleton}
      />
      <skinnedMesh
        geometry={(nodes as any).Fit_shirts?.geometry}
        material={(materials as any).Fit_shirts}
        skeleton={(nodes as any).Fit_shirts?.skeleton}
      />
      <skinnedMesh
        geometry={(nodes as any).Real_Hair?.geometry}
        material={(materials as any)['Hair_Transparency.002']}
        skeleton={(nodes as any).Real_Hair?.skeleton}
      />
      <primitive object={(nodes as any).CC_Base_BoneRoot} />
      <skinnedMesh
        name="CC_Base_Body_1"
        geometry={(nodes as any).CC_Base_Body_1?.geometry}
        material={(materials as any).Std_Tongue}
        skeleton={(nodes as any).CC_Base_Body_1?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_1?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_1?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_2"
        geometry={(nodes as any).CC_Base_Body_2?.geometry}
        material={(materials as any).Std_Skin_Head}
        skeleton={(nodes as any).CC_Base_Body_2?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_2?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_2?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_3"
        geometry={(nodes as any).CC_Base_Body_3?.geometry}
        material={(materials as any).Std_Eyelash}
        skeleton={(nodes as any).CC_Base_Body_3?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_3?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_3?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_4"
        geometry={(nodes as any).CC_Base_Body_4?.geometry}
        material={(materials as any).Std_Upper_Teeth}
        skeleton={(nodes as any).CC_Base_Body_4?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_4?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_4?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_5"
        geometry={(nodes as any).CC_Base_Body_5?.geometry}
        material={(materials as any).Std_Lower_Teeth}
        skeleton={(nodes as any).CC_Base_Body_5?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_5?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_5?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_6"
        geometry={(nodes as any).CC_Base_Body_6?.geometry}
        material={(materials as any).Std_Eye_R}
        skeleton={(nodes as any).CC_Base_Body_6?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_6?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_6?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_7"
        geometry={(nodes as any).CC_Base_Body_7?.geometry}
        material={(materials as any).Std_Cornea_R}
        skeleton={(nodes as any).CC_Base_Body_7?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_7?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_7?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_8"
        geometry={(nodes as any).CC_Base_Body_8?.geometry}
        material={(materials as any).Std_Eye_L}
        skeleton={(nodes as any).CC_Base_Body_8?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_8?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_8?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_Body_9"
        geometry={(nodes as any).CC_Base_Body_9?.geometry}
        material={(materials as any).Std_Cornea_L}
        skeleton={(nodes as any).CC_Base_Body_9?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_Body_9?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_Body_9?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_TearLine_1"
        geometry={(nodes as any).CC_Base_TearLine_1?.geometry}
        material={(materials as any).Std_Tearline_R}
        skeleton={(nodes as any).CC_Base_TearLine_1?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_TearLine_1?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_TearLine_1?.morphTargetInfluences}
      />
      <skinnedMesh
        name="CC_Base_TearLine_2"
        geometry={(nodes as any).CC_Base_TearLine_2?.geometry}
        material={(materials as any).Std_Tearline_L}
        skeleton={(nodes as any).CC_Base_TearLine_2?.skeleton}
        morphTargetDictionary={(nodes as any).CC_Base_TearLine_2?.morphTargetDictionary}
        morphTargetInfluences={(nodes as any).CC_Base_TearLine_2?.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={(nodes as any).Hair_Base_1?.geometry}
        material={(materials as any).Hair_Transparency}
        skeleton={(nodes as any).Hair_Base_1?.skeleton}
      />
      <skinnedMesh
        geometry={(nodes as any).Hair_Base_2?.geometry}
        material={(materials as any).Scalp_Transparency}
        skeleton={(nodes as any).Hair_Base_2?.skeleton}
      />
    </group>
  );
}

useGLTF.preload('/Shayla_Changes(Visemes).glb');
useGLTF.preload('/working.glb');

function FallbackImage() {
  return (
    <Html center>
      <div className="text-white">Loading Avatar...</div>
    </Html>
  );
}

export interface AvatarHandle {
  setMouthShape: (shape: string) => void;
  reset: () => void;
}

interface AvatarProps {
  isSpeaking?: boolean;
}

const AvatarWithLipSync = forwardRef<AvatarHandle, AvatarProps>(({ isSpeaking = false }, ref) => {
  const [currentMouthShape, setCurrentMouthShape] = React.useState('X');

  useEffect(() => {
    console.log('[Avatar] isSpeaking changed to:', isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    console.log('[Avatar] currentMouthShape changed to:', currentMouthShape);
  }, [currentMouthShape]);

  useImperativeHandle(ref, () => ({
    setMouthShape: (shape: string) => {
      console.log('[Avatar] Setting mouth shape:', shape);
      setCurrentMouthShape(shape);
    },
    reset: () => {
      console.log('[Avatar] Resetting to idle');
      setCurrentMouthShape('X');
    }
  }));

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0a0c10] to-[#001c38] relative overflow-hidden flex flex-col items-center justify-end">
      <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none" />
      
      <div className="w-full h-full relative">
        <Canvas 
          camera={{ position: [0, 0, 2.3], fov: 30 }}
          className="w-full h-full z-10"
        >
          <Environment preset="sunset" environmentIntensity={0.2} />
          <ambientLight intensity={0.15} color="#cce8ff" />
          <spotLight
            position={[1.2, 1.69, 10]}
            intensity={120}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={15}
            shadow-camera-near={0.3}
          />
          <spotLight
            position={[-20, -1.9, 5]}
            intensity={600}
            color="#f5e4f4"
            angle={Math.PI / 5}
            penumbra={0.7}
          />
          <spotLight
            position={[0, -1.53, 4.09]}
            intensity={20}
            color="#f2d3f1"
            angle={Math.PI / 5.6}
            penumbra={0.8}
          />
          <spotLight
            position={[3, 1, 5]}
            intensity={15}
            color="#f5e4f4"
            angle={Math.PI / 6}
            penumbra={0.5}
          />
          
          <Suspense fallback={<FallbackImage />}>
            <ShaylaModel isSpeaking={isSpeaking} currentMouthShape={currentMouthShape} />
          </Suspense>

          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            target={[0, 1.5, 0]}
            minPolarAngle={Math.PI / 2.2} 
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 8}
            maxAzimuthAngle={Math.PI / 8}
          />
        </Canvas>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#001c38] to-transparent pointer-events-none z-20" />
    </div>
  );
});

AvatarWithLipSync.displayName = 'AvatarWithLipSync';

export default AvatarWithLipSync;
