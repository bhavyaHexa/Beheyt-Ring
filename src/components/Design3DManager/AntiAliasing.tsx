import React, { Suspense } from "react";
import {
  EffectComposer,
  SMAA,
  Bloom,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export const AntiAliasing: React.FC = () => {
  return (
    <EffectComposer multisampling={16}>
      {/* SMAA requires Suspense because it loads textures asynchronously */}
      <Suspense fallback={null}>
        <SMAA />
      </Suspense>

      {/* <Bloom
        intensity={0.01}
        luminanceThreshold={0.01}
        luminanceSmoothing={0.1}
      /> */}

      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};
