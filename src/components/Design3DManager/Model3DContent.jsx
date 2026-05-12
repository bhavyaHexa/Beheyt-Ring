import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../../managers/stateManager';
import * as THREE from "three";

// 3D Rendering Component
const Model3DContent = observer(() => {
    const { design3DManager } = rootStore;
    console.log(
        design3DManager.activeModel.modelUrl
    )
    const url = design3DManager.activeModel.modelUrl;

    const color = design3DManager.activeModel.colorHex;

    console.log(color)

    console.log("Rendering Model URL:", url)

    useEffect(() => {
        // Alert only if we have data loaded but no URL for the selection
        if (!url && design3DManager.ringsData) {
            alert("model is not present");
        }
    }, [url, design3DManager.ringsData]);

    if (!url) return null;

    const { scene, materials } = useGLTF(url);

    console.log(materials)

    const goldMaterial = useMemo(() => {
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 1.0,
            roughness: 0.2,
            normalScale: new THREE.Vector2(1.0, 1.0),
        });
        return material;
    }, [color]);


    const silverMaterial = useMemo(() => {
        // 1. Create the base material
        const material = new THREE.MeshStandardMaterial({
            color: "#f6f5f5",
            roughness: 0.15,
            metalness: 1.0,
            // aoMap: materials.Silver.map,
            // aoMapIntensity: 1.5,
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
