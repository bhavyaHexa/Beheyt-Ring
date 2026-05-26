import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';

interface ModelAnimationProps {
  loadedObject: THREE.Object3D;
}

export const ModelAnimation = observer(({
  loadedObject,
}: ModelAnimationProps) => {
  const { designManager } = rootStore;
  const currentView = designManager.currentView; // Track view changes via MobX observer
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Final showcase rotation (Home View)
    const homeRotation = {
      x: -Math.PI / 4,
      y: -Math.PI / 10,
      z: Math.PI / 3,
    };

    // Engrave view target rotation
    const engraveRotation = {
      x: homeRotation.x - 6.28,
      y: homeRotation.y - 1.23,
      z: homeRotation.z + 1.31,
    };

    // Kill any active animations before starting a new one
    if (tlRef.current) {
      tlRef.current.kill();
    }

    if (currentView === 'engrave') {
      // Set the engrave rotation, position, and scale instantly
      loadedObject.rotation.set(engraveRotation.x, engraveRotation.y, engraveRotation.z);
      loadedObject.position.set(0, 0, 0);
      loadedObject.scale.set(1, 1, 1);
      loadedObject.updateMatrixWorld(true);
    } else {
      const tl = gsap.timeline();
      tlRef.current = tl;

      // Check if this is the initial mount/load of the model
      const isInitial = loadedObject.userData.isInitialLoaded === undefined;
      
      if (isInitial) {
        loadedObject.userData.isInitialLoaded = true;

        // Set initial entry state
        loadedObject.rotation.set(0.2, -0.8, 0);
        loadedObject.position.set(0, -0.3, 0);
        loadedObject.scale.set(0.92, 0.92, 0.92);

        // Entry showcase animation: Rotate, rise, and scale up
        tl.to(loadedObject.rotation, {
          x: homeRotation.x,
          y: homeRotation.y,
          z: homeRotation.z,
          duration: 1.8,
          ease: 'power3.out',
        }, 0);

        tl.to(loadedObject.position, {
          y: 0,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);

        tl.to(loadedObject.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);
      } else {
        // Smoothly transition back to the home showcase position and rotation
        tl.to(loadedObject.rotation, {
          x: homeRotation.x,
          y: homeRotation.y,
          z: homeRotation.z,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);

        tl.to(loadedObject.position, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);

        tl.to(loadedObject.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);
      }
    }

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
      }
    };
  }, [loadedObject, currentView]);

  return null;
});

export default ModelAnimation;