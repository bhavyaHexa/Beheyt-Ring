import React, { useMemo, useEffect, useRef } from "react";
import { useGLTF, useEnvironment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { observer } from "mobx-react-lite";
import { rootStore } from "../../managers/stateManager";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import MeshRefractionMaterialWebGL from "../../material/MeshRefractionMaterial.js";
import { alignModelToOrigin } from "../../utils/alignment";

export const TestingModelContent = observer(() => {
  const { designManager, design3DManager } = rootStore;
  
  // Fall back to the active production model GLB URL if no custom GLB is dropped in yet
  const url = designManager.testingGlbUrl || design3DManager.activeModel.modelUrl;

  if (!url) return null;

  return <TestingModelInner url={url} />;
});

interface InnerProps {
  url: string;
}

const TestingModelInner = observer(({ url }: InnerProps) => {
  const { designManager } = rootStore;
  const { size } = useThree();
  
  // Load the GLTF. React Three Fiber Suspense will display loader automatically
  const { scene } = useGLTF(url);

  // Load Environment Map for the Diamond Refraction (shared)
  const diamondEnvMap = useEnvironment({ files: "/env/08.hdr" });

  const { colorHex, roughness, finish, showDiamond } = designManager.selection;

  // Create materials ONCE and hold them in refs (exactly like SingleModel)
  const goldMaterialRef = useRef(
    new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 1,
      roughness: roughness,
      clearcoat: finish === "polished" ? 1.0 : 0.0,
      normalScale: new THREE.Vector2(1.0, 1.0),
    })
  );

  const silverMaterialRef = useRef(
    new THREE.MeshPhysicalMaterial({
      color: "#f6f5f5",
      metalness: 1.0,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      normalScale: new THREE.Vector2(1.0, 1.0),
    })
  );

  const engravingMaterialRef = useRef(
    new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 1.0,
      roughness: roughness,
      clearcoat: finish === "polished" ? 1.0 : 0.0,
      clearcoatRoughness: 0.1,
    })
  );

  // Keep materials updated when customizer color/roughness/finish changes
  useEffect(() => {
    goldMaterialRef.current.color.set(colorHex);
    goldMaterialRef.current.roughness = roughness;
    goldMaterialRef.current.clearcoat = finish === "polished" ? 1.0 : 0.0;
    goldMaterialRef.current.needsUpdate = true;

    engravingMaterialRef.current.color.set(colorHex);
    engravingMaterialRef.current.roughness = roughness;
    engravingMaterialRef.current.clearcoat = finish === "polished" ? 1.0 : 0.0;
    engravingMaterialRef.current.needsUpdate = true;
  }, [colorHex, roughness, finish]);

  // Setup cloned scene, apply materials, center it, and calculate bounds
  const boundsData = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();

    // Check if there is a NoDiamond mesh in the scene
    let hasNoDiamondMesh = false;
    clone.traverse((node) => {
      if (node.name.includes("NoDiamond")) {
        hasNoDiamondMesh = true;
      }
    });

    // Traverse and apply materials & settings
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const mesh = node;
        
        // Cache original maps and attributes to preserve custom GLB details
        if (mesh.userData.originalNormalMap === undefined) {
          mesh.userData.originalNormalMap = (mesh.material as any)?.normalMap || null;
          mesh.userData.originalNormalScale = (mesh.material as any)?.normalScale 
            ? (mesh.material as any).normalScale.clone() 
            : null;
          mesh.userData.originalAoMap = (mesh.material as any)?.aoMap || null;
          mesh.userData.originalAoMapIntensity = (mesh.material as any)?.aoMapIntensity ?? 1.0;
        }

        const originalNormalMap = mesh.userData.originalNormalMap;
        const originalNormalScale = mesh.userData.originalNormalScale;
        const originalAoMap = mesh.userData.originalAoMap;
        const originalAoMapIntensity = mesh.userData.originalAoMapIntensity;

        if (mesh.geometry) {
          mesh.geometry.computeVertexNormals();
        }

        const targetBaseMaterial = goldMaterialRef.current;
        const targetFinishingMaterial = silverMaterialRef.current;

        // Apply materials based on standard mesh names
        if (mesh.name === "Silver_Metal") {
          mesh.visible = !showDiamond;
          mesh.material = targetFinishingMaterial;
          if (originalNormalMap) {
            targetFinishingMaterial.normalMap = originalNormalMap;
            if (originalNormalScale) {
              targetFinishingMaterial.normalScale.copy(originalNormalScale);
            }
          }
          if (originalAoMap) {
            targetFinishingMaterial.aoMap = originalAoMap;
            targetFinishingMaterial.aoMapIntensity = originalAoMapIntensity;
          }
        } else if (mesh.name === "Silver_Diamond") {
          mesh.visible = showDiamond;
          mesh.material = targetFinishingMaterial;
          if (originalNormalMap) {
            targetFinishingMaterial.normalMap = originalNormalMap;
            if (originalNormalScale) {
              targetFinishingMaterial.normalScale.copy(originalNormalScale);
            }
          }
          if (originalAoMap) {
            targetFinishingMaterial.aoMap = originalAoMap;
            targetFinishingMaterial.aoMapIntensity = originalAoMapIntensity;
          }
        } else if (mesh.name === "NoDiamond" || mesh.name.includes("NoDiamond")) {
          mesh.visible = !showDiamond;
        } else if (
          mesh.name === "Diamond_Mesh" ||
          mesh.name.includes("Diam_Centr") ||
          mesh.name.includes("Diamond_Metal")
        ) {
          mesh.visible = showDiamond;
          if (showDiamond) {
            const bvh = new MeshBVH(mesh.geometry, { strategy: 1 });
            mesh.material = new MeshRefractionMaterialWebGL({
              geometry: mesh.geometry,
              bvh: bvh,
              envMap: diamondEnvMap as THREE.Texture,
              resolution: new THREE.Vector2(size.width, size.height),
              ior: 2.4,
              bounces: 3,
              aberrationStrength: 0.005,
              envMapIntensity: 0.6,
              reflectivity: 0,
              fresnel: 0.3,
            });
          }
        } else if (
          mesh.name === "Engraving Mesh" ||
          mesh.name === "Engraving Metal" ||
          mesh.name === "Engraving_Mesh" ||
          mesh.name === "Engraving_Metal" ||
          mesh.name.includes("Engraving")
        ) {
          mesh.material = engravingMaterialRef.current;
          if (originalNormalMap) {
            engravingMaterialRef.current.normalMap = originalNormalMap;
            if (originalNormalScale) {
              engravingMaterialRef.current.normalScale.copy(originalNormalScale);
            }
          }
          if (originalAoMap) {
            engravingMaterialRef.current.aoMap = originalAoMap;
            engravingMaterialRef.current.aoMapIntensity = originalAoMapIntensity;
          }
        } else if (
          mesh.name.includes("Custom") ||
          mesh.name === "Gold" ||
          mesh.name === "Base_Metal" ||
          mesh.name === "Base_metal" ||
          mesh.name.includes("Base")
        ) {
          if (!mesh.name.includes("NoDiamond")) {
            mesh.visible = hasNoDiamondMesh ? showDiamond : true;
          }
          mesh.material = targetBaseMaterial;
          if (originalNormalMap) {
            targetBaseMaterial.normalMap = originalNormalMap;
            if (originalNormalScale) {
              targetBaseMaterial.normalScale.copy(originalNormalScale);
            }
          }
          if (originalAoMap) {
            targetBaseMaterial.aoMap = originalAoMap;
            targetBaseMaterial.aoMapIntensity = originalAoMapIntensity;
          }
        } else if (
          mesh.name === "Finishing_Metal" ||
          mesh.name.includes("Finishing")
        ) {
          mesh.visible = true;
          mesh.material = targetFinishingMaterial;
          if (originalNormalMap) {
            targetFinishingMaterial.normalMap = originalNormalMap;
            if (originalNormalScale) {
              targetFinishingMaterial.normalScale.copy(originalNormalScale);
            }
          }
          if (originalAoMap) {
            targetFinishingMaterial.aoMap = originalAoMap;
            targetFinishingMaterial.aoMapIntensity = originalAoMapIntensity;
          }
        }

        // Apply smooth shading universally
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat) {
              (mat as any).flatShading = false;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });

    // Align and rotate the model to match exactly the production ring showcase rotation
    const alignmentResult = alignModelToOrigin(
      clone,
      -Math.PI / 4,
      -Math.PI / 10,
      Math.PI / 3
    );

    const sizeVec = new THREE.Vector3();
    let maxDim = 1.0;
    if (alignmentResult.rotatedBox) {
      alignmentResult.rotatedBox.getSize(sizeVec);
      maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
    } else {
      sizeVec.copy(alignmentResult.localSize);
      maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
    }

    const minY = alignmentResult.minY ?? 0;

    return {
      clone,
      minY,
      maxDim,
    };
  }, [scene, showDiamond, size.width, size.height, diamondEnvMap]);

  // Compute final scale based on manual setting and autoScale option
  const finalScale = useMemo(() => {
    if (!boundsData) return 1.0;
    let scale = designManager.testingScale;
    if (designManager.testingAutoScale && boundsData.maxDim > 0) {
      // Scale to target dimension of 2.2 units (similar to default rings sizing)
      scale *= 2.2 / boundsData.maxDim;
    }
    return scale;
  }, [boundsData, designManager.testingScale, designManager.testingAutoScale]);

  // Update minY on the designManager store reactively so shadows align underneath
  useEffect(() => {
    if (boundsData) {
      const scaledMinY = boundsData.minY * finalScale;
      designManager.setTestingMinY(scaledMinY);
    } else {
      designManager.setTestingMinY(0);
    }
  }, [boundsData, finalScale, designManager]);

  if (!boundsData) return null;

  return (
    <group scale={[finalScale, finalScale, finalScale]}>
      <primitive object={boundsData.clone} />
    </group>
  );
});

export default TestingModelContent;
