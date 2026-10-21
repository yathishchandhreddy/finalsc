import fs from 'fs';
import path from 'path';

// Node polyfill for GLTFExporter binary writeAsync
globalThis.FileReader = class FileReader {
  onloadend = null;
  result = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Construct high quality 3D Tech Penguin for VSB Engineering College
const scene = new THREE.Scene();
scene.name = "VSB_Tech_Penguin_Scene";

const rootGroup = new THREE.Group();
rootGroup.name = "Meshy_AI_VSB_Tech_Penguin_1012173021";
scene.add(rootGroup);

// Materials
const darkBodyMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  roughness: 0.35,
  metalness: 0.15,
  name: "Penguin_Body_Material"
});

const bellyMat = new THREE.MeshStandardMaterial({
  color: 0xf8fafc,
  roughness: 0.25,
  metalness: 0.05,
  name: "Penguin_Belly_Material"
});

const beakOrangeMat = new THREE.MeshStandardMaterial({
  color: 0xf97316,
  roughness: 0.35,
  metalness: 0.1,
  name: "Penguin_Beak_Material"
});

const techBlueMat = new THREE.MeshStandardMaterial({
  color: 0x2563eb,
  roughness: 0.25,
  metalness: 0.6,
  name: "Penguin_Tech_Blue_Material"
});

const eyeMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.1,
  metalness: 0.9,
  name: "Penguin_Eye_Material"
});

const goldAccentMat = new THREE.MeshStandardMaterial({
  color: 0xf59e0b,
  roughness: 0.3,
  metalness: 0.7,
  name: "Penguin_Gold_Material"
});

// 1. Main Body
const bodyGeo = new THREE.SphereGeometry(1.0, 32, 24);
bodyGeo.scale(0.85, 1.25, 0.8);
const bodyMesh = new THREE.Mesh(bodyGeo, darkBodyMat);
bodyMesh.name = "Body";
bodyMesh.position.y = 1.2;
rootGroup.add(bodyMesh);

// 2. Belly (White Patch)
const bellyGeo = new THREE.SphereGeometry(0.72, 32, 24);
bellyGeo.scale(0.8, 1.15, 0.4);
const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
bellyMesh.name = "Belly";
bellyMesh.position.set(0, 1.1, 0.52);
rootGroup.add(bellyMesh);

// 3. Head Group (allows pivoting for thinking/greeting/nodding)
const headGroup = new THREE.Group();
headGroup.name = "Head";
headGroup.position.set(0, 2.3, 0);
rootGroup.add(headGroup);

// Head sphere
const headGeo = new THREE.SphereGeometry(0.7, 32, 24);
headGeo.scale(0.9, 0.85, 0.9);
const headMesh = new THREE.Mesh(headGeo, darkBodyMat);
headMesh.name = "Head_Mesh";
headGroup.add(headMesh);

// Face patch
const faceGeo = new THREE.SphereGeometry(0.48, 24, 16);
faceGeo.scale(0.9, 0.7, 0.3);
const faceMesh = new THREE.Mesh(faceGeo, bellyMat);
faceMesh.name = "Face_White";
faceMesh.position.set(0, -0.05, 0.48);
headGroup.add(faceMesh);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
eyeLeft.name = "Eye_Left";
eyeLeft.position.set(-0.25, 0.08, 0.6);
headGroup.add(eyeLeft);

const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
eyeRight.name = "Eye_Right";
eyeRight.position.set(0.25, 0.08, 0.6);
headGroup.add(eyeRight);

// Eye highlights
const pupilGeo = new THREE.SphereGeometry(0.035, 12, 12);
const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
pupilL.position.set(-0.22, 0.11, 0.68);
headGroup.add(pupilL);
const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
pupilR.position.set(0.28, 0.11, 0.68);
headGroup.add(pupilR);

// Beak Upper and Lower (for speaking animation)
const beakUpperGeo = new THREE.ConeGeometry(0.2, 0.45, 16);
beakUpperGeo.rotateX(Math.PI / 2);
const beakUpper = new THREE.Mesh(beakUpperGeo, beakOrangeMat);
beakUpper.name = "Beak_Upper";
beakUpper.position.set(0, -0.05, 0.75);
headGroup.add(beakUpper);

