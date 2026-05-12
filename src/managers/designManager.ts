import { makeAutoObservable } from "mobx";
import { RootStore } from "./stateManager";

export class DesignManagerStore {
    selectedCollection: string = "briljant";
    selectedModelId: string = "546";
    selectedVariation: string = "3.5 mm";
    selectedColor: string = "gold";
    selectedModelUrl: string = "/BehytRings/Briljant/546/4.5mm/Beheyt Briljant_546_V1.1.glb"

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
            modelUrl: this.selectedModelUrl
        };
    }
}
