import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

import { renderer } from "./renderer.js";

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
export const listener = new THREE.AudioListener();
export const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
export const ambLight = new THREE.AmbientLight(0x303030);

const controllerModelFactory = new XRControllerModelFactory();

export function init() {
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  scene.add(camera);

  window.addEventListener("resize", onWindowResize);

  scene.background = new THREE.Color(0x131862);

  camera.add(listener);

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
