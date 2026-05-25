import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { AlignmentResult } from '../types';

// Color of the bounding box wireframe lines (hoisted to avoid re-creation on every render)
const WIREFRAME_COLOR = new THREE.Color('#818cf8');

interface BoundingBoxProps {
  boundsData: AlignmentResult;
  loadedObject: THREE.Object3D;
}

/**
 * BoundingBox - Component that renders a wireframe bounding box aligned
 * to the loaded 3D model's transform.
 */
export const BoundingBox: React.FC<BoundingBoxProps> = ({
  boundsData,
  loadedObject,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Sync group transformation with the model on every render frame
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(loadedObject.position);
      groupRef.current.rotation.copy(loadedObject.rotation);
    }
  });

  return (
    <group ref={groupRef}>
      <box3Helper args={[boundsData.localBox, WIREFRAME_COLOR]} />
    </group>
  );
};

export default BoundingBox;
