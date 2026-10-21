import React, { useEffect, useRef } from 'react';
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

export function PenguinModel({ state, onModelLoaded, modelUrl }: PenguinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetUrl = modelUrl || PENGUIN_MODEL_PATH;
  const gltf = useGLTF(targetUrl);
  const { actions } = useAnimations(gltf.animations, groupRef);

  // References to key anatomical parts detected in model
  const nodesMap = useRef<{
    head?: THREE.Object3D;
    beakLower?: THREE.Object3D;
    beakUpper?: THREE.Object3D;
    wingLeft?: THREE.Object3D;
    wingRight?: THREE.Object3D;
    eyeLeft?: THREE.Object3D;
    eyeRight?: THREE.Object3D;
    body?: THREE.Object3D;
    footLeft?: THREE.Object3D;
    footRight?: THREE.Object3D;
    morphMeshes: THREE.Mesh[];
  }>({ morphMeshes: [] });

  const inspectedSceneRef = useRef<THREE.Group | null>(null);
  const prevStateRef = useRef<PenguinState>(state);
  const stateStartTimeRef = useRef<number>(0);

  const initialTransforms = useRef<{
    beakLowerY?: number;
    wingLeftZ?: number;
    wingRightZ?: number;
    wingRightX?: number;
  }>({});

  const onModelLoadedRef = useRef(onModelLoaded);
  useEffect(() => {
    onModelLoadedRef.current = onModelLoaded;
  });

  // STEP 1: Inspect model structure, skeleton, morph targets, and animation clips on mount once
  useEffect(() => {
    if (!gltf.scene || inspectedSceneRef.current === gltf.scene) return;
    inspectedSceneRef.current = gltf.scene;

    const detectedNodes: string[] = [];
    const morphMeshes: THREE.Mesh[] = [];
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    let boneCount = 0;
    let meshCount = 0;

    const nodeRefs: typeof nodesMap.current = { morphMeshes: [] };

    gltf.scene.traverse((obj) => {
      if (obj.name) {
        detectedNodes.push(obj.name);
      }

      if (obj instanceof THREE.Bone) {
        boneCount++;
      }

      if (obj instanceof THREE.SkinnedMesh) {
        skinnedMeshes.push(obj);
      }

      if (obj instanceof THREE.Mesh) {
        meshCount++;
        obj.castShadow = true;
        obj.receiveShadow = true;

        if (obj.morphTargetDictionary && Object.keys(obj.morphTargetDictionary).length > 0) {
          morphMeshes.push(obj);
        }
      }

      const lowerName = (obj.name || '').toLowerCase();

      // Specifically detect Head group (pivot at neck [0, 2.3, 0])
      if (!nodeRefs.head) {
        if (
          lowerName === 'head' ||
          lowerName === 'head_group' ||
          (lowerName.includes('head') && !lowerName.includes('mesh') && !lowerName.includes('phone') && !lowerName.includes('pad'))
        ) {
          nodeRefs.head = obj;
        }
      }

      // Lower Beak for jaw/speaking animation
      if (!nodeRefs.beakLower) {
        if (lowerName.includes('beak_lower') || lowerName.includes('jaw') || lowerName.includes('mouth_down')) {
          nodeRefs.beakLower = obj;
        }
      }

      if (!nodeRefs.beakUpper) {
        if (lowerName.includes('beak_upper') || lowerName.includes('mouth_up')) {
          nodeRefs.beakUpper = obj;
        }
      }

      // Wings / Arms
      if (!nodeRefs.wingLeft) {
        if (lowerName.includes('wing_l') || lowerName.includes('wingleft') || lowerName.includes('flipper_l') || lowerName.includes('arm_l')) {
          nodeRefs.wingLeft = obj;
        }
      }

      if (!nodeRefs.wingRight) {
        if (lowerName.includes('wing_r') || lowerName.includes('wingright') || lowerName.includes('flipper_r') || lowerName.includes('arm_r')) {
          nodeRefs.wingRight = obj;
        }
      }

      // Eyes (for blinking)
      if (!nodeRefs.eyeLeft && (lowerName.includes('eye_l') || lowerName.includes('eyeleft'))) {
        nodeRefs.eyeLeft = obj;
      }
      if (!nodeRefs.eyeRight && (lowerName.includes('eye_r') || lowerName.includes('eyeright'))) {
        nodeRefs.eyeRight = obj;
      }

      // Feet
      if (!nodeRefs.footLeft && (lowerName.includes('foot_l') || lowerName.includes('footleft') || lowerName.includes('leg_l'))) {
        nodeRefs.footLeft = obj;
      }
      if (!nodeRefs.footRight && (lowerName.includes('foot_r') || lowerName.includes('footright') || lowerName.includes('leg_r'))) {
        nodeRefs.footRight = obj;
      }

      // Body / Spine
      if (!nodeRefs.body) {
        if (lowerName === 'body' || lowerName.includes('spine') || lowerName.includes('root')) {
          nodeRefs.body = obj;
        }
      }
    });

    nodeRefs.morphMeshes = morphMeshes;
    nodesMap.current = nodeRefs;

    initialTransforms.current = {
      beakLowerY: nodeRefs.beakLower?.position.y ?? -0.15,
      wingLeftZ: nodeRefs.wingLeft?.rotation.z ?? -0.12,
      wingRightZ: nodeRefs.wingRight?.rotation.z ?? 0.12,
      wingRightX: nodeRefs.wingRight?.rotation.x ?? 0,
    };

    const details: ModelInspectionDetails = {
      nodeNames: detectedNodes,
      animationNames: gltf.animations?.map((a) => a.name) || [],
      hasBones: boneCount > 0,
      hasMorphTargets: morphMeshes.length > 0,
      meshCount,
    };

    onModelLoadedRef.current?.(details);

    // Detailed console diagnostic output per STEP 1
    console.group('🐧 [VSB 3D Penguin Model Diagnostic]');
    console.log('Model URL:', targetUrl);
    console.log('Embedded Animation Clips:', gltf.animations?.length ? gltf.animations.map((a) => `${a.name} (${a.duration.toFixed(2)}s)`) : 'None in GLB (Using real-time kinematic animation)');
    console.log('Skeleton / Bones:', boneCount > 0 ? `${boneCount} bones` : 'Rig-less Separate Mesh Hierarchy (Arms, Head, Feet are independent nodes)');
    console.log('SkinnedMeshes:', skinnedMeshes.length);
    console.log('Morph Targets:', morphMeshes.length > 0 ? morphMeshes.map((m) => Object.keys(m.morphTargetDictionary || {})) : 'None');
    console.log('Detected Controllable Nodes:', {
      head: nodeRefs.head ? nodeRefs.head.name : 'Not detected',
      wingRight: nodeRefs.wingRight ? nodeRefs.wingRight.name : 'Not detected',
      wingLeft: nodeRefs.wingLeft ? nodeRefs.wingLeft.name : 'Not detected',
      beakLower: nodeRefs.beakLower ? nodeRefs.beakLower.name : 'Not detected',
      eyeLeft: nodeRefs.eyeLeft ? nodeRefs.eyeLeft.name : 'Not detected',
      eyeRight: nodeRefs.eyeRight ? nodeRefs.eyeRight.name : 'Not detected',
      footLeft: nodeRefs.footLeft ? nodeRefs.footLeft.name : 'Not detected',
      footRight: nodeRefs.footRight ? nodeRefs.footRight.name : 'Not detected',
    });
    console.log('Local Node Transforms:', {
      head: nodeRefs.head?.position.toArray(),
      wingRight: nodeRefs.wingRight?.position.toArray(),
      wingLeft: nodeRefs.wingLeft?.position.toArray(),
      beakLower: nodeRefs.beakLower?.position.toArray(),
    });
    console.groupEnd();
  }, [gltf.scene, gltf.animations, targetUrl]);

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

  // Procedural Kinematic Animation Loop
  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;

    const t = stateObj.clock.getElapsedTime();
    const nodes = nodesMap.current;

    // Track state transitions and elapsed time in state
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      stateStartTimeRef.current = t;
    }
    const elapsedInState = Math.max(0, t - stateStartTimeRef.current);

    // Base root transforms
    let targetPosY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;

    // Head transforms
    let headRotX = 0;
    let headRotY = 0;
    let headRotZ = 0;

    // Right Arm/Wing transforms (Z positive = raises arm outward and upward)
    let wingRightRotZ = 0.12;
    let wingRightRotX = 0;
    let wingRightRotY = 0;

    // Left Arm/Wing transforms (Z negative = raises arm outward and upward)
    let wingLeftRotZ = -0.12;
    let wingLeftRotX = 0;
    let wingLeftRotY = 0;

    // Beak / Jaw displacement (negative Y opens beak)
    let beakLowerDispY = 0;

    // Procedural blink: every 4.2 seconds, eyes blink for 0.14s
    const blinkCycle = t % 4.2;
    const isBlinking = blinkCycle < 0.14;
    const eyeScaleY = isBlinking ? 0.1 : 1.0;
    if (nodes.eyeLeft) nodes.eyeLeft.scale.y = eyeScaleY;
    if (nodes.eyeRight) nodes.eyeRight.scale.y = eyeScaleY;

    // =========================================================================
    // STEP 3 & STEP 5: DISTINCT, VISIBLE ACTIONS PER STATE
    // =========================================================================
    switch (state) {
      case 'greeting': {
        // WAVE: Right arm visibly raises up high and waves back and forth 3+ times
        targetPosY = Math.sin(t * 2.0) * 0.04;
        targetRotY = 0.18; // Turns slightly towards the user
        headRotX = 0.1 + Math.sin(t * 4.0) * 0.08; // Friendly nod
        headRotY = 0.12;

        // Wave motion: Right arm raised high (+2.1 rad ~120 deg) and waving at 9Hz
        const waveAngle = Math.sin(elapsedInState * 9.0);
        wingRightRotZ = 2.1 + waveAngle * 0.45;
        wingRightRotX = Math.sin(elapsedInState * 9.0) * 0.35; // Flipper waves toward user
        wingRightRotY = -0.2;

        // Left arm remains relaxed at side
        wingLeftRotZ = -0.15;
        break;
      }

      case 'thinking': {
        // THINK: Head tilts noticeably and right arm moves toward chin/head
        targetPosY = Math.sin(t * 1.5) * 0.06;
        targetRotY = -0.1;

        // Curious head tilt
        headRotZ = 0.42; // Distinct head tilt
        headRotX = -0.12;
        headRotY = Math.sin(t * 1.2) * 0.12;

        // Right arm moves up and points toward chin/head
        wingRightRotZ = 1.45;
        wingRightRotX = 0.65;
        wingRightRotY = -0.45;

        // Left arm relaxed at side
        wingLeftRotZ = -0.2;
        break;
      }

      case 'happy': {
        // HAPPY: Both arms move outward and upward with celebratory body hops
        targetPosY = Math.abs(Math.sin(elapsedInState * 8.0)) * 0.25; // Energetic hops
        targetRotY = Math.sin(elapsedInState * 4.0) * 0.18;
        headRotX = Math.sin(elapsedInState * 8.0) * 0.16;
        headRotZ = Math.sin(elapsedInState * 4.0) * 0.1;

        // Both arms raised high and flapping joyfully
        const flapCycle = Math.sin(elapsedInState * 10.0) * 0.35;
        wingRightRotZ = 1.85 + flapCycle;
        wingLeftRotZ = -1.85 - flapCycle;
        wingRightRotX = Math.sin(elapsedInState * 10.0) * 0.2;
        wingLeftRotX = Math.sin(elapsedInState * 10.0) * 0.2;
        break;
      }

      case 'speaking': {
        // SPEAKING: Beak opens/closes in cadence with speech + conversational gestures
        beakLowerDispY = -0.14 * Math.abs(Math.sin(t * 14.0));

        // Articulating head nod and body inflection facing the conversation
        headRotX = Math.sin(t * 7.5) * 0.12;
        headRotY = 0.22 + Math.sin(t * 3.5) * 0.08; // Facing right toward conversation
        headRotZ = Math.sin(t * 2.5) * 0.05;

        targetPosY = Math.sin(t * 3.5) * 0.05;
        targetRotY = 0.22 + Math.sin(t * 2.2) * 0.08;

        // Both arms make natural communicative gesturing motions
        wingRightRotZ = 0.55 + Math.sin(t * 4.5) * 0.28;
        wingLeftRotZ = -0.55 - Math.sin(t * 4.0) * 0.28;
        wingRightRotX = Math.sin(t * 4.5) * 0.22;
        wingLeftRotX = Math.sin(t * 4.0) * 0.22;

        // Morph target fallback if custom model has mouthOpen
        nodes.morphMeshes.forEach((mesh) => {
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            const mouthIdx = mesh.morphTargetDictionary['mouthOpen'] ?? mesh.morphTargetDictionary['beakOpen'] ?? 0;
            mesh.morphTargetInfluences[mouthIdx] = THREE.MathUtils.damp(
              mesh.morphTargetInfluences[mouthIdx],
              Math.abs(Math.sin(t * 14)) * 0.85,
              18,
              delta
            );
          }
        });
        break;
      }

      case 'listening': {
        // LISTENING: Attentive forward lean and turns toward conversation on the right
        targetPosY = 0.03;
        targetRotX = 0.16; // Leans forward attentively
        targetRotY = 0.32; // Faces toward user chat
        headRotX = 0.1;
        headRotY = 0.3; // Turns head right towards the conversation
        wingRightRotZ = 0.12;
        wingLeftRotZ = -0.12;
        break;
      }

      case 'error': {
        // ERROR: Puzzled reverse head tilt and confused shake
        targetPosY = 0;
        headRotZ = -0.4; // Reverse tilt
        headRotY = Math.sin(t * 8.0) * 0.22; // Confused shake
        headRotX = 0.08;
        wingRightRotZ = 0.35;
        wingLeftRotZ = -0.35;
        break;
      }

      case 'idle':
      default: {
        // IDLE: Gentle natural floating, subtle flipper breathing sway
        targetPosY = Math.sin(t * 1.5) * 0.05;
        targetRotY = Math.sin(t * 0.8) * 0.05;
        headRotX = Math.sin(t * 1.2) * 0.04;
        headRotY = Math.sin(t * 0.7) * 0.06;
        wingRightRotZ = 0.12 + Math.sin(t * 1.5) * 0.04;
        wingLeftRotZ = -0.12 - Math.sin(t * 1.5) * 0.04;
        break;
      }
    }

    // Smooth exponential damping (speed 12 for responsive, fluid animation)
    const dampSpeed = 12;

    // Apply to main root group
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, dampSpeed, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, dampSpeed, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, dampSpeed, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, dampSpeed, delta);

    // Apply to Head
    if (nodes.head) {
      nodes.head.rotation.x = THREE.MathUtils.damp(nodes.head.rotation.x, headRotX, dampSpeed, delta);
      nodes.head.rotation.y = THREE.MathUtils.damp(nodes.head.rotation.y, headRotY, dampSpeed, delta);
      nodes.head.rotation.z = THREE.MathUtils.damp(nodes.head.rotation.z, headRotZ, dampSpeed, delta);
    }

    // Apply to Right Arm / Wing
    if (nodes.wingRight) {
      nodes.wingRight.rotation.z = THREE.MathUtils.damp(nodes.wingRight.rotation.z, wingRightRotZ, dampSpeed, delta);
      nodes.wingRight.rotation.x = THREE.MathUtils.damp(nodes.wingRight.rotation.x, wingRightRotX, dampSpeed, delta);
      nodes.wingRight.rotation.y = THREE.MathUtils.damp(nodes.wingRight.rotation.y, wingRightRotY, dampSpeed, delta);
    }

    // Apply to Left Arm / Wing
    if (nodes.wingLeft) {
      nodes.wingLeft.rotation.z = THREE.MathUtils.damp(nodes.wingLeft.rotation.z, wingLeftRotZ, dampSpeed, delta);
      nodes.wingLeft.rotation.x = THREE.MathUtils.damp(nodes.wingLeft.rotation.x, wingLeftRotX, dampSpeed, delta);
      nodes.wingLeft.rotation.y = THREE.MathUtils.damp(nodes.wingLeft.rotation.y, wingLeftRotY, dampSpeed, delta);
    }

    // Apply to Beak Lower for speech articulation
    if (nodes.beakLower) {
      const baseBeakY = initialTransforms.current.beakLowerY ?? -0.15;
      nodes.beakLower.position.y = THREE.MathUtils.damp(
        nodes.beakLower.position.y,
        baseBeakY + beakLowerDispY,
        18,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} dispose={null} position={[0, -1.2, 0]} scale={1.22}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Preload the exact user specified GLB model
useGLTF.preload(PENGUIN_MODEL_PATH);
