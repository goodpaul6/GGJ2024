import * as THREE from "three";

import createSlice from "./sliceCreator.js";
import { birthdayGltf } from "./assets.js";
import { setWorldPos } from "./player.js";
import { addToGrabbables } from "./grabbables.js";
import { camera } from "./scene.js";
import {
  createCuboidBody,
  createCylinderBody,
  updateObjectFromBody,
  setBodyType,
  BODY_TYPE_POSN_KINEMATIC,
  BODY_TYPE_DYNAMIC,
  resetDynamicBodyToPos,
  createCylinderTrigger,
  clear as clearPhysics,
  drainTriggerEvents,
} from "./physics.js";

const tempVec = new THREE.Vector3();

function setup() {
  this.room = birthdayGltf.scene;

  setWorldPos(0, 0.3, 1);

  this.candleLight = this.room.getObjectByName("CandleLight");
  this.candleLight.intensity = 1;
  this.candleLight.castShadow = true;

  this.candleFires = this.room.children.filter((c) =>
    c.name.startsWith("CandleFire")
  );

  for (const fire of this.candleFires) {
    fire.userData.initScale = fire.scale.clone();
  }

  this.paddle = this.room.getObjectByName("Paddle");

  this.paddle.userData.body = createCuboidBody({
    hx: 0.1,
    hy: 0.02,
    hz: 0.2,
    position: this.paddle.position,
    mass: 10,
    colliderOffset: new THREE.Vector3(0, 0, 0.1),
  });

  this.paddle.userData.initPos = this.paddle.position.clone();

  addToGrabbables(this.paddle, 0.3);

  this.table = this.room.getObjectByName("Table");

  tempVec.copy(this.table.position);
  tempVec.setY(tempVec.y + 0.5);

  this.table.userData.body = createCuboidBody({
    hx: 1.4,
    hy: 0.15,
    hz: 1.05,
    position: tempVec.clone(),
  });

  this.cake = this.room.getObjectByName("Cake");

  this.cake.userData.body = createCylinderBody({
    halfHeight: 0.13,
    position: this.cake.position,
    radius: 0.21,
  });

  tempVec.copy(this.cake.position);
  tempVec.setY(tempVec.y + 0.25);

  this.blowTrigger = createCylinderTrigger({
    halfHeight: 0.1,
    position: tempVec.clone(),
    radius: 0.21,
  });

  this.scene.add(birthdayGltf.scene);
}

function update(dt) {
  this.candleLight.intensity = Math.random() * 0.2 + 2;

  const events = drainTriggerEvents(this.blowTrigger);

  if (events.length > 0) {
    console.log("Blow", events);
  }

  if (this.paddle.userData.isGrabbed) {
    const body = this.paddle.userData.body;
    setBodyType(body, BODY_TYPE_POSN_KINEMATIC);

    // Offset the hand position by a bit (along the orientation axes, not global world axes)
    tempVec.set(0, 0, -0.15);
    tempVec.applyQuaternion(this.paddle.userData.grabHandOrient);
    tempVec.add(this.paddle.userData.grabHandPos);

    body.setNextKinematicTranslation(tempVec);
    body.setNextKinematicRotation(this.paddle.userData.grabHandOrient);
  } else {
    setBodyType(this.paddle.userData.body, BODY_TYPE_DYNAMIC);

    if (this.paddle.position.distanceTo(camera.position) > 2.25) {
      resetDynamicBodyToPos(
        this.paddle.userData.body,
        this.paddle.userData.initPos
      );
    }
  }

  updateObjectFromBody(this.paddle, this.paddle.userData.body);

  for (const fire of this.candleFires) {
    const value = Math.random() * 0.4 + 0.8;
    fire.scale.x = fire.userData.initScale.x * value;
    fire.scale.y = fire.userData.initScale.y * value;
    fire.scale.z = fire.userData.initScale.z * value;
  }
}

function teardown() {
  clearPhysics();
}

export default function () {
  return createSlice({
    name: "Happy birthday",
    setup,
    update,
    teardown,
  });
}
