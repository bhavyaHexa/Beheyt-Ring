import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { useControls } from 'leva'
import * as THREE from 'three'

/**
 * Custom PostProcessing component using vanilla Three.js EffectComposer.
 * This allows us to use TAARenderPass (Temporal Anti-Aliasing) for high-quality smooth edges.
 * Note: While Three.js calls this TAA, it provides the temporal smoothing the user requested.
 */
export default function PostProcessing() {
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

  // Bloom Controls (Reverted names to match previous implementation)
  const { bloomEnabled, intensity, luminanceThreshold, radius } = useControls("Post Processing.Bloom", {
    bloomEnabled: { value: false, label: "Enabled" },
    intensity: { value: 0.5, min: 0, max: 3, step: 0.1, label: "Intensity" },
    luminanceThreshold: { value: 0.9, min: 0, max: 1, step: 0.05, label: "Threshold" },
    radius: { value: 0.4, min: 0, max: 1, step: 0.01, label: "Radius" },
  });

  // Brightness & Contrast Controls
  const { bcEnabled, brightness, contrast } = useControls("Post Processing.Brightness & Contrast", {
    bcEnabled: { value: true, label: "Enabled" },
    brightness: { value: 0, min: -1, max: 1, step: 0.01 },
    contrast: { value: 0, min: -1, max: 1, step: 0.01 },
  });

  // Create composer and passes
  const composerState = useMemo(() => {
    const composer = new EffectComposer(gl)
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // 0. Regular Render Pass (Fallback for when SSAA is disabled)
    // This provides the standard "jaggy" edges
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // 1. TRAA Pass (Temporal Anti-Aliasing)
    // This provides high-quality smooth edges by accumulating samples over time.
    const traaPass = new TAARenderPass(scene, camera)
    traaPass.unbiased = unbiased
    traaPass.sampleLevel = sampleLevel
    traaPass.accumulate = true
    composer.addPass(traaPass)

    // 2. Bloom Pass (UnrealBloomPass)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height), 
      intensity, 
      radius, 
      luminanceThreshold
    )
    composer.addPass(bloomPass)

    // 3. Brightness/Contrast Pass
    const bcPass = new ShaderPass(BrightnessContrastShader)
    composer.addPass(bcPass)

    // 4. Output Pass
    // Necessary to handle tone mapping and color space conversion correctly
    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    return { composer, renderPass, traaPass, bloomPass, bcPass, outputPass }
  }, [gl, scene, camera])

  // Update pass parameters whenever controls change
  useEffect(() => {
    const { composer, renderPass, traaPass, bloomPass, bcPass, outputPass } = composerState

    // Toggle between standard RenderPass and TAARenderPass
    // This ensures something is always rendering the scene
    renderPass.enabled = !traaEnabled
    traaPass.enabled = traaEnabled
    
    // Update TRAA settings
    traaPass.sampleLevel = sampleLevel
    traaPass.unbiased = unbiased
    traaPass.accumulate = traaEnabled

    // Clear camera offset if TRAA is disabled to fix positioning issues
    if (!traaEnabled && camera.clearViewOffset) {
      camera.clearViewOffset()
    }

    // Update Bloom
    bloomPass.enabled = bloomEnabled
    bloomPass.strength = intensity
    bloomPass.threshold = luminanceThreshold
    bloomPass.radius = radius

    // Update Brightness/Contrast
    bcPass.enabled = bcEnabled
    bcPass.uniforms.brightness.value = brightness
    bcPass.uniforms.contrast.value = contrast

    // Sync OutputPass with renderer settings
    outputPass.toneMapping = gl.toneMapping

    // Sync size
    composer.setSize(size.width, size.height)
  }, [composerState, gl.toneMapping, size, camera, traaEnabled, sampleLevel, unbiased, bloomEnabled, intensity, luminanceThreshold, radius, bcEnabled, brightness, contrast])

  // Render loop override
  useFrame((state) => {
    const { composer, traaPass } = composerState

    if (traaEnabled && traaPass) {
      // Reset TRAA accumulation if camera moves, otherwise OrbitControls feels "stuck" or blurry
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
