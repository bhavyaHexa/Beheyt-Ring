import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";

export class DesignManagerStore {
    selectedCollection: string = "briljant";
    selectedModelId: string = "546";
    selectedVariation: string = "4.5mm";
    selectedColor: string = "gold";

    colorMap: Record<string, string> = {
        gold: "#f2bd61",
        silver: "#f6f5f5",
        rose_gold: "#e8a274"  //f4a068
    };

    get selectedColorHex(): string {
        return this.colorMap[this.selectedColor.toLowerCase()];
    }

    get selectedModelUrl(): string {
        const collection = this.selectedCollection.charAt(0).toUpperCase() + this.selectedCollection.slice(1);
        const variation = this.selectedVariation.replace(/\s+/g, '');
        return `/BehytRings/${collection}/${this.selectedModelId}/${variation}/${this.selectedModelId}_${this.selectedVariation}.glb`;
    }

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
    }

    setCollection(collection: string) {
        this.selectedCollection = collection;
    }

    setModelId(id: string) {
        this.selectedModelId = id;
    }

    setVariation(variation: string) {
        this.selectedVariation = variation;
    }

    setColor(color: string) {
        this.selectedColor = color;
    }

    get selection() {
        return {
            collection: this.selectedCollection,
            modelId: this.selectedModelId,
            variation: this.selectedVariation,
            color: this.selectedColor,
            colorHex: this.selectedColorHex,
            modelUrl: this.selectedModelUrl
        };
    }
}
