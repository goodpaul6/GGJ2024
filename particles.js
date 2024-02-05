import * as THREE from "three";

import { scene } from "./scene.js";

let emitters = [];

const tempVec = new THREE.Vector3();
const tempColor = new THREE.Color();
const tempMat = new THREE.Matrix4();

export function createParticleEmitter({
  geometry,
  material,
  timeBetweenEmissions,
  minEmitCount,
  maxEmitCount,
  lifeMinSeconds,
  lifeMaxSeconds,
  velMinVec,
  velMaxVec,
  emitRadius,
  maxParticles,
  // These take in two arguments time t from 0 to 1 (increasing) and
  // a vec/color respectively that should be assigned to
  scaleForT = null,
  colorForT = null,
  pos,
}) {
  const e = {
    timeBetweenEmissions,
    minEmitCount,
    maxEmitCount,
    lifeMinSeconds,
    lifeMaxSeconds,
    velMinVec,
    velMaxVec,
    emitRadius,
    pos: pos.clone(),
    scaleForT,
    colorForT,
    running: false,
    timeSinceLastEmit: 0,
    iMesh: new THREE.InstancedMesh(geometry, material, maxParticles),
    particles: [],
    isMarkedForRemoval: false,
  };

  scene.add(e.iMesh);

  // Initially the count is 0
  e.iMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  e.iMesh.count = 0;
  e.iMesh.frustumCulled = false;

  emitters.push(e);
  return e;
}

export function removeEmitter(emitter) {
  stopEmitter(emitter);
  emitter.isMarkedForRemoval = true;
}

export function clear() {
  for (const e of emitters) {
    e.iMesh.removeFromParent();
    e.iMesh.dispose();
  }

  emitters.length = 0;
}

export function setEmitterPos(emitter, pos) {
  emitter.pos.copy(pos);
}

export function startEmitter(emitter) {
  if (emitter.isMarkedForRemoval) {
    throw new Error("Cannot start an emitter that you attempted to remove.");
  }

  emitter.running = true;
  emitter.timeSinceLastEmit = 0;
}

export function stopEmitter(emitter) {
  emitter.running = false;
}

function createParticle({ emitter, pos, vel, lifeSeconds }) {
  const p = {
    emitter,
    pos,
    vel,
    lifeSeconds,
    initLifeSeconds: lifeSeconds,
  };

  emitter.particles.push(p);

  return p;
}

export function update(dt) {
  emitters = emitters.filter((e) => {
    if (!e.isMarkedForRemoval) {
      return true;
    }

    // Remove the emitter only once all its particles are gone (otherwise, because
    // we remove the iMesh, those particles will disappear too).
    if (e.particles.length > 0) {
      return true;
    }

    e.iMesh.removeFromParent();
    return false;
  });

  for (const e of emitters) {
    if (!e.running) {
      return;
    }

    e.timeSinceLastEmit += dt;

    if (e.timeSinceLastEmit < e.timeBetweenEmissions) {
      continue;
    }

    e.timeSinceLastEmit = 0;

    const count = Math.floor(
      e.minEmitCount + (e.maxEmitCount - e.minEmitCount) * Math.random()
    );

    for (let i = 0; i < count; ++i) {
      const vx =
        e.velMinVec.x + (e.velMaxVec.x - e.velMinVec.x) * Math.random();
      const vy =
        e.velMinVec.y + (e.velMaxVec.y - e.velMinVec.y) * Math.random();
      const vz =
        e.velMinVec.z + (e.velMaxVec.z - e.velMinVec.z) * Math.random();

      tempVec.randomDirection();
      tempVec.multiplyScalar(e.emitRadius);

      const lifeSeconds =
        e.lifeMinSeconds +
        (e.lifeMaxSeconds - e.lifeMinSeconds) * Math.random();

      createParticle({
        emitter: e,
        lifeSeconds,
        pos: new THREE.Vector3(
          e.pos.x + tempVec.x,
          e.pos.y + tempVec.y,
          e.pos.z + tempVec.z
        ),
        vel: new THREE.Vector3(vx, vy, vz),
      });
    }
  }

  for (const e of emitters) {
    e.particles = e.particles.filter((p) => p.lifeSeconds > 0);

    e.iMesh.count = e.particles.length;

    for (const [i, p] of e.particles.entries()) {
      p.lifeSeconds -= dt;

      tempVec.copy(p.vel);
      tempVec.multiplyScalar(dt);

      p.pos.add(tempVec);

      const t = 1 - p.lifeSeconds / p.initLifeSeconds;

      if (e.scaleForT) {
        e.scaleForT(t, tempVec);
      } else {
        tempVec.setScalar(1);
      }

      tempMat.compose(p.pos, new THREE.Quaternion(), tempVec);

      p.emitter.iMesh.setMatrixAt(i, tempMat);

      if (e.colorForT) {
        e.colorForT(t, tempColor);
        p.emitter.iMesh.setColorAt(i, tempColor);
      }
    }
  }

  for (const e of emitters) {
    e.iMesh.instanceMatrix.needsUpdate = true;
    if (e.iMesh.instanceColor) {
      e.iMesh.instanceColor.needsUpdate = true;
    }
  }
}
