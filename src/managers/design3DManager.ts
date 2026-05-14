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
