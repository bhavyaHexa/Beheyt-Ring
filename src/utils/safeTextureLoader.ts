import * as THREE from 'three';

export class SafeTextureLoader extends THREE.TextureLoader {
    load(
        url: string,
        onLoad?: (texture: any) => void,
        onProgress?: (event: any) => void,
        onError?: (err: any) => void
    ): any {
        return super.load(
            url,
            (texture) => {
                if (onLoad) onLoad(texture);
            },
            onProgress,
            (err) => {
                console.warn(`SafeTextureLoader: Failed to load texture at ${url}. Falling back to default.`);
                const fallbackUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                super.load(
                    fallbackUrl,
                    (fallbackTexture) => {
                        if (onLoad) onLoad(fallbackTexture);
                    },
                    undefined,
                    (fallbackErr) => {
                        if (onError) onError(fallbackErr);
                    }
                );
            }
        );
    }
}
