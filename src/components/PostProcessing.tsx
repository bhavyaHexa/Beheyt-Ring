import { useEffect, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js'
import { useControls } from 'leva'
import * as THREE from 'three'

/**
 * Custom PostProcessing component using vanilla Three.js EffectComposer.
 * This allows us to use TAARenderPass (Temporal Anti-Aliasing) for high-quality smooth edges.
 * Note: While Three.js calls this TAA, it provides the temporal smoothing the user requested.
 */
interface PostProcessingProps {
  dirty: string;
}

export default function PostProcessing({ dirty }: PostProcessingProps) {
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

  // SSAO Controls
  const { ssaoEnabled, ssaoIntensity, kernelRadius, minDistance, maxDistance, ssaoOnly } = useControls("Post Processing.SSAO", {
    ssaoEnabled: { value: true, label: "Enabled" },
    ssaoOnly: { value: false, label: "SSAO Debug Output" },
    ssaoIntensity: { value: 1.5, min: 0, max: 5, step: 0.1, label: "Intensity" },
    kernelRadius: { value: 0.5, min: 0.01, max: 5, step: 0.01, label: "Kernel Radius" },
    minDistance: { value: 1.0, min: 0, max: 50.0, step: 0.1, label: "Min Distance (x1000)" },
    maxDistance: { value: 100.0, min: 0, max: 2000.0, step: 1.0, label: "Max Distance (x1000)" },
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

    // 1.5 SSAO Pass
    const ssaoPass = new SSAOPass(scene, camera, size.width, size.height)

    // Patch visibility to ignore transparent objects (like ContactShadows) during SSAO render
    const ssaoPassAny = ssaoPass as any;
    const originalVisibility = ssaoPassAny._overrideVisibility.bind(ssaoPassAny);
    ssaoPassAny._overrideVisibility = function () {
      originalVisibility();
      this.scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh && object.material && object.visible) {
          const isTransparent = Array.isArray(object.material)
            ? object.material.some(m => m.transparent)
            : object.material.transparent;
          if (isTransparent) {
            object.visible = false;
            this._visibilityCache.push(object);
          }
        }
      });
    };

    // Inject intensity uniform into the SSAO shader
    ssaoPassAny.ssaoMaterial.uniforms['intensity'] = { value: 1.0 }
    ssaoPassAny.ssaoMaterial.fragmentShader = ssaoPassAny.ssaoMaterial.fragmentShader
      .replace(
        'uniform float kernelRadius;',
        'uniform float kernelRadius;\nuniform float intensity;'
      )
      .replace(
        'gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );',
        'gl_FragColor = vec4( vec3( 1.0 - occlusion * intensity ), 1.0 );'
      )
    composer.addPass(ssaoPass)

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

    return { composer, renderPass, traaPass, ssaoPass, bloomPass, bcPass, outputPass }
  }, [gl, scene, camera])

  // Update pass parameters whenever controls change
  useEffect(() => {
    const { composer, renderPass, traaPass, ssaoPass, bloomPass, bcPass, outputPass } = composerState

    // Toggle between standard RenderPass and TAARenderPass
    // This ensures something is always rendering the scene
    renderPass.enabled = !traaEnabled
    traaPass.enabled = traaEnabled

    // Update TRAA settings
    traaPass.sampleLevel = sampleLevel
    traaPass.unbiased = unbiased
    traaPass.accumulate = traaEnabled

    // Clear camera offset if TRAA is disabled to fix positioning issues
    if (!traaEnabled && (camera as any).clearViewOffset) {
      (camera as any).clearViewOffset()
    }

    // Update SSAO
    ssaoPass.enabled = ssaoEnabled
    ssaoPass.kernelRadius = kernelRadius
    ssaoPass.minDistance = minDistance / 1000
    ssaoPass.maxDistance = maxDistance / 1000

    // Sync camera near/far to prevent white-out issues if camera changes
    if (ssaoPass.ssaoMaterial.uniforms['cameraNear']) {
      ssaoPass.ssaoMaterial.uniforms['cameraNear'].value = camera.near;
      ssaoPass.ssaoMaterial.uniforms['cameraFar'].value = camera.far;
    }
    if (ssaoPass.depthRenderMaterial.uniforms['cameraNear']) {
      ssaoPass.depthRenderMaterial.uniforms['cameraNear'].value = camera.near;
      ssaoPass.depthRenderMaterial.uniforms['cameraFar'].value = camera.far;
    }

    // Set custom injected intensity uniform
    if (ssaoPass.ssaoMaterial.uniforms['intensity']) {
      ssaoPass.ssaoMaterial.uniforms['intensity'].value = ssaoIntensity;
    }

    // Fix issue where changing intensity didn't immediately update or created errors
    if (ssaoPass.output !== undefined) {
      ssaoPass.output = ssaoOnly ? SSAOPass.OUTPUT.SSAO : SSAOPass.OUTPUT.Default
    }

    // Update Bloom
    bloomPass.enabled = bloomEnabled
    bloomPass.strength = intensity
    bloomPass.threshold = luminanceThreshold
    bloomPass.radius = radius

    // Update Brightness/Contrast
    bcPass.enabled = bcEnabled
    bcPass.uniforms.brightness.value = brightness;
    bcPass.uniforms.contrast.value = contrast;
    
    // Sync OutputPass with renderer settings
    (outputPass as any).toneMapping = gl.toneMapping;

    // Reset TAA accumulation when any prop (including dirty) changes
    if (traaPass) {
      (traaPass as any).accumulateIndex = -1
    }

    // Sync size
    composer.setSize(size.width, size.height)
  }, [composerState, gl.toneMapping, size, camera, traaEnabled, sampleLevel, unbiased, ssaoEnabled, ssaoOnly, ssaoIntensity, kernelRadius, minDistance, maxDistance, bloomEnabled, intensity, luminanceThreshold, radius, bcEnabled, brightness, contrast, dirty])

  // Render loop override
  useFrame((state) => {
    const { composer, traaPass } = composerState

    if (traaEnabled && traaPass) {
      // Reset TRAA accumulation if camera moves, otherwise OrbitControls feels "stuck" or blurry
      if (!state.camera.matrixWorld.equals(lastMatrix.current)) {
        (traaPass as any).accumulateIndex = -1
        lastMatrix.current.copy(state.camera.matrixWorld)
      }
    }

    if (composer) {
      composer.render()
    }
  }, 1)

  return null
}
