import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, ContactShadows } from '@react-three/drei';
import { observer } from 'mobx-react-lite';

import Model3DContent from './Model3DContent';
import Loader from '../Loader/Loader';
import EngraveModelViewer from '../engrave/EngraveModelViewer';
import EngraveModelRender from '../engrave/EngraveModelRender';
import { rootStore } from '../../managers/stateManager';

import DynamicContactShadows from './DynamicContactShadows';
import AutoRotateController from './AutoRotateController';
import CanvasCamera from './CanvasCamera';


const ModelRender = observer(() => {
    const { designManager } = rootStore;

    // We want the 3D viewport to be visible in both 'home' and 'engrave' views
    const isVisible = designManager.currentView === 'home' || designManager.currentView === 'engrave';

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main 3D Viewport - fills the background */}
            <div className={`w-full h-full pointer-events-auto ${!isVisible ? 'hidden' : ''}`}>
                <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
                    <color attach="background" args={["#f8f7f2"]} />
                    <Suspense fallback={<Loader />}>
                        <Environment files={"/env/08.hdr"}
                            environmentIntensity={0.7}
                            environmentRotation={[0, 3.63, 0]}
                        />

                        <DynamicContactShadows>
                            {/* <AutoRotateController> */}
                            <Model3DContent />
                            {designManager.currentView === 'engrave' && <EngraveModelRender />}
                            {/* </AutoRotateController> */}
                        </DynamicContactShadows>
                        <CanvasCamera />
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
