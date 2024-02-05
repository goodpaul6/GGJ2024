import * as THREE from "three";
import RAPIER from "rapier";

import { scene } from "./scene.js";

let world = null;

const physicsLoadedHandlers = [];

const bodies = [];

let triggers = [];

const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempMatrix = new THREE.Matrix4();
const ONE = new THREE.Vector3(1, 1, 1);

export const BODY_TYPE_DYNAMIC = 0;
export const BODY_TYPE_POSN_KINEMATIC = 1;

export const DEBUG_MODE = false;

export function init() {
  RAPIER.init().then(function () {
    world = new RAPIER.World(new THREE.Vector3(0, -9.8, 0));

    for (const handlerFn of physicsLoadedHandlers) {
      handlerFn();
    }
  });
}

export function onPhysicsLoaded(fn) {
  if (world) {
    fn();
  } else {
    physicsLoadedHandlers.push(fn);
  }
}

export function createEmptyBody({ position, quat = null, mass = 0 }) {
  const desc =
    mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
  desc.setTranslation(...position);
  if (quat !== null) {
    desc.setRotation(quat);
  }

  const body = world.createRigidBody(desc);
  bodies.push(body);

  return body;
}

export function createAndAttachCuboidCollider({
  body,
  hx,
  hy,
  hz,
  offset = null,
}) {
  const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz);
  if (offset !== null) {
    colliderDesc.setTranslation(...offset);
  }

  return world.createCollider(colliderDesc, body);
}

function createBody(position, quat, mass, colliderDesc) {
  const body = createEmptyBody({
    position,
    quat,
    mass,
  });

  world.createCollider(colliderDesc, body);

  return body;
}

export function removeBody(body) {
  world.removeRigidBody(body);
}

export function createCuboidBody({
  hx,
  hy,
  hz,
  position,
  quat = null,
  mass = 0,
  colliderOffset = null,
}) {
  const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz);

  if (colliderOffset !== null) {
    colliderDesc.setTranslation(...colliderOffset);
  }

  return createBody(position, quat, mass, colliderDesc);
}

export function createCylinderBody({
  halfHeight,
  radius,
  position,
  quat = null,
  mass = 0,
  colliderOffset = null,
}) {
  const colliderDesc = RAPIER.ColliderDesc.cylinder(halfHeight, radius);

  if (colliderOffset !== null) {
    colliderDesc.setTranslation(...colliderOffset);
  }

  return createBody(position, quat, mass, colliderDesc);
}

export function createCapsuleBody({
  halfHeight,
  radius,
  position,
  quat = null,
  mass = 0,
  colliderOffset = null,
}) {
  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius);

  if (colliderOffset !== null) {
    colliderDesc.setTranslation(...colliderOffset);
  }

  return createBody(position, quat, mass, colliderDesc);
}

export function updateObjectFromBody(mesh, body) {
  // TODO(Apaar): Handle instanced meshes
  mesh.position.copy(body.translation());
  mesh.quaternion.copy(body.rotation());
}

export function resetDynamicBodyToPos(body, pos) {
  body.setTranslation(pos.clone(), true);
  body.setLinvel(new THREE.Vector3(), true);
  body.setAngvel(new THREE.Vector3(), true);
}

function createTrigger({ shape, position, quat = null }) {
  const trigger = {
    shape,
    position: position.clone(),
    quat: quat?.clone() ?? new THREE.Quaternion(),
    events: [],
    intersectingBodies: [],
    isMarkedForRemoval: false,
    obj: null,
  };

  triggers.push(trigger);

  return trigger;
}

export function removeTrigger(trigger) {
  trigger.isMarkedForRemoval = true;
}

export function createCylinderTrigger({
  halfHeight,
  radius,
  position,
  quat = null,
}) {
  const shape = new RAPIER.Cylinder(halfHeight, radius);

  return createTrigger({
    shape,
    position,
    quat,
  });
}

export function drainTriggerEvents(trigger) {
  const events = trigger.events.slice();
  trigger.events.length = 0;

  return events;
}

export function setBodyType(body, type) {
  switch (type) {
    case BODY_TYPE_DYNAMIC:
      if (body.bodyType() !== RAPIER.RigidBodyType.Dynamic) {
        body.setBodyType(RAPIER.RigidBodyType.Dynamic);
      }
      break;
    case BODY_TYPE_POSN_KINEMATIC:
      if (body.bodyType() !== RAPIER.RigidBodyType.KinematicPositionBased) {
        body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased);
      }
      break;
  }
}

const DEBUG_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.15,
});

const TRIGGER_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.15,
});

const DEBUG_BOX = new THREE.BoxGeometry(1, 1, 1);
const DEBUG_CYLINDER = new THREE.CylinderGeometry(1, 1, 1);
const DEBUG_CAPSULE = new THREE.CapsuleGeometry(1, 1);

