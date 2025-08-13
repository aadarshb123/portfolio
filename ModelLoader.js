import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CLICKABLE_OBJECTS, CONFIG } from './config.js';

export class ModelLoader {
  constructor(sceneManager, interactionManager, onLoadComplete = null) {
    this.sceneManager = sceneManager;
    this.interactionManager = interactionManager;
    this.onLoadComplete = onLoadComplete;
    this.meshGroups = new Map();
    
    this.setupLoaders();
    this.initializeMeshGroups();
  }
  
  setupLoaders() {
    // Setup Draco loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    
    // Create GLTF loader and attach Draco decoder
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
  }
  
  initializeMeshGroups() {
    // Initialize mesh groups for each clickable object
    CLICKABLE_OBJECTS.forEach(obj => {
      this.meshGroups.set(obj.name, []);
    });
  }
  
  async loadModel() {
    // --- IMPORTANT ---
    // Now loading the smaller, compressed model for faster performance.
    const modelUrl = 'https://d2fv4trqk78kwg.cloudfront.net/finalmodel-v1.glb';

    try {
      const gltf = await this.loadGLTF(modelUrl);
      this.processModel(gltf);
    } catch (error) {
      console.error(`Error loading model from CloudFront: ${error}`);
      // Handle the error appropriately, e.g., show a message to the user.
    }
  }
  
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf),
        (xhr) => {
          console.log(`Model loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        (error) => reject(error)
      );
    });
  }
  
  processModel(gltf) {
    // Traverse the model and categorize meshes
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Categorize mesh based on name
        this.categorizeMesh(child);
      }
    });
    
    // Register all clickable objects with interaction manager
    this.registerClickableObjects();
    
    // Add to scene
    this.sceneManager.addToScene(gltf.scene);
    
    // Notify that loading is complete
    if (this.onLoadComplete) {
      this.onLoadComplete();
    }
    
    console.log('3D model loaded and processed successfully!');
  }
  
  categorizeMesh(mesh) {
    CLICKABLE_OBJECTS.forEach(obj => {
      if (obj.meshNames.includes(mesh.name)) {
        this.meshGroups.get(obj.name).push(mesh);
      }
    });
  }
  
  registerClickableObjects() {
    CLICKABLE_OBJECTS.forEach(obj => {
      const meshes = this.meshGroups.get(obj.name);
      if (meshes && meshes.length > 0) {
        this.interactionManager.registerClickableObject(
          obj.name,
          meshes,
          obj.action,
          obj.target
        );
      }
    });
  }
  
  getMeshGroup(name) {
    return this.meshGroups.get(name) || [];
  }
  
  dispose() {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    this.meshGroups.clear();
  }
}