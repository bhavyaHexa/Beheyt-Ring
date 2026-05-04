import { useGLTF, Clone, useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import { MeshPhysicalMaterial, Vector2 } from "three";
import { useGLTF, Clone } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { MeshPhysicalMaterial, Vector2, TextureLoader, MeshBasicMaterial } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, goldRoughness, silverRoughness, roughnessMapUrl, ...props }) {
  export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, aoMapUrl, aoIntensity, viewOnlyAOMap, ...props }) {
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
      roughness: goldRoughness,
      normalMap: originalNormalMap,
      normalScale: new Vector2(normalIntensity, normalIntensity),
      aoMap: activeAOMap,
      aoMapIntensity: aoIntensity,
      envMapIntensity: envIntensity,
    }), [originalNormalMap, normalIntensity, envIntensity, goldRoughness]);
  }), [originalNormalMap, normalIntensity, activeAOMap, aoIntensity, envIntensity]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughnessMap: roughnessMapUrl ? externalRoughnessMap : circleRoughnessMap,

    roughness: silverRoughness,
    roughness: 0.0,
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
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
          if (node.name === "Circle002") {
            return <primitive object={customSilverMaterial} attach="material" />
          }
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
          if (node.name === "Circle002") {
            return <primitive object={customSilverMaterial} attach="material" />
          }
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