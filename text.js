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
}

export function initText() {
  meshFromText("Welcome to a series of slices!");
  camera.add(mesh);
}

export function hideText() {
  mesh.visible = false;
}

export function showText(text = null) {
  if (text !== null) {
    camera.remove(mesh);
    meshFromText(text);
    camera.add(mesh);
  }
  mesh.visible = true;
}

export function update(dt) {}
