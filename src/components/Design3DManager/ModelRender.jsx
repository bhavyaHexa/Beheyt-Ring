import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Center, Environment, CameraControls, ContactShadows } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { useControls } from 'leva';
import * as THREE from 'three';
import { rootStore } from '../../managers/stateManager';
import Model3DContent from './Model3DContent';

// Helper component to sync environment rotation
const EnvironmentSync = ({ x, y, z }) => {
    const { scene } = useThree();

    useEffect(() => {
        if (scene) {
            // Convert degrees to radians and apply to scene environment rotation
            // Modern Three.js (used in this project) supports environmentRotation directly
            scene.environmentRotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
            );
            // Also sync background rotation just in case
            scene.backgroundRotation.set(
                THREE.MathUtils.degToRad(x),
                THREE.MathUtils.degToRad(y),
                THREE.MathUtils.degToRad(z)
            );
        }
    }, [scene, x, y, z]);

    return null;
};

const ModelRender = observer(() => {
    const { design3DManager } = rootStore;
    const { collection, modelId, variation, color, modelUrl } = design3DManager.activeModel;

    const { envRotationX, envRotationY, envRotationZ } = useControls("Environment", {
        envRotationX: {
            value: 0,
            min: 0,
            max: 360,
            step: 1,
            label: 'Rotation X (deg)'
        },
        envRotationY: {
            value: 0,
            min: 0,
            max: 360,
            step: 1,
            label: 'Rotation Y (deg)'
        },
        envRotationZ: {
            value: 0,
            min: 0,
            max: 360,
            step: 1,
            label: 'Rotation Z (deg)'
        }
    });

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main 3D Viewport - fills the background */}
            <div className="w-full h-full pointer-events-auto">
                <Canvas shadows camera={{ position: [0, 0, 10], fov: 35 }}>
                    <color attach="background" args={["#f8f7f2"]} />
                    <Suspense fallback={null}>
                        <EnvironmentSync x={envRotationX} y={envRotationY} z={envRotationZ} />
                        <Environment files={"/env/08.hdr"}
                            environmentIntensity={0.9}
                        />
                        <Center>
                            <Model3DContent />
                        </Center>
                        <ContactShadows
                            position={[0, -2, 0]}
                            opacity={0.6}
                            scale={10}
                            blur={2.5}
                            far={4.5}
                        />
                        <CameraControls makeDefault />
                    </Suspense>
                </Canvas>
            </div>


        </div>
    );
});

export default ModelRender;
