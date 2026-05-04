import { useGLTF, Clone } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { MeshPhysicalMaterial, Vector2, TextureLoader, MeshBasicMaterial } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, aoMapUrl, aoIntensity, viewOnlyAOMap, ...props }) {
  const { scene, nodes } = useGLTF(url);

  // Extract the original normal map safely
  const originalNormalMap = useMemo(() => {
    return nodes.Object002_Low?.material?.normalMap || null;
  }, [nodes]);

  // Extract the original AO map safely
  const originalAOMap = useMemo(() => {
    const aoMap = nodes.Object002_Low?.material?.aoMap || null;
    console.log("Original AO Map extracted from model:", aoMap);
    return aoMap;
  }, [nodes]);

  // State for external AO map
  const [externalAOMap, setExternalAOMap] = useState(null);

  useEffect(() => {
    if (aoMapUrl) {
      console.log("Loading external AO map from URL:", aoMapUrl);
      new TextureLoader().load(
        aoMapUrl,
        (texture) => {
          texture.flipY = false;
          // Set channel to 1 if it needs secondary UVs, or keep it 0 if it uses primary
          // texture.channel = 1; 
          setExternalAOMap(texture);
          console.log("Successfully loaded external AO map:", texture);
        },
        undefined,
        (err) => {
          console.error("Failed to load external AO map:", err);
        }
      );
    } else {
      setExternalAOMap(null);
    }
  }, [aoMapUrl]);

  // Determine which AO map to use
  const activeAOMap = externalAOMap || originalAOMap;

  // Define Materials
  const customGoldMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#fcc266",
    metalness: 1.0,
    roughness: 0.0,
    normalMap: originalNormalMap,
    normalScale: new Vector2(normalIntensity, normalIntensity),
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
    envMapIntensity: envIntensity,
  }), [originalNormalMap, normalIntensity, activeAOMap, aoIntensity, envIntensity]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughness: 0.0,
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
    envMapIntensity: envIntensity,
  }), [activeAOMap, aoIntensity, envIntensity]);

  // Material to view only the AO map
  const aoOnlyMaterial = useMemo(() => {
    if (activeAOMap) {
      return new MeshBasicMaterial({ map: activeAOMap });
    }
    return new MeshBasicMaterial({ color: "white" }); // Fallback if no AO map
  }, [activeAOMap]);

  return (
    <>
      {/* The Original Ring */}
      <Clone
        object={scene}
        castShadow
        receiveShadow
        inject={(node) => {
          if (node.isMesh) {
            if (viewOnlyAOMap) return <primitive object={aoOnlyMaterial} attach="material" />;
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
            if (viewOnlyAOMap) return <primitive object={aoOnlyMaterial} attach="material" />;
            return node.name.includes("Object002")
              ? <primitive object={customGoldMaterial} attach="material" />
              : <primitive object={customSilverMaterial} attach="material" />
          }
        }}
      />
    </>
  );
}