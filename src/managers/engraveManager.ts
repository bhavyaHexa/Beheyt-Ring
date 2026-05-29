import { makeAutoObservable } from "mobx";


export class EngraveManager {
    ambientIntensity = 0.5;
    engraving = '';
    shouldDownloadUV = false;
    shouldDownloadUVOrange = false;
    shouldDownloadNormal = false;
    shouldDownloadHeight = false;

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

    triggerUVOrangeDownload() {
        this.shouldDownloadUVOrange = true;
    }

    triggerNormalDownload() {
        this.shouldDownloadNormal = true;
    }

    triggerHeightDownload() {
        this.shouldDownloadHeight = true;
    }

    resetAllDownloads() {
        this.shouldDownloadUV = false;
        this.shouldDownloadUVOrange = false;
        this.shouldDownloadNormal = false;
        this.shouldDownloadHeight = false;
    }
}

export const engraveManager = new EngraveManager();
