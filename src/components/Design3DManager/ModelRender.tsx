import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import * as THREE from "three";

import Model3DContent from "./Model3DContent";
import Loader from "../Loader/Loader";
import EngraveModelViewer from "../engrave/EngraveModelViewer";
import EngraveModelRender from "../engrave/EngraveModelRender";
import { rootStore } from "../../managers/stateManager";

import DynamicContactShadows from "./DynamicContactShadows";
import CanvasCamera from "./CanvasCamera";
import AntiAliasing from "./AntiAliasing";

const ModelRender = observer(() => {
  const { designManager } = rootStore;

  // We want the 3D viewport to be visible in both 'home' and 'engrave' views
  const isVisible =
    designManager.currentView === "home" ||
    designManager.currentView === "engrave";

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Main 3D Viewport - fills the background */}
      <div
        className={`w-full h-full pointer-events-auto bg-white ${!isVisible ? "hidden" : ""}`}
      >
        <Canvas
          shadows
          dpr={[1.5, 3]}
          gl={{
            antialias: false,
            alpha: true,
          }}
        >
          <Suspense fallback={<Loader />}>
            <Environment
              files={"/env/08.exr"}
              environmentIntensity={0.7}
              environmentRotation={[0, 3.63, 0]}
              blur={0.5}
            />

            {/* Top-Left Reflection Light Panel & Directional Light */}
            {/* <directionalLight position={[-3.5, 4, 3.5]} intensity={4.0} />
            <mesh position={[-3.5, 4, 3.5]} lookAt={[0, 0, 0]}>
              <planeGeometry args={[2.0, 0.8]} />
              <meshBasicMaterial color={[15, 15, 15]} toneMapped={false} side={THREE.DoubleSide} />
            </mesh> */}

            <DynamicContactShadows>
              {/* <AutoRotateController> */}
              <Model3DContent />
              {designManager.currentView === "engrave" && (
                <EngraveModelRender />
              )}
              {/* </AutoRotateController> */}
            </DynamicContactShadows>
            <CanvasCamera />
            <AntiAliasing samples={32} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay for Engraving */}
      {designManager.currentView === "engrave" && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <EngraveModelViewer />
        </div>
      )}
    </div>
  );
});

export default ModelRender;
