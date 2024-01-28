import * as THREE from "three";
import { camera } from "./scene.js";

export let mesh = null;

function meshFromText(text) {
  // Create a canvas and draw your text on it
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set the size of your canvas and text properties
  canvas.width = 512;
  canvas.height = 512;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Add your text
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create a material using this texture
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Create a plane geometry for the mesh
  const planeGeometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(planeGeometry, material);
  mesh.position.set(0, -0.5, -2); // set position where you want it
  mesh.name = "Text";

  mesh.material.depthTest = false;
  mesh.material.depthWrite = false;
  mesh.onBeforeRender = function (renderer) {
    renderer.clearDepth();
  };
}

export function hideText() {
  camera.remove(mesh);
  // We can use a visible property on the mesh to hide it instead,
  // but we are always displaying different text when we make it
  // visible again, so we just remove it from the camera instead
  // mesh.visible = false;
}

export function showText(text, timer = null) {
  meshFromText(text);

  mesh.userData.timer = timer;
  camera.add(mesh);
}

export function update(dt) {
  if (mesh?.userData.timer) {
    mesh.userData.timer -= dt;
    if (mesh.userData.timer < 0) {
      hideText();
    }
  }
}
