import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";
import { useLoader } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';
import { SingleModelProps } from '../../types';
import { alignModelToOrigin } from '../../utils/alignment';

// Custom loaders and helpers
import { SafeTextureLoader } from '../../utils/safeTextureLoader';
import { getTextureValue, getNormalMapValue } from '../../utils/textureHelpers';

// Materials and Sub-components
import MeshRefractionMaterialWebGL from '../../material/MeshRefractionMaterial.js';
import ModelAnimation from './ModelAnimation';
import { MaterialLerpController } from './MaterialLerpController';

export const SingleModel = observer(({
    variation,
    diamondEnvMap,
    size,
    normalIntensity,
}: SingleModelProps & {
    normalIntensity: number;
}) => {
    const { design3DManager, designManager } = rootStore;
    const { collection, modelId, colorHex, roughness, finish, showDiamond, variation: selectedVariation } = design3DManager.activeModel;

    const isVisible = selectedVariation === variation;

    // Get the variation data from ringsData
    const variationData = useMemo(() => {
        if (!design3DManager.ringsData) return null;
        return design3DManager.ringsData.rings[collection]?.[modelId]?.[variation] || null;
    }, [design3DManager.ringsData, collection, modelId, variation]);

    // Build URL and paths for this specific variation
    const url = variationData?.modelUrl || design3DManager.rootStore.designManager.getModelUrlForVariation(variation);
    const formattedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, '');

    // Resolve AO map for Gold (Base Metal)
    const aoGoldUrl = getTextureValue(variationData?.textures, [
        'aoGold',
        'Base_metal_AO',
        'Base_Metal_AO',
        'Base_metal_Ao',
        'base_metal_ao',
        'Gold_Metal_AO',
        'Gold_metal_AO',
        'Gold_Metal_Ao',
        'gold_metal_ao',
        'Base_Metal',
        'Gold_Metal'
    ]);
    const hasAoGold = !!aoGoldUrl;

    // Resolve AO map for Silver (Finishing Metal)
    const aoSilverUrl = getTextureValue(variationData?.textures, [
        'aoSilver',
        'Finishing_Metal_Ao',
        'Finishing_Metal_AO',
        'Finishing_metal_AO',
        'Finishing_metal_Ao',
        'finishing_metal_ao',
        'Silver_Metal_AO',
        'Silver_metal_AO',
        'Silver_Metal_Ao',
        'silver_metal_ao',
        'Finishing_Metal',
        'Silver_Metal'
    ]);
    const hasAoSilver = !!aoSilverUrl;

    // Resolve AO map for Engraving Mesh
    const aoEngravingUrl = getTextureValue(variationData?.textures, [
        'aoEngraving',
        'aoEngrave',
        'aoEngravingMesh',
        'aoEngraving_Mesh',
        'Engraving_Mesh_AO',
        'Engraving_Mesh',
        'aoEngravingMetal',
        'aoEngraving_Metal',
        'Engraving_Metal_AO',
        'Engraving_Metal'
    ]);
    const hasAoEngraving = !!aoEngravingUrl;

    // Resolve normal map for Base Metal (Gold)
    const normalBaseUrl = getTextureValue(variationData?.textures, [
        'normalBase',
        'Base_Metal_Normal',
        'Base_metal_Normal',
        'base_metal_normal',
        'Base_Metal_Normal.webp',
        'Base_metal_Normal.webp',
        'base_metal_normal.webp'
    ]) || getNormalMapValue(variationData?.textures, ['Base_Metal_Normal', 'base_metal_normal']);
    const hasNormalBase = !!normalBaseUrl;

    // Resolve normal map for Finishing Metal (Silver)
    const normalFinishingUrl = getTextureValue(variationData?.textures, [
        'normalFinishing',
        'Finishing_Metal_Normal',
        'Finishing_metal_Normal',
        'finishing_metal_normal',
        'Finishing_Metal_Normal.webp',
        'Finishing_metal_Normal.webp',
        'finishing_metal_normal.webp'
    ]) || getNormalMapValue(variationData?.textures, ['Finishing_Metal_Normal', 'finishing_metal_normal']);
    const hasNormalFinishing = !!normalFinishingUrl;

    const aoMapUrlGold = hasAoGold && aoGoldUrl ? aoGoldUrl : "";
    const aoMapUrlSilver = hasAoSilver && aoSilverUrl ? aoSilverUrl : "";
    const aoMapUrlEngraving = hasAoEngraving && aoEngravingUrl ? aoEngravingUrl : "";
    const normalBaseMapUrl = hasNormalBase && normalBaseUrl ? normalBaseUrl : "";
    const normalFinishingMapUrl = hasNormalFinishing && normalFinishingUrl ? normalFinishingUrl : "";

    const roughnessMapUrl = (variationData?.textures?.roughness && !variationData.textures.roughness.endsWith('roughness.jpg'))
        ? variationData.textures.roughness
        : `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Roughness_Map.jpg`;

    // Load textures safely for this variation
    const aoTextureGold = useLoader(SafeTextureLoader, aoMapUrlGold) as THREE.Texture;
    if (aoTextureGold) aoTextureGold.flipY = false;

    const aoTextureSilver = useLoader(SafeTextureLoader, aoMapUrlSilver) as THREE.Texture;
    if (aoTextureSilver) aoTextureSilver.flipY = false;

    const aoTextureEngraving = useLoader(SafeTextureLoader, aoMapUrlEngraving) as THREE.Texture;
    if (aoTextureEngraving) aoTextureEngraving.flipY = false;

    const roughnessTexture = useLoader(SafeTextureLoader, roughnessMapUrl) as THREE.Texture;
    if (roughnessTexture) roughnessTexture.flipY = false;

    const normalBaseTexture = useLoader(SafeTextureLoader, normalBaseMapUrl) as THREE.Texture;
    if (normalBaseTexture) {
        normalBaseTexture.flipY = false;
        normalBaseTexture.colorSpace = THREE.NoColorSpace;
    }

    const normalFinishingTexture = useLoader(SafeTextureLoader, normalFinishingMapUrl) as THREE.Texture;
    if (normalFinishingTexture) {
        normalFinishingTexture.flipY = false;
        normalFinishingTexture.colorSpace = THREE.NoColorSpace;
    }

    // Load the GLTF for this variation
    const { scene } = useGLTF(url);


    // Create materials ONCE and hold them in refs
    const goldMaterialRef = useRef(
        new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: 1,
            roughness: roughness,
            aoMap: hasAoGold ? aoTextureGold : null,
            aoMapIntensity: hasAoGold ? 1.0 : 0.0,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            normalScale: new THREE.Vector2(normalIntensity, normalIntensity),
            normalMap: hasNormalBase ? normalBaseTexture : null,
            alphaMap: aoTextureGold
        })
    );

    const silverMaterialRef = useRef(
        new THREE.MeshPhysicalMaterial({
            color: "#f6f5f5",
            metalness: 1.0,
            roughness: roughness,
            aoMap: hasAoSilver ? aoTextureSilver : null,
            aoMapIntensity: hasAoSilver ? 0.8 : 0.0,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            clearcoatRoughness: 0.1,
            normalScale: new THREE.Vector2(normalIntensity, normalIntensity),
            normalMap: hasNormalFinishing ? normalFinishingTexture : null,
        })
    );

    const engravingMaterialRef = useRef(
        new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: 1.0,
            roughness: roughness,
            aoMap: hasAoEngraving ? aoTextureEngraving : null,
            aoMapIntensity: hasAoEngraving ? 1.0 : 0.0,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            clearcoatRoughness: 0.1
        })
    );

    // Keep textures in sync if they change (e.g. modelId/variation swap)
    useEffect(() => {
        // Update Gold Material
        goldMaterialRef.current.aoMap = hasAoGold ? aoTextureGold : null;
        goldMaterialRef.current.aoMapIntensity = hasAoGold ? 1.0 : 0.0;
        goldMaterialRef.current.roughnessMap = roughnessTexture;
        goldMaterialRef.current.normalMap = hasNormalBase ? normalBaseTexture : null;
        goldMaterialRef.current.needsUpdate = true;

        // Update Silver Material
        silverMaterialRef.current.aoMap = hasAoSilver ? aoTextureSilver : null;
        silverMaterialRef.current.aoMapIntensity = hasAoSilver ? 0.5 : 0.5;
        silverMaterialRef.current.roughnessMap = roughnessTexture;
        silverMaterialRef.current.normalMap = hasNormalFinishing ? normalFinishingTexture : null;
        silverMaterialRef.current.needsUpdate = true;

        // Update Engraving Material
        engravingMaterialRef.current.aoMap = hasAoEngraving ? aoTextureEngraving : null;
        engravingMaterialRef.current.aoMapIntensity = hasAoEngraving ? 1.0 : 0.0;
        engravingMaterialRef.current.roughnessMap = roughnessTexture;
        engravingMaterialRef.current.needsUpdate = true;

        // Log normal map application status for the visible variation
        if (isVisible) {
            if (hasNormalBase) {
                console.log(`Base Metal Normal Map applied: Yes (Path: ${normalBaseMapUrl})`, normalBaseTexture);
            } else {
                console.log("Base Metal Normal Map applied: No");
            }

            if (hasNormalFinishing) {
                console.log(`Finishing Metal Normal Map applied: Yes (Path: ${normalFinishingMapUrl})`, normalFinishingTexture);
            } else {
                console.log("Finishing Metal Normal Map applied: No");
            }
        }
    }, [
        aoTextureGold,
        aoTextureSilver,
        aoTextureEngraving,
        roughnessTexture,
        normalBaseTexture,
        normalFinishingTexture,
        hasAoGold,
        hasAoSilver,
        hasAoEngraving,
        hasNormalBase,
        hasNormalFinishing,
        isVisible,
        normalBaseMapUrl,
        normalFinishingMapUrl
    ]);

    // Update normalScale when Leva controls change
    useEffect(() => {
        const targetBaseMaterial = goldMaterialRef.current;
        const targetFinishingMaterial = silverMaterialRef.current;

        if (hasNormalBase) {
            targetBaseMaterial.normalScale.set(normalIntensity, normalIntensity);
        }
        if (hasNormalFinishing) {
            targetFinishingMaterial.normalScale.set(normalIntensity, normalIntensity);
        }
    }, [normalIntensity, hasNormalBase, hasNormalFinishing]);

    // // Log the model's position/location coordinates (x, y, z) in the console
    // useEffect(() => {
    //     if (isVisible && scene) {
    //         const box = new THREE.Box3().setFromObject(scene);
    //         const center = new THREE.Vector3();
    //         box.getCenter(center);
    //         console.log(`Model Location: x=${center.x}, y=${center.y}, z=${center.z}`);
    //     }
    // }, [scene, isVisible, modelId, variation]);


    // Mesh Processing Logic
    useMemo(() => {
        // Reset normal maps on shared materials before traversing
        goldMaterialRef.current.normalMap = null;
        silverMaterialRef.current.normalMap = null;
        engravingMaterialRef.current.normalMap = null;

        scene.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                const mesh = node;

                // Cache original normal map and scale on first traversal
                if (mesh.userData.originalNormalMap === undefined) {
                    mesh.userData.originalNormalMap = (mesh.material as any)?.normalMap || null;
                    mesh.userData.originalNormalScale = (mesh.material as any)?.normalScale
                        ? (mesh.material as any).normalScale.clone()
                        : null;
                }
                const originalNormalMap = mesh.userData.originalNormalMap;
                const originalNormalScale = mesh.userData.originalNormalScale;

                const targetFinishingMaterial = silverMaterialRef.current;
                const targetBaseMaterial = goldMaterialRef.current;

                // Handle Visibility based on showDiamond
                if (mesh.name === "Silver_Metal") {
                    mesh.visible = !showDiamond;
                    mesh.material = targetFinishingMaterial;
                    if (hasNormalFinishing) {
                        targetFinishingMaterial.normalMap = normalFinishingTexture;
                        targetFinishingMaterial.normalScale.set(normalIntensity, normalIntensity);
                    } else if (originalNormalMap) {
                        targetFinishingMaterial.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            targetFinishingMaterial.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                if (mesh.name === "Silver_Diamond") {
                    mesh.visible = showDiamond;
                    mesh.material = targetFinishingMaterial;
                    if (hasNormalFinishing) {
                        targetFinishingMaterial.normalMap = normalFinishingTexture;
                        targetFinishingMaterial.normalScale.set(normalIntensity, normalIntensity);
                    } else if (originalNormalMap) {
                        targetFinishingMaterial.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            targetFinishingMaterial.normalScale.copy(originalNormalScale);
                        }
                    }
                }

                // --- START: NEWLY IMPLEMENTED DIAMOND LOGIC ---
                if (mesh.name === "Diamond_Mesh" || mesh.name.includes("Diam_Centr") || mesh.name.includes("Diamond_Metal")) {
                    mesh.visible = showDiamond;

                    if (showDiamond) {
                        // 1. Create BVH for the geometry (required for refraction bounces)
                        const bvh = new MeshBVH(mesh.geometry, { strategy: 1 });

                        // 2. Assign the advanced Refraction Material
                        mesh.material = new MeshRefractionMaterialWebGL({
                            geometry: mesh.geometry,
                            bvh: bvh,
                            envMap: diamondEnvMap as THREE.Texture,
                            resolution: new THREE.Vector2(size.width, size.height),
                            ior: 2.4,
                            bounces: 3,
                            aberrationStrength: 0.0005,
                        });
                    }
                }

                else if (mesh.name === "Engraving Mesh" || mesh.name === "Engraving Metal" || mesh.name === "Engraving_Mesh" || mesh.name === "Engraving_Metal" || mesh.name.includes("Engraving")) {
                    mesh.material = engravingMaterialRef.current;
                    if (originalNormalMap) {
                        engravingMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            engravingMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                else if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Base_Metal" || mesh.name === "Base_metal" || mesh.name.includes("Base")) {
                    mesh.material = targetBaseMaterial;
                    if (hasNormalBase) {
                        targetBaseMaterial.normalMap = normalBaseTexture;
                        targetBaseMaterial.normalScale.set(normalIntensity, normalIntensity);
                    } else if (originalNormalMap) {
                        targetBaseMaterial.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            targetBaseMaterial.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                else if (mesh.name === "Finishing_Metal" || mesh.name.includes("Finishing")) {
                    mesh.material = targetFinishingMaterial;
                    if (hasNormalFinishing) {
                        targetFinishingMaterial.normalMap = normalFinishingTexture;
                        targetFinishingMaterial.normalScale.set(normalIntensity, normalIntensity);
                    } else if (originalNormalMap) {
                        targetFinishingMaterial.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            targetFinishingMaterial.normalScale.copy(originalNormalScale);
                        }
                    }
                }
            }
        });
    }, [
        scene,
        goldMaterialRef.current,
        silverMaterialRef.current,
        engravingMaterialRef.current,
        diamondEnvMap,
        size,
        showDiamond,
        collection,
        modelId,
        aoTextureEngraving,
        normalBaseTexture,
        normalFinishingTexture,
        hasNormalBase,
        hasNormalFinishing,
        normalIntensity,
    ]);

    const boundsData = useMemo(() => {
        if (!scene) return null;
        const res = alignModelToOrigin(scene, -Math.PI / 4, -Math.PI / 10, Math.PI / 3);
        if (isVisible) {
            designManager.setModelMinY(res.minY || 0);
        }
        return res;
    }, [scene, isVisible, designManager]);

    return (
        <group visible={isVisible}>
            {scene && boundsData && (
                <>
                    <primitive object={scene} />
                    <ModelAnimation loadedObject={scene} />
                    <MaterialLerpController
                        goldMaterial={goldMaterialRef.current}
                        silverMaterial={silverMaterialRef.current}
                        engravingMaterial={engravingMaterialRef.current}
                        variationData={variationData}
                        roughness={roughness}
                        colorHex={colorHex}
                        modelId={modelId}
                        variation={variation}
                        finish={finish}
                    />
                </>
            )}
        </group>
    );
});
