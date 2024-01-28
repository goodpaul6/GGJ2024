import { scene } from "./scene.js";
import sisterSliceMaker from "./sisterSlice.js";

const sliceMakers = [];

let currentSliceIndex = 0;
let currentSlice = null;

export function init() {
  sliceMakers.push(sisterSliceMaker);
}

export function update(dt) {
  if (sliceMakers.length === 0) {
    return;
  }

  if (!currentSlice) {
    currentSlice = sliceMakers[currentSliceIndex]();
  }

  if (!currentSlice.isSetUp) {
    scene.add(currentSlice.scene);

    if (currentSlice.setup) {
      currentSlice.setup();
    }

    currentSlice.isSetUp = true;
  }

  if (currentSlice.update) {
    currentSlice.update(dt);
  }

  if (currentSlice.isDone) {
    // TODO(Apaar): Light switch transition
    scene.remove(currentSlice.scene);

    // Go to the next slice
    currentSliceIndex += 1;
    currentSliceIndex %= slices.length;
  }
}
