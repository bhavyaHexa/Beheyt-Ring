import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, CameraControls, ContactShadows } from '@react-three/drei';
import { observer } from 'mobx-react-lite';

import Model3DContent from './Model3DContent';
import Loader from '../Loader/Loader';
import EngraveModelViewer from '../engrave/EngraveModelViewer';
import EngraveModelRender from '../engrave/EngraveModelRender';
import { rootStore } from '../../managers/stateManager';

import GroundedModel from '../GroundedModel';
import AutoRotateController from './AutoRotateController';


const ModelRender = observer(() => {
    const { designManager } = rootStore;
    const cameraControlsRef = useRef<any>(null);

    // We want the 3D viewport to be visible in both 'home' and 'engrave' views
    const isVisible = designManager.currentView === 'home' || designManager.currentView === 'engrave';

    useEffect(() => {
        if (!cameraControlsRef.current) return;

        if (designManager.currentView === 'engrave') {
            // Move camera to the right side, looking at the left inner wall to center the text
            cameraControlsRef.current.setLookAt(3.5, 3.0, 0, -0.5, -0.5, 0, true);
        } else {
            // Smoothly reset camera to the default view
            cameraControlsRef.current.setLookAt(0, 0, 8, 0, 0, 0, true);
        }
    }, [designManager.currentView]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main 3D Viewport - fills the background */}
            <div className={`w-full h-full pointer-events-auto ${!isVisible ? 'hidden' : ''}`}>
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 35 }} gl={{ preserveDrawingBuffer: true }}>
                    <color attach="background" args={["#f8f7f2"]} />
                    <Suspense fallback={<Loader />}>
                        <Environment files={"/env/08.hdr"}
                            environmentIntensity={0.7}
                            environmentRotation={[0, 3.63, 0]}
                        />
                    
                        <GroundedModel>
                            <AutoRotateController>
                                <Model3DContent />
                                {designManager.currentView === 'engrave' && <EngraveModelRender />}
                            </AutoRotateController>
                        </GroundedModel>    
                        <CameraControls
                            ref={cameraControlsRef}
                            makeDefault
                            minDistance={designManager.currentView === 'engrave' ? 1 : 5}
                            maxDistance={10}
                            // minPolarAngle={0}
                            // maxPolarAngle={Math.PI / 1.75}
                            smoothTime={0.25}
                            draggingSmoothTime={0.1}
                            dollySpeed={0.5}
                            truckSpeed={0} // Keep model centered by disabling panning
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* UI Overlay for Engraving */}
            {designManager.currentView === 'engrave' && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <EngraveModelViewer />
                </div>
            )}
        </div>
    );
});

export default ModelRender;
