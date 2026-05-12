import { makeAutoObservable, runInAction } from "mobx";
import { RootStore } from "./stateManager";

export class Design3DManagerStore {
    rootStore: RootStore;
    ringsData: any = null;

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
            });
        } catch (error) {
            console.error("Failed to load rings data:", error);
        }
    }

    // This store reacts to changes in DesignManager via the RootStore
    get activeModel() {
        return this.rootStore.designManager.selection;
    }

    //     get activeModelUrl() {
    //         if (!this.ringsData) return null;

    //         const { collection, modelId, variation, modelUrl } = this.activeModel;

    //         console.log(modelUrl)

    //         // Normalize keys for lookup (e.g., "4.5 mm" -> "4.5mm")
    //         const colKey = collection.toLowerCase();
    //         const idKey = modelId;
    //         const varKey = variation.replace(/\s+/g, '').toLowerCase();

    //         try {
    //             const modelData = this.ringsData.rings?.[colKey]?.[idKey]?.[varKey];
    //             return modelData?.modelUrl || null;
    //         } catch (e) {
    //             return null;
    //         }
    //     }
}
