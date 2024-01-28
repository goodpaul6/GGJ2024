import * as THREE from "three";

import createSlice from "./sliceCreator.js";
import { birthdayGltf } from "./assets.js";
import { setWorldPos } from "./player.js";
import { addToGrabbables } from "./grabbables.js";
import {
  createCuboidBody,
  createCylinderBody,
  updateObjectFromBody,
  setBodyType,
  BODY_TYPE_POSN_KINEMATIC,
  BODY_TYPE_DYNAMIC,
} from "./physics.js";

function setup() {
  this.room = birthdayGltf.scene;

  setWorldPos(0, 0.5, 2);

  const lightbulb = this.room.getObjectByName("RoomLightbulb");
  lightbulb.intensity = 2;

  this.candleLight = this.room.getObjectByName("CandleLight");
  this.candleLight.intensity = 1;

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

  addToGrabbables(this.paddle);

  this.table = this.room.getObjectByName("Table");

  this.table.userData.body = createCylinderBody({
    halfHeight: 0.07,
    position: this.table.position,
    radius: 1.55,
  });

  this.scene.add(birthdayGltf.scene);
}

function update(dt) {
  this.candleLight.intensity = Math.random() * 0.2 + 1;

  updateObjectFromBody(this.paddle, this.paddle.userData.body);

  if (this.paddle.userData.isGrabbed) {
    setBodyType(this.paddle.userData.body, BODY_TYPE_POSN_KINEMATIC);

    this.paddle.userData.body.setNextKinematicTranslation(
      this.paddle.userData.grabHandPos
    );
    this.paddle.userData.body.setNextKinematicRotation(
      this.paddle.userData.grabHandOrient
    );
  } else {
    setBodyType(this.paddle.userData.body, BODY_TYPE_DYNAMIC);
  }

  for (const fire of this.candleFires) {
    const value = Math.random() * 0.4 + 0.8;
    fire.scale.x = fire.userData.initScale.x * value;
    fire.scale.y = fire.userData.initScale.y * value;
    fire.scale.z = fire.userData.initScale.z * value;
  }
}

export default function () {
  return createSlice({
    name: "Happy birthday",
    setup,
    update,
  });
}
