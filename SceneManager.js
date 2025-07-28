import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
import { CONFIG } from './config.js';

export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pmremGenerator = null;
    
    this.init();
  }
  
  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createLights();
    this.loadEnvironment();
    this.setupEventListeners();
    this.startRenderLoop();
  }
  
  createScene() {
    this.scene = new THREE.Scene();
  }
  
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.NEAR,
      CONFIG.CAMERA.FAR
    );
    this.camera.position.set(
      CONFIG.CAMERA.POSITION.x,
      CONFIG.CAMERA.POSITION.y,
      CONFIG.CAMERA.POSITION.z
    );
  }
  
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(this.renderer.domElement);
  }
  
  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(
      CONFIG.CONTROLS.TARGET.x,
      CONFIG.CONTROLS.TARGET.y,
      CONFIG.CONTROLS.TARGET.z
    );
    this.controls.update();
  }
  
  createLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(
      CONFIG.LIGHTS.AMBIENT.color,
      CONFIG.LIGHTS.AMBIENT.intensity
    );
    this.scene.add(ambient);
    
    // Directional light
    const directional = new THREE.DirectionalLight(
      CONFIG.LIGHTS.DIRECTIONAL.color,
      CONFIG.LIGHTS.DIRECTIONAL.intensity
    );
    directional.position.set(
      CONFIG.LIGHTS.DIRECTIONAL.position.x,
      CONFIG.LIGHTS.DIRECTIONAL.position.y,
      CONFIG.LIGHTS.DIRECTIONAL.position.z
    );
    this.scene.add(directional);
  }
  
  loadEnvironment() {
    this.pmremGenerator = new PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    new RGBELoader()
      .load(`${CONFIG.RELEASE_BASE}warm_restaurant_night_4k.hdr`, (texture) => {
        const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
        this.scene.environment = envMap;
        texture.dispose();
        this.pmremGenerator.dispose();
      }, 
      (xhr) => {
        console.log('HDR ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading HDR:', error);
      });
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
  
  addToScene(object) {
    this.scene.add(object);
  }
  
  removeFromScene(object) {
    this.scene.remove(object);
  }
  
  getScene() {
    return this.scene;
  }
  
  getCamera() {
    return this.camera;
  }
  
  getRenderer() {
    return this.renderer;
  }
}