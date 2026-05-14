import { makeAutoObservable } from 'mobx';

export class SceneStore {
    ambientIntensity = 0.5;
    engraving = '';
    constructor() {
        makeAutoObservable(this);
    }

    setAmbientIntensity(value: number) {
        this.ambientIntensity = value;
    }

    setEngraving(value: string) {
        this.engraving = value;
    }
}

export const sceneStore = new SceneStore();
