import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";

export class DesignManagerStore {
    selectedCollection: string = "briljant";
    selectedModelId: string = "546";
    selectedVariation: string = "4.5mm";
    selectedColor: string = "gold";
    showDiamond: boolean = true;

    colorMap: Record<string, string> = {
        gold: "#f1b95f", //ffb948  //ffa930
        silver: "#e2e2e2",
        'rose gold': "#f4a26b"  //f4a068
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

    setDiamond(show: boolean) {
        this.showDiamond = show;
    }

    get selection() {
        return {
            collection: this.selectedCollection,
            modelId: this.selectedModelId,
            variation: this.selectedVariation,
            color: this.selectedColor,
            colorHex: this.selectedColorHex,
            modelUrl: this.selectedModelUrl,
            showDiamond: this.showDiamond
        };
    }
}
