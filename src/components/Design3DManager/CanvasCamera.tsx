import React, { useEffect, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import CameraController from './CameraController';
import CameraTransitionController from './CameraTransitionController';
import { CameraControls } from '@react-three/drei';

export const CanvasCamera = observer(() => {
    const { camera } = useThree();

    // State to trigger re-renders when the camera controls are loaded
    const [controls, setControls] = useState<CameraControls | null>(null);

    // Custom ref object to update the state when ref is assigned
    const cameraControlsRef = useMemo(() => ({
        get current() {
            return controls;
        },
        set current(value) {
            setControls(value);
        }
    }), [controls]);

    // Apply default camera settings (position and fov)
    useEffect(() => {
        if (camera) {
            if ('fov' in camera) {
                (camera as THREE.PerspectiveCamera).fov = 30;
            }
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    return (
        <>
            <CameraController cameraRef={cameraControlsRef} />
            <CameraTransitionController controls={controls} />
        </>
    );
});

export default CanvasCamera;
