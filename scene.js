import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

import { renderer } from "./renderer.js";
import { DEBUG_MODE as PHYSICS_DEBUG_MODE, forEachBody } from "./physics.js";

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
export const listener = new THREE.AudioListener();
export const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);

const controllerModelFactory = new XRControllerModelFactory();

export function init() {
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  scene.add(camera);

  window.addEventListener("resize", onWindowResize);

  scene.background = new THREE.Color(0x79c6d4);

  camera.add(listener);

  const ambLight = new THREE.AmbientLight(0x606060);
  scene.add(ambLight);

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
