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

            {/* Status UI Overlay - positioned as a floating card */}
            <div className="absolute top-8 right-8 z-10 p-6 bg-white/40 backdrop-blur-[20px] rounded-[1.25rem] border border-white/50 text-black shadow-[0_10px_40px_rgba(0,0,0,0.05)] pointer-events-auto font-sans">
                <div className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1rem] text-black/50 mb-4">
                    <span className="w-2 h-2 bg-[#16a34a] rounded-full shadow-[0_0_10px_rgba(22,163,74,0.3)] animate-[pulse-ring_1.25s_cubic-bezier(0.215,0.61,0.355,1)_infinite]"></span>
                    Rendering Active
                </div>
                <div className="flex gap-8 flex-wrap">
                    <div className="flex flex-col">
                        <label className="block text-[0.7rem] text-black/40 mb-1">Collection</label>
                        <span className="text-[1rem] font-semibold text-black">{collection}</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-[0.7rem] text-black/40 mb-1">Model ID</label>
                        <span className="text-[1rem] font-semibold text-black">#{modelId}</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-[0.7rem] text-black/40 mb-1">Variation</label>
                        <span className="text-[1rem] font-semibold text-black">{variation}</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-[0.7rem] text-black/40 mb-1">Color</label>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${color === 'gold' ? 'bg-[linear-gradient(135deg,#bf953f,#fcf6ba,#aa771c)]' :
                                color === 'silver' ? 'bg-[linear-gradient(135deg,#707070,#ffffff,#909090)]' : 'bg-gray-400'
                                }`}></div>
                            <span className="text-[1rem] font-semibold text-black">{color}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ModelRender;
