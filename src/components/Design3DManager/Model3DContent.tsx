import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";
import { useThree, useFrame, useLoader } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';
import { SingleModelProps } from '../../types';
import { useControls } from 'leva';

// START: NEWLY IMPLEMENTED IMPORTS
import MeshRefractionMaterialWebGL from '../../material/MeshRefractionMaterial.js';
// END: NEWLY IMPLEMENTED IMPORTS

class SafeTextureLoader extends THREE.TextureLoader {
    load(
        url: string,
        onLoad?: (texture: any) => void,
        onProgress?: (event: any) => void,
        onError?: (err: any) => void
    ): any {
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

/**
 * Helper to retrieve normal map texture URL by checking both keys and values
 * in textures configuration object case-insensitively for matches.
 */
const getNormalMapValue = (texturesObj: any, matchTerms: string[]): string | undefined => {
    if (!texturesObj) return undefined;
    const matchTermsLower = matchTerms.map(t => t.toLowerCase());
    
    // 1. Check keys
    for (const key of Object.keys(texturesObj)) {
        const keyLower = key.toLowerCase();
        for (const term of matchTermsLower) {
            if (keyLower.includes(term)) {
                return texturesObj[key];
            }
        }
    }
    
    // 2. Check values/URLs
    for (const key of Object.keys(texturesObj)) {
        const val = texturesObj[key];
        if (typeof val === 'string') {
            const valLower = val.toLowerCase();
            for (const term of matchTermsLower) {
                if (valLower.includes(term)) {
                    return val;
                }
            }
        }
    }
    
    return undefined;
};

/**
 * Helper to retrieve a value from an object using a list of potential keys,
 * matching case-insensitively and ignoring non-alphanumeric characters.
 */
const getValueIgnoreCaseAndSymbols = (obj: any, keysToSearch: string[]): any => {
    if (!obj) return undefined;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedKeys = keysToSearch.map(normalize);
    for (const key of Object.keys(obj)) {
        if (normalizedKeys.includes(normalize(key))) {
            return obj[key];
        }
    }
    return undefined;
};

const SingleModel = observer(({
    variation,
    diamondEnvMap,
    size,
    normalIntensity,

}: SingleModelProps & {
    normalIntensity: number;
  
}) => {
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

    // Resolve normal map for Base Metal (Gold)
    const normalBaseUrl = getTextureValue(texturesAny, [
        'normalBase',
        'Base_Metal_Normal',
        'Base_metal_Normal',
        'base_metal_normal',
        'Base_Metal_Normal.webp',
        'Base_metal_Normal.webp',
        'base_metal_normal.webp'
    ]) || getNormalMapValue(texturesAny, ['Base_Metal_Normal', 'base_metal_normal']);
    const hasNormalBase = !!normalBaseUrl;

    // Resolve normal map for Finishing Metal (Silver)
    const normalFinishingUrl = getTextureValue(texturesAny, [
        'normalFinishing',
        'Finishing_Metal_Normal',
        'Finishing_metal_Normal',
        'finishing_metal_normal',
        'Finishing_Metal_Normal.webp',
        'Finishing_metal_Normal.webp',
        'finishing_metal_normal.webp'
    ]) || getNormalMapValue(texturesAny, ['Finishing_Metal_Normal', 'finishing_metal_normal']);
    const hasNormalFinishing = !!normalFinishingUrl;

    const aoMapUrlGold = hasAoGold && aoGoldUrl ? aoGoldUrl : fallbackTextureUrl;
    const aoMapUrlSilver = hasAoSilver && aoSilverUrl ? aoSilverUrl : fallbackTextureUrl;
    const aoMapUrlEngraving = hasAoEngraving && aoEngravingUrl ? aoEngravingUrl : fallbackTextureUrl;
    const normalBaseMapUrl = hasNormalBase && normalBaseUrl ? normalBaseUrl : fallbackTextureUrl;
    const normalFinishingMapUrl = hasNormalFinishing && normalFinishingUrl ? normalFinishingUrl : fallbackTextureUrl;

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

    // --- START: LERP ANIMATION CHANGES ---

    // Resolve custom color fields from JSON configuration if present
    const baseMetalColorVal = getValueIgnoreCaseAndSymbols(variationData, ["Base_Metal_Color", "baseMetalColor", "Base Metal Color", "base_metal_color"]);
    const finishingMetalColorVal = getValueIgnoreCaseAndSymbols(variationData, ["finishing_metal_color", "finishingMetalColor", "finishing metal color", "finshing metal color", "finshing_metal_color", "finshingMetalColor"]);
    const engravingMeshColorVal = getValueIgnoreCaseAndSymbols(variationData, ["engraving_mesh_color", "engravingMeshColor", "engraving mesh color", "engrave_mesh_color", "engraveMeshColor", "engrave mesh color"]);
    const colorChangeVal = getValueIgnoreCaseAndSymbols(variationData, ["colorChange", "color_change", "colorChangeMesh", "color change"]);

    // Stable refs to the target colors and roughness
    const targetBaseColor = useRef(new THREE.Color());
    const targetFinishingColor = useRef(new THREE.Color());
    const targetEngravingColor = useRef(new THREE.Color());
    const targetRoughness = useRef(roughness);
    const prevModelVariation = useRef({ modelId: '', variation: '' });

    // Update target values and snap initial colors when switching variation/model to prevent flashes
    useEffect(() => {
        const isModel174 = modelId === "174";
        const hasConfig = !!(baseMetalColorVal || finishingMetalColorVal || engravingMeshColorVal || colorChangeVal);

        const resolveColor = (colorName: string | undefined, defaultHex: string): string => {
            if (!colorName) return defaultHex;
            const cleanName = colorName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const map = rootStore.designManager.colorMap;
            
            let mappedName = cleanName;
            if (cleanName === "rosegold" || cleanName === "rose") {
                mappedName = "rose gold";
            } else if (cleanName === "gold") {
                mappedName = "gold";
            } else if (cleanName === "silver") {
                mappedName = "silver";
            }

            if (map[mappedName]) return map[mappedName];
            return colorName;
        };

        if (hasConfig) {
            const changeMesh = (colorChangeVal || "").trim().toLowerCase().replace(/[^a-z0-9]/g, '');

            if (changeMesh === "basemetal" || changeMesh === "base" || changeMesh === "gold" || changeMesh === "both") {
                targetBaseColor.current.set(colorHex);
            } else {
                targetBaseColor.current.set(resolveColor(baseMetalColorVal, "#ffc35c"));
            }

            if (changeMesh === "finishingmetal" || changeMesh === "finishing" || changeMesh === "finshing" || changeMesh === "finshingmetal" || changeMesh === "silver" || changeMesh === "both") {
                targetFinishingColor.current.set(colorHex);
            } else {
                targetFinishingColor.current.set(resolveColor(finishingMetalColorVal, "#f6f5f5"));
            }

            if (changeMesh === "engravingmesh" || changeMesh === "engraving" || changeMesh === "engrave" || changeMesh === "basemetal" || changeMesh === "base" || changeMesh === "gold" || changeMesh === "both") {
                targetEngravingColor.current.set(colorHex);
            } else {
                targetEngravingColor.current.set(resolveColor(engravingMeshColorVal, "#ffc35c"));
            }
        } else {
            if (isModel174) {
                targetBaseColor.current.set("#f6f5f5");
                targetFinishingColor.current.set(colorHex);
                targetEngravingColor.current.set("#f6f5f5");
            } else {
                targetBaseColor.current.set(colorHex);
                targetFinishingColor.current.set("#f6f5f5");
                targetEngravingColor.current.set(colorHex);
            }
        }
        targetRoughness.current = roughness;

        // If the model or variation changed, snap colors immediately to prevent a visible slow transition on load
        const isNewModelOrVariation = prevModelVariation.current.modelId !== modelId || prevModelVariation.current.variation !== variation;
        if (isNewModelOrVariation) {
            const targetGoldColor = isModel174 ? targetFinishingColor.current : targetBaseColor.current;
            const targetSilverColor = isModel174 ? targetBaseColor.current : targetFinishingColor.current;

            goldMaterialRef.current.color.copy(targetGoldColor);
            silverMaterialRef.current.color.copy(targetSilverColor);
            engravingMaterialRef.current.color.copy(targetEngravingColor.current);

            // Update tracking ref
            prevModelVariation.current = { modelId, variation };
        }
    }, [colorHex, roughness, baseMetalColorVal, finishingMetalColorVal, engravingMeshColorVal, colorChangeVal, modelId, variation]);

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
        const isModel174 = modelId === "174";
        const targetBaseMaterial = isModel174 ? silverMaterialRef.current : goldMaterialRef.current;
        const targetFinishingMaterial = isModel174 ? goldMaterialRef.current : silverMaterialRef.current;

        if (hasNormalBase) {
            targetBaseMaterial.normalScale.set(normalIntensity, normalIntensity);
        }
        if (hasNormalFinishing) {
            targetFinishingMaterial.normalScale.set(normalIntensity, normalIntensity);
        }
    }, [normalIntensity, hasNormalBase, hasNormalFinishing, modelId]);

    // Lerp material properties toward target values every frame
    useFrame((_, delta) => {
        const factor = 1 - Math.pow(0.01, delta); // ~0.3s smooth transition

        // Target Clearcoat based on finish
        const targetClearcoat = finish === "polished" ? 1.0 : 0.0;

        const isModel174 = modelId === "174";
        const targetGoldColor = isModel174 ? targetFinishingColor.current : targetBaseColor.current;
        const targetSilverColor = isModel174 ? targetBaseColor.current : targetFinishingColor.current;

        // Update Gold Material
        goldMaterialRef.current.color.lerp(targetGoldColor, factor);
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
        silverMaterialRef.current.color.lerp(targetSilverColor, factor);
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
        engravingMaterialRef.current.color.lerp(targetEngravingColor.current, factor);
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

                const isModel174 = modelId === "174";
                const targetFinishingMaterial = isModel174 ? goldMaterialRef.current : silverMaterialRef.current;
                const targetBaseMaterial = isModel174 ? silverMaterialRef.current : goldMaterialRef.current;

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

                else if (mesh.name === "Engraving_Mesh") {
                    mesh.material = engravingMaterialRef.current;
                    if (originalNormalMap) {
                        engravingMaterialRef.current.normalMap = originalNormalMap;
                        if (originalNormalScale) {
                            engravingMaterialRef.current.normalScale.copy(originalNormalScale);
                        }
                    }
                }
                else if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Base_Metal" || mesh.name.includes("Base")) {
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

    return <primitive object={scene} visible={isVisible} rotation={[-Math.PI / 4, -Math.PI / 10, Math.PI / 3]} />;
});

const Model3DContent = observer(() => {
    const { size } = useThree();
    const { design3DManager } = rootStore;
    const { collection, modelId } = design3DManager.activeModel;

    // Load Environment Map for the Diamond Refraction (shared)
    const diamondEnvMap = useEnvironment({ files: '/08.hdr' });

    // Leva controls to scale the normals properly`
    const { normalIntensity } = useControls('Normal Map Controls', {
        normalIntensity: { value: 1.0, min: -5.0, max: 5.0, step: 0.05 },
    });

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
                        normalIntensity={normalIntensity}
                    />
                </ModelErrorBoundary>
            ))}
        </group>
    );
});

export default Model3DContent;