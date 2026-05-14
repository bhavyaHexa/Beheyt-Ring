import { useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Float32BufferAttribute } from 'three';
import * as THREE from 'three';
import { engraveManager } from '../../managers/engraveManager';
import { generateTextHeightMap, convertHeightToNormalMap } from '../../utils/normalUtils';
import { useGLTF } from '@react-three/drei';
import { BoundaryPointsEvaluator } from '../../utils/geometry/BoundaryPointsEvaluator';

import { rootStore } from '../../managers/stateManager'

const RedCube = observer(function RedCube() {

    const designManager = rootStore.designManager;

    const url = designManager.selectedModelUrl
    console.log(url)
    const { nodes } = useGLTF(url);
    console.log(nodes);

    // 1. Generate maps and apply Wrapping/Repeat settings immediately
    const { aoTexture } = useMemo(() => {
        const heightCanvas = generateTextHeightMap({
            text: engraveManager.engraving || 'E',
            mode: 'engrave',
            blur: 0.01,
            offsetY: -60
        });

        // const normalCanvas = convertHeightToNormalMap(heightCanvas, 2.0);

        // console.log(normalCanvas)

        // const nTex = new THREE.CanvasTexture(normalCanvas);
        // console.log(nTex)
        const aoTex = new THREE.CanvasTexture(heightCanvas);
        console.log(aoTex)

        const repX = -1;
        const repY = 1;
        // nTex.wrapS = THREE.RepeatWrapping;
        // nTex.wrapT = THREE.RepeatWrapping;
        // nTex.repeat.set(repX, repY);

        // Normal maps must be in linear color space to work correctly
        // nTex.colorSpace = THREE.NoColorSpace;

        aoTex.wrapS = THREE.RepeatWrapping;
        aoTex.wrapT = THREE.RepeatWrapping;
        aoTex.repeat.set(repX, repY);
        aoTex.colorSpace = THREE.NoColorSpace;

        return { aoTexture: aoTex };
    }, [engraveManager.engraving]);

    // 2. Add UV2 to the loaded GLB Geometry
    const ringMesh = nodes['Engraving_Mesh'] as THREE.Mesh;

    // useEffect(() => {
    //     // Fix the GLB Ring Geometry
    //     if (ringMesh && ringMesh.geometry && ringMesh.geometry.attributes.uv && !ringMesh.geometry.attributes.uv2) {
    //         ringMesh.geometry.setAttribute(
    //             'uv2', // Use 'uv1' if you are on Three.js r151 or newer
    //             new Float32BufferAttribute(ringMesh.geometry.attributes.uv.array, 2)
    //         );
    //     }
    // }, [nodes, ringMesh]); // Add nodes as dependency so it runs when GLTF loads

    const materialPhysical = new THREE.MeshPhysicalMaterial({
        color: 0xfcc266,
        roughness: 0.9,
        metalness: 0.1,
        // normalMap: normalTexture,
        // normalScale: new THREE.Vector2(-1, -1), // Try (1, 1) if the engraving looks inverted
        aoMap: aoTexture,
        aoMapIntensity: 1
    });

    // console.log(materialPhysical.normalMap)

    useEffect(() => {
        if (!ringMesh || !ringMesh.geometry) return; // guard: wait until mesh exists

        // Use the newly implemented BoundaryPointsEvaluator
        const evaluator = new BoundaryPointsEvaluator(ringMesh.geometry);
        const boundaryPoints = evaluator.getBoundaryPoints(true);
        
        console.log('Boundary Points for Engraving_Mesh:', boundaryPoints);
        
        // If you need recursive boundary loops:
        // const boundaryLoops = evaluator.getBoundaryPointsRecursive(true);
        // console.log('Boundary Loops:', boundaryLoops);

    }, [ringMesh]); // 👈 dependency is ringMesh — runs when mesh loads/changes

    if (!ringMesh) return null;

    return (
        <mesh
            material={materialPhysical}
            geometry={ringMesh.geometry}
        />
    );
});

export default RedCube;