import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
    children: React.ReactNode;
}

const BBoxCenter = ({ children }: Props) => {
    const groupRef = useRef<THREE.Group>(null);

    console.log("groupRef.current", groupRef.current);
    useLayoutEffect(() => {
        if (!groupRef.current) return;

        // Compute bounding box
        const box = new THREE.Box3().setFromObject(groupRef.current);

        const center = new THREE.Vector3();

        box.getCenter(center);

        // Center horizontally
        groupRef.current.position.x = -center.x;
        groupRef.current.position.z = -center.z;

        // Place model on ground plane
        groupRef.current.position.y = -box.min.y;

    }, [children]);

    return (
        <group ref={groupRef}>
            {children}
        </group>
    );
};

export default BBoxCenter;