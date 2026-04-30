import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import { useControls } from 'leva'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Model from './Model'
import Lights from './Lights'
import * as THREE from 'three'

function ToneMappingDebugger() {
  const { gl } = useThree();

  const { toneMapping, exposure } = useControls("Renderer Settings", {
    toneMapping: {
      value: THREE.NoToneMapping,
      options: {
        None: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping,
        AgX: THREE.AgXToneMapping,
      },
    },
    exposure: { value: 1, min: 0, max: 2, step: 0.1 }
  });

  useEffect(() => {
    gl.toneMapping = Number(toneMapping);
    gl.toneMappingExposure = exposure;
    gl.needsUpdate = true;
  }, [gl, toneMapping, exposure]);

  return null;
}


function AssetControls({
  modelUrl, onModelUrlChange,
}) {
  const [, set] = useControls("Assets", () => ({
    modelUrl: {
      value: modelUrl,
      onChange: (v) => onModelUrlChange(v),
    },
  }));

  // Sync Leva GUI when props change from outside (like dropzone)
  useEffect(() => {
    set({ modelUrl: modelUrl });
  }, [modelUrl, set]);

  return null;
}

function PostProcessing() {
  const { bloomEnabled, intensity, luminanceThreshold, luminanceSmoothing, radius } = useControls("Bloom", {
    bloomEnabled: { value: true, label: "Enabled" },
    intensity: { value: 1.0, min: 0, max: 10, step: 0.1 },
    luminanceThreshold: { value: 0.9, min: 0, max: 2, step: 0.05 },
    luminanceSmoothing: { value: 0.025, min: 0, max: 1, step: 0.01 },
    radius: { value: 0.4, min: 0, max: 1, step: 0.01 },
  });

  if (!bloomEnabled) return null;

  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={intensity}
        luminanceThreshold={luminanceThreshold}
        luminanceSmoothing={luminanceSmoothing}
        mipmapBlur
        radius={radius}
      />
    </EffectComposer>
  );
}


export default function ModelViewer({ modelUrl, envUrl }) {
  const [currentModelUrl, setCurrentModelUrl] = useState(modelUrl);

  // Sync state if props change
  useEffect(() => {
    setCurrentModelUrl(modelUrl);
  }, [modelUrl]);

  return (
    <div className="canvas-container">
      <Canvas
        // shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          // As requested: default use NoToneMapping
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={["#f9f9f9"]} />
        <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={35} />
        <ToneMappingDebugger />

        <AssetControls
          modelUrl={modelUrl}
          onModelUrlChange={setCurrentModelUrl}
        />


        <Suspense fallback={null}>
          <Lights envUrl={envUrl} />

          {/* Model component */}
          <Model url={currentModelUrl} envUrl={envUrl} rotation={[- Math.PI / 2, 0, Math.PI / 3]} />

          <ContactShadows
            position={[0, -1.3, 0]}
            opacity={0.5}
            scale={8}
            blur={2}
            far={10}
          />

          {/* <PostProcessing /> */}
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={100}
        />
      </Canvas>
    </div>
  )
}

