import * as THREE from 'three';

export class SafeTextureLoader extends THREE.TextureLoader {
    load(
        url: string,
        onLoad?: (texture: any) => void,
        onProgress?: (event: any) => void,
        onError?: (err: any) => void
    ): any {
        if (!url) {
            const dummyTexture = new THREE.Texture();
            if (onLoad) {
                setTimeout(() => onLoad(dummyTexture), 0);
            }
            return dummyTexture;
        }

        return super.load(
            url,
            (texture) => {
                if (onLoad) onLoad(texture);
            },
            onProgress,
            (err) => {
                console.warn(`SafeTextureLoader: Failed to load texture at "${url}".`);
                const dummyTexture = new THREE.Texture();
                if (onLoad) onLoad(dummyTexture);
            }
        );
    }
}
