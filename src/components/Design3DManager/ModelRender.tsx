import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, CameraControls, ContactShadows } from '@react-three/drei';
import { observer } from 'mobx-react-lite';

import Model3DContent from './Model3DContent';
import Loader from '../Loader/Loader';
import EngraveModelViewer from '../engrave/EngraveModelViewer';
import { rootStore } from '../../managers/stateManager';

const ModelRender = observer(() => {
    const { designManager } = rootStore;

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main 3D Viewport - fills the background */}
            {designManager.currentView === 'home' && (
                <div className="w-full h-full pointer-events-auto">
                    <Canvas shadows camera={{ position: [0, 0, 8], fov: 35 }}>
                        <color attach="background" args={["#f8f7f2"]} />
                        <Suspense fallback={<Loader />}>
                            <Environment files={"/env/08.hdr"}
                                environmentIntensity={0.9}
                                environmentRotation={[0, 3.63, 0]}
                            />
                            <Center>
                                <Model3DContent />
                            </Center>
                            <ContactShadows
                                position={[0, -1, 0]}
                                opacity={0.5}
                                scale={4}
                                blur={4.5}
                                far={4}
                            />
                            <CameraControls
                                makeDefault
                                minDistance={5}
                                maxDistance={10}
                                minPolarAngle={0}
                                maxPolarAngle={Math.PI / 1.75}
                                smoothTime={0.25}
                                draggingSmoothTime={0.1}
                                dollySpeed={0.5}
                                truckSpeed={0} // Keep model centered by disabling panning
                            />
                        </Suspense>
                    </Canvas>
                </div>
            )}

            {/* UI Overlay for Engraving */}
            {designManager.currentView === 'engrave' && (
                <div className="absolute inset-0 pointer-events-auto">
                    <EngraveModelViewer />
                </div>
            )}
        </div>
    );
});

export default ModelRender;
