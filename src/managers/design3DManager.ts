import { makeAutoObservable, runInAction } from "mobx";
import { RootStore } from "./stateManager";
import { RingsData } from "../types";

export class Design3DManagerStore {
    rootStore: RootStore;
    ringsData: RingsData | null = null;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, { rootStore: false });
        this.rootStore = rootStore;
        this.loadRingsData();
    }

    async loadRingsData() {
        try {
            const response = await fetch("/data/rings.json");
            const data = await response.json();
            runInAction(() => {
                this.ringsData = data;
                
                // Ensure initial selected collection/model/variation is valid
                const dm = this.rootStore.designManager;
                const collections = Object.keys(data.rings || {});
                if (collections.length > 0) {
                    const matchedCollection = collections.find(
                        c => c.toLowerCase() === dm.selectedCollection.toLowerCase()
                    );
                    if (matchedCollection) {
                        dm.selectedCollection = matchedCollection;
                    } else {
                        dm.selectedCollection = collections[0];
                    }
                    if (dm.selectedCollection.toLowerCase() === "artisanal") {
                        dm.showDiamond = false;
                    } else {
                        dm.showDiamond = true;
                    }
                    const modelIds = Object.keys(data.rings[dm.selectedCollection] || {}).filter(key => key !== "collectionID" && key !== "id");
                    if (modelIds.length > 0) {
                        if (!modelIds.includes(dm.selectedModelId)) {
                            dm.selectedModelId = modelIds[0];
                        }
                        const variations = Object.keys(data.rings[dm.selectedCollection][dm.selectedModelId] || {}).filter(key => key !== "collectionID" && key !== "id");
                        if (variations.length > 0) {
                            if (!variations.includes(dm.selectedVariation)) {
                                dm.selectedVariation = variations[0];
                            }
                        }
                    }
                }
                dm.updateDefaultColorForActiveModel();
                dm.updateUrlParams();
            });
        } catch (error) {
            console.error("Failed to load rings data:", error);
        }
    }

    // This store reacts to changes in DesignManager via the RootStore
    get activeModel() {
        return this.rootStore.designManager.selection;
    }

}
