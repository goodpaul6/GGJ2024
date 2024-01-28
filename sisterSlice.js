import * as THREE from "three";
import createSlice from "./sliceCreator.js";
import { roomGltf, doorGltf, sisterGltf } from "./assets.js";
import { addToGrabbables } from "./grabbables.js";
import { setWorldPos } from "./player.js";
import { showText } from "./text.js";

function setup() {
  // Set y pos to 0.5 to make yourself a lil taller
  setWorldPos(0, 0.5, 0);
  this.room = roomGltf.scene;
  this.room.position.set(0, 0.02, 0);

  this.sister = sisterGltf.scene;
  this.sister.position.set(-5.79, 0.02, 0);
  this.sister.rotation.set(0, -1, 0);

  this.door = doorGltf.scene;
  this.door.position.set(-5.02, 0.02, 0.72);

  this.door.userData.closed = true;
  this.door.userData.fullyOpened = false;
  this.door.maxRotation = -1.518;

  this.handle = this.door.getObjectByName("Handle");
  this.handle.updateMatrixWorld(true);
  addToGrabbables(this.handle);

  const bbox = new THREE.Box3().setFromObject(this.door);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  // this.door.position.set(0, 0.02, -0.5 * size.z);

  const lightbulb = this.room.getObjectByName("RoomLightbulb");
  lightbulb.intensity = 500;

  this.ground = this.room.getObjectByName("Ground");

  this.scene.add(this.room);
  this.scene.add(this.door);
  this.scene.add(this.sister);

  showText("Save your sister from the closet!", 5);
}

function update(dt) {
  if (this.timerBeforeNextFun) {
    this.timerBeforeNextFun -= dt;
    if (this.timerBeforeNextFun < 0) {
      this.nextFun();
    }
  }

  // Door logic
  if (
    !this.door.userData.closed &&
    this.door.rotation.y > this.door.maxRotation
  ) {
    this.door.rotateY(-dt);
  }
  if (
    !this.door.userData.isFullyOpened &&
    this.door.rotation.y > this.door.maxRotation
  ) {
    this.door.userData.isFullyOpened;
    this.timerBeforeNextFun = 5;
    this.nextFun = () => {
      showText('Sister: "You\'re adopted!"', 3);
      this.timerBeforeNextFun = 3;
      this.nextFun = () => {
        this.isDone = true;
        this.timerBeforeNextFun = null;
        this.nextFun = null;
      };
    };
  }
  if (this.handle.userData.isGrabbed) {
    this.door.userData.closed = false;
  }
}

export default function () {
  return createSlice({
    name: "Save your sister",
    setup,
    update,
  });
}
