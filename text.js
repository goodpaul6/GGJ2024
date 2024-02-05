import * as THREE from "three";
import { camera } from "./scene.js";

export let mesh = null;

function meshFromText(text) {
  // Create a canvas and draw your text on it
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set the size of your canvas and text properties
  canvas.width = 1024;
  canvas.height = 1024;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add your text
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);

  if (!mesh) {
    // Create a plane geometry for the mesh
    const planeGeometry = new THREE.PlaneGeometry(2, 2);

    // Create a material using this texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    mesh = new THREE.Mesh(planeGeometry, material);
    mesh.position.set(0, -0.5, -2); // set position where you want it
    mesh.name = "Text";

    mesh.material.depthTest = false;
    mesh.material.depthWrite = false;

    camera.add(mesh);
  } else {
    mesh.material.map = texture;
  }

  mesh.visible = true;
}

export function hideText() {
  mesh.visible = false;
}

export function showText(text, timer = null) {
  meshFromText(text);

  mesh.userData.timer = timer;
  mesh.visible = true;
}

export function update(dt) {
  if (mesh?.userData.timer) {
    mesh.userData.timer -= dt;
    if (mesh.userData.timer < 0) {
      hideText();
    }
  }
}
