import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Game } from './Game';
import { settingsManager } from './Settings';
import { getSummerLabPhase } from './PhaseHelper';

const DarkInteriorShader = {
  uniforms: {
    "tDiffuse": { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D( tDiffuse, vUv );
      
      // Vignette effect for dark interior
      vec2 coord = (vUv - 0.5) * 2.0;
      float rf = length(coord) * 0.8; // Radius of vignette
      float e = 1.0 - smoothstep(0.4, 1.2, rf);
      
      // Backrooms color grading (sickly dark yellow contrast)
      color.r = pow(color.r, 1.2) * 1.3;
      color.g = pow(color.g, 1.2) * 1.2;
      color.b = pow(color.b, 1.2) * 0.7;

      // Apply vignette
      color.rgb *= e;

      // Subtle film grain
      color.rgb -= rand(vUv * 100.0) * 0.05;
      
      gl_FragColor = color;
    }
  `
};

export class PostProcessingManager {
  composer: EffectComposer | null = null;
  game: Game;

  constructor(game: Game) {
    this.game = game;

    const usePremiumShaders = settingsManager.getSettings().premiumShaders;
    const isPerformanceMode = settingsManager.getSettings().performanceMode;
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const disableComposer = isPerformanceMode || (isMobile && !usePremiumShaders);
    
    const summerLabPhase = getSummerLabPhase();
    const isBackrooms = this.game.world.isSummerLab && summerLabPhase === 3;
    const forceComposer = isBackrooms; // Only force for Backrooms which needs the color grading/vignette pass

    if (!disableComposer) {
      if (usePremiumShaders) {
        this.game.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.game.renderer.toneMappingExposure = 1.0;
        this.game.renderer.shadowMap.enabled = true;
        this.game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else {
        this.game.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.game.renderer.toneMappingExposure = 1.1; // Bright punchy lighting
      }
      
      this.composer = new EffectComposer(this.game.renderer);
      const renderPass = new RenderPass(this.game.scene, this.game.camera);
      this.composer.addPass(renderPass);

      if (isBackrooms) {
        const darkPass = new ShaderPass(DarkInteriorShader);
        this.composer.addPass(darkPass);
      }
      
      // Ray Tracing AO setup
      if (usePremiumShaders) {
        // Soft ambient occlusion
        const ssaoPass = new SSAOPass(this.game.scene, this.game.camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        this.composer.addPass(ssaoPass);
      }
      
      // Subtle bloom
      if (this.game.world.isSummerLab) {
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.4, 0.85);
        this.composer.addPass(bloomPass);
      } else {
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.25, 0.2, 0.95);
        this.composer.addPass(bloomPass);
      }
    } else {
      this.game.renderer.toneMapping = THREE.NoToneMapping;
    }
  }

  setSize(width: number, height: number) {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  render() {
    if (this.composer) {
      const hideShininess = settingsManager.getSettings().hideShininess;
      this.composer.passes.forEach(pass => {
        if (pass instanceof UnrealBloomPass) {
          pass.strength = hideShininess ? 0.0 : (this.game.world.isSummerLab ? 0.35 : 0.25);
        }
      });
      this.composer.render();
    } else {
      this.game.renderer.render(this.game.scene, this.game.camera);
    }
  }

  dispose() {
    if (this.composer) {
      this.composer.renderer.dispose();
      if ((this.composer as any).renderTarget1) (this.composer as any).renderTarget1.dispose();
      if ((this.composer as any).renderTarget2) (this.composer as any).renderTarget2.dispose();
    }
  }
}
