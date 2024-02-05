import * as THREE from "three";

import createSlice from "./sliceCreator.js";
import { birthdayGltf } from "./assets.js";
import { setWorldPos } from "./player.js";
import { addToGrabbables } from "./grabbables.js";
import { ambLight, camera } from "./scene.js";
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
import {
  clear as clearParticles,
  createParticleEmitter,
  setEmitterPos,
  startEmitter,
} from "./particles.js";
import { isTextVisible, showText } from "./text.js";

const tempVec = new THREE.Vector3();

const FIRE_START_COLOR = new THREE.Color("yellow");
const FIRE_END_COLOR = new THREE.Color("red");

function easeOutCirc(x) {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}

function setup() {
  this.room = birthdayGltf.scene;

  setWorldPos(0, 0, 0);

  this.lampLight = this.room.getObjectByName("LampLight");
  this.lampLight.intensity = 0.5;

  this.candleLight = this.room.getObjectByName("CandleLight");
  this.candleLight.intensity = 1;
  this.candleLight.castShadow = true;

  this.candleFires = this.room.children.filter((c) =>
    c.name.startsWith("CandleFire")
  );

  for (const fire of this.candleFires) {
    // In case it was made invisible in an earlier run through
    fire.visible = true;
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
  this.paddle.userData.blowCount = 0;

  addToGrabbables(this.paddle, 0.3);

  this.table = this.room.getObjectByName("Table");

  tempVec.copy(this.table.position);
  tempVec.setY(tempVec.y + 0.5);

  this.table.userData.body = createCuboidBody({
    hx: 1.4,
    hy: 0.1,
    hz: 1.05,
    position: tempVec.clone(),
  });

  this.cake = this.room.getObjectByName("Cake");

  this.cake.userData.body = createCylinderBody({
    halfHeight: 0.13,
    position: this.cake.position,
    radius: 0.21,
  });

  this.paddleEmitter = createParticleEmitter({
    geometry: new THREE.BoxGeometry(0.05, 0.05, 0.05),
    material: new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }),
    lifeMinSeconds: 1,
    lifeMaxSeconds: 2,
    minEmitCount: 2,
    maxEmitCount: 10,
    timeBetweenEmissions: 0.1,
    velMinVec: new THREE.Vector3(0, 0.2, 0),
    velMaxVec: new THREE.Vector3(0, 1, 0),
    emitRadius: 0.05,
    pos: this.paddle.position,
    scaleForT: (t, dest) => dest.setScalar(1 - t),
    colorForT: (t, dest) =>
      dest.lerpColors(FIRE_START_COLOR, FIRE_END_COLOR, easeOutCirc(t)),
    maxParticles: 200,
  });

  tempVec.copy(this.cake.position);
  tempVec.setY(tempVec.y + 0.25);

  this.blowTrigger = createCylinderTrigger({
    halfHeight: 0.1,
    position: tempVec.clone(),
    radius: 0.16,
  });

  this.scene.add(birthdayGltf.scene);

  showText("Pick up the paddle and blow out the candles with it!", 10);
}

function update(dt) {
  setEmitterPos(this.paddleEmitter, this.paddle.position);

  if (this.paddleEmitter.running) {
    ambLight.intensity = 0;

    this.lampLight.intensity = 0;

    this.candleLight.intensity = Math.random() * 0.3 + 0.5;
    this.candleLight.position.copy(this.paddleEmitter.pos);
    this.candleLight.position.y += 0.2;

    if (!isTextVisible()) {
      this.isDone = true;
    }
  } else {
    this.candleLight.intensity = Math.random() * 0.3 + 2;
  }

  for (const event of drainTriggerEvents(this.blowTrigger)) {
    if (!event.isEnterEvent) {
      continue;
    }

    this.paddle.userData.blowCount += 1;

    if (this.paddle.userData.blowCount >= 5) {
      showText("Dad: Nice going, son! Cindy, get the water!", 5);

      for (const fire of this.candleFires) {
        fire.visible = false;
      }

      startEmitter(this.paddleEmitter);
    }
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
  // Put it back in its place
  this.paddle.position.copy(this.paddle.userData.initPos);

  clearPhysics();
  clearParticles();

  ambLight.intensity = 1;
}

export default function () {
  return createSlice({
    name: "Happy birthday",
    setup,
    update,
    teardown,
  });
}
