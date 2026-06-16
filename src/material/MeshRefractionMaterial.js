import * as THREE from 'three';
import {
    MeshBVHUniformStruct,
    shaderStructs,
    shaderIntersectFunction,
} from 'three-mesh-bvh';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createBackgroundRenderTarget(renderer) {
    const { width, height } = renderer.getSize(new THREE.Vector2());
    // Optimization: Render background at lower resolution (0.5x) for refraction
    const rt = new THREE.WebGLRenderTarget(width * 0.5, height * 0.5, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
    });
    return rt;
}

// ---------------------------------------------------------------------------
// GLSL source (GLSL 3.0 es)
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  out vec3 vWorldPos;
  out vec3 vViewPos;

  void main() {
    vec4 worldPos4  = modelMatrix * vec4(position, 1.0);
    vWorldPos       = worldPos4.xyz;

    vec4 mvPos      = modelViewMatrix * vec4(position, 1.0);
    vViewPos        = mvPos.xyz;

    gl_Position     = projectionMatrix * mvPos;
  }
`;


const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;
  precision highp isampler2D;

  ${shaderStructs}
  ${shaderIntersectFunction}

  uniform BVH bvh;
  uniform sampler2D tDiffuse;
  uniform vec2      resolution;
  uniform sampler2D envMap;
  uniform float     uEnvMapIntensity;

  uniform vec3  uColor;
  uniform float uIOR;
  uniform float uAberration;
  uniform float uFresnel;
  uniform float uReflectivity;
  uniform float uBlur;
  uniform float uEnvRotation;
  uniform vec3  uHighlightColor;
  uniform float uHighlightTolerance;
  uniform vec3  uAttenuationColor;
  uniform float uAttenuationDistance;
  uniform int   uBounces;

  uniform mat4 uModelMatrix;
  uniform mat4 uModelMatrixInverse;

  // cameraPosition is provided by Three.js

  in vec3 vWorldPos;
  in vec3 vViewPos;

  out vec4 pc_fragColor;

  #define PI 3.14159265359

  vec2 equirectUV(vec3 dir) {
    float phi   = atan(dir.z, dir.x);
    float theta = asin(clamp(dir.y, -1.0, 1.0));
    return vec2(phi / (2.0 * PI) + 0.5, theta / PI + 0.5);
  }

  vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
  }

  vec3 sampleEnv(vec3 dir) {
    return texture(envMap, equirectUV(dir)).rgb * uEnvMapIntensity;
  }

  vec3 sampleScreen(vec2 uv) {
    return texture(tDiffuse, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
  }

  // Derive perfectly sharp geometric face normal from screen-space derivatives.
  // This is anti-aliased by the GPU naturally and avoids both flat-shading
  // pixel popping and smooth-normal blurring across facets.
  vec3 geometricNormal(vec3 worldPos) {
    return normalize(cross(dFdx(worldPos), dFdy(worldPos)));
  }

  // Same but in view space for the glass-offset calculation
  vec3 geometricNormalView(vec3 viewPos) {
    return normalize(cross(dFdx(viewPos), dFdy(viewPos)));
  }

  vec4 calculateInternalBounces(vec3 worldPos, vec3 rd, vec3 worldNormal, float ior) {
    vec3 worldRefractDir = refract(rd, worldNormal, 1.0 / ior);
    vec3 rayOrigin    = (uModelMatrixInverse * vec4(worldPos, 1.0)).xyz;
    vec3 rayDirection = normalize((uModelMatrixInverse * vec4(worldRefractDir, 0.0)).xyz);
    rayOrigin        += rayDirection * 0.001;

    float totalDist = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= uBounces) break;
      uvec4 faceIndices;
      vec3  faceNormal;
      vec3  barycoord;
      float side;
      float dist;
      bool didHit = bvhIntersectFirstHit(bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist);
      if (!didHit) break;
      totalDist        += dist;
      vec3 hitPos       = rayOrigin + rayDirection * max(dist - 0.001, 0.0);
      // Diamond facets are geometrically flat — use flat face normal
      vec3 tempDir      = refract(rayDirection, faceNormal, ior);
      if (length(tempDir) > 0.0) {
        rayDirection = tempDir;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin    = hitPos + rayDirection * 0.001;
    }
    vec3 finalDir = normalize((uModelMatrix * vec4(rayDirection, 0.0)).xyz);
    return vec4(finalDir, totalDist);
  }

  void main() {
    vec3 worldPos      = vWorldPos;
    vec3 viewDir       = normalize(worldPos - cameraPosition);
    // Derive sharp geometric face normal from position derivatives — no vertex
    // normal interpolation, no flat-shading pixel popping, naturally anti-aliased
    vec3 worldNormal   = geometricNormal(worldPos);
    vec3 viewNormal    = geometricNormalView(vViewPos);
    vec2 screenUV      = gl_FragCoord.xy / resolution;

    float dotNL        = dot(viewDir, worldNormal);
    float facingRatio  = -dotNL;
    float isFrontFacing = smoothstep(-0.2, 0.0, facingRatio);

    float iorR = uIOR * (1.0 - uAberration);
    float iorG = uIOR;
    float iorB = uIOR * (1.0 + uAberration);

    vec4 exitR_data = calculateInternalBounces(worldPos, viewDir, worldNormal, iorR);
    vec4 exitG_data = calculateInternalBounces(worldPos, viewDir, worldNormal, iorG);
    vec4 exitB_data = calculateInternalBounces(worldPos, viewDir, worldNormal, iorB);

    vec3 exitR = exitR_data.xyz;
    vec3 exitG = exitG_data.xyz;
    vec3 exitB = exitB_data.xyz;
    float totalDist = (exitR_data.w + exitG_data.w + exitB_data.w) / 3.0;

    vec3 envDiamond = vec3(
      sampleEnv(rotateY(exitR, uEnvRotation)).r,
      sampleEnv(rotateY(exitG, uEnvRotation)).g,
      sampleEnv(rotateY(exitB, uEnvRotation)).b
    );

    float fireDistortion = 0.01;
    float o              = uBlur * 0.005;
    vec2  offsets[4] = vec2[](vec2(o,o), vec2(-o,o), vec2(o,-o), vec2(-o,-o));

    vec3 screenDiamond = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      screenDiamond += vec3(
        sampleScreen(screenUV + exitR.xy * fireDistortion + offsets[i]).r,
        sampleScreen(screenUV + exitG.xy * fireDistortion + offsets[i]).g,
        sampleScreen(screenUV + exitB.xy * fireDistortion + offsets[i]).b
      );
    }
    screenDiamond /= 4.0;

    vec3 diamondResult = mix(screenDiamond, envDiamond, 0.82);
    diamondResult      = pow(max(diamondResult, vec3(0.0)), vec3(0.9));
    vec3 transmittance = pow(uAttenuationColor, vec3(totalDist / uAttenuationDistance));
    diamondResult     *= transmittance;

    vec3 glassDirWorldR = refract(viewDir, worldNormal, 1.0 / iorR);
    vec3 glassDirWorldG = refract(viewDir, worldNormal, 1.0 / iorG);
    vec3 glassDirWorldB = refract(viewDir, worldNormal, 1.0 / iorB);

    vec3 envGlass = vec3(
      sampleEnv(rotateY(glassDirWorldR, uEnvRotation)).r,
      sampleEnv(rotateY(glassDirWorldG, uEnvRotation)).g,
      sampleEnv(rotateY(glassDirWorldB, uEnvRotation)).b
    );

    vec3 viewDirView  = normalize(vViewPos);
    vec3 glassDirView = refract(viewDirView, viewNormal, 1.5 / uIOR);
    vec2 glassOffset  = glassDirView.xy * 0.1;

    vec3 screenGlass = sampleScreen(screenUV + glassOffset);
    vec3 glassResult = mix(screenGlass, envGlass, 0.95);

    vec3 baseRefract  = mix(glassResult, diamondResult, isFrontFacing);
    vec3 finalRefract = baseRefract * uColor;

    vec3 reflectionDir = normalize(viewDir - worldNormal * dot(viewDir, worldNormal) * 2.0);
    vec3 envReflect    = sampleEnv(rotateY(reflectionDir, uEnvRotation));
    vec2 reflectOffset = reflectionDir.xy * 0.01;
    vec3 screenReflect = sampleScreen(screenUV + reflectOffset);
    vec3 reflectionRGB = mix(screenReflect, envReflect, 0.85);

    float nFresnel  = pow(max(1.0 + dot(viewDir, worldNormal), 0.0), 5.0) * uFresnel;
    vec3 surfaceGlint = reflectionRGB * nFresnel * uReflectivity * 3.0;

    float highlightMask  = smoothstep(uHighlightTolerance, 1.0, facingRatio);
    highlightMask        = pow(highlightMask, 3.0);
    vec3 facetHighlight  = uHighlightColor * highlightMask * 5.0;

    vec3 finalColor = finalRefract + surfaceGlint + facetHighlight;
    pc_fragColor    = vec4(finalColor, 1.0);
  }
`;

