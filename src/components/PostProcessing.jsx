import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js'
import { useControls, folder } from 'leva'
import * as THREE from 'three'

/**
 * Optimized PostProcessing component.
 * Focused exclusively on TRAA (Temporal Anti-Aliasing) for maximum smoothness.
 */
export default function PostProcessing({ dirty, modelKey }) {
  const { gl, scene, camera, size } = useThree()
  const lastMatrix = useRef(new THREE.Matrix4())

  // AA Selection and Controls
  const { traaEnabled, traaSampleLevel, traaUnbiased } = useControls("Post Processing", {
    "Anti-Aliasing": folder({
      traaEnabled: {
        value: true,
        label: "Enable TRAA"
      },
      traaSampleLevel: {
        value: 3,
        min: 0,
        max: 5,
        step: 1,
        label: "TRAA Level",
        render: (get) => get("Post Processing.Anti-Aliasing.traaEnabled")
      },
      traaUnbiased: {
        value: true,
        label: "TRAA Unbiased",
        render: (get) => get("Post Processing.Anti-Aliasing.traaEnabled")
      }
    })
  })

  // Create composer and passes
  const composerState = useMemo(() => {
    // 0. Create a standard Render Target for the composer
    // We disable hardware MSAA here to let TRAA handle all anti-aliasing
    const renderTarget = new THREE.WebGLRenderTarget(
      size.width * gl.getPixelRatio(),
      size.height * gl.getPixelRatio(),
      {
        samples: 0,
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        colorSpace: THREE.SRGBColorSpace
      }
    )

    const composer = new EffectComposer(gl, renderTarget)
    composer.setPixelRatio(gl.getPixelRatio())

    // 1. Regular Render Pass (used when TRAA is off)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // 2. TRAA Pass (Temporal Anti-Aliasing)
    // This renders the scene with sub-pixel jitter over multiple frames
    const traaPass = new TAARenderPass(scene, camera)
    traaPass.unbiased = traaUnbiased
    traaPass.sampleLevel = traaSampleLevel
    traaPass.accumulate = true
    composer.addPass(traaPass)

    // 3. Gamma Correction Pass (Final Output)
    const gammaPass = new ShaderPass(GammaCorrectionShader)
    composer.addPass(gammaPass)

    return { composer, renderPass, traaPass, gammaPass }
  }, [gl, scene, camera])

  // Update pass parameters whenever controls change or model changes
  useEffect(() => {
    const { composer, renderPass, traaPass } = composerState

    // Toggle between standard RenderPass and TAARenderPass
    renderPass.enabled = !traaEnabled
    traaPass.enabled = traaEnabled

    // Update TRAA settings
    if (traaPass) {
      traaPass.sampleLevel = traaSampleLevel
      traaPass.unbiased = traaUnbiased
      traaPass.accumulate = traaEnabled
      // CRITICAL: Reset accumulation index to -1 to force a re-render of the new scene/model
      traaPass.accumulateIndex = -1
    }

    // Clear camera offset if TRAA is disabled
    if (!traaEnabled && camera.clearViewOffset) {
      camera.clearViewOffset()
    }

    // Sync size
    composer.setSize(size.width, size.height)
  }, [composerState, size, camera, traaEnabled, traaSampleLevel, traaUnbiased, dirty, modelKey])

  // Render loop override
  useFrame((state) => {
    const { composer, traaPass } = composerState

    if (traaEnabled && traaPass) {
      // Reset accumulation if camera moves
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
