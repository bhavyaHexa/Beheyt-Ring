import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { observer } from "mobx-react-lite";
import { ContactShadows } from "@react-three/drei";
import { rootStore } from "../../managers/stateManager";

import { useFrame } from "@react-three/fiber";

interface Props {
  children: React.ReactNode;
}

export const DynamicContactShadows = observer(({ children }: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Group>(null);
  const { designManager } = rootStore;
  
  const isTestingRoute = designManager.currentRoute === "/testing";
  const minY = isTestingRoute ? designManager.testingMinY : designManager.modelMinY;

  const view = designManager.currentView;
  console.log(view);

  useFrame((state) => {
    state.gl.setClearColor(0x000000, 0);

    if (shadowRef.current) {
      shadowRef.current.traverse((node) => {
        if ((node as any).isOrthographicCamera) {
          node.name = "ContactShadowsCamera";
        }
        if ((node as any).isMesh) {
          const mesh = node as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (m.toneMapped !== false) {
                m.toneMapped = false;
                m.needsUpdate = true;
              }
            });
          } else if (mesh.material) {
            if (mesh.material.toneMapped !== false) {
              mesh.material.toneMapped = false;
              mesh.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, -1);

  return (
    <>
      <group ref={groupRef}>{children}</group>
      {(view === "home" || isTestingRoute) && (
        <group ref={shadowRef}>
          <ContactShadows
            position={[0, minY - 0.02, 0]}
            opacity={0.4}
            scale={15}
            blur={0.5}
            far={3}
          />
        </group>
      )}
    </>
  );
});

export default DynamicContactShadows;
