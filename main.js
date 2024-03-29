// This file serves as one big main function

// A series of vignettes that are funny-but-sad.

import { init as initRenderer, renderer } from "./renderer.js";
import { init as initScene, scene, camera } from "./scene.js";
import { init as initInput, update as updateInput } from "./input.js";
import {
  getReferenceSpace,
  init as initPlayer,
  update as updatePlayer,
} from "./player.js";
import {
  init as initAssets,
  update as updateAssets,
  onAllLoaded,
  allLoaded,
} from "./assets.js";
import { init as initPhysics, update as updatePhysics } from "./physics.js";
import { init as initSlices, update as updateSlices } from "./slices.js";
import { update as updateGrabbables } from "./grabbables.js";
import { update as updateText } from "./text.js";
import { update as updateParticles } from "./particles.js";

initPhysics();
initRenderer();
initScene();
initInput();
initPlayer();
initAssets();

onAllLoaded(() => {
  initSlices();
});

let lastTS = 0;

const maxDt = 0.04;

let frames = 0;
let timeSinceLastLoggedFrames = 0;

function animate(ts) {
  ts /= 1000;

  const dt = Math.min(ts - lastTS, maxDt);
  lastTS = ts;

  frames += 1;
  timeSinceLastLoggedFrames += dt;

  if (timeSinceLastLoggedFrames >= 1) {
    console.log("FPS: ", frames);
    frames = 0;
    timeSinceLastLoggedFrames -= 1;
  }

  updateAssets();

  renderer.xr.setReferenceSpace(getReferenceSpace());

  if (!allLoaded()) {
    return;
  }

  updateSlices(dt);
  updateInput();
  updateGrabbables();
  updatePlayer(dt);
  updateText(dt);
  updateParticles(dt);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
setInterval(updatePhysics, 1000 / 60);
