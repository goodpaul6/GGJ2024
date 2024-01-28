import * as THREE from "three";
import { gamepads } from "./input.js";

const grabbables = [];

export function addToGrabbables(grabbable) {
  grabbable.userData.isGrabbed = false;

  grabbables.push(grabbable);
}

export function update() {
  const tempVector = new THREE.Vector3();
  const tempMatrix = new THREE.Matrix4();
  const tempQuat = new THREE.Quaternion();

  for (const grabbable of grabbables) {
    const worldPos = grabbable.getWorldPosition(new THREE.Vector3());

    for (const gamepad of gamepads) {
      const controller = gamepad.controller;
      // Make sure we have the matrix for the controller
      controller.updateMatrixWorld(true);

      tempMatrix.identity().extractRotation(controller.matrixWorld);

      tempVector.setFromMatrixPosition(controller.matrixWorld);
      tempQuat.setFromRotationMatrix(tempMatrix);

      const pressedValue = 0.4;

      if (grabbable.userData.heldByGamepad === gamepad) {
        if (gamepad.buttons[1].value < pressedValue) {
          gamepad.hasGrabbedObject = false;

          grabbable.userData.isGrabbed = false;
          grabbable.userData.heldByGamepad = null;
        } else {
          grabbable.userData.grabHandPos = tempVector.clone();
          grabbable.userData.grabHandOrient = tempQuat.clone();
        }
      } else if (
        !gamepad.hasGrabbedObject &&
        !grabbable.userData.heldByGamepad &&
        gamepad.buttons[1].value >= pressedValue &&
        worldPos.distanceTo(tempVector) < 0.2
      ) {
        gamepad.hasGrabbedObject = true;

        grabbable.userData.isGrabbed = true;
        grabbable.userData.heldByGamepad = gamepad;

        grabbable.userData.grabHandPos = tempVector.clone();
        grabbable.userData.grabHandOrient = tempQuat.clone();
      }
    }
  }
}
