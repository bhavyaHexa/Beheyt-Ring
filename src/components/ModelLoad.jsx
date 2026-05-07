import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import { useControls } from "leva";
import * as THREE from "three";

export default function ModelLoad({ url, ...props }) {
    const { scene, materials } = useGLTF(url);
    console.log("map  ", materials.Gold.map);
    console.log("map in Material is ", materials.Material.map);

    // CRITICAL: You must load the texture using useTexture.
    // Three.js materials cannot accept a string URL directly in the 'map' property.
    // If you pass a string, you get the "Cannot read properties of undefined (reading 'elements')" error.
    // const texture = useTexture("/AoMap/Artisanaal_174_AO.webp");

    const { goldColor } = useControls("Gold Material", {
        goldColor: { value: "#ffc495", label: "Color" }
    });

    // Ensure the texture orientation matches the GLTF model


    const goldMaterial = useMemo(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: "#ffc35c", //eab155 //ffc35c 
            normalMap: materials.Material.normalMap,
            metalness: 1.0,
            roughness: 0.0,

            // normalMapIntensity: 1.0,

            // // normalScale: materials.Material.normalScale,
            normalScale: new THREE.Vector2(1.0, 1.0),

        });
        return material;
    }, []);

    useEffect(() => {
        if (goldMaterial) {
            goldMaterial.color.set(goldColor);
        }
    }, [goldColor, goldMaterial]);


    const silverMaterial = useMemo(() => {
        const material = new THREE.MeshStandardMaterial({
            color: "#f6f5f5",
            roughness: 0.1,
            metalness: 1.0,
            aoMap: materials.Gold.map,
            aoMapIntensity: 1.0, // This must be the texture object, not the URL string
        });
        // material.map.repeat.set(2, 2),
        return material;
    }, []);

    console.log(silverMaterial.map)

    useMemo(() => {
        scene.traverse((mesh) => {
            if (mesh.isMesh) {
                if (mesh.name.includes("Object")) {
                    mesh.material = goldMaterial;
                } else {
                    mesh.material = silverMaterial;
                }
            }
        })
    }, [scene, goldMaterial, silverMaterial])

    return <primitive object={scene} {...props} />
}