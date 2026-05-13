import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Environment, CameraControls, ContactShadows } from '@react-three/drei';
import { observer } from 'mobx-react-lite';

import Model3DContent from './Model3DContent';


const ModelRender = observer(() => {

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Main 3D Viewport - fills the background */}
            <div className="w-full h-full pointer-events-auto">
                <Canvas shadows camera={{ position: [0, 0, 10], fov: 35 }}>
                    <color attach="background" args={["#f8f7f2"]} />
                    <Suspense fallback={null}>
                        <Environment files={"/env/08.hdr"}
                            environmentIntensity={0.9}
                            environmentRotation={[0, 3.63, 0]}
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
