import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { PenguinState } from '../types';

export const PENGUIN_MODEL_PATH = '/Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb';

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
  const gltf = useGLTF(modelUrl || PENGUIN_MODEL_PATH);
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
    morphMeshes: THREE.Mesh[];
  }>({ morphMeshes: [] });

  const inspectedSceneRef = useRef<THREE.Group | null>(null);
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

  // Inspect model structure, skeleton, morph targets, and animation clips on mount once
  useEffect(() => {
    if (!gltf.scene || inspectedSceneRef.current === gltf.scene) return;
    inspectedSceneRef.current = gltf.scene;

    const detectedNodes: string[] = [];
    const morphMeshes: THREE.Mesh[] = [];
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

      if (obj instanceof THREE.Mesh) {
        meshCount++;
        obj.castShadow = true;
        obj.receiveShadow = true;

        if (obj.morphTargetDictionary && Object.keys(obj.morphTargetDictionary).length > 0) {
          morphMeshes.push(obj);
        }
      }

      const lowerName = (obj.name || '').toLowerCase();

      // Specifically detect Head group (not headphone band or head mesh)
      if (!nodeRefs.head) {
        if (
          lowerName === 'head' ||
          lowerName === 'head_group' ||
          (lowerName.includes('head') && !lowerName.includes('mesh') && !lowerName.includes('phone') && !lowerName.includes('pad'))
        ) {
          nodeRefs.head = obj;
        }
      }

      // Specifically detect Beak Lower for jaw/speaking animation
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

      // Wings
      if (!nodeRefs.wingLeft) {
        if (lowerName.includes('wing_l') || lowerName.includes('wingleft') || lowerName.includes('flipper_l')) {
          nodeRefs.wingLeft = obj;
        }
      }

      if (!nodeRefs.wingRight) {
        if (lowerName.includes('wing_r') || lowerName.includes('wingright') || lowerName.includes('flipper_r')) {
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
      wingLeftZ: nodeRefs.wingLeft?.rotation.z ?? 0.2,
      wingRightZ: nodeRefs.wingRight?.rotation.z ?? -0.2,
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
    console.log('[VSB 3D Penguin] Inspected model hierarchy:', details);
  }, [gltf.scene, gltf.animations]);

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

  // Procedural Animation & Kinematics Loop
  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;

    const t = stateObj.clock.getElapsedTime();
    const nodes = nodesMap.current;

    // Base root transforms
    let targetPosY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;

    let headRotX = 0;
    let headRotY = 0;
    let headRotZ = 0;

    let wingLeftRotZ = 0.2;
    let wingRightRotZ = -0.2;
    let wingRightRotX = 0;

    let beakLowerDispY = 0;

    // Procedural blink: every 4.2 seconds, blink for 0.14s
    const blinkCycle = t % 4.2;
    const isBlinking = blinkCycle < 0.14;
    const eyeScaleY = isBlinking ? 0.1 : 1.0;
    if (nodes.eyeLeft) nodes.eyeLeft.scale.y = eyeScaleY;
    if (nodes.eyeRight) nodes.eyeRight.scale.y = eyeScaleY;

    // Distinct procedural behaviors per state
    switch (state) {
      case 'idle':
        // Gentle floating bob and calm breathing
        targetPosY = Math.sin(t * 1.5) * 0.08;
        targetRotY = Math.sin(t * 0.8) * 0.06;
        headRotX = Math.sin(t * 1.2) * 0.05;
        headRotY = Math.sin(t * 0.7) * 0.08;
        wingLeftRotZ = 0.2 + Math.sin(t * 1.5) * 0.06;
        wingRightRotZ = -0.2 - Math.sin(t * 1.5) * 0.06;
        break;

      case 'greeting':
        // Friendly welcome movement: wave right wing, nod head
        targetPosY = Math.sin(t * 2.0) * 0.08;
        targetRotY = 0.25;
        headRotX = 0.12 + Math.sin(t * 3.5) * 0.1;
        wingRightRotZ = -1.2 + Math.sin(t * 7.0) * 0.4; // Waving wing up
        wingRightRotX = Math.sin(t * 7.0) * 0.25;
        wingLeftRotZ = 0.3;
        break;

      case 'listening':
        // Attentive posture: turns toward conversation on the right, leans forward
        targetPosY = 0.04;
        targetRotX = 0.16; // Leans forward
        targetRotY = 0.32; // Faces toward the conversation on the right!
        headRotX = 0.1;
        headRotY = 0.28; // Head faces right towards the chat
        wingLeftRotZ = 0.12;
        wingRightRotZ = -0.12;
        break;

      case 'thinking':
        // Expressive curiosity head tilt & contemplative floating bob
        targetPosY = Math.sin(t * 1.6) * 0.08;
        targetRotY = -0.1;
        headRotZ = 0.35; // Curious head tilt
        headRotX = -0.12;
        headRotY = Math.sin(t * 1.2) * 0.16;
        wingLeftRotZ = 0.35;
        wingRightRotZ = -0.15;
        break;

      case 'speaking':
        // Beak open/close movement synchronized with lively head & wing gestures
        targetPosY = Math.sin(t * 3.5) * 0.07;
        targetRotY = 0.22 + Math.sin(t * 2.2) * 0.1; // Facing conversation
        headRotX = Math.sin(t * 8.0) * 0.12; // Expressive articulating nod
        headRotY = 0.2 + Math.sin(t * 3.5) * 0.08;
        headRotZ = Math.sin(t * 2.5) * 0.06;
        // Beak vertical displacement for speech
        beakLowerDispY = -0.12 * Math.abs(Math.sin(t * 14.0));
        wingLeftRotZ = 0.35 + Math.sin(t * 5.0) * 0.18;
        wingRightRotZ = -0.35 - Math.sin(t * 5.5) * 0.18;

        // Apply morph target if present in custom GLB
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

      case 'happy':
        // Celebratory hopping and enthusiastic wing flaps
        targetPosY = Math.abs(Math.sin(t * 6.5)) * 0.3; // Upbeat hops
        targetRotY = Math.sin(t * 3.5) * 0.25;
        headRotX = Math.sin(t * 8.0) * 0.18;
        headRotZ = Math.sin(t * 5.0) * 0.12;
        wingLeftRotZ = 0.8 + Math.sin(t * 12.0) * 0.45;
        wingRightRotZ = -0.8 - Math.sin(t * 12.0) * 0.45;
        break;

      case 'error':
        // Puzzled reverse head tilt & confused shake
        targetPosY = 0;
        headRotZ = -0.35; // Confused tilt
        headRotY = Math.sin(t * 9.0) * 0.22; // Puzzled shake
        headRotX = 0.08;
        wingLeftRotZ = 0.4;
        wingRightRotZ = -0.1;
        break;
    }

    // Apply smooth exponential damping to main group
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, 7, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 8, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 6, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 8, delta);

    // Apply to Head node if present
    if (nodes.head) {
      nodes.head.rotation.x = THREE.MathUtils.damp(nodes.head.rotation.x, headRotX, 9, delta);
      nodes.head.rotation.y = THREE.MathUtils.damp(nodes.head.rotation.y, headRotY, 9, delta);
      nodes.head.rotation.z = THREE.MathUtils.damp(nodes.head.rotation.z, headRotZ, 9, delta);
    }

    // Apply to Wings if present
    if (nodes.wingLeft) {
      nodes.wingLeft.rotation.z = THREE.MathUtils.damp(nodes.wingLeft.rotation.z, wingLeftRotZ, 10, delta);
    }
    if (nodes.wingRight) {
      nodes.wingRight.rotation.z = THREE.MathUtils.damp(nodes.wingRight.rotation.z, wingRightRotZ, 10, delta);
      nodes.wingRight.rotation.x = THREE.MathUtils.damp(nodes.wingRight.rotation.x, wingRightRotX, 10, delta);
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
