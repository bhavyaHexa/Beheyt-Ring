import { useGLTF, Clone } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { MeshPhysicalMaterial, Vector2, TextureLoader, MeshBasicMaterial } from "three";
import { useControls } from "leva";

export default function Model({ url, envUrl, clonePos, cloneRot, cloneScale, normalIntensity, envIntensity, aoMapUrl, aoIntensity, viewOnlyAOMap, roughnessMapUrl, roughnessIntensity, roughnessRepeat, ...props }) {
  const { scene, nodes } = useGLTF(url);
  console.log("Original Ring Position:", props.position || [0, 0, 0]);
  console.log("Original Ring Rotation:", props.rotation);

  console.log("Cloned Ring Position:", clonePos);

  // Extract maps safely from the model nodes
  const originalNormalMap = useMemo(() => {
    return nodes.Object002_Low?.material?.normalMap || null;
  }, [nodes]);


  // Extract the original AO map safely
  const originalAOMap = useMemo(() => {
    const aoMap = nodes.Object002_Low?.material?.aoMap || null;
    console.log("Original AO Map extracted from model:", aoMap);
    return aoMap;
  }, [nodes]);

  // Extract the original Roughness map safely, checking Circle002 first
  const originalRoughnessMap = useMemo(() => {
    const roughnessMap = nodes.Circle002?.material?.roughnessMap || nodes.Object002_Low?.material?.roughnessMap || null;
    if (roughnessMap) {
      console.log("Original Roughness Map extracted from model:", roughnessMap);
    } else {
      console.log("No Roughness Map found in the original model.");
    }
    return roughnessMap;
  }, [nodes]);

  // State for external maps
  const [externalAOMap, setExternalAOMap] = useState(null);
  const [externalRoughnessMap, setExternalRoughnessMap] = useState(null);

  useEffect(() => {
    if (aoMapUrl) {
      console.log("Loading external AO map from URL:", aoMapUrl);
      new TextureLoader().load(
        aoMapUrl,
        (texture) => {
          texture.flipY = false;
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

  useEffect(() => {
    if (roughnessMapUrl) {
      console.log("Loading external Roughness map from URL:", roughnessMapUrl);
      new TextureLoader().load(
        roughnessMapUrl,
        (texture) => {
          texture.flipY = false;
          setExternalRoughnessMap(texture);
          console.log("Successfully loaded external Roughness map:", texture);
        },
        undefined,
        (err) => {
          console.error("Failed to load external Roughness map:", err);
        }
      );
    } else {
      setExternalRoughnessMap(null);
    }
  }, [roughnessMapUrl]);

  // Determine which maps to use
  const activeAOMap = externalAOMap || originalAOMap;
  const activeRoughnessMap = externalRoughnessMap || originalRoughnessMap;

  // Log which roughness map is applied and its repeat
  useEffect(() => {
    if (activeRoughnessMap) {
      activeRoughnessMap.wrapS = activeRoughnessMap.wrapT = THREE.RepeatWrapping;
      activeRoughnessMap.repeat.set(roughnessRepeat[0], roughnessRepeat[1]);
      activeRoughnessMap.needsUpdate = true;
    }

    if (externalRoughnessMap) {
      console.log(`Applied Roughness Map: External Map (from URL). Repeat: [${roughnessRepeat[0]}, ${roughnessRepeat[1]}]`);
    } else if (originalRoughnessMap) {
      console.log(`Applied Roughness Map: Original Model Map (${originalRoughnessMap.name || 'unnamed'}). Repeat: [${roughnessRepeat[0]}, ${roughnessRepeat[1]}]`);
    } else {
      console.log("Applied Roughness Map: None (using base value)");
    }
  }, [activeRoughnessMap, externalRoughnessMap, originalRoughnessMap, roughnessRepeat]);

  // Define Materials
  const customGoldMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#fcc266",
    metalness: 1.0,
    roughness: 0.1,
    normalMap: originalNormalMap,
    normalScale: new Vector2(normalIntensity, normalIntensity),
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
    envMapIntensity: envIntensity,
  }), [originalNormalMap, normalIntensity, activeAOMap, aoIntensity, envIntensity]);

  const customSilverMaterial = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughness: 0.2,
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
    envMapIntensity: envIntensity,
  }), [activeAOMap, aoIntensity, envIntensity]);

  const circle002Material = useMemo(() => new MeshPhysicalMaterial({
    color: "#f6f5f5",
    metalness: 1.0,
    roughness: activeRoughnessMap ? roughnessIntensity : 0.2,
    roughnessMap: activeRoughnessMap,
    aoMap: activeAOMap,
    aoMapIntensity: aoIntensity,
    envMapIntensity: envIntensity,
  }), [activeAOMap, aoIntensity, envIntensity, activeRoughnessMap, roughnessIntensity]);
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
              return <primitive object={circle002Material} attach="material" />
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
              return <primitive object={circle002Material} attach="material" />
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
