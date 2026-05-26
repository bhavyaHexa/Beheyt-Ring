import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import { rootStore } from '../../managers/stateManager';
import CameraController from './CameraController';
import { CameraControls } from '@react-three/drei';

export const CanvasCamera = observer(() => {
    const { designManager } = rootStore;
    const { camera } = useThree();
    const cameraControlsRef = useRef<CameraControls>(null);

    // Apply default camera settings (position and fov)
    useEffect(() => {
        if (camera) {
            camera.position.set(0, 0, 8);
            if ('fov' in camera) {
                (camera as THREE.PerspectiveCamera).fov = 35;
            }
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    // Handle transition between home view and engrave view
    useEffect(() => {
        if (!cameraControlsRef.current) return;

        if (designManager.currentView === 'engrave') {
            // Move camera to the right side, looking at the left inner wall to center the text
            cameraControlsRef.current.setLookAt(3.5, 3.0, 0, -0.5, -0.5, 0, true);
        } else {
            // Smoothly reset camera to the default view
            cameraControlsRef.current.setLookAt(0, 0, 8, 0, 0, 0, true);
        }
    }, [designManager.currentView]);

    const minDistance = designManager.currentView === 'engrave' ? 1 : 5;

    return (
        <CameraController cameraRef={cameraControlsRef} minDistance={minDistance} />
    );
});

export default CanvasCamera;
