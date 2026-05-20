import { makeAutoObservable } from "mobx";


export class EngraveManager {
    ambientIntensity = 0.5;
    engraving = '';
    shouldDownloadUV = false;

    constructor() {
        makeAutoObservable(this);
    }

    setAmbientIntensity(value: number) {
        this.ambientIntensity = value;
    }

    setEngraving(value: string) {
        this.engraving = value;
    }

    triggerUVDownload() {
        this.shouldDownloadUV = true;
    }

    resetUVDownload() {
        this.shouldDownloadUV = false;
    }
}

export const engraveManager = new EngraveManager();
