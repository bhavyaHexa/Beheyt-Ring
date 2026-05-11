import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import { useControls } from "leva";
import * as THREE from "three";

export default function ModelLoad({ url, ...props }) {
    const { scene, materials } = useGLTF(url);
    console.log("materials", materials);

    // console.log("map  ", materials.Gold.map);
    // console.log("map in Material is ", materials.Material.map);

    // CRITICAL: You must load the texture using useTexture.
    // Three.js materials cannot accept a string URL directly in the 'map' property.
    // If you pass a string, you get the "Cannot read properties of undefined (reading 'elements')" error.
    // const texture = useTexture("/AoMap/Artisanaal_174_AO.webp");

    const { goldColor, showNormalMap, normalIntensity } = useControls("Gold Material", {
        goldColor: { value: "#ffc35c", label: "Color" },
        showNormalMap: { value: true, label: "Enable Normal Map" },
        normalIntensity: { value: 1.0, min: 0, max: 5, step: 0.1, label: "Normal Intensity" }
    });

    const goldMaterial = useMemo(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: "#ffc35c",
            metalness: 1.0,
            roughness: 0.0,
            normalScale: new THREE.Vector2(1.0, 1.0),
        });
        return material;
    }, []);

    useEffect(() => {
        if (goldMaterial) {
            goldMaterial.color.set(goldColor);
            // Apply or remove normal map based on the toggle
            goldMaterial.normalMap = showNormalMap ? materials.Gold?.normalMap : null;
            goldMaterial.normalScale.set(normalIntensity, normalIntensity);
            goldMaterial.needsUpdate = true;
        }
    }, [goldColor, showNormalMap, normalIntensity, goldMaterial, materials]);


    const silverMaterial = useMemo(() => {
        // 1. Create the base material
        const material = new THREE.MeshStandardMaterial({
            color: "#f6f5f5",
            roughness: 0.15,
            metalness: 1.0,
            aoMap: materials.Silver.map,
            aoMapIntensity: 1.5,

        });

        // 2. Conditionally apply the normal map
        if (materials.Silver?.normalMap) {
            material.normalMap = materials.Silver.normalMap;
            material.normalScale.set(1, 1);
            console.log("material is present", materials.Silver.normalMap)
        }

        return material;
    }, [materials]); // Added materials as a dependency

    // const engraveMaterial = useMemo(() => {
    //     const material = new THREE.MeshStandardMaterial({
    //         color: "#f6f5f5",
    //         aoMap: materials.Silver.map,
    //         roughness: 0.15,
    //         metalness: 1.0

    //     });
    //     return material;
    // }, []);

    console.log(silverMaterial.map)

    useMemo(() => {
        scene.traverse((mesh) => {
            if (mesh.isMesh) {
                if (mesh.name.includes("Custom") || mesh.name.includes("Gold")) {
                    mesh.material = goldMaterial;
                }
                // else if (mesh.name.includes("Engraving")) {
                //     mesh.material = engraveMaterial;
                // }
                else {
                    mesh.material = silverMaterial;
                }
            }
        })
    }, [scene, goldMaterial, silverMaterial])

    return <primitive object={scene} {...props} />
}