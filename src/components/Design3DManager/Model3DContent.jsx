import React, { useEffect, useMemo } from 'react';
import { useGLTF, useTexture, useEnvironment } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";
import { useThree } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';

// START: NEWLY IMPLEMENTED IMPORTS
import MeshRefractionMaterialWebGL from '../../material/MeshRefractionMaterial.js';
// END: NEWLY IMPLEMENTED IMPORTS

const Model3DContent = observer(() => {
    const { design3DManager } = rootStore;
    const { collection, modelId, variation, colorHex, modelUrl: url } = design3DManager.activeModel;
    const { size } = useThree();

    // Load Environment Map for the Diamond Refraction
    const diamondEnvMap = useEnvironment({ files: '/gemEnv.exr' });

    // Texture loading for metal
    const formattedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, '');
    const aoMapUrlGold = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Gold_Metal_AO.webp`;
    const aoMapUrlSilver = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Silver_Metal_AO.webp`;

    const aoTextureGold = useTexture(aoMapUrlGold);
    if (aoTextureGold) aoTextureGold.flipY = false;

    const aoTextureSilver = useTexture(aoMapUrlSilver);
    if (aoTextureSilver) aoTextureSilver.flipY = false;

    const { scene } = useGLTF(url);

    // Metal Materials
    const goldMaterial = useMemo(() => {
        return new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: 1.0,
            roughness: 0.15,
            aoMap: aoTextureGold,
            aoMapIntensity: 1.0,
        });
    }, [colorHex, aoTextureGold]);

    const silverMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: "#f6f5f5",
            roughness: 0.15,
            metalness: 1.0,
            aoMap: aoTextureSilver,
            aoMapIntensity: 0.8,
        });
    }, [aoTextureSilver]);

    // Mesh Processing Logic
    useMemo(() => {
        scene.traverse((node) => {
            if (node.isMesh) {
                const mesh = node;

                // Hide Silver_Diamond mesh
                if (mesh.name === "Silver_Diamond") {
                    mesh.visible = false;
                }

                // --- START: NEWLY IMPLEMENTED DIAMOND LOGIC ---
                if (mesh.name === "Diamond_Mesh" || mesh.name.includes("Diam_Centr")) {
                    // 1. Create BVH for the geometry (required for refraction bounces)
                    const bvh = new MeshBVH(mesh.geometry, { strategy: 1 });

                    // 2. Assign the advanced Refraction Material
                    mesh.material = new MeshRefractionMaterialWebGL({
                        geometry: mesh.geometry,
                        bvh: bvh,
                        envMap: diamondEnvMap,
                        resolution: new THREE.Vector2(size.width, size.height),
                        ior: 2.4,
                        bounces: 2,
                        aberrationStrength: 0.0001,
                        // color: "#ffffff", // Use white for pure diamond, or change as needed
                    });
                }
                // --- END: NEWLY IMPLEMENTED DIAMOND LOGIC ---

                else if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Engraving_Mesh") {
                    mesh.material = goldMaterial;
                }
                else if (mesh.name === "Silver_Metal") {
                    mesh.material = silverMaterial;
                }
            }
        });
    }, [scene, goldMaterial, silverMaterial, diamondEnvMap, size]);

    return <primitive object={scene} rotation={[-Math.PI / 2, 0, Math.PI / 3]} />;
});

export default Model3DContent;