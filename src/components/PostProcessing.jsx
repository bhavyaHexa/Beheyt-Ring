import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
// import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { useControls } from 'leva'
import * as THREE from 'three'

export default function PostProcessing({ dirty }) {
  const { gl, scene, camera, size } = useThree()

  const composerRef = useRef()
  const passesRef = useRef()
  const lastMatrix = useRef(new THREE.Matrix4())

  // TRAA Controls
  const { traaEnabled, sampleLevel, unbiased } = useControls("Post Processing.TRAA", {
    traaEnabled: true,
    sampleLevel: { value: 5, min: 0, max: 5, step: 1 },
    unbiased: true
  })



  // Bloom
  const { bloomEnabled, intensity, luminanceThreshold, bloomRadius } = useControls("Post Processing.Bloom", {
    bloomEnabled: false,
    intensity: 0.5,
    luminanceThreshold: 0.9,
    bloomRadius: 0.4,
  })

  // Brightness / Contrast
  const { bcEnabled, brightness, contrast } = useControls("Post Processing.Color", {
    bcEnabled: true,
    brightness: 0,
    contrast: 0
  })

  // ⭐ CREATE COMPOSER AFTER FIRST RENDER (CRITICAL FIX)
  useEffect(() => {

    gl.autoClear = false

    const composer = new EffectComposer(gl)
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(size.width, size.height)

    // 1️⃣ Render pass MUST ALWAYS BE FIRST
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)


    // 3️⃣ TAA (STACKED AFTER SSAO)
    const traaPass = new TAARenderPass(scene, camera)
    traaPass.accumulate = true
    composer.addPass(traaPass)

    // 4️⃣ Bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      intensity,
      bloomRadius,
      luminanceThreshold
    )
    composer.addPass(bloomPass)

    // 5️⃣ Brightness / Contrast
    const bcPass = new ShaderPass(BrightnessContrastShader)
    composer.addPass(bcPass)

    // 6️⃣ Output
    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    composerRef.current = composer
    passesRef.current = { renderPass, traaPass, bloomPass, bcPass, outputPass }

    return () => {
      // Cleanup on unmount
    }
  }, [gl, scene, camera])

  // ⭐ HANDLE RESIZE
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height)
    }
  }, [size])

  // ⭐ UPDATE PASS SETTINGS
  useEffect(() => {
    const composer = composerRef.current
    const passes = passesRef.current
    if (!composer || !passes) return

    const { renderPass, traaPass, bloomPass, bcPass, outputPass } = passes

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
    bloomPass.radius = bloomRadius

    // Color
    bcPass.enabled = bcEnabled
    bcPass.uniforms.brightness.value = brightness
    bcPass.uniforms.contrast.value = contrast

    // Sync OutputPass with renderer settings
    outputPass.toneMapping = gl.toneMapping

    // Reset TAA accumulation when any prop (including dirty) changes
    if (traaPass) {
      traaPass.accumulateIndex = -1
    }

  }, [gl.toneMapping, size, camera, traaEnabled, sampleLevel, unbiased, bloomEnabled, intensity, luminanceThreshold, bloomRadius, bcEnabled, brightness, contrast, dirty])

  // ⭐ RENDER LOOP
  useFrame((state) => {
    const composer = composerRef.current
    const passes = passesRef.current
    if (!composer || !passes) return

    // Reset TAA when camera moves
    if (traaEnabled && !state.camera.matrixWorld.equals(lastMatrix.current)) {
      passes.traaPass.accumulateIndex = -1
      lastMatrix.current.copy(state.camera.matrixWorld)
    }

    composer.render()
  }, 1)

  return null
}
