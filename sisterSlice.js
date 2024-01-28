import * as THREE from "three";
import createSlice from "./sliceCreator.js";
import { roomGltf, doorGltf } from "./assets.js";

function setup() {
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  this.cube = new THREE.Mesh(geom, material);
  this.cube.position.set(0, 1, 5);

  this.scene.add(this.cube);

  this.room = roomGltf.scene;
  this.room.position.set(0, 0.02, 0);

  this.door = doorGltf.scene;
  this.door.position.set(-5.02, 0.02, 0.72);

  const bbox = new THREE.Box3().setFromObject(this.door);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  // this.door.position.set(0, 0.02, -0.5 * size.z);

  const lightbulb = this.room.getObjectByName("RoomLightbulb");
  lightbulb.intensity = 500;

  this.ground = this.room.getObjectByName("Ground");
  this.scene.add(this.room);
  this.scene.add(this.door);
}

function update(dt) {
  this.cube.rotateY(dt);
  this.door.rotateY(dt);
}

export default function () {
  return createSlice({
    name: "Save your sister",
    setup,
    update,
  });
}
