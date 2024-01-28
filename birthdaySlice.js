import createSlice from "./sliceCreator.js";
import { birthdayGltf } from "./assets.js";
import { setWorldPos } from "./player.js";

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

  this.scene.add(birthdayGltf.scene);
}

function update(dt) {
  this.candleLight.intensity = Math.random() * 0.2 + 1;

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
