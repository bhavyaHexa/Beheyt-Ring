import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import { useControls } from 'leva'
import Model from './Model'
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

  });

  useEffect(() => {
    gl.toneMapping = Number(toneMapping);
    gl.toneMappingExposure = exposure;
    gl.needsUpdate = true;
  }, [gl, toneMapping, exposure]);

  return null;
}


function AssetControls({ modelUrl, onModelUrlChange, envUrl, onEnvUrlChange, showBackground, onShowBackgroundChange }) {
  useControls("Assets", {
    modelUrl: {
      value: modelUrl,
      onChange: (v) => onModelUrlChange(v),
    },
    environmentUrl: {
      value: envUrl,
      onChange: (v) => onEnvUrlChange(v),
    },
    showBackground: {
      value: showBackground,
      onChange: (v) => onShowBackgroundChange(v),
    }
  });
  return null;
}


export default function ModelViewer({ modelUrl, envUrl }) {
  const [currentModelUrl, setCurrentModelUrl] = useState(modelUrl);
  const [currentEnvUrl, setCurrentEnvUrl] = useState(envUrl);
  const [showBackground, setShowBackground] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setCurrentModelUrl(modelUrl);
  }, [modelUrl]);

  useEffect(() => {
    setCurrentEnvUrl(envUrl);
  }, [envUrl]);

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
        <color attach="background" args={["#faf8f8"]} />
        <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={35} />
        <ToneMappingDebugger />

        <AssetControls
          modelUrl={modelUrl}
          onModelUrlChange={setCurrentModelUrl}
          envUrl={envUrl}
          onEnvUrlChange={setCurrentEnvUrl}
          showBackground={showBackground}
          onShowBackgroundChange={setShowBackground}
        />


        {/* Basic lighting */}
        {/* <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow /> */}

        <Suspense fallback={null}>
          {/* Environment declaration */}
          <Environment
            frames={Infinity}
            files={currentEnvUrl}
            background={showBackground}
            resolution={256}
            environmentIntensity={1}
            environmentRotation={[0, -4.38, 0]}
          />

          {/* Model component */}
          <Model url={currentModelUrl} envUrl={currentEnvUrl} rotation={[- Math.PI / 2, 0, Math.PI / 5]} />

          <ContactShadows
            position={[0, -1.3, 0]}
            opacity={0.5}
            scale={8}
            blur={2}
            far={10}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  )
}
