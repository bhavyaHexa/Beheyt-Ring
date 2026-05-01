import { useGLTF, Clone } from "@react-three/drei";
import { useMemo } from "react";
import { MeshPhysicalMaterial, Vector2 } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, ...props }) {
  const { scene, nodes } = useGLTF(url);

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