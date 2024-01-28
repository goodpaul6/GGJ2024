import * as THREE from "three";
import RAPIER from "rapier";

let world = null;

const physicsLoadedHandlers = [];

const bodies = [];

const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempMatrix = new THREE.Matrix4();
const ONE = new THREE.Vector3(1, 1, 1);

export const BODY_TYPE_DYNAMIC = 0;
export const BODY_TYPE_POSN_KINEMATIC = 1;

export const DEBUG_MODE = true;

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
  body.setTranslation(pos.clone(), false);
  body.setLinvel(new THREE.Vector3(), false);
  body.setAngvel(new THREE.Vector3(), false);
}

export function numColliders(body) {
  return body.numColliders();
}

export function setBodySensor({ body, colliderIndex = 0, name, isSensor }) {
  if (colliderIndex < 0 || colliderIndex >= body.numColliders()) {
    throw new Error(
      "Invalid collider index. Make sure to attach a collider and make sure the index you provide is valid."
    );
  }

  const collider = body.collider(colliderIndex);

  const wasSensor = collider.isSensor();
  if (wasSensor === isSensor) {
    return;
  }

  collider.setSensor(isSensor);

  if (!wasSensor && isSensor) {
    const sensors = body.userData?.sensors ?? [];
    sensors.push({
      collider,
      name,
    });

    body.userData = {
      ...body.userData,
      sensors,
      sensorEvents: body.userData?.sensorEvents ?? [],
      intersections: [],
    };
  } else if (wasSensor && !isSensor) {
    body.userData.sensors.remove(
      body.userData.sensors.find((s) => s.name === name)
    );
  }
}

function createSensorEvent({
  sensorName,
  isEnterEvent = false,
  isExitEvent = false,
  otherBody,
}) {
  return {
    sensorName,
    isEnterEvent,
    isExitEvent,
    otherBody,
  };
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

const DEBUG_BOX = new THREE.BoxGeometry(1, 1, 1);
const DEBUG_CYLINDER = new THREE.CylinderGeometry(1, 1, 1);
const DEBUG_CAPSULE = new THREE.CapsuleGeometry(1, 1);

export function forEachBody(fn) {
  bodies.forEach(fn);
}

export function drainSensorEvents(body) {
  if (!body.userData?.sensors?.length) {
    throw new Error(
      "This body isn't even a sensor dawg. Use setBodySensor to set it up as one."
    );
  }

  const events = body.userData.sensorEvents.slice();
  body.userData.sensorEvents.length = 0;

  return events;
}

export function update() {
  if (!world) {
    return;
  }

  for (const body of bodies) {
    const sensors = body.userData?.sensors;

    if (!sensors?.length) {
      continue;
    }

    // We have an abstraction over Rapier's low-level intersection system to
    // surface events for bodies that enter and exit collision.
    //
    // Since the physics step is different from the XR step, we let the user
    // handle the events whenever they want, and queue them up here.
    for (const { collider, name: sensorName } of sensors) {
      const prevIntersections = body.userData.intersections.slice();
      body.userData.intersections.length = 0;

      world.intersectionsWith(collider, (otherCollider) => {
        const otherBody = collider.parent();

        body.userData.intersections.push(otherBody);

        if (prevIntersections.includes(otherBody)) {
          return;
        }

        // We just started colliding with this, so queue up an enter event
        body.userData.sensorEvents.push(
          createSensorEvent({
            isEnterEvent: true,
            otherBody,
            sensorName,
          })
        );
      });

      for (const prevIntersection of prevIntersections) {
        if (body.userData.intersections.includes(prevIntersection)) {
          continue;
        }

        // This other body stopped intersecting with us
        body.userData.sensorEvents.push(
          createSensorEvent({
            isExitEvent: true,
            otherBody: prevIntersection,
            sensorName,
          })
        );
      }
    }
  }

  if (DEBUG_MODE) {
    for (const body of bodies) {
      if (body.obj) {
        updateObjectFromBody(body.obj, body);
        continue;
      }

      body.obj = new THREE.Object3D();

      for (let i = 0; i < body.numColliders(); ++i) {
        const collider = body.collider(i);
        const shape = collider.shape;

        // This is in world space, so we use the inverse of the parent body's
        // transform to get the collider's pos in local space
        const colliderTranslation = collider.translation();

        tempVec.copy(body.translation());
        tempQuat.copy(body.rotation());

        tempMatrix.compose(tempVec, tempQuat, ONE);
        tempMatrix.invert();

        const localPos = new THREE.Vector3()
          .copy(colliderTranslation)
          .applyMatrix4(tempMatrix);

        if (shape instanceof RAPIER.Cuboid) {
          const mesh = new THREE.Mesh(DEBUG_BOX, DEBUG_MATERIAL);

          mesh.position.copy(localPos);

          mesh.scale.set(
            shape.halfExtents.x * 2,
            shape.halfExtents.y * 2,
            shape.halfExtents.z * 2
          );

          body.obj.add(mesh);
        } else if (shape instanceof RAPIER.Cylinder) {
          const mesh = new THREE.Mesh(DEBUG_CYLINDER, DEBUG_MATERIAL);

          mesh.position.copy(localPos);
          mesh.scale.set(shape.radius, shape.halfHeight * 2, shape.radius);

          body.obj.add(mesh);
        } else if (shape instanceof RAPIER.Capsule) {
          const mesh = new THREE.Mesh(DEBUG_CAPSULE, DEBUG_MATERIAL);

          mesh.position.copy(localPos);
          mesh.scale.set(shape.radius, shape.halfHeight * 2, shape.radius);

          body.obj.add(mesh);
        }
      }
    }
  }

  world.timestep = clock.getDelta();
  world.step();
}
