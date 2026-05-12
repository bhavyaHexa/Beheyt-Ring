import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export interface MeshRefractionMaterialParameters {
    geometry: THREE.BufferGeometry;
    bvh: MeshBVH;
    envMap: THREE.Texture;
    backgroundTexture?: THREE.Texture | null;
    resolution?: THREE.Vector2;
    ior?: number;
    bounces?: number;
    aberrationStrength?: number;
    fresnel?: number;
    reflectivity?: number;
    color?: string | number | THREE.Color;
    blur?: number;
    envRotation?: number;
    highlightColor?: string | number | THREE.Color;
    highlightTolerance?: number;
    attenuationColor?: string | number | THREE.Color;
    attenuationDistance?: number;
}

export default class MeshRefractionMaterialWebGL extends THREE.ShaderMaterial {
    constructor(parameters: MeshRefractionMaterialParameters);
    color: THREE.Color;
    blur: number;
    envRotation: number;
    highlightColor: THREE.Color;
    highlightTolerance: number;
    attenuationColor: THREE.Color;
    attenuationDistance: number;
    setResolution(width: number, height: number): void;
    setBackgroundTexture(tex: THREE.Texture): void;
}

export function createBackgroundRenderTarget(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget;