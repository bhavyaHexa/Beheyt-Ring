import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useTexture, useEnvironment } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";
import { useThree, useFrame } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';

// START: NEWLY IMPLEMENTED IMPORTS
import MeshRefractionMaterialWebGL from '../../material/MeshRefractionMaterial.js';
// END: NEWLY IMPLEMENTED IMPORTS

const SingleModel = observer(({ variation, diamondEnvMap, size }) => {
    const { design3DManager } = rootStore;
    const { collection, modelId, colorHex, roughness, finish, showDiamond, variation: selectedVariation } = design3DManager.activeModel;

    const isVisible = selectedVariation === variation;

    // Build URL and paths for this specific variation
    const url = design3DManager.rootStore.designManager.getModelUrlForVariation(variation);
    const formattedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, '');
    const aoMapUrlGold = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Gold_Metal_AO.webp`;
    const aoMapUrlSilver = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Silver_Metal_AO.webp`;
    const roughnessMapUrl = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Roughness_Map.jpg`;

    // Load textures for this variation
    const aoTextureGold = useTexture(aoMapUrlGold);
    if (aoTextureGold) aoTextureGold.flipY = false;

    const aoTextureSilver = useTexture(aoMapUrlSilver);
    if (aoTextureSilver) aoTextureSilver.flipY = false;

    const roughnessTexture = useTexture(roughnessMapUrl);
    if (roughnessTexture) roughnessTexture.flipY = false;

    // Load the GLTF for this variation
    const { scene } = useGLTF(url);

    // --- START: LERP ANIMATION CHANGES ---

    // Stable ref to the target color and roughness (updated on selection change)
    const targetColor = useRef(new THREE.Color(colorHex));
    const targetRoughness = useRef(roughness);

    // Update target values whenever they change
    useEffect(() => {
        targetColor.current.set(colorHex);
        targetRoughness.current = roughness;
    }, [colorHex, roughness]);

    // Create materials ONCE and hold them in refs
    const goldMaterialRef = useRef(
        new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: 1.0,
            roughness: roughness,
            aoMap: aoTextureGold,
            aoMapIntensity: 1.0,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            clearcoatRoughness: 0.1
        })
    );

    const silverMaterialRef = useRef(
        new THREE.MeshPhysicalMaterial({
            color: "#f6f5f5",
            metalness: 1.0,
            roughness: roughness,
            aoMap: aoTextureSilver,
            aoMapIntensity: 0.8,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            clearcoatRoughness: 0.1
        })
    );

    // Keep textures in sync if they change (e.g. modelId/variation swap)
    useEffect(() => {
        // Update Gold Material
        goldMaterialRef.current.aoMap = aoTextureGold;
        goldMaterialRef.current.roughnessMap = roughnessTexture;
        goldMaterialRef.current.needsUpdate = true;

        // Update Silver Material
        silverMaterialRef.current.aoMap = aoTextureSilver;
        silverMaterialRef.current.roughnessMap = roughnessTexture;
        silverMaterialRef.current.needsUpdate = true;
    }, [aoTextureGold, aoTextureSilver, roughnessTexture]);

    // Lerp material properties toward target values every frame
    useFrame((_, delta) => {
        const factor = 1 - Math.pow(0.01, delta); // ~0.3s smooth transition

        // Target Clearcoat based on finish
        const targetClearcoat = finish === "polished" ? 1.0 : 0.0;

        // Update Gold Material
        goldMaterialRef.current.color.lerp(targetColor.current, factor);
        goldMaterialRef.current.roughness = THREE.MathUtils.lerp(
            goldMaterialRef.current.roughness,
            targetRoughness.current,
            factor
        );
        goldMaterialRef.current.clearcoat = THREE.MathUtils.lerp(
            goldMaterialRef.current.clearcoat,
            targetClearcoat,
            factor
        );
        goldMaterialRef.current.clearcoatRoughness = THREE.MathUtils.lerp(
            goldMaterialRef.current.clearcoatRoughness,
            0.1,
            factor
        );

        // Update Silver Material
        silverMaterialRef.current.roughness = THREE.MathUtils.lerp(
            silverMaterialRef.current.roughness,
            targetRoughness.current,
            factor
        );
        silverMaterialRef.current.clearcoat = THREE.MathUtils.lerp(
            silverMaterialRef.current.clearcoat,
            targetClearcoat,
            factor
        );
        silverMaterialRef.current.clearcoatRoughness = THREE.MathUtils.lerp(
            silverMaterialRef.current.clearcoatRoughness,
            0.1,
            factor
        );
    });

    // --- END: LERP ANIMATION CHANGES ---



    // Mesh Processing Logic
    useMemo(() => {
        scene.traverse((node) => {
            if (node.isMesh) {
                const mesh = node;

                // Handle Visibility based on showDiamond
                if (mesh.name === "Silver_Metal") {
                    mesh.visible = !showDiamond;
                    mesh.material = silverMaterialRef.current;
                }
                if (mesh.name === "Silver_Diamond") {
                    mesh.visible = showDiamond;
                    mesh.material = silverMaterialRef.current;
                }

                // --- START: NEWLY IMPLEMENTED DIAMOND LOGIC ---
                if (mesh.name === "Diamond_Mesh" || mesh.name.includes("Diam_Centr")) {
                    mesh.visible = showDiamond;

                    if (showDiamond) {
                        // 1. Create BVH for the geometry (required for refraction bounces)
                        const bvh = new MeshBVH(mesh.geometry, { strategy: 1 });

                        // 2. Assign the advanced Refraction Material
                        mesh.material = new MeshRefractionMaterialWebGL({
                            geometry: mesh.geometry,
                            bvh: bvh,
                            envMap: diamondEnvMap,
                            resolution: new THREE.Vector2(size.width, size.height),
                            ior: 2.4,
                            bounces: 3,
                            aberrationStrength: 0.0005,
                        });
                    }
                }

                else if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Engraving_Mesh") {
                    mesh.material = goldMaterialRef.current; // <-- uses stable ref
                }
            }
        });
    }, [scene, goldMaterialRef.current, silverMaterialRef.current, diamondEnvMap, size, showDiamond]);

    return <primitive object={scene} visible={isVisible} rotation={[-Math.PI / 4, -Math.PI / 10, Math.PI / 3]} />;
});

const Model3DContent = observer(() => {
    const { size } = useThree();

    // Load Environment Map for the Diamond Refraction (shared)
    const diamondEnvMap = useEnvironment({ files: '/08.hdr' });

    // Define the variations we want to preload
    const variations = ["4.5mm", "5.0mm"];

    return (
        <group>
            {variations.map((v) => (
                <SingleModel
                    key={v}
                    variation={v}
                    diamondEnvMap={diamondEnvMap}
                    size={size}
                />
            ))}
        </group>
    );
});

export default Model3DContent;