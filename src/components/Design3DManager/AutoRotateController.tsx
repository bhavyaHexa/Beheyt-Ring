import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import { rootStore } from '../../managers/stateManager';

interface AutoRotateControllerProps {
    children: React.ReactNode;
}

export const AutoRotateController = observer(({ children }: AutoRotateControllerProps) => {
    const { designManager } = rootStore;
    const groupRef = useRef<THREE.Group>(null);
    const { gl } = useThree();
    const isInteractingRef = useRef(false);
    const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
        const canvas = gl.domElement;

        const handleInteractionStart = () => {
            isInteractingRef.current = true;
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
        };

        const handleInteractionEnd = () => {
            // Add a small delay (e.g. 1.5s) before resuming rotation after user finishes dragging
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
            interactionTimeoutRef.current = setTimeout(() => {
                isInteractingRef.current = false;
            }, 3000);
        };

        // Listen to pointer events on the canvas
        canvas.addEventListener('pointerdown', handleInteractionStart);
        canvas.addEventListener('pointerup', handleInteractionEnd);
        canvas.addEventListener('pointerleave', handleInteractionEnd);
        canvas.addEventListener('touchstart', handleInteractionStart);
        canvas.addEventListener('touchend', handleInteractionEnd);

        return () => {
            canvas.removeEventListener('pointerdown', handleInteractionStart);
            canvas.removeEventListener('pointerup', handleInteractionEnd);
            canvas.removeEventListener('pointerleave', handleInteractionEnd);
            canvas.removeEventListener('touchstart', handleInteractionStart);
            canvas.removeEventListener('touchend', handleInteractionEnd);
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
        };
    }, [gl]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const isEngraveView = designManager.currentView === 'engrave';

        if (designManager.autoRotate && !isInteractingRef.current && !isEngraveView) {
            // Standard auto rotation speed
            const speed = designManager.autoRotateSpeed;
            groupRef.current.rotation.y += speed * delta;
        } else {
            // Damp back to 0 rotation if auto-rotate is disabled, user is interacting, or we are in engrave view
            // Wait: we only damp back to 0 if NOT interacting (otherwise user's orbit controls drag gets resisted by the lerp)
            // AND we only do it if autoRotate is off or if it is engrave view (so we align text to camera).
            // Let's refine this condition:
            if (!isInteractingRef.current && (!designManager.autoRotate || isEngraveView)) {
                if (groupRef.current.rotation.y !== 0) {
                    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
                    if (Math.abs(groupRef.current.rotation.y) < 0.001) {
                        groupRef.current.rotation.y = 0;
                    }
                }
            }
        }
    });

    return (
        <group ref={groupRef}>
            {children}
        </group>
    );
});

export default AutoRotateController;
