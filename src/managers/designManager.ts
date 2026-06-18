import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";
import { DesignSelection, ColorType, FinishType } from "../types";
import { getTextureValue, getNormalMapValue } from "../utils/textureHelpers";

export class DesignManagerStore {
  selectedCollection: string = "Briljant";
  selectedModelId: string = "546";
  selectedVariation: string = "4.5mm";
  selectedColor: ColorType = "gold";
  selectedFinish: FinishType = "polished";
  showDiamond: boolean = true;
  currentView: "home" | "engrave" = "home";
  currentRoute: string = window.location.pathname;
  modelMinY: number = 0;
  normalIntensity: number = 1.0;
  autoRotate: boolean = true;
  autoRotateSpeed: number = 0.5;
  useAntiAliasing: boolean = true;

  colorMap: Record<string, string> = {
    gold: "#ffba43",
    silver: "#f6f5f5",
    "rose gold": "#e8a274", //f4a068
  };

  get selectedColorHex(): string {
    return this.colorMap[this.selectedColor.toLowerCase()];
  }

  get isDiamondAvailable(): boolean {
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (ringsData) {
      const collectionData = ringsData.rings[this.selectedCollection];
      if (collectionData) {
        const modelData = collectionData[this.selectedModelId];
        if (modelData) {
          const variationData = modelData[this.selectedVariation];
          if (variationData) {
            return !!variationData.isDiamond;
          }
        }
      }
    }
    return false;
  }

  syncDiamondState(respectUrlParam: boolean = false) {
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (ringsData) {
      const collectionData = ringsData.rings[this.selectedCollection];
      if (collectionData) {
        const modelData = collectionData[this.selectedModelId];
        if (modelData) {
          const variationData = modelData[this.selectedVariation];
          if (variationData) {
            const hasDiamond = !!variationData.isDiamond;
            if (!hasDiamond) {
              this.showDiamond = false;
            } else {
              if (respectUrlParam) {
                const params = new URLSearchParams(window.location.search);
                const diamondParam = params.get("diamond");
                if (diamondParam !== null) {
                  this.showDiamond = diamondParam === "true";
                  return;
                }
              }
              if (this.selectedCollection.toLowerCase() === "artisanal") {
                this.showDiamond = false;
              } else {
                this.showDiamond = true;
              }
            }
          }
        }
      }
    }
  }

  getModelUrlForVariation(variation: string): string {
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (ringsData) {
      const collectionData = ringsData.rings[this.selectedCollection];
      if (collectionData) {
        const modelData = collectionData[this.selectedModelId];
        if (modelData) {
          const variationData = modelData[variation];
          if (variationData && variationData.modelUrl) {
            return variationData.modelUrl;
          }
        }
      }
    }
    const collection =
      this.selectedCollection.charAt(0).toUpperCase() +
      this.selectedCollection.slice(1);
    const formattedVariation = variation.replace(/\s+/g, "");
    return `/BehytRings/${collection}/${this.selectedModelId}/${formattedVariation}/${this.selectedModelId}_${variation}.glb`;
  }

  get selectedModelUrl(): string {
    return this.getModelUrlForVariation(this.selectedVariation);
  }

  rootStore: RootStore;

  collectionIdMap: Record<string, string> = {
    "1": "Briljant",
    "2": "Artisanal",
    "3": "Perle",
    "4": "Vintage",
    "5": "Silver Heart",
    "6": "Classic",
    "7": "Romance",
    "8": "Contemporian",
    "9": "Tweekleurig",
  };

  getCollectionId(collectionName: string): string {
    const entry = Object.entries(this.collectionIdMap).find(
      ([_, name]) => name.toLowerCase() === collectionName.toLowerCase(),
    );
    return entry ? entry[0] : collectionName;
  }

