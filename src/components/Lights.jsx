import { Environment, useHelper } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function Lights({ envUrl, envIntensity, envRotation, showBackground }) {
  const light1 = useRef()
  const light2 = useRef()
  const groupRef = useRef()

  const {
    showHelpers,
    rotationSpeed
  } = useControls('Lighting', {
    'Light Helpers': folder({
      showHelpers: { value: false, label: 'Enabled' },
      rotationSpeed: { value: 1.0, min: 0, max: 10, step: 0.1, label: 'Rotation Speed' },
    })
  }, { collapsed: true })

  // Animate light rotation
  useFrame((state, delta) => {
    const angle = delta * rotationSpeed

    if (groupRef.current) {
      // Clockwise rotation (negative Y)
      groupRef.current.rotation.y += angle
      groupRef.current.rotation.x -= angle
    }
  })

  // Apply helpers
  useHelper(showHelpers ? light1 : null, THREE.PointLightHelper, 0.2, 'cyan')
  useHelper(showHelpers ? light2 : null, THREE.PointLightHelper, 0.2, 'orange')

  const {
    visible1,
    intensity1,
    color1,
    position1,
    distance1,
    decay1
  } = useControls('Lighting', {
    'Light 1': folder({
      visible1: { value: false, label: 'Enabled' },
      intensity1: { value: 10, min: 0, max: 500, step: 1, label: 'Intensity' },
      color1: { value: '#ffffff', label: 'Color' },
      position1: { value: [-0.4, 2.1, 0.1], label: 'Position' },
      distance1: { value: 20, min: 0, max: 100, step: 1, label: 'Distance' },
      decay1: { value: 5, min: 0, max: 5, step: 0.1, label: 'Decay' },
    })
  }, { collapsed: true })

  const {
    visible2,
    intensity2,
    color2,
    position2,
    distance2,
    decay2
  } = useControls('Lighting', {
    'Light 2': folder({
      visible2: { value: false, label: 'Enabled' },
      intensity2: { value: 20, min: 0, max: 500, step: 1, label: 'Intensity' },
      color2: { value: '#ffffff', label: 'Color' },
      position2: { value: [0.8, -1.7, -1.6], label: 'Position' },
      distance2: { value: 20, min: 0, max: 100, step: 1, label: 'Distance' },
      decay2: { value: 2, min: 0, max: 5, step: 0.1, label: 'Decay' },
    })
  }, { collapsed: true })

  const { scene } = useThree()

  // Forcefully sync scene environment properties every frame to ensure they update
  useFrame(() => {
    if (scene) {
      scene.environmentIntensity = envIntensity
      scene.backgroundIntensity = envIntensity

      if (scene.environmentRotation) {
        scene.environmentRotation.set(envRotation[0], envRotation[1], envRotation[2])
      }
      if (scene.backgroundRotation) {
        scene.backgroundRotation.set(envRotation[0], envRotation[1], envRotation[2])
      }
    }
  })

  // Debug log to verify Leva values are changing
  // useEffect(() => {
  //   console.log('Leva Env Update:', { envIntensity, envRotation })
  // }, [envIntensity, envRotation])

  return (
    <>
      <Environment
        files={envUrl}
        background={showBackground}
        resolution={256}
        environmentIntensity={envIntensity}
        rotation={envRotation}
        backgroundRotation={envRotation}
      />

      <group ref={groupRef}>
        <pointLight
          ref={light1}
          visible={visible1}
          intensity={intensity1}
          color={color1}
          position={position1}
          distance={distance1}
          decay={decay1}
        // castShadow
        />

        <pointLight
          ref={light2}
          visible={visible2}
          intensity={intensity2}
          color={color2}
          position={position2}
          distance={distance2}
          decay={decay2}
        // castShadow
        />
      </group>
    </>
  )
}

