import * as THREE from 'three';
import type { AlignmentResult } from '../types';

/**
 * Computes the tight bounding box of an object in its parent's coordinate space.
 * 
 * @param object The 3D object to measure
 */
export function computeTightParentBounds(object: THREE.Object3D): THREE.Box3 {
  object.updateMatrixWorld(true);
  const parentBox = new THREE.Box3();
  const tempV = new THREE.Vector3();
  let hasVertices = false;

  const parent = object.parent;
  const inverseParentMatrix = parent 
    ? new THREE.Matrix4().copy(parent.matrixWorld).invert() 
    : new THREE.Matrix4(); // Identity if no parent

  const meshToParentMatrix = new THREE.Matrix4();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry?.attributes?.position) {
      const position = mesh.geometry.attributes.position;
      meshToParentMatrix.multiplyMatrices(inverseParentMatrix, mesh.matrixWorld);

      for (let i = 0; i < position.count; i++) {
        tempV.fromBufferAttribute(position, i);
        tempV.applyMatrix4(meshToParentMatrix);
        parentBox.expandByPoint(tempV);
        hasVertices = true;
      }
    }
  });

  if (!hasVertices) {
    parentBox.setFromObject(object);
    if (parent) {
      parentBox.applyMatrix4(inverseParentMatrix);
    }
  }

  return parentBox;
}

/**
 * Rotates an object and offsets its position so its center sits exactly at the world origin (0, 0, 0).
 * Calculates bounds and minY in local parent space.
 * 
 * @param object The 3D object to align
 * @param rx Rotation around X-axis in radians
 * @param ry Rotation around Y-axis in radians
 * @param rz Rotation around Z-axis in radians
 */
export function alignModelToOrigin(
  object: THREE.Object3D,
  rx: number = -Math.PI / 4,
  ry: number = -Math.PI / 10,
  rz: number = Math.PI / 3
): AlignmentResult {
  // 1. Reset rotation and position to default to ensure clean calculation (idempotency)
  object.rotation.set(0, 0, 0);
  object.position.set(0, 0, 0);
  object.updateMatrixWorld(true);

  // Calculate local bounding box of the unrotated object to get local size/dimensions
  const localBox = new THREE.Box3().setFromObject(object);
  const localCenter = new THREE.Vector3();
  localBox.getCenter(localCenter);
  const localSize = new THREE.Vector3();
  localBox.getSize(localSize);

  // Fallback for empty geometries
  if (localSize.length() === 0) {
    localSize.set(1, 1, 1);
    localBox.min.set(-0.5, -0.5, -0.5);
    localBox.max.set(0.5, 0.5, 0.5);
    localCenter.set(0, 0, 0);
  }

  // 2. Apply target rotation to the object (around its local origin, position still at 0)
  object.rotation.set(rx, ry, rz);
  object.updateMatrixWorld(true);

  // 3. Compute the tight bounding box of the rotated model in its parent/local space (position is still 0)
  const rotatedBox = computeTightParentBounds(object);
  const rotatedCenter = new THREE.Vector3();
  rotatedBox.getCenter(rotatedCenter);

  // Calculate minY and maxY in local space before the shift
  const localMinY = rotatedBox.min.y;
  const localMaxY = rotatedBox.max.y;

  // 4. Shift position so the rotated center sits exactly at (0, 0, 0)
  object.position.copy(rotatedCenter).negate();
  object.updateMatrixWorld(true);

  // 5. After shift, calculate final minY and maxY in the shifted coordinate system
  const minY = localMinY - rotatedCenter.y;
  const maxY = localMaxY - rotatedCenter.y;

  return {
    localBox,
    localCenter,
    localSize,
    rotatedCenterOffset: rotatedCenter,
    minY,
    maxY,
    rotatedBox,
  };
}