  getCollectionNameFromIdOrName(idOrName: string): string {
    if (this.collectionIdMap[idOrName]) {
      return this.collectionIdMap[idOrName];
    }
    const nameMatch = Object.values(this.collectionIdMap).find(
      (name) => name.toLowerCase() === idOrName.toLowerCase(),
    );
    return nameMatch || idOrName;
  }

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.loadFromUrlParams();
    makeAutoObservable(this, { rootStore: false });
  }

  loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const colParam = params.get("collection");
    const modelParam = params.get("modelId") || params.get("model");
    const variationParam = params.get("variation") || params.get("width");
    const colorParam = params.get("color");
    const finishParam = params.get("finish");
    const diamondParam = params.get("diamond");

    if (colParam) {
      this.selectedCollection = this.getCollectionNameFromIdOrName(colParam);
    }

    let isNormalFromParam = false;
    if (modelParam) {
      const parts = modelParam.split("/");
      this.selectedModelId = parts[0];
      if (parts[1]) {
        const routePart = parts[1].toLowerCase();
        if (routePart.startsWith("norm") || routePart.startsWith("norn")) {
          isNormalFromParam = true;
        }
      }
    }

    if (isNormalFromParam || window.location.pathname === "/normal") {
      this.currentRoute = "/normal";
    } else {
      this.currentRoute = "/";
    }

    if (variationParam) this.selectedVariation = variationParam;
    if (colorParam) this.selectedColor = colorParam as ColorType;
    if (finishParam) this.selectedFinish = finishParam as FinishType;
    if (diamondParam !== null) this.showDiamond = diamondParam === "true";
  }

  updateUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const colId = this.getCollectionId(this.selectedCollection);
    params.set("collection", colId);

    let modelParamValue = this.selectedModelId;
    if (this.currentRoute === "/normal") {
      modelParamValue += "/normal";
    }
    params.set("modelId", modelParamValue);

    // Remove the extra parameters
    params.delete("variation");
    params.delete("width");
    params.delete("color");
    params.delete("finish");
    params.delete("diamond");
    params.delete("model");

    const newRelativePathQuery =
      window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newRelativePathQuery);
  }

  setCollection(collection: string) {
    this.selectedCollection = collection;
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (ringsData && ringsData.rings[collection]) {
      const modelIds = Object.keys(ringsData.rings[collection]).filter(
        (key) => key !== "collectionID" && key !== "id",
      );
      if (modelIds.length > 0) {
        if (!modelIds.includes(this.selectedModelId)) {
          this.selectedModelId = modelIds[0];
        }
        const variations = Object.keys(
          ringsData.rings[collection][this.selectedModelId] || {},
        );
        if (variations.length > 0) {
          this.selectedVariation = variations[0];
        }
      }
    }
    this.syncDiamondState();
    this.updateDefaultColorForActiveModel();
    this.updateUrlParams();
  }

  setModelId(id: string) {
    this.selectedModelId = id;
    const ringsData = this.rootStore.design3DManager.ringsData;
    const collection = this.selectedCollection;
    if (
      ringsData &&
      ringsData.rings[collection] &&
      ringsData.rings[collection][id]
    ) {
      const variations = Object.keys(ringsData.rings[collection][id]);
      if (variations.length > 0) {
        this.selectedVariation = variations[0];
      }
    }
    this.syncDiamondState();
    this.updateDefaultColorForActiveModel();
    this.updateUrlParams();
  }

  setVariation(variation: string) {
    this.selectedVariation = variation;
    this.syncDiamondState();
    this.updateDefaultColorForActiveModel();
    this.updateUrlParams();
  }

  setColor(color: ColorType) {
    this.selectedColor = color;
    this.updateUrlParams();
  }

  setFinish(finish: FinishType) {
    this.selectedFinish = finish;
    this.updateUrlParams();
  }

  setDiamond(show: boolean) {
    this.showDiamond = show;
    this.updateUrlParams();
  }

  setCurrentView(view: "home" | "engrave") {
    this.currentView = view;
  }

  setCurrentRoute(route: string) {
    this.currentRoute = route;
  }

  navigateTo(path: string) {
    this.setCurrentRoute(path);

    const params = new URLSearchParams(window.location.search);
    const colId = this.getCollectionId(this.selectedCollection);
    params.set("collection", colId);

    let modelParamValue = this.selectedModelId;
    if (path === "/normal") {
      modelParamValue += "/normal";
    }
    params.set("modelId", modelParamValue);

    // Remove the extra parameters
    params.delete("variation");
    params.delete("width");
    params.delete("color");
    params.delete("finish");
    params.delete("diamond");
    params.delete("model");

    const newRelativePathQuery = path + "?" + params.toString();
    window.history.pushState(null, "", newRelativePathQuery);
  }

  get selection(): DesignSelection {
    return {
      collection: this.selectedCollection,
      modelId: this.selectedModelId,
      variation: this.selectedVariation,
      color: this.selectedColor,
      colorHex: this.selectedColorHex,
      modelUrl: this.selectedModelUrl,
      showDiamond: this.showDiamond,
      finish: this.selectedFinish,
      roughness: this.selectedFinish === "polished" ? 0.1 : 0.3,
    };
  }

  updateDefaultColorForActiveModel() {
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (!ringsData) return;

    const collectionData = ringsData.rings[this.selectedCollection];
    if (!collectionData) return;

    const modelData = collectionData[this.selectedModelId];
    if (!modelData) return;

    const variationData = modelData[this.selectedVariation];
    if (!variationData) return;

    // Determine the color change mesh
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Find colorChange
    let colorChangeVal = "";
    for (const key of Object.keys(variationData)) {
      if (normalize(key) === "colorchange") {
        colorChangeVal = variationData[key];
        break;
      }
    }

    if (!colorChangeVal) return;

    const parts = colorChangeVal.split(",").map((s: string) => normalize(s));
    let defaultColorName = "";

    const hasBase = parts.some(
      (p: string) =>
        p === "basemetal" || p === "base" || p === "gold" || p === "both",
    );
    const hasFinishing = parts.some(
      (p: string) =>
        p === "finishingmetal" ||
        p === "finishing" ||
        p === "finshing" ||
        p === "finshingmetal" ||
        p === "silver" ||
        p === "both",
    );

    if (hasBase) {
      // Find Base Metal Color key
      for (const key of Object.keys(variationData)) {
        if (normalize(key) === "basemetalcolor") {
          defaultColorName = variationData[key];
          break;
        }
      }
    } else if (hasFinishing) {
      // Find Finishing Metal Color key
      for (const key of Object.keys(variationData)) {
        const normKey = normalize(key);
        if (
          normKey === "finishingmetalcolor" ||
          normKey === "finshingmetalcolor"
        ) {
          defaultColorName = variationData[key];
          break;
        }
      }
    }

    if (defaultColorName) {
      const cleanColor = defaultColorName.trim().toLowerCase();
      if (
        cleanColor === "gold" ||
        cleanColor === "silver" ||
        cleanColor === "rose gold" ||
        cleanColor === "rosegold"
      ) {
        const finalColor = cleanColor === "rosegold" ? "rose gold" : cleanColor;
        this.selectedColor = finalColor as ColorType;
      }
    }
  }

  setNormalIntensity(value: number) {
    this.normalIntensity = value;
  }

  setModelMinY(value: number) {
    this.modelMinY = value;
  }

  setAutoRotate(value: boolean) {
    this.autoRotate = value;
  }

  setAutoRotateSpeed(value: number) {
    this.autoRotateSpeed = value;
  }

  get activeNormalMaps() {
    const ringsData = this.rootStore.design3DManager.ringsData;
    if (!ringsData) return [];

    const collectionData = ringsData.rings[this.selectedCollection];
    if (!collectionData) return [];

    const modelData = collectionData[this.selectedModelId];
    if (!modelData) return [];

    const variationData = modelData[this.selectedVariation];
    if (!variationData) return [];

    const texturesAny = variationData.textures as any;
    if (!texturesAny) return [];

    const normalBaseUrl =
      getTextureValue(texturesAny, [
        "normalBase",
        "Base_Metal_Normal",
        "Base_metal_Normal",
        "base_metal_normal",
        "Base_Metal_Normal.webp",
        "Base_metal_Normal.webp",
        "base_metal_normal.webp",
      ]) ||
      getNormalMapValue(texturesAny, [
        "Base_Metal_Normal",
        "base_metal_normal",
      ]);

    const normalFinishingUrl =
      getTextureValue(texturesAny, [
        "normalFinishing",
        "Finishing_Metal_Normal",
        "Finishing_metal_Normal",
        "finishing_metal_normal",
        "Finishing_Metal_Normal.webp",
        "Finishing_metal_Normal.webp",
        "finishing_metal_normal.webp",
      ]) ||
      getNormalMapValue(texturesAny, [
        "Finishing_Metal_Normal",
        "finishing_metal_normal",
      ]);

    const results = [];
    if (normalBaseUrl) {
      results.push({
        type: "base",
        meshName: "Base_Metal",
        url: normalBaseUrl,
        filename: normalBaseUrl.substring(normalBaseUrl.lastIndexOf("/") + 1),
      });
    }
    if (normalFinishingUrl) {
      results.push({
        type: "finishing",
        meshName: "Finishing_Metal",
        url: normalFinishingUrl,
        filename: normalFinishingUrl.substring(
          normalFinishingUrl.lastIndexOf("/") + 1,
        ),
      });
    }
    return results;
  }
}