export default class MeshRefractionMaterialWebGL extends THREE.ShaderMaterial {
    constructor({
        geometry,
        bvh,
        envMap,
        backgroundTexture = null,
        resolution = new THREE.Vector2(1024, 768),
        ior = 2.4,
        bounces = 3,
        aberrationStrength = 0.001,
        fresnel = 0.01,
        reflectivity = 1.0,
        color = 0xffffff,
        blur = 0.12,
        envRotation = 0.0,
        highlightColor = 0xffffff,
        highlightTolerance = 1.0,
        attenuationColor = 0xffffff,
        attenuationDistance = 1.0,
        envMapIntensity = 1.0,
    }) {
        const bvhUniform = new MeshBVHUniformStruct();
        bvhUniform.updateFrom(bvh);

        super({
            glslVersion: THREE.GLSL3,
            vertexShader,
            fragmentShader,
            uniforms: {
                bvh: { value: bvhUniform },
                tDiffuse: { value: backgroundTexture },
                resolution: { value: resolution },
                envMap: { value: envMap },
                uEnvMapIntensity: { value: envMapIntensity },
                uColor: { value: new THREE.Color(color) },
                uIOR: { value: ior },
                uAberration: { value: aberrationStrength },
                uFresnel: { value: fresnel },
                uReflectivity: { value: reflectivity },
                uBlur: { value: blur },
                uEnvRotation: { value: envRotation },
                uHighlightColor: { value: new THREE.Color(highlightColor) },
                uHighlightTolerance: { value: highlightTolerance },
                uAttenuationColor: { value: new THREE.Color(attenuationColor) },
                uAttenuationDistance: { value: attenuationDistance },
                uBounces: { value: bounces },
                uModelMatrix: { value: new THREE.Matrix4() },
                uModelMatrixInverse: { value: new THREE.Matrix4() },
            },
            transparent: true,
            depthWrite: true,
        });

        this.onBeforeRender = (_renderer, _scene, _camera, _geometry, mesh) => {
            this.uniforms.uModelMatrix.value.copy(mesh.matrixWorld);
            this.uniforms.uModelMatrixInverse.value.copy(mesh.matrixWorld).invert();
        };
    }