const beakLowerGeo = new THREE.ConeGeometry(0.16, 0.35, 16);
beakLowerGeo.rotateX(Math.PI / 2);
const beakLower = new THREE.Mesh(beakLowerGeo, beakOrangeMat);
beakLower.name = "Beak_Lower";
beakLower.position.set(0, -0.15, 0.7);
headGroup.add(beakLower);

// Tech Headphones / VSB College Headset
const headphoneBandGeo = new THREE.TorusGeometry(0.72, 0.06, 12, 32, Math.PI);
const headphoneBand = new THREE.Mesh(headphoneBandGeo, techBlueMat);
headphoneBand.name = "Headphone_Band";
headphoneBand.rotation.x = Math.PI / 2;
headphoneBand.rotation.z = Math.PI / 2;
headphoneBand.position.set(0, 0.2, 0);
headGroup.add(headphoneBand);

const earPadGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 20);
earPadGeo.rotateZ(Math.PI / 2);

const earPadLeft = new THREE.Mesh(earPadGeo, techBlueMat);
earPadLeft.name = "EarPad_Left";
earPadLeft.position.set(-0.68, 0.05, 0);
headGroup.add(earPadLeft);

const earPadRight = new THREE.Mesh(earPadGeo, techBlueMat);
earPadRight.name = "EarPad_Right";
earPadRight.position.set(0.68, 0.05, 0);
headGroup.add(earPadRight);

// Microphone boom
const micArmGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
micArmGeo.rotateX(Math.PI / 3);
const micArm = new THREE.Mesh(micArmGeo, darkBodyMat);
micArm.position.set(-0.65, -0.15, 0.25);
headGroup.add(micArm);

const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), goldAccentMat);
micTip.position.set(-0.55, -0.3, 0.45);
headGroup.add(micTip);

// 4. Wings (Left and Right flappers)
const wingLeftGroup = new THREE.Group();
wingLeftGroup.name = "Wing_Left";
wingLeftGroup.position.set(-0.8, 1.8, 0);
rootGroup.add(wingLeftGroup);

const wingGeo = new THREE.BoxGeometry(0.12, 0.9, 0.35);
wingGeo.translate(0, -0.4, 0);
const wingLeftMesh = new THREE.Mesh(wingGeo, darkBodyMat);
wingLeftMesh.rotation.z = 0.2;
wingLeftGroup.add(wingLeftMesh);

const wingRightGroup = new THREE.Group();
wingRightGroup.name = "Wing_Right";
wingRightGroup.position.set(0.8, 1.8, 0);
rootGroup.add(wingRightGroup);

const wingRightMesh = new THREE.Mesh(wingGeo.clone(), darkBodyMat);
wingRightMesh.rotation.z = -0.2;
wingRightGroup.add(wingRightMesh);

// 5. Feet
const footGeo = new THREE.BoxGeometry(0.35, 0.12, 0.55);
footGeo.translate(0, 0, 0.15);
const footLeft = new THREE.Mesh(footGeo, beakOrangeMat);
footLeft.name = "Foot_Left";
footLeft.position.set(-0.35, 0.06, 0);
rootGroup.add(footLeft);

const footRight = new THREE.Mesh(footGeo.clone(), beakOrangeMat);
footRight.name = "Foot_Right";
footRight.position.set(0.35, 0.06, 0);
rootGroup.add(footRight);

// 6. VSB College Tech Chest Badge
const badgeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24);
badgeGeo.rotateX(Math.PI / 2);
const badgeMesh = new THREE.Mesh(badgeGeo, techBlueMat);
badgeMesh.name = "VSB_Badge";
badgeMesh.position.set(0, 1.35, 0.72);
rootGroup.add(badgeMesh);

const badgeCoreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 24);
badgeCoreGeo.rotateX(Math.PI / 2);
const badgeCore = new THREE.Mesh(badgeCoreGeo, goldAccentMat);
badgeCore.position.set(0, 1.35, 0.73);
rootGroup.add(badgeCore);

async function run() {
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, { binary: true });
  const outputPath = path.join(process.cwd(), 'public', 'Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb');
  fs.writeFileSync(outputPath, Buffer.from(glb));
  console.log(`Successfully generated ${outputPath} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
}

run().catch((err) => {
  console.error('Generation error:', err);
  process.exit(1);
});
