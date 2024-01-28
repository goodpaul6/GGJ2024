import * as THREE from "three";
import { gamepads } from "./input.js";
let grabbables = [];

export function addToGrabbables(grabbable, isGrabbed = false) {
  grabbable.isGrabbed = isGrabbed;
  grabbables.push(grabbable);
}

export function update() {
  const tempVector = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();
  const tempQuat = new THREE.Quaternion();
  for (const gamepad of gamepads) {
    const pressedValue = 0.4;
    if (gamepad.buttons[1].value < pressedValue) continue;
    const controller = gamepad.controller;
    // Make sure we have the matrix for the controller
    controller.updateMatrixWorld(true);

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    tempVector.setFromMatrixPosition(controller.matrixWorld);
    tempQuat.setFromRotationMatrix(tempMatrix);

    for (const grabbable of grabbables) {
      const worldPos = grabbable.getWorldPosition(new THREE.Vector3());

      if (worldPos.distanceTo(tempVector) < 0.2) {
        grabbable.isGrabbed = true;
      }
    }
  }
}
