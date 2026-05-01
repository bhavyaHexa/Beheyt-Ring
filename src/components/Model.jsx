import { useGLTF, Clone, useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import { MeshPhysicalMaterial, Vector2 } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, goldRoughness, silverRoughness, roughnessMapUrl, ...props }) {
  const { scene, nodes } = useGLTF(url);

  console.log(envUrl);

  // Extract maps safely from the model nodes
  const originalNormalMap = useMemo(() => {
    return nodes.Object002_Low?.material?.normalMap || null;
  }, [nodes]);

  const circleRoughnessMap = useMemo(() => {
    // Extract roughness map specifically from Circle002
    return nodes.Circle002?.material?.roughnessMap || null;
  }, [nodes]);

  // Load external roughness map if URL is provided
  // We use a 1x1 transparent pixel as fallback to avoid useTexture issues with empty strings
  const fallbackTexture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const externalRoughnessMap = useTexture(roughnessMapUrl || fallbackTexture);

  useMemo(() => {
    if (externalRoughnessMap && roughnessMapUrl) {
      externalRoughnessMap.wrapS = externalRoughnessMap.wrapT = 1000; // RepeatWrapping
      externalRoughnessMap.needsUpdate = true;
    }
  }, [externalRoughnessMap, roughnessMapUrl]);

  // Define Materials
  const customGoldMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#fcc266",
    metalness: 1.0,
    roughness: goldRoughness,
    normalMap: originalNormalMap,
    normalScale: new Vector2(normalIntensity, normalIntensity),
    envMapIntensity: envIntensity,
  }), [originalNormalMap, normalIntensity, envIntensity, goldRoughness]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughnessMap: roughnessMapUrl ? externalRoughnessMap : circleRoughnessMap,

    roughness: silverRoughness,
    envMapIntensity: envIntensity,
  }), [envIntensity, silverRoughness, roughnessMapUrl, externalRoughnessMap, circleRoughnessMap]);

  // Console log for tracking which map is used
  useEffect(() => {
    const isExternal = !!roughnessMapUrl;
    const mapType = isExternal ? "External (Leva)" : (circleRoughnessMap ? "Model Default" : "None");
    const source = isExternal ? roughnessMapUrl : (circleRoughnessMap?.name || circleRoughnessMap?.uuid || "N/A");

    console.log(`%c[Roughness Control] Using ${mapType} map for Circle002`, "color: #3b82f6; font-weight: bold;");
    console.log(`Source/URL: ${source}`);
  }, [roughnessMapUrl, circleRoughnessMap, externalRoughnessMap]);

  return (
    <>
      {/* The Original Ring */}
      <Clone
        object={scene}
        castShadow
        receiveShadow
        inject={(node) => {
          if (node.isMesh) {
            if (node.name === "Circle002") {
              return <primitive object={customSilverMaterial} attach="material" />
            }
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
            if (node.name === "Circle002") {
              return <primitive object={customSilverMaterial} attach="material" />
            }
            return node.name.includes("Object002")
              ? <primitive object={customGoldMaterial} attach="material" />
              : <primitive object={customSilverMaterial} attach="material" />
          }
        }}
      />
    </>
  );
}