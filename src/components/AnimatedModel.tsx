import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { AlignmentResult } from '../types';
import { BoundingBox } from './BoundingBox';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../managers/stateManager';

interface AnimatedModelProps {
  loadedObject: THREE.Object3D;
  boundsData: AlignmentResult;
}

export const AnimatedModel = observer(({
  loadedObject,
  boundsData,
}: AnimatedModelProps) => {
  const animationProgressRef = useRef(0);

  // Target rotation angles (matching alignment parameters)
  const targetX = -Math.PI / 4;
  const targetY = -Math.PI / 10;
  const targetZ = Math.PI / 3;

  useEffect(() => {
    // Reset animation progress
    animationProgressRef.current = 0;

    // Start with a full 360-degree rotation offset around Y-axis for spin effect (opposite direction)
    loadedObject.rotation.set(0, 0, 0);
    loadedObject.updateMatrixWorld(true);
  }, [loadedObject]);

  // Reset animation progress when returning to home view from engrave view
  useEffect(() => {
    if (rootStore.designManager.currentView !== 'engrave') {
      animationProgressRef.current = 0;
    }
  }, [rootStore.designManager.currentView]);

  useFrame((_, delta) => {
    // If in engrave mode, let the engraving rotation take over
    if (rootStore.designManager.currentView === 'engrave') {
      return;
    }

    if (animationProgressRef.current >= 1) {
      // Ensure it stays at target rotation
      loadedObject.rotation.set(targetX, targetY, targetZ);
      loadedObject.updateMatrixWorld(true);
      return;
    }

    // Increment progress (animates over ~2s with multiplier 0.5)
    animationProgressRef.current += delta * 0.5;

    if (animationProgressRef.current >= 1) {
      animationProgressRef.current = 1;
      loadedObject.rotation.set(targetX, targetY, targetZ);
    } else {
      // Use smoothstep for a natural deceleration curve
      const t = THREE.MathUtils.smoothstep(animationProgressRef.current, 0, 1);
      const currentY = targetY + Math.PI * 2 * (1 - t);
      loadedObject.rotation.set(targetX, currentY, targetZ);
    }
    loadedObject.updateMatrixWorld(true);
  });

  return (
    <group>
      {/* Render the model itself */}
      <primitive object={loadedObject} />

      {/* Render the bounding box statically as a sibling */}
      <BoundingBox
        boundsData={boundsData}
        loadedObject={loadedObject}
      />
    </group>
  );
});
export default AnimatedModel;
