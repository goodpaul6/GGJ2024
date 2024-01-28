import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

import { renderer } from "./renderer.js";
import { DEBUG_MODE as PHYSICS_DEBUG_MODE, forEachBody } from "./physics.js";
import { onAllLoaded, roomGltf } from "./assets.js";

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
export const listener = new THREE.AudioListener();
export const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);

const controllerModelFactory = new XRControllerModelFactory();

export let room = null;
export let lightbulb = null;

export function init() {
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", onWindowResize);

  scene.background = new THREE.Color(0x79c6d4);

  camera.add(listener);

  dirLight.position.set(10, 13, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;

  scene.add(dirLight);

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );

  scene.add(controllerGrip1);

  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );

  scene.add(controllerGrip2);

  onAllLoaded(function () {
    room = roomGltf.scene;
    room.position.set(0, 0.02, 0);

    lightbulb = room.getObjectByName("RoomLightbulb");
    lightbulb.intensity = 500;
    scene.add(room);
  });
}

export function update(elapsed) {
  if (!PHYSICS_DEBUG_MODE) {
    return;
  }

  // Add body objects to scene if they haven't been added
  forEachBody(function (body) {
    if (!body.obj || body.obj.parent) {
      return;
    }

    scene.add(body.obj);
  });
}
