import { useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { useControls } from 'leva'
import * as THREE from 'three'

/**
 * Custom PostProcessing component using vanilla Three.js EffectComposer.
 * This allows us to use SSAARenderPass for high-quality anti-aliasing.
 */
export default function PostProcessing() {
  const { gl, scene, camera, size } = useThree()

  // SSAA Controls
  const { ssaaEnabled, sampleLevel, unbiased } = useControls("Post Processing.SSAA", {
    ssaaEnabled: { value: true, label: "Enabled" },
    sampleLevel: { 
      value: 2, 
      min: 0, 
      max: 5, 
      step: 1, 
      label: "Sample Level (2^n)",
      hint: "Higher levels are extremely expensive but provide better anti-aliasing."
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

    // 1. SSAA Pass (Super-Sample Anti-Aliasing)
    // This provides high-quality smooth edges
    const ssaaPass = new SSAARenderPass(scene, camera)
    ssaaPass.unbiased = unbiased
    ssaaPass.sampleLevel = sampleLevel
    composer.addPass(ssaaPass)

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

    return { composer, renderPass, ssaaPass, bloomPass, bcPass, outputPass }
  }, [gl, scene, camera])

  // Update pass parameters whenever controls change
  useEffect(() => {
    const { composer, renderPass, ssaaPass, bloomPass, bcPass, outputPass } = composerState

    // Toggle between standard RenderPass and SSAARenderPass
    // This ensures something is always rendering the scene
    renderPass.enabled = !ssaaEnabled
    ssaaPass.enabled = ssaaEnabled
    
    // Update SSAA settings
    ssaaPass.sampleLevel = sampleLevel
    ssaaPass.unbiased = unbiased

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
  }, [composerState, gl.toneMapping, size, ssaaEnabled, sampleLevel, unbiased, bloomEnabled, intensity, luminanceThreshold, radius, bcEnabled, brightness, contrast])

  // Render loop override
  useFrame(() => {
    if (composerState.composer) {
      composerState.composer.render()
    }
  }, 1)

  return null
}
