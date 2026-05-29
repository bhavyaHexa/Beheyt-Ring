import { useMemo, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Float32BufferAttribute } from 'three';
import * as THREE from 'three';
import { engraveManager } from '../../managers/engraveManager';
import { generateTextHeightMap, convertHeightToNormalMap } from '../../utils/normalUtils';
import { useGLTF } from '@react-three/drei';
import { rootStore } from '../../managers/stateManager';
import { useControls } from 'leva';
import BBoxEngrave from './BBoxEngrave';

const EngraveModelRender = observer(function EngraveModelRender() {

    const designManager = rootStore.designManager;

    const url = designManager.selectedModelUrl
    console.log(url)
    const { nodes, scene } = useGLTF(url);
    console.log(nodes);

    const { textOffsetX } = useControls('Engrave Controls', {
        textOffsetX: { value: 0, min: -1024, max: 1024, step: 1 },
    });

    // 1. Generate maps and apply Wrapping/Repeat settings immediately
    const { normalTexture, aoTexture, hCanvas } = useMemo(() => {
        const hCanvas = generateTextHeightMap({
            text: engraveManager.engraving || 'Empty',
            mode: 'engrave',
            blur: 0,
            offsetY: 0,
            offsetX: textOffsetX
        });

        const nCanvas = convertHeightToNormalMap(hCanvas, 2.0);

        const nTex = new THREE.CanvasTexture(nCanvas);
        const aoTex = new THREE.CanvasTexture(hCanvas);

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

        return { normalTexture: nTex, aoTexture: aoTex, hCanvas };
    }, [engraveManager.engraving, textOffsetX]);

    // Find the engraving mesh (either Engraving Mesh, Engraving Metal, Engraving_Mesh, or Engraving_Metal)
    const ringMesh = useMemo(() => {
        if (!nodes) return null;
        const targetNames = ['Engraving Mesh', 'Engraving Metal', 'Engraving_Mesh', 'Engraving_Metal'];
        for (const name of targetNames) {
            if (nodes[name] instanceof THREE.Mesh) {
                return nodes[name] as THREE.Mesh;
            }
        }
        for (const key of Object.keys(nodes)) {
            const node = nodes[key];
            if (node instanceof THREE.Mesh) {
                const lowerName = node.name.toLowerCase();
                if (lowerName === 'engraving mesh' || lowerName === 'engraving metal' || lowerName === 'engraving_mesh' || lowerName === 'engraving_metal') {
                    return node;
                }
            }
        }
        return null;
    }, [nodes]);

    useEffect(() => {
        if (!ringMesh || !ringMesh.geometry) return;

        // Fix the GLB Ring Geometry
        if (ringMesh.geometry.attributes.uv && !ringMesh.geometry.attributes.uv2) {
            ringMesh.geometry.setAttribute(
                'uv2', // Use 'uv1' if you are on Three.js r151 or newer
                new Float32BufferAttribute(ringMesh.geometry.attributes.uv.array, 2)
            );
        }
    }, [ringMesh]);

    // Handle map downloads triggered from the store/UI
    useEffect(() => {
        if (!ringMesh || !ringMesh.geometry) return;

        if (engraveManager.shouldDownloadUV) {
            import('../../utils/uvUtils').then(({ downloadUVLayout }) => {
                downloadUVLayout(ringMesh.geometry, 2048, 'engraving-uv-layout.png', null);
                engraveManager.resetAllDownloads();
            });
        }

        if (engraveManager.shouldDownloadUVOrange) {
            import('../../utils/uvUtils').then(({ downloadUVLayout }) => {
                downloadUVLayout(ringMesh.geometry, 2048, 'engraving-uv-map-orange.png', hCanvas);
                engraveManager.resetAllDownloads();
            });
        }

        if (engraveManager.shouldDownloadNormal) {
            import('../../utils/normalUtils').then(({ convertHeightToNormalMap }) => {
                import('../../utils/downloadCanvas').then(({ downloadCanvas }) => {
                    const nCanvas = convertHeightToNormalMap(hCanvas, 2.0);
                    downloadCanvas(nCanvas, 'engraving-normal-map.png');
                    engraveManager.resetAllDownloads();
                });
            });
        }

        if (engraveManager.shouldDownloadHeight) {
            import('../../utils/downloadCanvas').then(({ downloadCanvas }) => {
                downloadCanvas(hCanvas, 'engraving-height-map.png');
                engraveManager.resetAllDownloads();
            });
        }
    }, [
        ringMesh, 
        hCanvas, 
        engraveManager.shouldDownloadUV, 
        engraveManager.shouldDownloadUVOrange, 
        engraveManager.shouldDownloadNormal, 
        engraveManager.shouldDownloadHeight
    ]);

    const originalMaterialRef = useRef<THREE.Material | THREE.Material[] | null>(null);

    useEffect(() => {
        if (!ringMesh || !ringMesh.geometry) return; // guard: wait until mesh exists

        // Only save the original material if we haven't already, or if it's not our engraved clone
        if (!originalMaterialRef.current || !(ringMesh.material as any).userData?.isEngraved) {
            originalMaterialRef.current = ringMesh.material;
        }

        const baseMaterial = originalMaterialRef.current as THREE.MeshPhysicalMaterial;

        // Clone the existing material to keep all user-selected properties (color, metalness, roughness, etc.)
        const engravedMaterial = baseMaterial.clone();
        engravedMaterial.userData.isEngraved = true;

        // Apply engraving specific maps
        engravedMaterial.normalMap = normalTexture;
        engravedMaterial.normalScale = new THREE.Vector2(-5, 5); // Try (1, 1) if the engraving looks inverted
        engravedMaterial.aoMap = aoTexture;
        engravedMaterial.aoMapIntensity = 1.0;

        engravedMaterial.needsUpdate = true;

        // Apply the cloned and modified material to the mesh
        ringMesh.material = engravedMaterial;

        return () => {
            // Restore original material when engraving mode is exited or re-rendered
            if (originalMaterialRef.current) {
                ringMesh.material = originalMaterialRef.current;
            }
            engravedMaterial.dispose();
        };
    }, [ringMesh, normalTexture, aoTexture]);

    return <BBoxEngrave textOffsetX={textOffsetX} />;
});

export default EngraveModelRender;