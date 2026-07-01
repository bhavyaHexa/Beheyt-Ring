import React, { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import { rootStore } from "../../managers/stateManager";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { MeshBVH } from "three-mesh-bvh";
import { SingleModelProps } from "../../types";
import { alignModelToOrigin } from "../../utils/alignment";

// Custom loaders and helpers
import { SafeTextureLoader } from "../../utils/safeTextureLoader";
import { getTextureValue, getNormalMapValue } from "../../utils/textureHelpers";

// Materials and Sub-components
import MeshRefractionMaterialWebGL from "../../material/MeshRefractionMaterial.js";
import ModelAnimation from "./ModelAnimation";
import { MaterialLerpController } from "./MaterialLerpController";

export const SingleModel = observer(
  ({
    variation,
    diamondEnvMap,
    size,
    normalIntensity,
  }: SingleModelProps & {
    normalIntensity: number;
  }) => {
    const { design3DManager, designManager } = rootStore;
    const {
      collection,
      modelId,
      colorHex,
      roughness,
      finish,
      showDiamond,
      variation: selectedVariation,
    } = design3DManager.activeModel;

    const isVisible = selectedVariation === variation;

    // Get the variation data from ringsData
    const variationData = useMemo(() => {
      if (!design3DManager.ringsData) return null;
      return (
        design3DManager.ringsData.rings[collection]?.[modelId]?.[variation] ||
        null
      );
    }, [design3DManager.ringsData, collection, modelId, variation]);

    // Build URL and paths for this specific variation
    const url =
      variationData?.modelUrl ||
      design3DManager.rootStore.designManager.getModelUrlForVariation(
        variation,
      );
    const formattedCollection =
      collection.charAt(0).toUpperCase() + collection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, "");

    // Resolve AO map for Gold (Base Metal)
    const aoGoldUrl = getTextureValue(variationData?.textures, [
      "aoGold",
      "Base_metal_AO",
      "Base_Metal_AO",
      "Base_metal_Ao",
      "base_metal_ao",
      "Gold_Metal_AO",
      "Gold_metal_AO",
      "Gold_Metal_Ao",
      "gold_metal_ao",
      "Base_Metal",
      "Gold_Metal",
    ]);
    const hasAoGold = !!aoGoldUrl;

    // Resolve AO map for Silver (Finishing Metal)
    const aoSilverUrl = getTextureValue(variationData?.textures, [
      "aoSilver",
      "Finishing_Metal_Ao",
      "Finishing_Metal_AO",
      "Finishing_metal_AO",
      "Finishing_metal_Ao",
      "finishing_metal_ao",
      "Silver_Metal_AO",
      "Silver_metal_AO",
      "Silver_Metal_Ao",
      "silver_metal_ao",
      "Finishing_Metal",
      "Silver_Metal",
    ]);
    const hasAoSilver = !!aoSilverUrl;

    // Resolve AO map for Engraving Mesh
    const aoEngravingUrl = getTextureValue(variationData?.textures, [
      "aoEngraving",
      "aoEngrave",
      "aoEngravingMesh",
      "aoEngraving_Mesh",
      "Engraving_Mesh_AO",
      "Engraving_Mesh",
      "aoEngravingMetal",
      "aoEngraving_Metal",
      "Engraving_Metal_AO",
      "Engraving_Metal",
    ]);
    const hasAoEngraving = !!aoEngravingUrl;

    // Resolve AO map for No Diamond Mesh
    const aoNoDiamondUrl = getTextureValue(variationData?.textures, [
      "aoNoDiamond",
      "aoNoDiamondGold",
      "Base_Metal_NoDiamond_AO",
      "Base_metal_NoDiamond_AO",
      "base_metal_nodiamond_ao",
      "NoDiamond_AO",
      "nodiamond_ao",
    ]);
    const hasAoNoDiamond = !!aoNoDiamondUrl;

    // Resolve normal map for Base Metal (Gold)
    const normalBaseUrl =
      getTextureValue(variationData?.textures, [
        "normalBase",
        "Base_Metal_Normal",
        "Base_metal_Normal",
        "base_metal_normal",
        "Base_Metal_Normal.webp",
        "Base_metal_Normal.webp",
        "base_metal_normal.webp",
      ]) ||
      getNormalMapValue(variationData?.textures, [
        "Base_Metal_Normal",
        "base_metal_normal",
      ]);
    const hasNormalBase = !!normalBaseUrl;

    // Resolve normal map for Finishing Metal (Silver)
    const normalFinishingUrl =
      getTextureValue(variationData?.textures, [
        "normalFinishing",
        "Finishing_Metal_Normal",
        "Finishing_metal_Normal",
        "finishing_metal_normal",
        "Finishing_Metal_Normal.webp",
        "Finishing_metal_Normal.webp",
        "finishing_metal_normal.webp",
      ]) ||
      getNormalMapValue(variationData?.textures, [
        "Finishing_Metal_Normal",
        "finishing_metal_normal",
      ]);
    const hasNormalFinishing = !!normalFinishingUrl;

    const aoMapUrlGold = hasAoGold && aoGoldUrl ? aoGoldUrl : "";
    const aoMapUrlSilver = hasAoSilver && aoSilverUrl ? aoSilverUrl : "";
    const aoMapUrlEngraving =
      hasAoEngraving && aoEngravingUrl ? aoEngravingUrl : "";
    const aoMapUrlNoDiamond =
      hasAoNoDiamond && aoNoDiamondUrl ? aoNoDiamondUrl : "";
    const normalBaseMapUrl =
      hasNormalBase && normalBaseUrl ? normalBaseUrl : "";
    const normalFinishingMapUrl =
      hasNormalFinishing && normalFinishingUrl ? normalFinishingUrl : "";

    const hasRoughness = !!variationData?.textures?.roughness;
    const rawRoughness = variationData?.textures?.roughness;
    const roughnessMapUrl: string =
      hasRoughness && rawRoughness
        ? rawRoughness.endsWith("roughness.jpg")
          ? `/BehytRings/${formattedCollection}/${modelId}/${formattedVariation}/Roughness_Map.jpg`
          : rawRoughness
        : "";

    // Load textures safely for this variation
    const aoTextureGold = useLoader(
      SafeTextureLoader,
      aoMapUrlGold,
    ) as THREE.Texture;
    if (aoTextureGold) aoTextureGold.flipY = false;

    const aoTextureSilver = useLoader(
      SafeTextureLoader,
      aoMapUrlSilver,
    ) as THREE.Texture;
    if (aoTextureSilver) aoTextureSilver.flipY = false;

    const aoTextureEngraving = useLoader(
      SafeTextureLoader,
      aoMapUrlEngraving,
    ) as THREE.Texture;
    if (aoTextureEngraving) aoTextureEngraving.flipY = false;

    const aoTextureNoDiamond = useLoader(
      SafeTextureLoader,
      aoMapUrlNoDiamond,
    ) as THREE.Texture;
    if (aoTextureNoDiamond) aoTextureNoDiamond.flipY = false;

    const roughnessTexture = useLoader(
      SafeTextureLoader,
      roughnessMapUrl,
    ) as THREE.Texture;
    if (roughnessTexture) roughnessTexture.flipY = false;

    const normalBaseTexture = useLoader(
      SafeTextureLoader,
      normalBaseMapUrl,
    ) as THREE.Texture;
    if (normalBaseTexture) {
      normalBaseTexture.flipY = false;
      normalBaseTexture.colorSpace = THREE.NoColorSpace;
    }

    const normalFinishingTexture = useLoader(
      SafeTextureLoader,
      normalFinishingMapUrl,
    ) as THREE.Texture;
    if (normalFinishingTexture) {
      normalFinishingTexture.flipY = false;
      normalFinishingTexture.colorSpace = THREE.NoColorSpace;
    }

    // Load the GLTF scene
    const { scene } = useGLTF(url);

    // Create materials ONCE and hold them in refs
    const goldMaterialRef = useRef(
      new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 1,
        roughness: roughness,
        aoMap:
          !showDiamond && hasAoNoDiamond
            ? aoTextureNoDiamond
            : hasAoGold
              ? aoTextureGold
              : null,
        aoMapIntensity:
          (!showDiamond && hasAoNoDiamond) || hasAoGold ? 1.0 : 0.0,
        roughnessMap: hasRoughness ? roughnessTexture : null,
        clearcoat: finish === "polished" ? 1.0 : 0.0,
        normalScale: new THREE.Vector2(0, 0),
        normalMap: hasNormalBase ? normalBaseTexture : null,
        alphaMap: hasAoGold ? aoTextureGold : null,
      }),
    );

    const silverMaterialRef = useRef(
      new THREE.MeshPhysicalMaterial({
        color: "#f6f5f5",
        metalness: 1.0,
        roughness: 0.1,
        aoMap: hasAoSilver ? aoTextureSilver : null,
        aoMapIntensity: hasAoSilver ? 0.8 : 0.0,
        roughnessMap: hasRoughness ? roughnessTexture : null,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        normalScale: new THREE.Vector2(0, 0),
        normalMap: hasNormalFinishing ? normalFinishingTexture : null,
      }),
    );

    const engravingMaterialRef = useRef(
      new THREE.MeshPhysicalMaterial({
        color: colorHex,
        metalness: 1.0,
        roughness: roughness,
        aoMap: hasAoEngraving ? aoTextureEngraving : null,
        aoMapIntensity: hasAoEngraving ? 1.0 : 0.0,
        roughnessMap: hasRoughness ? roughnessTexture : null,
        clearcoat: finish === "polished" ? 1.0 : 0.0,
        clearcoatRoughness: 0.1,
      }),
    );

    // Keep textures in sync if they change
    useEffect(() => {
      // Dynamic AO targeting for base/gold material based on diamond state
      const targetAoMap =
        !showDiamond && hasAoNoDiamond
          ? aoTextureNoDiamond
          : hasAoGold
            ? aoTextureGold
            : null;

      goldMaterialRef.current.aoMap = targetAoMap;
      goldMaterialRef.current.aoMapIntensity = targetAoMap ? 1.0 : 0.0;
      goldMaterialRef.current.roughnessMap = hasRoughness
        ? roughnessTexture
        : null;
      goldMaterialRef.current.normalMap = hasNormalBase
        ? normalBaseTexture
        : null;
      goldMaterialRef.current.alphaMap = hasAoGold ? aoTextureGold : null;
      goldMaterialRef.current.needsUpdate = true;

      // Update Silver Material
      silverMaterialRef.current.aoMap = hasAoSilver ? aoTextureSilver : null;
      silverMaterialRef.current.aoMapIntensity = hasAoSilver ? 0.8 : 0.0;
      silverMaterialRef.current.roughnessMap = hasRoughness
        ? roughnessTexture
        : null;
      silverMaterialRef.current.normalMap = hasNormalFinishing
        ? normalFinishingTexture
        : null;
      silverMaterialRef.current.needsUpdate = true;

      // Update Engraving Material
      const activeEngravingAo =
        showDiamond && hasAoEngraving ? aoTextureEngraving : null;
      engravingMaterialRef.current.aoMap = activeEngravingAo;
      engravingMaterialRef.current.aoMapIntensity = activeEngravingAo
        ? 1.0
        : 0.0;
      engravingMaterialRef.current.roughnessMap = hasRoughness
        ? roughnessTexture
        : null;
      engravingMaterialRef.current.needsUpdate = true;

      // Log normal map application status for the visible variation
      if (isVisible) {
        if (hasNormalBase) {
          console.log(
            `Base Metal Normal Map applied: Yes (Path: ${normalBaseMapUrl})`,
            normalBaseTexture,
          );
        } else {
          console.log("Base Metal Normal Map applied: No");
        }

        if (hasNormalFinishing) {
          console.log(
            `Finishing Metal Normal Map applied: Yes (Path: ${normalFinishingMapUrl})`,
            normalFinishingTexture,
          );
        } else {
          console.log("Finishing Metal Normal Map applied: No");
        }
      }
    }, [
      aoTextureGold,
      aoTextureSilver,
      aoTextureEngraving,
      aoTextureNoDiamond,
      roughnessTexture,
      hasRoughness,
      normalBaseTexture,
      normalFinishingTexture,
      hasAoGold,
      hasAoSilver,
      hasAoEngraving,
      hasAoNoDiamond,
      hasNormalBase,
      hasNormalFinishing,
      isVisible,
      normalBaseMapUrl,
      normalFinishingMapUrl,
      showDiamond,
    ]);

    // Update normalScale when controls change
    useEffect(() => {
      const targetBaseMaterial = goldMaterialRef.current;
      const targetFinishingMaterial = silverMaterialRef.current;

      if (hasNormalBase) {
        targetBaseMaterial.normalScale.set(1.0, 1.0);
      }
      if (hasNormalFinishing) {
        targetFinishingMaterial.normalScale.set(1.0, 1.0);
      }
    }, [hasNormalBase, hasNormalFinishing]);

    // Global Presence Scanner
    const {
      hasNoDiamondBaseMesh,
      hasNoDiamondFinishingMesh,
      hasNoDiamondEngravingMesh,
    } = useMemo(() => {
      let base = false;
      let finishing = false;
      let engraving = false;

      if (!scene)
        return {
          hasNoDiamondBaseMesh: false,
          hasNoDiamondFinishingMesh: false,
          hasNoDiamondEngravingMesh: false,
        };

      scene.traverse((node) => {
        if (node.name) {
          const nameLower = node.name.toLowerCase();
          if (nameLower.includes("nodiamond")) {
            if (nameLower.includes("engrav")) {
              engraving = true;
            } else if (
              nameLower.includes("finishing") ||
              nameLower.includes("silver")
            ) {
              finishing = true;
            } else {
              base = true;
            }
          }
        }
      });
      return {
        hasNoDiamondBaseMesh: base,
        hasNoDiamondFinishingMesh: finishing,
        hasNoDiamondEngravingMesh: engraving,
      };
    }, [scene]);

    // Mesh Processing Logic & Diagnostics Loop
    useMemo(() => {
      if (!scene) return;

      const diagnosticReport: any[] = [];

      // Reset normal maps on shared materials before traversing
      goldMaterialRef.current.normalMap = null;
      silverMaterialRef.current.normalMap = null;
      engravingMaterialRef.current.normalMap = null;

      scene.traverse((node: THREE.Object3D) => {
        if (node instanceof THREE.Mesh) {
          const mesh = node;
          if (mesh.geometry) {
            mesh.geometry.computeVertexNormals();
          }

          // Exact hierarchical inclusion checker
          const checkName = (n: THREE.Object3D, searchStr: string): boolean => {
            let current: THREE.Object3D | null = n;
            const target = searchStr.toLowerCase();
            while (current) {
              if (current.name && current.name.toLowerCase().includes(target)) {
                return true;
              }
              current = current.parent;
            }
            return false;
          };

          const isNoDiamondMesh = checkName(mesh, "NoDiamond");

          // An asset CANNOT be classified as a diamond component if it is explicitly a "NoDiamond" asset
          const isDiamondMesh =
            !isNoDiamondMesh &&
            (checkName(mesh, "diamond") || checkName(mesh, "diam_centr"));

          const isEngravingMesh = checkName(mesh, "engrav");
          const isFinishingMesh =
            checkName(mesh, "finishing") || checkName(mesh, "silver");

          // Cache original maps
          if (mesh.userData.originalNormalMap === undefined) {
            mesh.userData.originalNormalMap =
              (mesh.material as any)?.normalMap || null;
            mesh.userData.originalNormalScale = (mesh.material as any)
              ?.normalScale
              ? (mesh.material as any).normalScale.clone()
              : null;
          }
          const originalNormalMap = mesh.userData.originalNormalMap;
          const originalNormalScale = mesh.userData.originalNormalScale;

          const targetFinishingMaterial = silverMaterialRef.current;
          const targetBaseMaterial = goldMaterialRef.current;

          const applyNormalMap = (
            material: THREE.MeshPhysicalMaterial,
            isBase: boolean,
          ) => {
            const hasNormal = isBase ? hasNormalBase : hasNormalFinishing;
            const texture = isBase ? normalBaseTexture : normalFinishingTexture;
            if (hasNormal) {
              material.normalMap = texture;
              material.normalScale.set(1.0, 1.0);
            } else if (originalNormalMap) {
              material.normalMap = originalNormalMap;
              if (originalNormalScale) {
                material.normalScale.copy(originalNormalScale);
              }
            }
          };

          // --- DYNAMIC VISIBILITY SWITCHING RULES ---
          if (showDiamond) {
            if (isNoDiamondMesh) {
              mesh.visible = false;
            } else {
              mesh.visible = true;
            }
          } else {
            // Diamond is turned off
            if (isDiamondMesh) {
              mesh.visible = false;
            } else if (isEngravingMesh) {
              if (isNoDiamondMesh) {
                mesh.visible = true;
              } else {
                mesh.visible = !hasNoDiamondEngravingMesh;
              }
            } else if (isFinishingMesh) {
              if (isNoDiamondMesh) {
                mesh.visible = true;
              } else {
                mesh.visible = !hasNoDiamondFinishingMesh;
              }
            } else {
              // Base Metal Meshes
              if (isNoDiamondMesh) {
                mesh.visible = true;
              } else {
                mesh.visible = !hasNoDiamondBaseMesh;
              }
            }
          }

          // Trace to context matrix
          diagnosticReport.push({
            "Mesh Name": mesh.name,
            "Parent Name": mesh.parent?.name || "None",
            "Is Diamond": isDiamondMesh,
            "Is NoDiamond": isNoDiamondMesh,
            "Is Finishing": isFinishingMesh,
            "Is Engraving": isEngravingMesh,
            "Calculated Visibility": mesh.visible,
          });

          // --- MATERIAL ASSIGNMENTS ---
          if (isDiamondMesh) {
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
          } else if (isEngravingMesh) {
            mesh.material = engravingMaterialRef.current;
            if (originalNormalMap) {
              engravingMaterialRef.current.normalMap = originalNormalMap;
              if (originalNormalScale) {
                engravingMaterialRef.current.normalScale.copy(
                  originalNormalScale,
                );
              }
            }
          } else if (isFinishingMesh) {
            mesh.material = targetFinishingMaterial;
            applyNormalMap(targetFinishingMaterial, false);
          } else {
            mesh.material = targetBaseMaterial;
            applyNormalMap(targetBaseMaterial, true);
          }

          if (mesh.material) {
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((mat) => {
              if (mat) {
                (mat as any).flatShading = false;
                mat.needsUpdate = true;
              }
            });
          }
        }
      });

      // Show fixed status mapping inside devtools
      if (isVisible) {
        console.log(
          `%c[SingleModel Matrix] --- Configuration State (showDiamond: ${showDiamond}) ---`,
          "color: #00ffca; font-weight: bold; font-size: 12px;",
        );
        console.table(diagnosticReport);
      }
    }, [
      scene,
      goldMaterialRef.current,
      silverMaterialRef.current,
      engravingMaterialRef.current,
      diamondEnvMap,
      size,
      showDiamond,
      collection,
      modelId,
      aoTextureEngraving,
      normalBaseTexture,
      normalFinishingTexture,
      hasNormalBase,
      hasNormalFinishing,
      normalIntensity,
      hasNoDiamondBaseMesh,
      hasNoDiamondFinishingMesh,
      hasNoDiamondEngravingMesh,
      isVisible,
    ]);

    const boundsData = useMemo(() => {
      if (!scene) return null;
      const res = alignModelToOrigin(
        scene,
        -Math.PI / 4,
        -Math.PI / 10,
        Math.PI / 3,
      );
      if (isVisible) {
        designManager.setModelMinY(res.minY || 0);
      }
      return res;
    }, [scene, isVisible, designManager]);

    return (
      <group visible={isVisible}>
        {scene && boundsData && (
          <>
            <primitive object={scene} />
            <ModelAnimation loadedObject={scene} />
            <MaterialLerpController
              goldMaterial={goldMaterialRef.current}
              silverMaterial={silverMaterialRef.current}
              engravingMaterial={engravingMaterialRef.current}
              variationData={variationData}
              roughness={roughness}
              colorHex={colorHex}
              modelId={modelId}
              variation={variation}
              finish={finish}
            />
          </>
        )}
      </group>
    );
  },
);
