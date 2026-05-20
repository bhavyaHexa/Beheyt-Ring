import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";
import { DesignSelection, ColorType, FinishType } from "../types";

export class DesignManagerStore {
    selectedCollection: string = "briljant";
    selectedModelId: string = "546";
    selectedVariation: string = "4.5mm";
    selectedColor: ColorType = "gold";
    selectedFinish: FinishType = "polished";
    showDiamond: boolean = true;
    currentView: 'home' | 'engrave' = 'home';

    colorMap: Record<string, string> = {
        gold: "#f2bd61",
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
    }

    setVariation(variation: string) {
        this.selectedVariation = variation;
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
}
