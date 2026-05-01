import { useGLTF, Clone } from "@react-three/drei";
import { useMemo } from "react";
import { MeshPhysicalMaterial, Vector2 } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, ...props }) {
  const { scene, nodes } = useGLTF(url);
  const { normalIntensity } = useControls("Normal Map", {
    normalIntensity: { value: 1, min: 0, max: 5, step: 0.05, label: "Intensity" }
  });

  const { envIntensity } = useControls('Lighting', {
    envIntensity: { value: 1.0, min: 0, max: 10, step: 0.1, label: 'Intensity' },
  });

  // Extract the original normal map safely
  const originalNormalMap = useMemo(() => {
    return nodes.Object002_Low?.material?.normalMap || null;
  }, [nodes]);

  // Define Materials
  const customGoldMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#fcc266",
    metalness: 1.0,
    roughness: 0.0,
    normalMap: originalNormalMap,
    normalScale: new Vector2(normalIntensity, normalIntensity),
    envMapIntensity: envIntensity,
  }), [originalNormalMap, normalIntensity, envIntensity]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughness: 0.0,
    envMapIntensity: envIntensity,
  }), [envIntensity]);

  const { clonePos, cloneRot, cloneScale } = useControls("Cloned Ring", {
    clonePos: { value: [1.1, 0.0, 1.3], step: 0.1 },
    cloneRot: { value: [-4.1, 0.1, 1.2], step: 0.1 },
    cloneScale: { value: 1, step: 0.05 }
  });

  return (
    <>
      {/* The Original Ring */}
      <Clone
        object={scene}
        castShadow
        receiveShadow
        inject={(node) => {
          if (node.isMesh) {
            return node.name.includes("Object002")
              ? <primitive object={customGoldMaterial} attach="material" />
              : <primitive object={customSilverMaterial} attach="material" />
          }
        }}
        {...props}
      />

      {/* The Cloned Ring */}
      <Clone
        object={scene}
        castShadow
        receiveShadow
        position={clonePos}
        rotation={cloneRot}
        scale={cloneScale}
        inject={(node) => {
          if (node.isMesh) {
            return node.name.includes("Object002")
              ? <primitive object={customGoldMaterial} attach="material" />
              : <primitive object={customSilverMaterial} attach="material" />
          }
        }}
      />
    </>
  );
}