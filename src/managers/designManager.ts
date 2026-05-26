import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";
import { DesignSelection, ColorType, FinishType } from "../types";
import { getTextureValue, getNormalMapValue } from "../utils/textureHelpers";

export class DesignManagerStore {
    selectedCollection: string = "briljant";
    selectedModelId: string = "546";
    selectedVariation: string = "4.5mm";
    selectedColor: ColorType = "gold";
    selectedFinish: FinishType = "polished";
    showDiamond: boolean = true;
    currentView: 'home' | 'engrave' = 'home';
    modelMinY: number = 0;
    normalIntensity: number = 1.0;
    autoRotate: boolean = true;
    autoRotateSpeed: number = 0.5;



    colorMap: Record<string, string> = {
        gold: "#ffc35c",
        silver: "#f6f5f5",
        'rose gold': "#e8a274"  //f4a068
    };

    get selectedColorHex(): string {
        return this.colorMap[this.selectedColor.toLowerCase()];
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
        const collection = this.selectedCollection.charAt(0).toUpperCase() + this.selectedCollection.slice(1);
        const formattedVariation = variation.replace(/\s+/g, '');
        return `/BehytRings/${collection}/${this.selectedModelId}/${formattedVariation}/${this.selectedModelId}_${variation}.glb`;
    }

    get selectedModelUrl(): string {
        return this.getModelUrlForVariation(this.selectedVariation);
    }

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
    }

    setCollection(collection: string) {
        this.selectedCollection = collection;
        if (collection.toLowerCase() === "artisanal") {
            this.showDiamond = false;
        } else {
            this.showDiamond = true;
        }
        const ringsData = this.rootStore.design3DManager.ringsData;
        if (ringsData && ringsData.rings[collection]) {
            const modelIds = Object.keys(ringsData.rings[collection]);
            if (modelIds.length > 0) {
                if (!modelIds.includes(this.selectedModelId)) {
                    this.selectedModelId = modelIds[0];
                }
                const variations = Object.keys(ringsData.rings[collection][this.selectedModelId] || {});
                if (variations.length > 0 && !variations.includes(this.selectedVariation)) {
                    this.selectedVariation = variations[0];
                }
            }
        }
        this.updateDefaultColorForActiveModel();
    }

    setModelId(id: string) {
        this.selectedModelId = id;
        const ringsData = this.rootStore.design3DManager.ringsData;
        const collection = this.selectedCollection;
        if (ringsData && ringsData.rings[collection] && ringsData.rings[collection][id]) {
            const variations = Object.keys(ringsData.rings[collection][id]);
            if (variations.length > 0 && !variations.includes(this.selectedVariation)) {
                this.selectedVariation = variations[0];
            }
        }
        this.updateDefaultColorForActiveModel();
    }

    setVariation(variation: string) {
        this.selectedVariation = variation;
        this.updateDefaultColorForActiveModel();
    }

    setColor(color: ColorType) {
        this.selectedColor = color;
    }

    setFinish(finish: FinishType) {
        this.selectedFinish = finish;
    }

    setDiamond(show: boolean) {
        this.showDiamond = show;
    }

    setCurrentView(view: 'home' | 'engrave') {
        this.currentView = view;
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
            roughness: this.selectedFinish === "polished" ? 0.2 : 0.75
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
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Find colorChange
        let colorChangeVal = "";
        for (const key of Object.keys(variationData)) {
            if (normalize(key) === "colorchange") {
                colorChangeVal = variationData[key];
                break;
            }
        }

        if (!colorChangeVal) return;

        const changeMesh = normalize(colorChangeVal);
        let defaultColorName = "";

        if (changeMesh === "basemetal" || changeMesh === "base" || changeMesh === "gold") {
            // Find Base Metal Color key
            for (const key of Object.keys(variationData)) {
                if (normalize(key) === "basemetalcolor") {
                    defaultColorName = variationData[key];
                    break;
                }
            }
        } else if (changeMesh === "finishingmetal" || changeMesh === "finishing" || changeMesh === "finshing" || changeMesh === "finshingmetal" || changeMesh === "silver") {
            // Find Finishing Metal Color key
            for (const key of Object.keys(variationData)) {
                const normKey = normalize(key);
                if (normKey === "finishingmetalcolor" || normKey === "finshingmetalcolor") {
                    defaultColorName = variationData[key];
                    break;
                }
            }
        } else if (changeMesh === "both") {
            // Find either Base Metal Color or Finishing Metal Color
            for (const key of Object.keys(variationData)) {
                if (normalize(key) === "basemetalcolor") {
                    defaultColorName = variationData[key];
                    break;
                }
            }
        }

        if (defaultColorName) {
            const cleanColor = defaultColorName.trim().toLowerCase();
            if (cleanColor === "gold" || cleanColor === "silver" || cleanColor === "rose gold" || cleanColor === "rosegold") {
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


        const normalBaseUrl = getTextureValue(texturesAny, [
            'normalBase',
            'Base_Metal_Normal',
            'Base_metal_Normal',
            'base_metal_normal',
            'Base_Metal_Normal.webp',
            'Base_metal_Normal.webp',
            'base_metal_normal.webp'
        ]) || getNormalMapValue(texturesAny, ['Base_Metal_Normal', 'base_metal_normal']);

        const normalFinishingUrl = getTextureValue(texturesAny, [
            'normalFinishing',
            'Finishing_Metal_Normal',
            'Finishing_metal_Normal',
            'finishing_metal_normal',
            'Finishing_Metal_Normal.webp',
            'Finishing_metal_Normal.webp',
            'finishing_metal_normal.webp'
        ]) || getNormalMapValue(texturesAny, ['Finishing_Metal_Normal', 'finishing_metal_normal']);

        const results = [];
        if (normalBaseUrl) {
            results.push({
                type: 'base',
                meshName: 'Base_Metal',
                url: normalBaseUrl,
                filename: normalBaseUrl.substring(normalBaseUrl.lastIndexOf('/') + 1)
            });
        }
        if (normalFinishingUrl) {
            results.push({
                type: 'finishing',
                meshName: 'Finishing_Metal',
                url: normalFinishingUrl,
                filename: normalFinishingUrl.substring(normalFinishingUrl.lastIndexOf('/') + 1)
            });
        }
        return results;
    }
}
