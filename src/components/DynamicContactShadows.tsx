import React, { useRef } from 'react';
import * as THREE from 'three';
import { observer } from 'mobx-react-lite';
import { ContactShadows } from '@react-three/drei';
import { rootStore } from '../managers/stateManager';

interface Props {
    children: React.ReactNode;
}

export const DynamicContactShadows = observer(({ children }: Props) => {
    const groupRef = useRef<THREE.Group>(null);
    const { designManager } = rootStore;
    const minY = designManager.modelMinY;

    return (
        <>
            <group ref={groupRef}>
                {children}
            </group>

            <ContactShadows
                position={[0, minY - 0.02, 0]}
                opacity={0.45}
                scale={4}
                blur={2.5}
                far={3}
            />
        </>
    );
});

export default DynamicContactShadows;
