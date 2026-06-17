import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { rootStore } from '../../managers/stateManager';
import { getValueIgnoreCaseAndSymbols } from '../../utils/textureHelpers';

interface MaterialLerpControllerProps {
    goldMaterial: THREE.MeshPhysicalMaterial;
    silverMaterial: THREE.MeshPhysicalMaterial;
    engravingMaterial: THREE.MeshPhysicalMaterial;
    variationData: any;
    roughness: number;
    colorHex: string;
    modelId: string;
    variation: string;
    finish: string;
}

export const MaterialLerpController: React.FC<MaterialLerpControllerProps> = ({
    goldMaterial,
    silverMaterial,
    engravingMaterial,
    variationData,
    roughness,
    colorHex,
    modelId,
    variation,
    finish,
}) => {
    // Resolve custom color fields from JSON configuration if present
    const baseMetalColorVal = getValueIgnoreCaseAndSymbols(variationData, ["Base_Metal_Color", "baseMetalColor", "Base Metal Color", "base_metal_color"]);
    const finishingMetalColorVal = getValueIgnoreCaseAndSymbols(variationData, ["finishing_metal_color", "finishingMetalColor", "finishing metal color", "finshing metal color", "finshing_metal_color", "finshingMetalColor"]);
    const engravingMeshColorVal = getValueIgnoreCaseAndSymbols(variationData, [
        "engraving_mesh_color", "engravingMeshColor", "engraving mesh color", 
        "engrave_mesh_color", "engraveMeshColor", "engrave mesh color",
        "engraving_metal_color", "engravingMetalColor", "engraving metal color",
        "engrave_metal_color", "engraveMetalColor", "engrave metal color"
    ]);
    const colorChangeVal = getValueIgnoreCaseAndSymbols(variationData, ["colorChange", "color_change", "colorChangeMesh", "color change"]);

    // Stable refs to the target colors and roughness
    const targetBaseColor = useRef(new THREE.Color());
    const targetFinishingColor = useRef(new THREE.Color());
    const targetEngravingColor = useRef(new THREE.Color());
    const targetRoughness = useRef(roughness);
    const prevModelVariation = useRef({ modelId: '', variation: '' });

    // Update target values and snap initial colors when switching variation/model to prevent flashes
    useEffect(() => {
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
            const parts = (colorChangeVal || "").split(',').map((s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

            const hasBase = parts.some((p: string) => p === "basemetal" || p === "base" || p === "gold" || p === "both");
            const hasFinishing = parts.some((p: string) => p === "finishingmetal" || p === "finishing" || p === "finshing" || p === "finshingmetal" || p === "silver" || p === "both");
            const hasEngraving = parts.some((p: string) => p === "engravingmesh" || p === "engravingmetal" || p === "engraving" || p === "engrave" || p === "basemetal" || p === "base" || p === "gold" || p === "both");

            if (hasBase) {
                targetBaseColor.current.set(colorHex);
            } else {
                targetBaseColor.current.set(resolveColor(baseMetalColorVal, "#ffba43"));
            }

            if (hasFinishing) {
                targetFinishingColor.current.set(colorHex);
            } else {
                targetFinishingColor.current.set(resolveColor(finishingMetalColorVal, "#f6f5f5"));
            }

            if (hasEngraving) {
                targetEngravingColor.current.set(colorHex);
            } else {
                targetEngravingColor.current.set(resolveColor(engravingMeshColorVal, "#ffba43"));
            }
        } else {
            targetBaseColor.current.set(colorHex);
            targetFinishingColor.current.set("#f6f5f5");
            targetEngravingColor.current.set(colorHex);
        }
        targetRoughness.current = roughness;

        // If the model or variation changed, snap colors immediately to prevent a visible slow transition on load
        const isNewModelOrVariation = prevModelVariation.current.modelId !== modelId || prevModelVariation.current.variation !== variation;
        if (isNewModelOrVariation) {
            const targetGoldColor = targetBaseColor.current;
            const targetSilverColor = targetFinishingColor.current;

            goldMaterial.color.copy(targetGoldColor);
            silverMaterial.color.copy(targetSilverColor);
            engravingMaterial.color.copy(targetEngravingColor.current);

            // Update tracking ref
            prevModelVariation.current = { modelId, variation };
        }
    }, [
        colorHex,
        roughness,
        baseMetalColorVal,
        finishingMetalColorVal,
        engravingMeshColorVal,
        colorChangeVal,
        modelId,
        variation,
        goldMaterial,
        silverMaterial,
        engravingMaterial,
    ]);

    // Lerp material properties toward target values every frame
    useFrame((_, delta) => {
        const factor = 1 - Math.pow(0.01, delta); // ~0.3s smooth transition

        // Target Clearcoat based on finish
        const targetClearcoat = finish === "polished" ? 1.0 : 0.0;

        const targetGoldColor = targetBaseColor.current;
        const targetSilverColor = targetFinishingColor.current;

        // Update Gold Material
        goldMaterial.color.lerp(targetGoldColor, factor);
        goldMaterial.roughness = THREE.MathUtils.lerp(
            goldMaterial.roughness,
            targetRoughness.current,
            factor
        );
        goldMaterial.clearcoat = THREE.MathUtils.lerp(
            goldMaterial.clearcoat,
            targetClearcoat,
            factor
        );
        goldMaterial.clearcoatRoughness = THREE.MathUtils.lerp(
            goldMaterial.clearcoatRoughness,
            0.1,
            factor
        );

        // Update Silver Material
        silverMaterial.color.lerp(targetSilverColor, factor);
        silverMaterial.roughness = THREE.MathUtils.lerp(
            silverMaterial.roughness,
            targetRoughness.current,
            factor
        );
        silverMaterial.clearcoat = THREE.MathUtils.lerp(
            silverMaterial.clearcoat,
            targetClearcoat,
            factor
        );
        silverMaterial.clearcoatRoughness = THREE.MathUtils.lerp(
            silverMaterial.clearcoatRoughness,
            0.1,
            factor
        );

        // Update Engraving Material
        engravingMaterial.color.lerp(targetEngravingColor.current, factor);
        engravingMaterial.roughness = THREE.MathUtils.lerp(
            engravingMaterial.roughness,
            targetRoughness.current,
            factor
        );
        engravingMaterial.clearcoat = THREE.MathUtils.lerp(
            engravingMaterial.clearcoat,
            targetClearcoat,
            factor
        );
        engravingMaterial.clearcoatRoughness = THREE.MathUtils.lerp(
            engravingMaterial.clearcoatRoughness,
            0.1,
            factor
        );
    });

    return null;
};
