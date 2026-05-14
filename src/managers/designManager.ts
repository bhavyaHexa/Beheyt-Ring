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
    }

    setModelId(id: string) {
        this.selectedModelId = id;
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
