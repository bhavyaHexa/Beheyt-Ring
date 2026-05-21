import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";
import { useThree, useFrame, useLoader } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';
import { SingleModelProps } from '../../types';

// START: NEWLY IMPLEMENTED IMPORTS
import MeshRefractionMaterialWebGL from '../../material/MeshRefractionMaterial.js';
// END: NEWLY IMPLEMENTED IMPORTS

class SafeTextureLoader extends THREE.TextureLoader {
    load(
        url: string,
        onLoad?: (texture: THREE.Texture) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ): THREE.Texture {
        return super.load(
            url,
            (texture) => {
                if (onLoad) onLoad(texture);
            },
            onProgress,
            (err) => {
                console.warn(`SafeTextureLoader: Failed to load texture at ${url}. Falling back to default.`);
                const fallbackUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                super.load(
                    fallbackUrl,
                    (fallbackTexture) => {
                        if (onLoad) onLoad(fallbackTexture);
                    },
                    undefined,
                    (fallbackErr) => {
                        if (onError) onError(fallbackErr);
                    }
                );
            }
        );
    }
}

class ModelErrorBoundary extends React.Component<
    { children: React.ReactNode; name?: string },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.warn(`ModelErrorBoundary caught an error for ${this.props.name || 'model'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

/**
 * Helper to retrieve a texture URL from the textures configuration object using
 * a list of potential keys, performing both exact and case-insensitive lookups.
 */
const getTextureValue = (texturesObj: any, searchKeys: string[]): string | undefined => {
    if (!texturesObj) return undefined;
    
    // 1. Try exact matches in priority order
    for (const key of searchKeys) {
        if (texturesObj[key]) return texturesObj[key];
    }
    
    // 2. Try case-insensitive matching
    const searchKeysLower = searchKeys.map(k => k.toLowerCase());
    for (const key of Object.keys(texturesObj)) {
        if (searchKeysLower.includes(key.toLowerCase())) {
            return texturesObj[key];
        }
    }
    
    return undefined;
};

const SingleModel = observer(({ variation, diamondEnvMap, size }: SingleModelProps) => {
    const { design3DManager } = rootStore;
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

    const fallbackTextureUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const texturesAny = variationData?.textures as any;

    // Resolve AO map for Gold (Base Metal)
    const aoGoldUrl = getTextureValue(texturesAny, [
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
    const aoSilverUrl = getTextureValue(texturesAny, [
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
    const aoEngravingUrl = getTextureValue(texturesAny, [
        'aoEngraving',
        'aoEngrave',
        'aoEngravingMesh',
        'aoEngraving_Mesh',
        'Engraving_Mesh_AO',
        'Engraving_Mesh'
    ]);
    const hasAoEngraving = !!aoEngravingUrl;

    const aoMapUrlGold = hasAoGold && aoGoldUrl ? aoGoldUrl : fallbackTextureUrl;
    const aoMapUrlSilver = hasAoSilver && aoSilverUrl ? aoSilverUrl : fallbackTextureUrl;
    const aoMapUrlEngraving = hasAoEngraving && aoEngravingUrl ? aoEngravingUrl : fallbackTextureUrl;

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
            aoMap: hasAoGold ? aoTextureGold : null,
            aoMapIntensity: hasAoGold ? 1.0 : 0.0,
            roughnessMap: roughnessTexture,
            clearcoat: finish === "polished" ? 1.0 : 0.0,
            normalScale: new THREE.Vector2(1, 1),
            normalMap: null,
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
            clearcoatRoughness: 0.1
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
        goldMaterialRef.current.needsUpdate = true;

        // Update Silver Material
        silverMaterialRef.current.aoMap = hasAoSilver ? aoTextureSilver : null;
        silverMaterialRef.current.aoMapIntensity = hasAoSilver ? 0.5 : 0.5;
        silverMaterialRef.current.roughnessMap = roughnessTexture;
        silverMaterialRef.current.needsUpdate = true;

        // Update Engraving Material
        engravingMaterialRef.current.aoMap = hasAoEngraving ? aoTextureEngraving : null;
        engravingMaterialRef.current.aoMapIntensity = hasAoEngraving ? 1.0 : 0.0;
        engravingMaterialRef.current.roughnessMap = roughnessTexture;
        engravingMaterialRef.current.needsUpdate = true;
    }, [aoTextureGold, aoTextureSilver, aoTextureEngraving, roughnessTexture, hasAoGold, hasAoSilver, hasAoEngraving]);

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

        // Update Engraving Material
        const isArtisanal = collection.toLowerCase() === "artisanal";
        const isArtisanal526 = isArtisanal && modelId === "526";
        const isGold = !(isArtisanal && !isArtisanal526);

        if (isGold) {
            engravingMaterialRef.current.color.lerp(targetColor.current, factor);
        } else {
            engravingMaterialRef.current.color.set("#f6f5f5");
        }
        engravingMaterialRef.current.roughness = THREE.MathUtils.lerp(
            engravingMaterialRef.current.roughness,
            targetRoughness.current,
            factor
        );
        engravingMaterialRef.current.clearcoat = THREE.MathUtils.lerp(
            engravingMaterialRef.current.clearcoat,
            targetClearcoat,
            factor
        );
        engravingMaterialRef.current.clearcoatRoughness = THREE.MathUtils.lerp(
            engravingMaterialRef.current.clearcoatRoughness,
            0.1,
            factor
        );
    });

    // --- END: LERP ANIMATION CHANGES ---



    // Mesh Processing Logic
    useMemo(() => {
        console.log(`--- Traversing scene for variation: ${variation} ---`);
        
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

                console.log(`Mesh Node: "${mesh.name}"`, {
                    material: mesh.material,
                    normalMap: originalNormalMap
                });

                // Handle Visibility based on showDiamond
                if (mesh.name === "Silver_Metal") {
                    mesh.visible = !showDiamond;
                    mesh.material = silverMaterialRef.current;
                    console.log("The Silver_Metal", mesh.material);
                    if (originalNormalMap) {
                        silverMaterialRef.current.normalMap = originalNormalMap;
                        console.log("The Silver_Metal normalMap", silverMaterialRef.current.normalMap); 
                        if (originalNormalScale) {
                            silverMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                if (mesh.name === "Silver_Diamond") {
                    mesh.visible = showDiamond;
                    mesh.material = silverMaterialRef.current;
                    if (originalNormalMap) {
                        silverMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            silverMaterialRef.current.normalScale.copy(originalNormalScale);
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

                else if (mesh.name === "Engraving_Mesh") {
                    mesh.material = engravingMaterialRef.current;
                    console.log(mesh.material);
                    if (originalNormalMap) {
                        engravingMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            engravingMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                else if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Base_Metal" || mesh.name.includes("Base")) {
                    mesh.material = goldMaterialRef.current; // <-- uses stable ref
                    console.log("The Base_Metal", mesh.material);
                    if (originalNormalMap) {
                        goldMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            goldMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                else if (mesh.name === "Finishing_Metal" || mesh.name.includes("Finishing")) {
                    mesh.material = silverMaterialRef.current;
                    console.log("The Finishing_Metal", mesh.material);
                    if (originalNormalMap) {
                        silverMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            silverMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
            }
        });
    }, [scene, goldMaterialRef.current, silverMaterialRef.current, engravingMaterialRef.current, diamondEnvMap, size, showDiamond, collection, modelId, aoTextureEngraving]);

    return <primitive object={scene} visible={isVisible} rotation={[-Math.PI / 4, -Math.PI / 10, Math.PI / 3]} />;
});

const Model3DContent = observer(() => {
    const { size } = useThree();
    const { design3DManager } = rootStore;
    const { collection, modelId } = design3DManager.activeModel;

    // Load Environment Map for the Diamond Refraction (shared)
    const diamondEnvMap = useEnvironment({ files: '/08.hdr' });

    // Define the variations dynamically based on the active model in ringsData
    const variations = useMemo(() => {
        if (!design3DManager.ringsData) return [];
        const colData = design3DManager.ringsData.rings[collection];
        if (!colData) return [];
        const modelData = colData[modelId];
        if (!modelData) return [];
        return Object.keys(modelData);
    }, [design3DManager.ringsData, collection, modelId]);

    return (
        <group>
            {variations.map((v) => (
                <ModelErrorBoundary key={`${collection}-${modelId}-${v}`} name={`${collection}-${modelId}-${v}`}>
                    <SingleModel
                        variation={v}
                        diamondEnvMap={diamondEnvMap}
                        size={size}
                    />
                </ModelErrorBoundary>
            ))}
        </group>
    );
});

export default Model3DContent;