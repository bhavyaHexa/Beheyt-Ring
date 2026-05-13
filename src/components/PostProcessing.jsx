import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js'
import { useControls } from 'leva'
import * as THREE from 'three'

/**
 * Custom PostProcessing component using vanilla Three.js EffectComposer.
 * Focused exclusively on TRAA (Temporal Anti-Aliasing) for high-quality smooth edges.
 * Uses GammaCorrectionShader to ensure color accuracy without shifting the background.
 */
export default function PostProcessing({ dirty }) {
  const { gl, scene, camera, size } = useThree()
  const lastMatrix = useRef(new THREE.Matrix4())

  // TRAA (Temporal Anti-Aliasing) Controls
  const { traaEnabled, sampleLevel, unbiased } = useControls("Post Processing.TRAA", {
    traaEnabled: { value: true, label: "Enabled" },
    sampleLevel: {
      value: 3,
      min: 0,
      max: 5,
      step: 1,
      label: "Sample Level (2^n)",
      hint: "Higher levels provide better smoothing over time."
    },
    unbiased: { value: true, label: "Unbiased" },
  })

  // Create composer and passes
  const composerState = useMemo(() => {
    const composer = new EffectComposer(gl)
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 1. Regular Render Pass (Fallback for when TRAA is disabled)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // 2. TRAA Pass (Temporal Anti-Aliasing)
    const traaPass = new TAARenderPass(scene, camera)
    traaPass.unbiased = unbiased
    traaPass.sampleLevel = sampleLevel
    traaPass.accumulate = true
    composer.addPass(traaPass)

    // 3. Gamma Correction Pass
    // This fixes the "orange gold" by converting linear to sRGB,
    // but unlike OutputPass, it won't shift pure white backgrounds.
    const gammaPass = new ShaderPass(GammaCorrectionShader)
    composer.addPass(gammaPass)

    return { composer, renderPass, traaPass, gammaPass }
  }, [gl, scene, camera])

  // Update pass parameters whenever controls change
  useEffect(() => {
    const { composer, renderPass, traaPass } = composerState

    // Toggle between standard RenderPass and TAARenderPass
    renderPass.enabled = !traaEnabled
    traaPass.enabled = traaEnabled

    // Update TRAA settings
    traaPass.sampleLevel = sampleLevel
    traaPass.unbiased = unbiased
    traaPass.accumulate = traaEnabled

    // Clear camera offset if TRAA is disabled
    if (!traaEnabled && camera.clearViewOffset) {
      camera.clearViewOffset()
    }

    // Reset TAA accumulation
    if (traaPass) {
      traaPass.accumulateIndex = -1
    }

    // Sync size
    composer.setSize(size.width, size.height)
  }, [composerState, size, camera, traaEnabled, sampleLevel, unbiased, dirty])

  // Render loop override
  useFrame((state) => {
    const { composer, traaPass } = composerState

    if (traaEnabled && traaPass) {
      if (!state.camera.matrixWorld.equals(lastMatrix.current)) {
        traaPass.accumulateIndex = -1
        lastMatrix.current.copy(state.camera.matrixWorld)
      }
    }

    if (composer) {
      composer.render()
    }
  }, 1)

  return null
}
