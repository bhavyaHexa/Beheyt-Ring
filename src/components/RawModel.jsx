import { useGLTF } from "@react-three/drei";
import { useMemo, useState, useEffect } from "react";
import { MeshPhysicalMaterial, TextureLoader } from "three";

export default function RawModel({ url, roughnessMapUrl, roughnessIntensity, roughnessRepeat, ...props }) {
  const { scene } = useGLTF(url);

  // Define simple materials
  const goldMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#ffd28a", // Gold color
    metalness: 1.0,
    roughness: 0.1,
  }), []);

  const silverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5", // Silver color
    metalness: 1.0,
    roughness: 0.15,
  }), []);

  // Extract existing roughness map and handle external one
  const [externalRoughnessMap, setExternalRoughnessMap] = useState(null);

  useEffect(() => {
    if (roughnessMapUrl) {
      new TextureLoader().load(roughnessMapUrl, (tex) => {
        tex.flipY = false;
        setExternalRoughnessMap(tex);
      });
    } else {
      setExternalRoughnessMap(null);
    }
  }, [roughnessMapUrl]);

  // Determine the active map and log it
  useEffect(() => {
    const originalRoughnessMap = scene.getObjectByName("Circle002")?.material?.roughnessMap;
    const activeMap = externalRoughnessMap || originalRoughnessMap;

    if (activeMap) {
      activeMap.wrapS = activeMap.wrapT = THREE.RepeatWrapping;
      activeMap.repeat.set(roughnessRepeat[0], roughnessRepeat[1]);
      activeMap.needsUpdate = true;
    }

    if (externalRoughnessMap) {
      console.log(`Applied Roughness Map: External Map (from URL). Repeat: [${roughnessRepeat[0]}, ${roughnessRepeat[1]}]`);
    } else if (originalRoughnessMap) {
      console.log(`Applied Roughness Map: Original Model Map on Circle002 (${originalRoughnessMap.name || 'unnamed'}). Repeat: [${roughnessRepeat[0]}, ${roughnessRepeat[1]}]`);
    }
  }, [externalRoughnessMap, scene, roughnessRepeat]);

  // Apply materials to meshes based on their names
  useMemo(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        const originalRoughnessMap = node.material?.roughnessMap;
        if (originalRoughnessMap) {
          console.log(`Original Roughness Map found on ${node.name}:`, originalRoughnessMap);
        }

        // Apply Gold to meshes that include "Object" in their name
        if (node.name.includes("Object")) {
          node.material = goldMaterial;
        } else {
          // Apply Silver to other meshes
          node.material = silverMaterial;
        }

        // Apply roughness map if available (Specifically for Circle002)
        if (node.name === "Circle002" && (externalRoughnessMap || originalRoughnessMap)) {
          node.material.roughnessMap = externalRoughnessMap || originalRoughnessMap;
          node.material.roughness = roughnessIntensity; // Use the controlled intensity
          node.material.needsUpdate = true;
        }
      }
    });
  }, [scene, goldMaterial, silverMaterial, externalRoughnessMap]);

  return <primitive object={scene} {...props} />;
}
