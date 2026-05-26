import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import { rootStore } from '../../managers/stateManager';
import CameraController from './CameraController';
import { CameraControls } from '@react-three/drei';

export const CanvasCamera = observer(() => {
    const { designManager } = rootStore;
    const { camera } = useThree();
    
    // State to trigger re-renders when the camera controls are loaded
    const [controls, setControls] = useState<CameraControls | null>(null);
    const [minDistance, setMinDistance] = useState(5);
    const isFirstTimeRef = useRef(true);

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
            camera.position.set(0, 0, 8);
            if ('fov' in camera) {
                (camera as THREE.PerspectiveCamera).fov = 35;
            }
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    // Handle transition between home view and engrave view
    useEffect(() => {
        if (!controls) return;

        const animate = !isFirstTimeRef.current;
        isFirstTimeRef.current = false;

        if (designManager.currentView === 'engrave') {
            // Allow closer zoom first, then transition camera instantly
            setMinDistance(1);
            controls.setLookAt(3.5, 3.0, 0, -0.5, -0.5, 0, false);
        } else {
            // transition back to home first, then restore minDistance to prevent snapping
            if (animate) {
                controls.setLookAt(0, 0, 8, 0, 0, 0, true).then(() => {
                    if (designManager.currentView === 'home') {
                        setMinDistance(5);
                    }
                });
            } else {
                controls.setLookAt(0, 0, 8, 0, 0, 0, false);
                setMinDistance(5);
            }
        }
    }, [designManager.currentView, controls]);

    return (
        <CameraController cameraRef={cameraControlsRef} minDistance={minDistance} />
    );
});

export default CanvasCamera;
