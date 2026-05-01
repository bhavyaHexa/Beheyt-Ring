import { Canvas, useThree } from '@react-three/fiber'
import { Environment, CameraControls, ContactShadows, PerspectiveCamera, Center, SoftShadows } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import { useControls } from 'leva'
import Model from './Model'
import Lights from './Lights'
import PostProcessing from './PostProcessing'
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



export default function ModelViewer({ modelUrl, envUrl }) {
  const [currentModelUrl, setCurrentModelUrl] = useState(modelUrl);

  const { normalIntensity } = useControls("Normal Map", {
    normalIntensity: { value: 1, min: 0, max: 5, step: 0.05, label: "Intensity" }
  });

  const { envIntensity, envRotation, showBackground } = useControls('Lighting.Environment', {
    envIntensity: { value: 0.7, min: 0, max: 10, step: 0.1, label: 'Intensity' },
    showBackground: { value: false, label: 'Show BG' },
    envRotation: { value: [0, -2.5, 0], step: 0.1, label: 'Rotation' },
  });

  const [shadowY, setShadowY] = useState(0);


  const { clonePos, cloneRot, cloneScale } = useControls("Cloned Ring", {
    clonePos: { value: [0.5, 0.0, 1.3], step: 0.1 },
    cloneRot: { value: [-4.0, 0.1, -2.0], step: 0.1 },
    cloneScale: { value: 0.8, step: 0.05 }
  });

  // Sync state if props change
  useEffect(() => {
    setCurrentModelUrl(modelUrl);
  }, [modelUrl]);

  return (
    <div className="canvas-container">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          // As requested: default use NoToneMapping
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={["#f9f9f9"]} />
        <PerspectiveCamera makeDefault position={[0, 3, 10.5]} fov={30} />

        <ToneMappingDebugger />

        <AssetControls
          modelUrl={modelUrl}
          onModelUrlChange={setCurrentModelUrl}
        />


        <Suspense fallback={null}>
          <Lights envUrl={envUrl} envIntensity={envIntensity} envRotation={envRotation} showBackground={showBackground} />

          {/* Model component centered at [0,0,0] to ensure zoom stays centered */}
          <Center onCentered={({ height }) => setShadowY(-height / 2)}>
            <Model
              url={currentModelUrl}
              envUrl={envUrl}
              rotation={[- Math.PI / 2, 0, Math.PI / 3]}
              clonePos={clonePos}
              cloneRot={cloneRot}
              cloneScale={cloneScale}
              normalIntensity={normalIntensity}
              envIntensity={envIntensity}
            />
          </Center>


          {/* Stable Contact Shadows */}
          <ContactShadows
            position={[0, shadowY, 0]}
            opacity={0.9}
            scale={2}
            blur={0.5}
            far={6}
            resolution={1024}
            width={20}
            height={20}
          />

          <PostProcessing dirty={`${clonePos}-${cloneRot}-${cloneScale}-${normalIntensity}-${envIntensity}-${envRotation}`} />
        </Suspense>

        <CameraControls
          makeDefault
          minDistance={2}
          maxDistance={100}
          dollyToCursor={false}
        />
      </Canvas>
    </div>
  )
}

