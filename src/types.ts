import * as THREE from 'three';

/**
 * Supported jewelry color types
 */
export type ColorType = 'gold' | 'silver' | 'rose gold';

/**
 * Supported surface finishes
 */
export type FinishType = 'polished' | 'matte';

/**
 * Data structure for the current design selection
 */
export interface DesignSelection {
    collection: string;
    modelId: string;
    variation: string;
    color: string;
    colorHex: string;
    modelUrl: string;
    showDiamond: boolean;
    finish: string;
    roughness: number;
}

/**
 * Texture set for a specific ring variation
 */
export interface TextureSet {
    albedo?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    ao?: string;
    aoGold?: string;
    aoSilver?: string;
}

/**
 * Data for a specific variation of a ring model
 */
export interface VariationData {
    modelUrl: string;
    textures: TextureSet;
}

/**
 * Map of variations for a specific model ID
 */
export interface ModelData {
    [variation: string]: VariationData;
}

/**
 * Map of models within a collection
 */
export interface CollectionData {
    [modelId: string]: ModelData;
}

/**
 * Root structure of the rings.json data
 */
export interface RingsData {
    rings: {
        [collection: string]: CollectionData;
    };
}

/**
 * Props for 3D model rendering components
 */
export interface SingleModelProps {
    variation: string;
    diamondEnvMap: THREE.Texture | null;
    size: { width: number; height: number };
}
