import React, { useEffect, useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";

// 3D Rendering Component
const Model3DContent = observer(() => {
    const { design3DManager } = rootStore;
    const { collection, modelId, variation, colorHex, modelUrl: url } = design3DManager.activeModel;

    console.log("Model URL:", url);
    console.log("Color:", colorHex);

    // Format selection for asset path
    const formattedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, '');
    const aoMapUrlGold = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Gold_Metal_AO.webp`;
    const aoMapUrlSilver = `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Silver_Metal_AO.webp`;

    console.log("AO Map URL:", aoMapUrlGold);
    console.log("AO Map Silver URL:", aoMapUrlSilver);


    // Load textures
    const aoTextureGold = useTexture(aoMapUrlGold);
    if (aoTextureGold) {
        aoTextureGold.flipY = false; // GLTF standard
    }

    const aoTextureSilver = useTexture(aoMapUrlSilver);
    if (aoTextureSilver) {
        aoTextureSilver.flipY = false; // GLTF standard
    }

    console.log("jdsfbds", aoTextureSilver)

    useEffect(() => {
        // Alert only if we have data loaded but no URL for the selection
        if (!url && design3DManager.ringsData) {
            alert("model is not present");
        }
    }, [url, design3DManager.ringsData]);

    if (!url) return null;

    const { scene, materials, mesh } = useGLTF(url);
    console.log(scene)

    console.log(materials)

    const goldMaterial = useMemo(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: colorHex,
            metalness: 1.0,
            roughness: 0.15,
            aoMap: aoTextureGold,
            aoMapIntensity: 1.0,
            normalScale: new THREE.Vector2(1.0, 1.0),
        });
        return material;
    }, [colorHex, aoTextureGold]);


    const silverMaterial = useMemo(() => {
        // 1. Create the base material
        const material = new THREE.MeshStandardMaterial({
            color: "#f6f5f5",
            roughness: 0.15,
            metalness: 1.0,
            aoMap: aoTextureSilver,
            aoMapIntensity: 2.5,

        });
        return material;
    }, [materials]);

    const diamondMaterial = useMemo(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: "#ff0000",

        });
        return material;
    }, []);



    useMemo(() => {
        scene.traverse((mesh) => {
            if (mesh.isMesh) {
                if (mesh.name.includes("Custom") || mesh.name === "Gold" || mesh.name === "Engraving_Mesh") {
                    mesh.material = goldMaterial;
                    // Ensure UV2 exists for aoMap
                    // if (mesh.geometry.attributes.uv && !mesh.geometry.attributes.uv2) {
                    //     mesh.geometry.setAttribute('uv2', mesh.geometry.attributes.uv);
                    // }
                }
                else if (mesh.name === "Diamond_Mesh") {
                    mesh.material = diamondMaterial;
                }
                else if (mesh.name === "Silver_Diamond" || mesh.name === "Silver_Metal") {
                    mesh.material = silverMaterial;
                }
            }
        })
    }, [scene, goldMaterial])

    return <primitive object={scene} rotation={[-Math.PI / 2, 0, Math.PI / 3]} />;
});

export default Model3DContent;
