import { DesignManagerStore } from "./designManager";
import { Design3DManagerStore } from "./design3DManager";

export class RootStore {
    designManager: DesignManagerStore;
    design3DManager: Design3DManagerStore;

    constructor() {
        this.designManager = new DesignManagerStore(this);
        this.design3DManager = new Design3DManagerStore(this);
    }
}

export const rootStore = new RootStore();
