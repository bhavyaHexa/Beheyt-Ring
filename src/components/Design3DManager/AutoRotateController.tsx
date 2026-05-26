import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import * as THREE from 'three';
import gsap from 'gsap';

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

    const rotationTweenRef = useRef<gsap.core.Tween | null>(null);

    // Handle user interaction
    useEffect(() => {
        const canvas = gl.domElement;

        const handleInteractionStart = () => {
            isInteractingRef.current = true;

            rotationTweenRef.current?.pause();

            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }
        };

        const handleInteractionEnd = () => {
            if (interactionTimeoutRef.current) {
                clearTimeout(interactionTimeoutRef.current);
            }

            interactionTimeoutRef.current = setTimeout(() => {
                isInteractingRef.current = false;
            }, 3000);
        };

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

            rotationTweenRef.current?.kill();
        };
    }, [gl]);

    // Handle auto rotation
    useEffect(() => {
        if (!groupRef.current) return;

        const group = groupRef.current;

        const isEngraveView = designManager.currentView === 'engrave';

        rotationTweenRef.current?.kill();

        // Auto Rotate
        if (
            designManager.autoRotate &&
            !isInteractingRef.current &&
            !isEngraveView
        ) {
            rotationTweenRef.current = gsap.to(group.rotation, {
                y: `+=${Math.PI * 2}`,
                duration: 20 / designManager.autoRotateSpeed,
                ease: 'none',
                repeat: -1,
            });
        } else {
            // Smooth reset to front
            rotationTweenRef.current = gsap.to(group.rotation, {
                y: 0,
                duration: 1,
                ease: 'power2.out',
            });
        }

        return () => {
            rotationTweenRef.current?.kill();
        };
    }, [
        designManager.autoRotate,
        designManager.autoRotateSpeed,
        designManager.currentView,
    ]);

    return (
        <group ref={groupRef}>
            {children}
        </group>
    );
});

export default AutoRotateController;