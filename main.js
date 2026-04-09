console.log('🚀 Portfolio script starting...');

// Set resume PDF src dynamically - detect base URL from current location
const baseUrl = window.location.pathname.includes('/portfolio') ? '/portfolio/' : '/';
const resumePdfIframe = document.getElementById('resume-pdf');
if (resumePdfIframe) {
  resumePdfIframe.src = `${baseUrl}p/aresume.pdf#view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
}

// Import Three.js using the import map
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

console.log('✅ Three.js imports loaded');

// Configuration (embedded to avoid import issues)
const CONFIG = {
  RELEASE_BASE: 'https://d2pnbujiw3xzto.cloudfront.net/',
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 100,
    POSITION: { x: 2, y: 2, z: 3 }
  },
  RENDERER: {
    TONE_MAPPING_EXPOSURE: 0.75
  },
  CONTROLS: {
    TARGET: { x: 0, y: 1, z: 0 }
  },
  LIGHTS: {
    AMBIENT: { color: 0xffffff, intensity: 0.5 },
    DIRECTIONAL: { color: 0xffffff, intensity: 2, position: { x: 5, y: 10, z: 7.5 } }
  },
  HIGHLIGHT: {
    SCALE_FACTOR: 1.15,
    OUTLINE_COLOR: 0x00BFFF,
    OUTLINE_OPACITY: 0.9
  }
};

const CLICKABLE_OBJECTS = [
  {
    name: 'greenFolder',
    meshNames: ['grh'],
    action: 'overlay',
    target: 'resume-overlay'
  },
  {
    name: 'computer',
    meshNames: ['defaultMaterial005_1', 'defaultMaterial005'],
    action: 'overlay',
    target: 'projects-overlay'
  },
  {
    name: 'books',
    meshNames: ['Cube066', 'Cube068', 'Cube069', 'Cube070', 'Cube071', 'Cube072', 'Cube073', 'Cube074'],
    action: 'link',
    target: 'https://www.goodreads.com/user/show/143791746-aadarsh-battula'
  },
  {
    name: 'movieNumber',
    meshNames: ['Movie_numberator'],
    action: 'link',
    target: 'https://letterboxd.com/aadarshb123/'
  },
  {
    name: 'runningShoes',
    meshNames: ['Red_sport_running_shoes', 'L', 'R'],
    action: 'link',
    target: 'https://www.strava.com/athletes/108160379'
  },
  {
    name: 'headphones',
    meshNames: ['JBL_Bluetooth_Headphones', 'band', 'earpiece', 'earpiece001', 'earpiece006', 'head_band', 'headband', 'logo', 'logo2'],
    action: 'overlay',
    target: 'headphone-overlay'
  },
  {
    name: 'monkey',
    meshNames: ['Stuffed_monkey', 'Stuffed_monkey_1', 'Stuffed_monkey-01'],
    action: 'overlay',
    target: 'intro-overlay'
  }
];

console.log('✅ Configuration loaded');

// Global variables
let scene, camera, renderer, controls, pmremGenerator;
let meshGroups = new Map();
let outlineMeshes = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let modelLoaded = false;
let clicksDisabled = false;

// Initialize mesh groups
CLICKABLE_OBJECTS.forEach(obj => {
  meshGroups.set(obj.name, []);
});

// Scene setup
function initScene() {
  console.log('🎬 Initializing scene...');
  
  // Scene
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    CONFIG.CAMERA.FOV,
    window.innerWidth / window.innerHeight,
    CONFIG.CAMERA.NEAR,
    CONFIG.CAMERA.FAR
  );
  camera.position.set(
    CONFIG.CAMERA.POSITION.x,
    CONFIG.CAMERA.POSITION.y,
    CONFIG.CAMERA.POSITION.z
  );
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.RENDERER.TONE_MAPPING_EXPOSURE;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  document.body.appendChild(renderer.domElement);
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(
    CONFIG.CONTROLS.TARGET.x,
    CONFIG.CONTROLS.TARGET.y,
    CONFIG.CONTROLS.TARGET.z
  );
  controls.update();
  
  // Lights
  const ambient = new THREE.AmbientLight(
    CONFIG.LIGHTS.AMBIENT.color,
    CONFIG.LIGHTS.AMBIENT.intensity
  );
  scene.add(ambient);
  
  const directional = new THREE.DirectionalLight(
    CONFIG.LIGHTS.DIRECTIONAL.color,
    CONFIG.LIGHTS.DIRECTIONAL.intensity
  );
  directional.position.set(
    CONFIG.LIGHTS.DIRECTIONAL.position.x,
    CONFIG.LIGHTS.DIRECTIONAL.position.y,
    CONFIG.LIGHTS.DIRECTIONAL.position.z
  );
  scene.add(directional);
  
  console.log('✅ Scene initialized');
}

// Load environment
function loadEnvironment() {
  console.log('🌍 Loading environment...');
  
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  new RGBELoader()
    .load(`${CONFIG.RELEASE_BASE}warm_restaurant_night_4k.hdr`, 
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
        console.log('✅ Environment loaded');
      }, 
      (xhr) => {
        console.log('HDR ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('❌ Error loading HDR:', error);
      }
    );
}

// Load 3D model
function loadModel() {
  console.log('📦 Loading 3D model...');
  
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  
  loader.load(
    `${CONFIG.RELEASE_BASE}final-v2.glb`,
    (gltf) => {
      console.log('✅ Model loaded, processing...');
      
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Categorize meshes
          CLICKABLE_OBJECTS.forEach(obj => {
            if (obj.meshNames.includes(child.name)) {
              meshGroups.get(obj.name).push(child);
            }
          });
        }
      });
      
      scene.add(gltf.scene);
      modelLoaded = true;
      updateUI();
      
      console.log('✅ Model processed and added to scene');
    },
    (xhr) => {
      const percent = Math.floor(xhr.loaded / xhr.total * 100);
      console.log('GLB ' + percent + '% loaded');
      updateLoadingProgress(percent);
    },
    (error) => {
      console.error('❌ Error loading model:', error);
      // Try fallback
      loadFallbackModel(loader);
    }
  );
}

function loadFallbackModel(loader) {
  console.log('🔄 Trying fallback model...');
  
  loader.load(
    `${CONFIG.RELEASE_BASE}model.glb`,
    (gltf) => {
      console.log('✅ Fallback model loaded');
      
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          CLICKABLE_OBJECTS.forEach(obj => {
            if (obj.meshNames.includes(child.name)) {
              meshGroups.get(obj.name).push(child);
            }
          });
        }
      });
      
      scene.add(gltf.scene);
      modelLoaded = true;
      updateUI();
      
      console.log('✅ Fallback model processed');
    },
    (xhr) => {
      const percent = Math.floor(xhr.loaded / xhr.total * 100);
      console.log('Fallback GLB ' + percent + '% loaded');
      updateLoadingProgress(percent);
    },
    (error) => {
      console.error('❌ Fallback model also failed:', error);
      modelLoaded = true;
      updateUI();
    }
  );
}

// UI Management
function updateLoadingProgress(percent) {
  const enterButton = document.getElementById('enter-portfolio');
  if (enterButton && enterButton.classList.contains('loading')) {
    const loadingText = enterButton.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = `${percent}%`;
    }
    enterButton.style.setProperty('--load-percent', `${percent}%`);
  }
}

function updateUI() {
  const enterButton = document.getElementById('enter-portfolio');
  if (enterButton) {
    enterButton.classList.remove('loading');
    enterButton.innerHTML = 'Enter Portfolio';
  }
}

// Interaction handlers
function createOutline(meshes) {
  removeOutlines();
  
  meshes.forEach(mesh => {
    const outlineMesh = mesh.clone();
    outlineMesh.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
    
    const worldQuaternion = mesh.getWorldQuaternion(new THREE.Quaternion());
    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    outlineMesh.rotation.copy(euler);
    
    outlineMesh.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
    outlineMesh.scale.multiplyScalar(CONFIG.HIGHLIGHT.SCALE_FACTOR);
    
    outlineMesh.material = new THREE.MeshBasicMaterial({
      color: CONFIG.HIGHLIGHT.OUTLINE_COLOR,
      transparent: true,
      opacity: CONFIG.HIGHLIGHT.OUTLINE_OPACITY,
      side: THREE.BackSide
    });
    
    outlineMeshes.push(outlineMesh);
    scene.add(outlineMesh);
  });
}

function removeOutlines() {
  outlineMeshes.forEach(mesh => {
    scene.remove(mesh);
    mesh.material.dispose();
  });
  outlineMeshes = [];
}

function isAnyOverlayOpen() {
  const overlays = ['intro-overlay', 'resume-overlay', 'projects-overlay', 'headphone-overlay'];
  return overlays.some(id => {
    const overlay = document.getElementById(id);
    return overlay && overlay.style.display === 'flex';
  });
}

function onClick(event) {
  // Don't process clicks if disabled (cooldown period) or overlay is open
  if (clicksDisabled || isAnyOverlayOpen()) {
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  for (const [name, meshes] of meshGroups) {
    if (meshes.length === 0) continue;

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      const obj = CLICKABLE_OBJECTS.find(o => o.name === name);
      if (obj) {
        handleClick(obj);
        return;
      }
    }
  }
}

function handleClick(obj) {
  if (obj.action === 'overlay') {
    showOverlay(obj.target);
  } else if (obj.action === 'link') {
    window.open(obj.target, '_blank');
  }
}

function onMouseMove(event) {
  // Don't show hover effects if clicks are disabled or overlay is open
  if (clicksDisabled || isAnyOverlayOpen()) {
    removeOutlines();
    document.body.style.cursor = 'default';
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  removeOutlines();

  let hovering = false;

  for (const [name, meshes] of meshGroups) {
    if (meshes.length === 0) continue;

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      const obj = CLICKABLE_OBJECTS.find(o => o.name === name);
      if (obj) {
        hovering = true;
        createOutline(meshes);
        document.body.style.cursor = 'pointer';
        break;
      }
    }
  }
  
  if (!hovering) {
    document.body.style.cursor = '';
  }
}

function showOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function hideOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Event listeners
function setupEventListeners() {
  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMouseMove);
  
  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // UI events
  document.getElementById('close-intro')?.addEventListener('click', () => hideOverlay('intro-overlay'));
  document.getElementById('enter-portfolio')?.addEventListener('click', () => {
    if (modelLoaded) {
      hideOverlay('intro-overlay');
      // Disable clicks for 2 seconds to prevent accidental clicks on objects underneath
      clicksDisabled = true;
      setTimeout(() => {
        clicksDisabled = false;
      }, 1000);
    }
  });
  document.getElementById('close-resume')?.addEventListener('click', () => hideOverlay('resume-overlay'));
  document.getElementById('close-projects')?.addEventListener('click', () => hideOverlay('projects-overlay'));
  document.getElementById('close-headphone')?.addEventListener('click', () => hideOverlay('headphone-overlay'));
  
  // Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      ['intro-overlay', 'resume-overlay', 'projects-overlay', 'headphone-overlay'].forEach(hideOverlay);
    }
  });
  
  console.log('✅ Event listeners setup');
}

/** Spotify embed uses loading="eager" so the iframe starts loading with the page (lazy waited until the overlay was visible). Skeleton hides on iframe load. */
function setupSpotifyEmbed() {
  const iframe = document.getElementById('spotify-embed-iframe');
  const skeleton = document.querySelector('#headphone-overlay .spotify-embed-skeleton');
  if (!iframe || !skeleton) return;

  const hideSkeleton = () => skeleton.classList.add('is-hidden');

  iframe.addEventListener('load', hideSkeleton, { once: true });
  setTimeout(hideSkeleton, 20000);
}

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Initialize everything
function init() {
  console.log('🚀 Starting portfolio initialization...');
  
  initScene();
  loadEnvironment();
  loadModel();
  setupEventListeners();
  setupSpotifyEmbed();
  animate();
  
  console.log('✅ Portfolio initialization complete');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('📝 Portfolio script loaded');