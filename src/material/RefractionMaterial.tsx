import React, { useMemo, useEffect, createContext, useContext } from 'react';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { useThree, useFrame } from '@react-three/fiber';
import MeshRefractionMaterialWebGL, { createBackgroundRenderTarget } from './MeshRefractionMaterial.js';
import { useEnvironment } from '@react-three/drei';

// Context to share the background texture across all diamond instances
const BackgroundTextureContext = createContext<THREE.Texture | null>(null);

export const BackgroundTextureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { gl, scene, camera } = useThree();
    const bgRenderTarget = useMemo(() => createBackgroundRenderTarget(gl), [gl]);

    useFrame(() => {
        // Optimization: Use visibility toggle on anything named Diam_Centr
        const diamonds: THREE.Object3D[] = [];
        scene.traverse((obj) => {
            if (obj.name.includes('Diam_Centr')) {
                diamonds.push(obj);
                obj.visible = false;
            }
        });

        gl.setRenderTarget(bgRenderTarget);
        gl.render(scene, camera);
        gl.setRenderTarget(null);

        // Show diamonds and update their materials with the new background texture
        diamonds.forEach((obj) => {
            const mesh = obj as THREE.Mesh;
            mesh.visible = true;
            if (mesh.material instanceof MeshRefractionMaterialWebGL) {
                (mesh.material as MeshRefractionMaterialWebGL).setBackgroundTexture(bgRenderTarget.texture);
            }
        });
    });

    return (
        <BackgroundTextureContext.Provider value={bgRenderTarget.texture}>
            {children}
        </BackgroundTextureContext.Provider>
    );
};

export type MeshRefractionMaterialProps = {
    geometry: THREE.BufferGeometry;
    meshRef: React.RefObject<THREE.Mesh>;
    envMap?: THREE.Texture;
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
};

export default function RefractionMaterial({
    geometry,
    meshRef,
    envMap,
    ior = 2.4,
    bounces = 3,
    aberrationStrength = 0.001,
    fresnel = 1.0,
    reflectivity = 2.5,
    color = '#ffffff',
    blur = 0.12,
    envRotation = 0,
    highlightColor = '#ffffff',
    highlightTolerance = 0.01,
    attenuationColor = '#ffffff',
    attenuationDistance = 1.0,
}: MeshRefractionMaterialProps) {
    const { size } = useThree();
    const backgroundTexture = useContext(BackgroundTextureContext);

    // Use gemEnv.exr by default if no envMap is provided
    const defaultEnv = useEnvironment({ files: '/gemEnv.exr' });
    const finalEnvMap = envMap || defaultEnv;

    // Build material
    const material = useMemo(() => {
        if (!geometry) return null;

        const bvh = new MeshBVH(geometry, { strategy: 1 });

        return new MeshRefractionMaterialWebGL({
            geometry,
            bvh,
            envMap: finalEnvMap as THREE.Texture,
            backgroundTexture: backgroundTexture,
            resolution: new THREE.Vector2(size.width, size.height),
            ior,
            bounces,
            aberrationStrength,
            fresnel,
            reflectivity,
            color,
            blur,
            envRotation,
            highlightColor,
            highlightTolerance,
            attenuationColor,
            attenuationDistance,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geometry, finalEnvMap, ior, bounces, aberrationStrength, fresnel, reflectivity, blur]);

    // Keep resolution in sync
    useEffect(() => {
        material?.setResolution(size.width, size.height);
    }, [size, material]);

    // Update background texture when context changes
    useEffect(() => {
        if (material && backgroundTexture) {
            material.setBackgroundTexture(backgroundTexture);
        }
    }, [backgroundTexture, material]);

    // Hot-update dynamic uniforms
    // useEffect(() => { if (material) material.color = color; }, [color, material]);
    useEffect(() => { if (material) material.blur = blur; }, [blur, material]);
    useEffect(() => { if (material) material.envRotation = envRotation; }, [envRotation, material]);
    // useEffect(() => { if (material) material.highlightColor = highlightColor; }, [highlightColor, material]);
    useEffect(() => { if (material) material.highlightTolerance = highlightTolerance; }, [highlightTolerance, material]);
    // useEffect(() => { if (material) material.attenuationColor = attenuationColor; }, [attenuationColor, material]);
    useEffect(() => { if (material) material.attenuationDistance = attenuationDistance; }, [attenuationDistance, material]);

    if (!material) return null;

    return <primitive object={material} attach="material" />;
}