export function forEachBody(fn) {
  bodies.forEach(fn);
}

export function clear() {
  for (const body of bodies) {
    if (body.obj?.parent) {
      body.obj.removeFromParent();
    }

    world.removeRigidBody(body);
  }

  for (const trigger of triggers) {
    if (trigger.obj?.parent) {
      trigger.obj.removeFromParent();
    }
  }

  bodies.length = 0;
  triggers.length = 0;
}

function createTriggerEvent({
  isEnterEvent = false,
  isExitEvent = false,
  body,
}) {
  if (!isEnterEvent && !isExitEvent) {
    throw new Error("Must be either an enter or exit event!");
  }

  return {
    isEnterEvent,
    isExitEvent,
    body,
  };
}

function addSubObjectForShape({ obj, shape, translation, quat, material }) {
  if (shape instanceof RAPIER.Cuboid) {
    const mesh = new THREE.Mesh(DEBUG_BOX, material);

    mesh.position.copy(translation);
    mesh.quaternion.copy(quat);

    mesh.scale.set(
      shape.halfExtents.x * 2,
      shape.halfExtents.y * 2,
      shape.halfExtents.z * 2
    );

    obj.add(mesh);
  } else if (shape instanceof RAPIER.Cylinder) {
    const mesh = new THREE.Mesh(DEBUG_CYLINDER, material);

    mesh.position.copy(translation);
    mesh.quaternion.copy(quat);
    mesh.scale.set(shape.radius, shape.halfHeight * 2, shape.radius);

    obj.add(mesh);
  } else if (shape instanceof RAPIER.Capsule) {
    const mesh = new THREE.Mesh(DEBUG_CAPSULE, material);

    mesh.position.copy(translation);
    mesh.quaternion.copy(quat);
    mesh.scale.set(shape.radius, shape.halfHeight * 2, shape.radius);

    obj.add(mesh);
  }
}

function addObjToBody(body) {
  body.obj = new THREE.Object3D();

  for (let i = 0; i < body.numColliders(); ++i) {
    const collider = body.collider(i);

    // This is in world space, so we use the inverse of the parent body's
    // transform to get the collider's pos in local space
    const colliderTranslation = collider.translation();

    tempVec.copy(body.translation());
    tempQuat.copy(body.rotation());

    tempMatrix.compose(tempVec, tempQuat, ONE);
    tempMatrix.invert();

    const translation = new THREE.Vector3()
      .copy(colliderTranslation)
      .applyMatrix4(tempMatrix);

    const shape = collider.shape;

    addSubObjectForShape({
      obj: body.obj,
      shape,
      translation,
      quat: new THREE.Quaternion(),
      material: DEBUG_MATERIAL,
    });
  }
}

function addObjToTrigger(trigger) {
  trigger.obj = new THREE.Object3D();
  trigger.obj.position.copy(trigger.position);
  trigger.obj.quaternion.copy(trigger.quat);

  addSubObjectForShape({
    obj: trigger.obj,
    shape: trigger.shape,
    translation: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    material: TRIGGER_MATERIAL,
  });
}

export function update() {
  if (!world) {
    return;
  }

  triggers = triggers.filter((t) => {
    if (!t.isMarkedForRemoval) {
      return true;
    }

    if (t.obj) {
      t.obj.removeFromParent();
    }
    return false;
  });

  for (const trigger of triggers) {
    const prevInt = trigger.intersectingBodies.slice();
    trigger.intersectingBodies.length = 0;

    world.intersectionsWithShape(
      trigger.position,
      trigger.quat,
      trigger.shape,
      (collider) => {
        const body = collider.parent();
        trigger.intersectingBodies.push(body);

        if (prevInt.includes(body)) {
          return;
        }

        // This body just started colliding with us
        trigger.events.push(
          createTriggerEvent({
            isEnterEvent: true,
            body,
          })
        );
      }
    );

    for (const prev of prevInt) {
      if (trigger.intersectingBodies.includes(prev)) {
        continue;
      }

      // This body is no longer colliding with this
      trigger.events.push(
        createTriggerEvent({
          body: prev,
          isExitEvent: true,
        })
      );
    }
  }

  if (DEBUG_MODE) {
    for (const body of bodies) {
      if (body.obj) {
        updateObjectFromBody(body.obj, body);
        continue;
      }

      addObjToBody(body);
      scene.add(body.obj);
    }

    for (const trigger of triggers) {
      if (trigger.obj) {
        trigger.obj.position.copy(trigger.position);
        trigger.obj.quaternion.copy(trigger.quat);
        continue;
      }

      addObjToTrigger(trigger);
      scene.add(trigger.obj);
    }
  }

  world.timestep = clock.getDelta();
  world.step();
}
