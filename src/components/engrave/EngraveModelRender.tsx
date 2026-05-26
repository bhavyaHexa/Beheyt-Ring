import { useMemo, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Float32BufferAttribute } from 'three';
import * as THREE from 'three';
import { engraveManager } from '../../managers/engraveManager';
import { generateTextHeightMap, convertHeightToNormalMap } from '../../utils/normalUtils';
import { useGLTF } from '@react-three/drei';
import { rootStore } from '../../managers/stateManager';
import { useControls } from 'leva';

const EngraveModelRender = observer(function EngraveModelRender() {

    const designManager = rootStore.designManager;

    const url = designManager.selectedModelUrl
    console.log(url)
    const { nodes, scene } = useGLTF(url);
    console.log(nodes);

    const { rotX, rotY, rotZ, textOffsetX } = useControls('Engrave Controls', {
        rotX: { value: 0, min: -Math.PI * 2, max: Math.PI * 2, step: 0.01 },
        rotY: { value: Math.PI, min: -Math.PI * 2, max: Math.PI * 2, step: 0.01 },
        rotZ: { value: 0, min: -Math.PI * 2, max: Math.PI * 2, step: 0.01 },
        textOffsetX: { value: 0, min: -1024, max: 1024, step: 1 },
    });

    const originalRotationRef = useRef<THREE.Euler | null>(null);
    const lastSceneRef = useRef<THREE.Object3D | null>(null);

    useEffect(() => {
        if (!scene) return;

        if (!originalRotationRef.current || lastSceneRef.current !== scene) {
            originalRotationRef.current = scene.rotation.clone();
            lastSceneRef.current = scene;
        }

        scene.rotation.x = originalRotationRef.current.x - 6.28;
        scene.rotation.y = originalRotationRef.current.y - 1.23;
        scene.rotation.z = originalRotationRef.current.z + 1.31;

        return () => {
            if (scene && originalRotationRef.current) {
                scene.rotation.copy(originalRotationRef.current);
            }
        };
    }, [scene, rotX, rotY, rotZ]);

    // 1. Generate maps and apply Wrapping/Repeat settings immediately
    const { normalTexture, aoTexture, hCanvas } = useMemo(() => {
        const hCanvas = generateTextHeightMap({
            text: engraveManager.engraving || 'Empty',
            mode: 'engrave',
            blur: 0.01,
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

        // Create a floating UI button to download the UV map
        const btn = document.createElement('button');
        btn.innerText = '📥 Download UV Map (Orange)';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.padding = '12px 20px';
        btn.style.backgroundColor = '#FFA500';
        btn.style.color = 'black';
        btn.style.fontWeight = 'bold';
        btn.style.border = '2px solid white';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '999999';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

        btn.onclick = () => {
            import('../../utils/uvUtils').then(({ downloadUVLayout }) => {
                downloadUVLayout(ringMesh.geometry, 2048, 'engraving-uv-map.png', hCanvas);
                btn.innerText = '✅ Downloaded!';
                setTimeout(() => { btn.innerText = '📥 Download UV Map (Orange)'; }, 2000);
            });
        };

        document.body.appendChild(btn);

        return () => {
            if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        };
    }, [nodes, scene, ringMesh, hCanvas]); // Add nodes as dependency so it runs when GLTF loads

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
        engravedMaterial.normalScale = new THREE.Vector2(-1, -1); // Try (1, 1) if the engraving looks inverted
        engravedMaterial.aoMap = aoTexture;
        engravedMaterial.aoMapIntensity = 1;

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

    return null;
});

export default EngraveModelRender;