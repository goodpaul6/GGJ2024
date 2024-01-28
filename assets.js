import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gltfLoader = new GLTFLoader();
const audioLoader = new THREE.AudioLoader();

// Array of functions that are called once all the models are loaded.
const allLoadedHandlers = [];

export let roomGltf = null;
export let doorGltf = null;
export let birthdayGltf = null;

export function init() {
  gltfLoader.load("assets/room.glb", function (gltf) {
    roomGltf = gltf;
  });

  gltfLoader.load("assets/door.glb", function (gltf) {
    doorGltf = gltf;
  });

  gltfLoader.load("assets/birthday.glb", function (gltf) {
    birthdayGltf = gltf;
  });
}

export function allLoaded() {
  return roomGltf && doorGltf && birthdayGltf;
}

// Function will be called if/once all models are loaded.
export function onAllLoaded(fn) {
  if (
    allLoadedHandlers.find(function (fv) {
      return fv.fn === fn;
    })
  ) {
    return;
  }

  let called = false;

  if (allLoaded()) {
    // If we're already loaded then just call it and mark it as such
    fn();
    called = true;
  }

  allLoadedHandlers.push({
    fn,
    called,
  });
}

// Polls for whether all the models are loaded and calls the handlers at that time.
export function update() {
  if (!allLoaded()) {
    return;
  }

  for (const handler of allLoadedHandlers) {
    if (handler.called) {
      continue;
    }

    handler.fn();
    handler.called = true;
  }
}
