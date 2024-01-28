import { isInVr } from "./renderer.js";
import createSlice from "./sliceCreator.js";

function setup() {}

function update(dt) {
  if (isInVr()) {
    this.isDone = true;
  }
}
export default function () {
  return createSlice({
    name: "Welcome",
    setup,
    update,
  });
}
