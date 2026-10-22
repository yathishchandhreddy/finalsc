import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { PenguinState } from '../types';
import defaultPenguinAsset from '../assets/Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb?url';

// Permanent built-in 3D model bundled with the codebase for Vercel and production
export const PENGUIN_MODEL_PATH = defaultPenguinAsset || '/Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb';

interface PenguinModelProps {
  state: PenguinState;
  onModelLoaded?: (details: ModelInspectionDetails) => void;
  modelUrl?: string;
}

export interface ModelInspectionDetails {
  nodeNames: string[];
  animationNames: string[];
  hasBones: boolean;
  hasMorphTargets: boolean;
  meshCount: number;
}

interface ControllableNodes {
  head?: THREE.Object3D;
  beakLower?: THREE.Object3D;
  beakUpper?: THREE.Object3D;
  wingLeft?: THREE.Object3D;
  wingRight?: THREE.Object3D;
  eyeLeft?: THREE.Object3D;
  eyeRight?: THREE.Object3D;
  footLeft?: THREE.Object3D;
  footRight?: THREE.Object3D;
  body?: THREE.Object3D;
  morphMeshes: THREE.Mesh[];
}

export function PenguinModel({ state, onModelLoaded, modelUrl }: PenguinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetUrl = modelUrl || PENGUIN_MODEL_PATH;
  const gltf = useGLTF(targetUrl);
  const { actions } = useAnimations(gltf.animations, groupRef);

  const prevStateRef = useRef<PenguinState>(state);
  const stateStartTimeRef = useRef<number>(0);
  const lastLoggedStateRef = useRef<string>('');
  const lastLogTimeRef = useRef<number>(0);

  // Deep clone gltf.scene to guarantee complete scene-graph isolation across multiple canvases
  const clonedScene = useMemo(() => {
    if (!gltf.scene) return null;
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  // Synchronously discover and cache all controllable node references from clonedScene
  const nodes = useMemo<ControllableNodes>(() => {
    const map: ControllableNodes = { morphMeshes: [] };
    if (!clonedScene) return map;

    clonedScene.traverse((obj) => {
      const lowerName = (obj.name || '').toLowerCase();

      // Head node (pivot at neck [0, 2.3, 0])
      if (!map.head && (lowerName === 'head' || (lowerName.includes('head') && !lowerName.includes('mesh') && !lowerName.includes('phone') && !lowerName.includes('pad')))) {
        map.head = obj;
      }

      // Lower Beak for jaw/speaking articulation
      if (!map.beakLower && (lowerName.includes('beak_lower') || lowerName.includes('jaw') || lowerName.includes('mouth_down'))) {
        map.beakLower = obj;
      }

      // Upper Beak
      if (!map.beakUpper && (lowerName.includes('beak_upper') || lowerName.includes('mouth_up'))) {
        map.beakUpper = obj;
      }

      // Right Wing / Arm (pivot at shoulder [0.8, 1.8, 0])
      if (!map.wingRight && (lowerName === 'wing_right' || lowerName.includes('wing_r') || lowerName.includes('wingright') || lowerName.includes('flipper_r') || lowerName.includes('arm_r'))) {
        map.wingRight = obj;
      }

      // Left Wing / Arm (pivot at shoulder [-0.8, 1.8, 0])
      if (!map.wingLeft && (lowerName === 'wing_left' || lowerName.includes('wing_l') || lowerName.includes('wingleft') || lowerName.includes('flipper_l') || lowerName.includes('arm_l'))) {
        map.wingLeft = obj;
      }

      // Eyes (for blinking)
      if (!map.eyeLeft && (lowerName.includes('eye_l') || lowerName.includes('eyeleft'))) {
        map.eyeLeft = obj;
      }
      if (!map.eyeRight && (lowerName.includes('eye_r') || lowerName.includes('eyeright'))) {
        map.eyeRight = obj;
      }

      // Feet
      if (!map.footLeft && (lowerName.includes('foot_l') || lowerName.includes('footleft') || lowerName.includes('leg_l'))) {
        map.footLeft = obj;
      }
      if (!map.footRight && (lowerName.includes('foot_r') || lowerName.includes('footright') || lowerName.includes('leg_r'))) {
        map.footRight = obj;
      }

      // Body / Torso
      if (!map.body && (lowerName === 'body' || lowerName.includes('spine') || lowerName.includes('root'))) {
        map.body = obj;
      }

      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.morphTargetDictionary && Object.keys(obj.morphTargetDictionary).length > 0) {
          map.morphMeshes.push(obj);
        }
      }
    });

    return map;
  }, [clonedScene]);

  // Initial neutral rest transforms
  const restTransforms = useRef({
    wingRightZ: 0,
    wingRightX: 0,
    wingRightY: 0,
    wingLeftZ: 0,
    wingLeftX: 0,
    wingLeftY: 0,
    headRotX: 0,
    headRotY: 0,
    headRotZ: 0,
    beakLowerY: -0.15,
  });

  // Report model inspection metadata to parent on mount once
  useEffect(() => {
    if (!clonedScene) return;

    const detectedNodes: string[] = [];
    let meshCount = 0;
    let boneCount = 0;

    clonedScene.traverse((obj) => {
      if (obj.name) detectedNodes.push(obj.name);
      if (obj instanceof THREE.Mesh) meshCount++;
      if (obj instanceof THREE.Bone) boneCount++;
    });

    onModelLoaded?.({
      nodeNames: detectedNodes,
      animationNames: gltf.animations?.map((a) => a.name) || [],
      hasBones: boneCount > 0,
      hasMorphTargets: nodes.morphMeshes.length > 0,
      meshCount,
    });
  }, [clonedScene, gltf.animations, nodes.morphMeshes.length, onModelLoaded]);

  // Handle embedded GLTF animation clips if present
  useEffect(() => {
    if (!actions) return;
    const clipNames = Object.keys(actions);
    if (clipNames.length === 0) return;

    const matchingClip = clipNames.find((name) =>
      name.toLowerCase().includes(state.toLowerCase())
    );

    const targetAction = (matchingClip && actions[matchingClip]) || actions[clipNames[0]];
    if (targetAction) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.3));
      targetAction.reset().fadeIn(0.3).play();
    }
  }, [state, actions]);

  // Procedural Kinematic Animation Loop using React Three Fiber's useFrame
  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;

    const t = stateObj.clock.getElapsedTime();

    // Detect state changes and track elapsed time in the active action state
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      stateStartTimeRef.current = t;

      // Diagnostic logging when action starts (STEP 4)
      if (lastLoggedStateRef.current !== state) {
        lastLoggedStateRef.current = state;
        console.group(`🐧 [VSB 3D Mascot Action Started: ${state.toUpperCase()}]`);
        console.log('Action Name:', state);
        console.log('Matched GLB Nodes:', {
          wingRight: nodes.wingRight ? `${nodes.wingRight.name} (type: ${nodes.wingRight.type})` : 'NOT FOUND',
          wingLeft: nodes.wingLeft ? `${nodes.wingLeft.name} (type: ${nodes.wingLeft.type})` : 'NOT FOUND',
          head: nodes.head ? `${nodes.head.name} (type: ${nodes.head.type})` : 'NOT FOUND',
          beakLower: nodes.beakLower ? `${nodes.beakLower.name}` : 'NOT FOUND',
        });
        console.log('Starting Rotations:', {
          wingRight: nodes.wingRight?.rotation.toArray().slice(0, 3),
          wingLeft: nodes.wingLeft?.rotation.toArray().slice(0, 3),
          head: nodes.head?.rotation.toArray().slice(0, 3),
        });
        console.groupEnd();
      }
    }

    const elapsedInState = Math.max(0, t - stateStartTimeRef.current);

    // Periodic development diagnostic log during active animation (every 1s)
    if (t - lastLogTimeRef.current > 1.0) {
      lastLogTimeRef.current = t;
      if (state !== 'idle') {
        console.log(`🎬 [VSB 3D Mascot] Active state: "${state}" (${elapsedInState.toFixed(1)}s elapsed) | WingRight rotZ: ${nodes.wingRight?.rotation.z.toFixed(3)} | Head rotZ: ${nodes.head?.rotation.z.toFixed(3)}`);
      }
    }

    // Base root position and orientation (centered at base Y = -1.2)
    const baseRootY = -1.2;
    let targetRootPosY = 0;
    let targetRootRotX = 0;
    let targetRootRotY = 0;
    let targetRootRotZ = 0;

    // Head target rotations
    let targetHeadRotX = 0;
    let targetHeadRotY = 0;
    let targetHeadRotZ = 0;

    // Right Arm/Wing target rotations (Z positive rotates arm outward and upward away from body)
    let targetWingRightRotZ = restTransforms.current.wingRightZ;
    let targetWingRightRotX = restTransforms.current.wingRightX;
    let targetWingRightRotY = restTransforms.current.wingRightY;

    // Left Arm/Wing target rotations (Z negative rotates arm outward and upward away from body)
    let targetWingLeftRotZ = restTransforms.current.wingLeftZ;
    let targetWingLeftRotX = restTransforms.current.wingLeftX;
    let targetWingLeftRotY = restTransforms.current.wingLeftY;

    // Lower Beak displacement (negative Y opens beak down)
    let targetBeakDispY = 0;

    // Procedural eye blinking: blink every 4.2 seconds for 0.14 seconds
    const blinkCycle = t % 4.2;
    const isBlinking = blinkCycle < 0.14;
    const eyeScaleY = isBlinking ? 0.08 : 1.0;
    if (nodes.eyeLeft) nodes.eyeLeft.scale.y = eyeScaleY;
    if (nodes.eyeRight) nodes.eyeRight.scale.y = eyeScaleY;

    // =========================================================================
    // DISTINCT, VISIBLE ACTION KINEMATICS PER STATE
    // =========================================================================
    switch (state) {
      case 'greeting': {
        // WAVE TEST (STEP 2): Right arm visibly raises high (+1.85 rad) and waves back & forth at least 3 times
        targetRootRotY = 0.22; // Turns slightly towards the user
        targetRootPosY = Math.sin(t * 2.5) * 0.04;

        // Head nods warmly and tilts slightly
        targetHeadRotX = 0.12 + Math.sin(t * 4.0) * 0.08;
        targetHeadRotY = 0.14;
        targetHeadRotZ = Math.sin(elapsedInState * 6.0) * 0.12;

        // Wave motion: Right arm raised high (+1.85 rad ~106 deg) and waving at 12 rad/s (~2 Hz)
        const waveOscillation = Math.sin(elapsedInState * 12.0);
        targetWingRightRotZ = 1.85 + waveOscillation * 0.55; // Oscillates between 1.30 and 2.40 rad
        targetWingRightRotX = Math.sin(elapsedInState * 12.0) * 0.35; // Flipper waves toward user
        targetWingRightRotY = -0.25;

        // Left arm remains relaxed at side
        targetWingLeftRotZ = -0.12;
        break;
      }

      case 'thinking': {
        // THINK (STEP 3): Distinct head tilt and right arm raised toward chin/head
        targetRootPosY = Math.sin(t * 1.5) * 0.04;
        targetRootRotY = -0.15; // Looks slightly aside

        // Distinct curious head tilt (26 degrees) and slight upward angle
        targetHeadRotZ = 0.48; // Strong tilt to the right
        targetHeadRotX = -0.14; // Looking upward thoughtfully
        targetHeadRotY = Math.sin(t * 1.5) * 0.12;

        // Right arm raised toward head/chin
        targetWingRightRotZ = 1.40; // Raised outward/upward
        targetWingRightRotX = 0.95; // Pointed forward toward beak
        targetWingRightRotY = -0.40;

        // Left arm relaxed at side
        targetWingLeftRotZ = -0.18;
        break;
      }

      case 'happy': {
        // HAPPY (STEP 3): Both arms raised outward and upward with visible body bounce
        targetRootPosY = Math.abs(Math.sin(elapsedInState * 9.0)) * 0.35; // Energetic visible body bounce!
        targetRootRotY = Math.sin(elapsedInState * 4.0) * 0.15;

        // Head joyfully bobs and tilts
        targetHeadRotX = Math.sin(elapsedInState * 9.0) * 0.22;
        targetHeadRotZ = Math.sin(elapsedInState * 4.5) * 0.14;

        // Both arms raised high and flapping joyfully
        const flapOscillation = Math.sin(elapsedInState * 12.0) * 0.45;
        targetWingRightRotZ = 1.85 + flapOscillation; // Right arm high (+Z)
        targetWingLeftRotZ = -1.85 - flapOscillation; // Left arm high (-Z)
        targetWingRightRotX = Math.sin(elapsedInState * 12.0) * 0.25;
        targetWingLeftRotX = Math.sin(elapsedInState * 12.0) * 0.25;
        break;
      }

      case 'speaking': {
        // SPEAKING (STEP 5): Beak articulates up/down in cadence with speech + natural arm gestures
        targetBeakDispY = -0.14 * Math.abs(Math.sin(t * 15.0));

        // Articulating head nod and body inflection facing the chat conversation on the right
        targetHeadRotX = Math.sin(t * 8.0) * 0.16;
        targetHeadRotY = 0.24 + Math.sin(t * 3.5) * 0.12; // Facing right toward conversation
        targetHeadRotZ = Math.sin(t * 2.5) * 0.06;

        targetRootPosY = Math.sin(t * 3.5) * 0.05;
        targetRootRotY = 0.22 + Math.sin(t * 2.2) * 0.08;

        // Natural conversational flipper gestures
        targetWingRightRotZ = 0.65 + Math.sin(t * 4.5) * 0.35;
        targetWingLeftRotZ = -0.65 - Math.sin(t * 4.0) * 0.35;
        targetWingRightRotX = Math.sin(t * 5.0) * 0.25;
        targetWingLeftRotX = Math.sin(t * 4.5) * 0.25;

        // Morph target articulation if supported
        nodes.morphMeshes.forEach((mesh) => {
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            const mouthIdx = mesh.morphTargetDictionary['mouthOpen'] ?? mesh.morphTargetDictionary['beakOpen'] ?? 0;
            mesh.morphTargetInfluences[mouthIdx] = THREE.MathUtils.damp(
              mesh.morphTargetInfluences[mouthIdx],
              Math.abs(Math.sin(t * 15.0)) * 0.85,
              20,
              delta
            );
          }
        });
        break;
      }

      case 'listening': {
        // LISTENING: Attentive forward lean and turned toward conversation
        targetRootPosY = 0.03;
        targetRootRotX = 0.18; // Leans forward attentively
        targetRootRotY = 0.32; // Faces toward user chat
        targetHeadRotX = 0.12;
        targetHeadRotY = 0.28;
        targetWingRightRotZ = 0.14;
        targetWingLeftRotZ = -0.14;
        break;
      }

      case 'error': {
        // ERROR: Puzzled reverse head tilt and confused shake
        targetRootPosY = 0;
        targetHeadRotZ = -0.42; // Reverse tilt
        targetHeadRotY = Math.sin(t * 9.0) * 0.25; // Confused shake
        targetHeadRotX = 0.10;
        targetWingRightRotZ = 0.38;
        targetWingLeftRotZ = -0.38;
        break;
      }

      case 'idle':
      default: {
        // IDLE: Natural breathing flipper sway and subtle floating posture
        targetRootPosY = Math.sin(t * 1.6) * 0.05;
        targetRootRotY = Math.sin(t * 0.8) * 0.05;
        targetHeadRotX = Math.sin(t * 1.4) * 0.06;
        targetHeadRotY = Math.sin(t * 0.8) * 0.06;
        targetWingRightRotZ = 0.08 + Math.sin(t * 1.8) * 0.06;
        targetWingLeftRotZ = -0.08 - Math.sin(t * 1.8) * 0.06;
        break;
      }
    }

    // Responsive exponential damping speed (16 for snappy, smooth, organic kinematics)
    const dampSpeed = 16;

    // 1. Root Group position and rotation
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, baseRootY + targetRootPosY, dampSpeed, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRootRotX, dampSpeed, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRootRotY, dampSpeed, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRootRotZ, dampSpeed, delta);

    // 2. Head Node
    if (nodes.head) {
      nodes.head.rotation.x = THREE.MathUtils.damp(nodes.head.rotation.x, targetHeadRotX, dampSpeed, delta);
      nodes.head.rotation.y = THREE.MathUtils.damp(nodes.head.rotation.y, targetHeadRotY, dampSpeed, delta);
      nodes.head.rotation.z = THREE.MathUtils.damp(nodes.head.rotation.z, targetHeadRotZ, dampSpeed, delta);
    }

    // 3. Right Wing / Arm
    if (nodes.wingRight) {
      nodes.wingRight.rotation.z = THREE.MathUtils.damp(nodes.wingRight.rotation.z, targetWingRightRotZ, dampSpeed, delta);
      nodes.wingRight.rotation.x = THREE.MathUtils.damp(nodes.wingRight.rotation.x, targetWingRightRotX, dampSpeed, delta);
      nodes.wingRight.rotation.y = THREE.MathUtils.damp(nodes.wingRight.rotation.y, targetWingRightRotY, dampSpeed, delta);
    }

    // 4. Left Wing / Arm
    if (nodes.wingLeft) {
      nodes.wingLeft.rotation.z = THREE.MathUtils.damp(nodes.wingLeft.rotation.z, targetWingLeftRotZ, dampSpeed, delta);
      nodes.wingLeft.rotation.x = THREE.MathUtils.damp(nodes.wingLeft.rotation.x, targetWingLeftRotX, dampSpeed, delta);
      nodes.wingLeft.rotation.y = THREE.MathUtils.damp(nodes.wingLeft.rotation.y, targetWingLeftRotY, dampSpeed, delta);
    }

    // 5. Lower Beak (Speech Articulation)
    if (nodes.beakLower) {
      const baseBeakY = restTransforms.current.beakLowerY;
      nodes.beakLower.position.y = THREE.MathUtils.damp(
        nodes.beakLower.position.y,
        baseBeakY + targetBeakDispY,
        22,
        delta
      );
    }

    // Expose runtime debugging helper for developers & automated inspection
    if (typeof window !== 'undefined') {
      (window as any).__vsbGetMascotDebugInfo = () => ({
        state,
        elapsedInState: t - stateStartTimeRef.current,
        nodesFound: {
          wingRight: !!nodes.wingRight,
          wingLeft: !!nodes.wingLeft,
          head: !!nodes.head,
          beakLower: !!nodes.beakLower,
          body: !!nodes.body,
        },
        rotations: {
          wingRight: nodes.wingRight ? nodes.wingRight.rotation.toArray().slice(0, 3) : null,
          wingLeft: nodes.wingLeft ? nodes.wingLeft.rotation.toArray().slice(0, 3) : null,
          head: nodes.head ? nodes.head.rotation.toArray().slice(0, 3) : null,
          root: groupRef.current ? groupRef.current.rotation.toArray().slice(0, 3) : null,
        },
        rootPosition: groupRef.current ? groupRef.current.position.toArray() : null,
      });
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef} dispose={null} position={[0, -1.2, 0]} scale={1.22}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the permanent GLB model
try {
  useGLTF.preload(PENGUIN_MODEL_PATH);
} catch {
  // Preload safeguard
}
