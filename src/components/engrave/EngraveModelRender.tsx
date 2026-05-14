import { useMemo, useEffect, Suspense } from 'react';
import { observer } from 'mobx-react-lite';
import { Float32BufferAttribute } from 'three';
import * as THREE from 'three';
import { sceneStore } from '../../stores/SceneStore';
import { generateTextHeightMap, convertHeightToNormalMap } from '../../utils/normalUtils';
import { useGLTF, Environment, Center, ContactShadows, CameraControls, Clone } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import Loader from '../Loader/Loader';

import { rootStore } from '../../managers/stateManager';

const EngraveModelContent = observer(() => {
    const { designManager } = rootStore;
    const url = designManager.selectedModelUrl;
    const { nodes, scene } = useGLTF(url) as any;

    // 1. Generate maps and apply Wrapping/Repeat settings immediately
    const { normalTexture, aoTexture } = useMemo(() => {
        const heightCanvas = generateTextHeightMap({
            text: sceneStore.engraving || 'Empty',
            mode: 'engrave',
            blur: 0.01,
            offsetY: -60
        });

        const normalCanvas = convertHeightToNormalMap(heightCanvas, 2.0);

        const nTex = new THREE.CanvasTexture(normalCanvas);
        const aoTex = new THREE.CanvasTexture(heightCanvas);

        const repX = -1;
        const repY = 1;
        nTex.wrapS = THREE.RepeatWrapping;
        nTex.wrapT = THREE.RepeatWrapping;
        nTex.repeat.set(repX, repY);

        // Normal maps must be in linear color space to work correctly
        nTex.colorSpace = THREE.NoColorSpace;

        aoTex.wrapS = THREE.RepeatWrapping;
        aoTex.wrapT = THREE.RepeatWrapping;
        aoTex.repeat.set(repX, repY);
        aoTex.colorSpace = THREE.NoColorSpace;

        return { normalTexture: nTex, aoTexture: aoTex };
    }, [sceneStore.engraving]);

    // 2. Add UV2 to the loaded GLB Geometry
    useEffect(() => {
        // Fix the GLB Ring Geometry
        const ringMesh = nodes['Engraving_Mesh'] as THREE.Mesh;
        if (ringMesh && ringMesh.geometry && ringMesh.geometry.attributes.uv && !ringMesh.geometry.attributes.uv2) {
            ringMesh.geometry.setAttribute(
                'uv2', 
                new Float32BufferAttribute(ringMesh.geometry.attributes.uv.array, 2)
            );
        }
    }, [nodes]);

    const materialPhysical = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: designManager.selectedColorHex,
        roughness: designManager.selectedFinish === 'polished' ? 0.2 : 0.75,
        metalness: 1.0,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(-1, -1),
        aoMap: aoTexture,
        aoMapIntensity: 1
    }), [designManager.selectedColorHex, designManager.selectedFinish, normalTexture, aoTexture]);

    const baseMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: designManager.selectedColorHex,
        roughness: designManager.selectedFinish === 'polished' ? 0.2 : 0.75,
        metalness: 1.0,
    }), [designManager.selectedColorHex, designManager.selectedFinish]);

    return (
        <Clone
            object={scene}
            rotation={[0, 0, 0]}
            inject={(node: any) => {
                if (node.isMesh) {
                    if (node.name === 'Engraving_Mesh') {
                        return <primitive object={materialPhysical} attach="material" />
                    }
                    // Apply base material to other metal parts
                    if (node.name.includes("Object") || node.name.includes("Circle")) {
                        return <primitive object={baseMaterial} attach="material" />
                    }
                }
            }}
        />
    );
});

const EngraveModelRender = observer(() => {
    return (
        <div className="w-full h-full bg-[#f8f7f2]">
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 35 }}>
                <color attach="background" args={["#f8f7f2"]} />
                <Suspense fallback={<Loader />}>
                    <Environment files={"/env/08.hdr"}
                        environmentIntensity={0.9}
                        environmentRotation={[0, 3.63, 0]}
                    />
                    <ambientLight intensity={sceneStore.ambientIntensity} />
                    <Center>
                        <EngraveModelContent />
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
                        truckSpeed={0}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
});

export default EngraveModelRender;
