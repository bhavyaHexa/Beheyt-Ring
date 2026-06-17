import React, { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import * as THREE from "three";

interface AntiAliasingProps {
  /**
   * Hardware MSAA samples for the composer's render target.
   * Set to 0 to rely purely on SMAA screen-space pass.
   * Typically set to 4 or 8 for high quality.
   */
  samples?: number;
}

export const AntiAliasing: React.FC<AntiAliasingProps> = ({ samples = 16 }) => {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    // Create a WebGLRenderTarget with hardware MSAA samples (WebGL2 feature)
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      samples: samples,
    });

    const _composer = new EffectComposer(gl, renderTarget);
    const renderPass = new RenderPass(scene, camera);
    _composer.addPass(renderPass);

    const smaaPass = new SMAAPass();
    _composer.addPass(smaaPass);

    // Unreal Bloom Pass for diamond sparkle/glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.01, // strength
      0.1, // radius
      0.01, // threshold
    );
    _composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    _composer.addPass(outputPass);

    return _composer;
  }, [gl, scene, camera, size, samples]);

  // Handle resizing of the composer
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  // Take over the React Three Fiber render loop
  useFrame(() => {
    composer.render();
  }, 1);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  return null;
};

export default AntiAliasing;