    get color() { return this.uniforms.uColor.value; }
    set color(v) { this.uniforms.uColor.value.set(v); }

    get blur() { return this.uniforms.uBlur.value; }
    set blur(v) { this.uniforms.uBlur.value = v; }

    get envRotation() { return this.uniforms.uEnvRotation.value; }
    set envRotation(v) { this.uniforms.uEnvRotation.value = v; }

    get highlightColor() { return this.uniforms.uHighlightColor.value; }
    set highlightColor(v) { this.uniforms.uHighlightColor.value.set(v); }

    get highlightTolerance() { return this.uniforms.uHighlightTolerance.value; }
    set highlightTolerance(v) { this.uniforms.uHighlightTolerance.value = v; }

    get attenuationColor() { return this.uniforms.uAttenuationColor.value; }
    set attenuationColor(v) { this.uniforms.uAttenuationColor.value.set(v); }

    get attenuationDistance() { return this.uniforms.uAttenuationDistance.value; }
    set attenuationDistance(v) { this.uniforms.uAttenuationDistance.value = v; }

    get envMapIntensity() { return this.uniforms.uEnvMapIntensity.value; }
    set envMapIntensity(v) { this.uniforms.uEnvMapIntensity.value = v; }

    setResolution(width, height) {
        this.uniforms.resolution.value.set(width, height);
    }

    setBackgroundTexture(tex) {
        this.uniforms.tDiffuse.value = tex;
    }
}