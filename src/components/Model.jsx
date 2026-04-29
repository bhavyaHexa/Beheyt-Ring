import { useGLTF, useEnvironment } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { MeshPhysicalMaterial, TextureLoader, Vector2 } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, ...props }) {
  // Use nodes instead of scene for direct access to meshes
  const { nodes, scene } = useGLTF(url);
  const envMap = useEnvironment({ files: envUrl });

  // Normal Map Intensity Controls
  const { normalIntensity } = useControls("Normal Map", {
    normalIntensity: { value: 1, min: 0, max: 5, step: 0.05, label: "Intensity" }
  });

  // Extract the original normal map from the model
  // This is the PRIORITY fix: we need to keep the original normal map if we replace the material
  const originalNormalMap = useMemo(() => {
    if (nodes.Object002_Low && nodes.Object002_Low.material) {
      return nodes.Object002_Low.material.normalMap;
    }
    return null;
  }, [nodes]);

  const customGoldMaterial = useMemo(() => {
    return new MeshPhysicalMaterial({
      color: "#febe57",
      metalness: 1.0,
      roughness: 0.1,
      envMapIntensity: 0.5,
      // Apply the normal map and its intensity
      normalMap: originalNormalMap,
      normalScale: new Vector2(normalIntensity, normalIntensity),
    });
  }, [envMap, originalNormalMap, normalIntensity]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughness: 0.1,
    envMapIntensity: 1.0,
  }), [envMap]);

  // Apply materials using nodes directly
  useEffect(() => {
    // Loop through all nodes and assign materials based on name
    Object.keys(nodes).forEach((key) => {
      const node = nodes[key];
      // console.log(node)
      if (node.isMesh) {
        if (node.name.includes("Object002")) {
          node.material = customGoldMaterial;
        } else {
          // Every other mesh gets silver material as requested
          node.material = customSilverMaterial;
        }
      }
    });
  }, [nodes, customGoldMaterial, customSilverMaterial]);

  return <primitive object={scene} scale={1} {...props} />;
}
