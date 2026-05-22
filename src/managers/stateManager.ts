import { DesignManagerStore } from "./designManager";
import { Design3DManagerStore } from "./design3DManager";
import { SheetManagerStore } from "./sheetManager";

export class RootStore {
    designManager: DesignManagerStore;
    design3DManager: Design3DManagerStore;
    sheetManager: SheetManagerStore;

    constructor() {
        this.designManager = new DesignManagerStore(this);
        this.design3DManager = new Design3DManagerStore(this);
        this.sheetManager = new SheetManagerStore(this);
    }
}

export const rootStore = new RootStore();

