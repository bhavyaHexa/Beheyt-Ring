import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { observer } from 'mobx-react-lite';
import { ContactShadows } from '@react-three/drei';
import { rootStore } from '../../managers/stateManager';

import { useFrame } from '@react-three/fiber';

interface Props {
    children: React.ReactNode;
}

export const DynamicContactShadows = observer(({ children }: Props) => {
    const groupRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Group>(null);
    const { designManager } = rootStore;
    const minY = designManager.modelMinY;

    const view = designManager.currentView;
    console.log(view);

    useFrame(() => {
        if (shadowRef.current) {
            shadowRef.current.traverse((node) => {
                if ((node as any).isMesh) {
                    const mesh = node as THREE.Mesh;
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((m) => {
                            if (m.toneMapped !== false) {
                                m.toneMapped = false;
                                m.needsUpdate = true;
                            }
                        });
                    } else if (mesh.material) {
                        if (mesh.material.toneMapped !== false) {
                            mesh.material.toneMapped = false;
                            mesh.material.needsUpdate = true;
                        }
                    }
                }
            });
        }
    });


    return (
        <>
            <group ref={groupRef}>
                {children}
            </group>
            {view === "home" && (
                <group ref={shadowRef}>
                    <ContactShadows
                        position={[0, minY - 0.02, 0]}
                        opacity={0.45}
                        scale={4}
                        blur={2.5}
                        far={3}
                    />
                </group>
            )}
        </>
    );
});


export default DynamicContactShadows;
