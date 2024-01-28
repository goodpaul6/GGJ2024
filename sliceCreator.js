import * as THREE from "three";

export default function ({ name, setup, update, ...props }) {
  return {
    // Will hold all the objects for the slice
    scene: new THREE.Scene(),
    isSetUp: false,
    isDone: false,
    ...props,

    name,
    setup,
    update,
  };
}
