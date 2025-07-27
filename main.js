import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2, 2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.75;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .load('warm_restaurant_night_4k.hdr', function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
  });

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 2);
directional.position.set(5, 10, 7.5);
scene.add(directional);

// Load GLB
let greenFolderBookMeshes = [];
let isHoveringGreenFolder = false;
let originalGreenFolderMaterial = null;
let computerMeshes = [];
let isHoveringComputer = false;
let originalComputerMaterial = null;
let bookMeshes = [];
let isHoveringBooks = false;
let originalBookMaterial = null;
let movieNumberMeshes = [];
let isHoveringMovieNumber = false;
let originalMovieNumberMaterial = null;
let runningShoesMeshes = [];
let isHoveringRunningShoes = false;
let originalRunningShoesMaterial = null;
let headphoneMeshes = [];
let isHoveringHeadphones = false;
let originalHeadphoneMaterial = null;
let monkeyMeshes = [];
let isHoveringMonkey = false;
let originalMonkeyMaterial = null;

// Function to create a clickable wrapper object
function createClickableWrapper(name, meshes) {
  const wrapper = new THREE.Group();
  wrapper.name = name;
  wrapper.userData = {
    isClickable: true,
    originalMaterials: [],
    meshes: meshes
  };
  
  // Store original materials
  meshes.forEach(mesh => {
    wrapper.userData.originalMaterials.push(mesh.material.clone());
  });
  
  return wrapper;
}

// Function to apply highlight effect to wrapper
function highlightWrapper(wrapper, hueOffset = 0, saturationOffset = 0.2, lightnessOffset = 0.2) {
  wrapper.userData.meshes.forEach((mesh, index) => {
    mesh.material = mesh.material.clone();
    mesh.material.color.offsetHSL(hueOffset, saturationOffset, lightnessOffset);
  });
}

// Function to reset wrapper materials
function resetWrapperMaterials(wrapper) {
  wrapper.userData.meshes.forEach((mesh, index) => {
    mesh.material.copy(wrapper.userData.originalMaterials[index]);
  });
}

// Function to apply light blue highlight to meshes
function applyLightBlueHighlight(meshes) {
  meshes.forEach((mesh) => {
    if (mesh.material && mesh.material.color) {
      mesh.material = mesh.material.clone();
      // Light blue: hue ~200, increase lightness and saturation slightly
      mesh.material.color.offsetHSL(0.55, 0.3, 0.4); // Light blue highlight
    }
  });
}

// Function to reset mesh materials to original
function resetMeshMaterials(meshes, originalMaterial) {
  if (originalMaterial) {
    meshes.forEach((mesh) => {
      mesh.material.copy(originalMaterial);
    });
  }
}

// Create a blue highlight light
let blueHighlightLight = null;
let currentlyHoveredMeshes = null;

// Function to add blue highlight light to scene
function addBlueHighlightLight() {
  if (!blueHighlightLight) {
    blueHighlightLight = new THREE.PointLight(0x87CEEB, 2, 10); // Light blue color, intensity 2, distance 10
    blueHighlightLight.position.set(0, 2, 0);
    scene.add(blueHighlightLight);
  }
}

// Function to remove blue highlight light from scene
function removeBlueHighlightLight() {
  if (blueHighlightLight) {
    scene.remove(blueHighlightLight);
    blueHighlightLight = null;
  }
  currentlyHoveredMeshes = null;
}

// Function to position blue light near hovered object
function positionBlueLightNearObject(meshes) {
  if (blueHighlightLight && meshes.length > 0) {
    currentlyHoveredMeshes = meshes;
    // Calculate center position of all meshes
    let centerX = 0, centerY = 0, centerZ = 0;
    meshes.forEach(mesh => {
      centerX += mesh.position.x;
      centerY += mesh.position.y;
      centerZ += mesh.position.z;
    });
    centerX /= meshes.length;
    centerY /= meshes.length;
    centerZ /= meshes.length;
    
    blueHighlightLight.position.set(centerX, centerY + 1, centerZ);
  }
}

// Outline highlighting system
let outlineMeshes = [];
let originalMaterials = new Map();

// Function to create outline effect by scaling the mesh slightly larger
function createOutlineEffect(meshes) {
  meshes.forEach(mesh => {
    if (!originalMaterials.has(mesh)) {
      originalMaterials.set(mesh, {
        scale: mesh.scale.clone(),
        material: mesh.material.clone()
      });
    }
    
    // Create a slightly larger copy for outline
    const outlineMesh = mesh.clone();
    
    // Copy the current world transform from the original mesh
    outlineMesh.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
    
    // Get world quaternion and convert to euler
    const worldQuaternion = mesh.getWorldQuaternion(new THREE.Quaternion());
    const euler = new THREE.Euler().setFromQuaternion(worldQuaternion);
    outlineMesh.rotation.copy(euler);
    
    outlineMesh.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
    
    // Make it slightly larger
    outlineMesh.scale.multiplyScalar(1.15); // 15% larger for better visibility
    
    outlineMesh.material = new THREE.MeshBasicMaterial({
      color: 0x00BFFF, // Brighter blue (Deep Sky Blue)
      transparent: true,
      opacity: 0.9, // More opaque
      side: THREE.BackSide // Render only the back faces
    });
    
    outlineMeshes.push(outlineMesh);
    scene.add(outlineMesh);
  });
}

// Function to remove outline effect
function removeOutlineEffect() {
  outlineMeshes.forEach(mesh => {
    scene.remove(mesh);
    mesh.material.dispose();
  });
  outlineMeshes = [];
}

// Function to apply targeted highlight to meshes
function applyTargetedHighlight(meshes) {
  removeOutlineEffect(); // Remove any existing outlines
  createOutlineEffect(meshes);
}

// Function to remove targeted highlight
function removeTargetedHighlight() {
  removeOutlineEffect();
}

const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    console.log(child.name);
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.name === 'grh') {
        greenFolderBookMeshes.push(child);
      }
      if (child.name === 'defaultMaterial005_1'
        || child.name === 'defaultMaterial005') {
        computerMeshes.push(child);
        if (!originalComputerMaterial) originalComputerMaterial = child.material.clone();
      }
      // Add book detection
      if (child.name === 'Cube066' 
        || child.name === 'Cube068'
        || child.name === 'Cube069'
        || child.name === 'Cube070'
        || child.name === 'Cube071'
        || child.name === 'Cube072'
        || child.name === 'Cube073'
        || child.name === 'Cube074') {
        bookMeshes.push(child);
        if (!originalBookMaterial) originalBookMaterial = child.material.clone();
      }
      // Add movie number detection
      if (child.name === 'Movie_numberator') {
        movieNumberMeshes.push(child);
        if (!originalMovieNumberMaterial) originalMovieNumberMaterial = child.material.clone();
      }
      // Add running shoes detection
      if (child.name === 'Red_sport_running_shoes' || child.name === 'L' || child.name === 'R') {
        runningShoesMeshes.push(child);
        if (!originalRunningShoesMaterial) originalRunningShoesMaterial = child.material.clone();
      }
      // Add headphone detection
      if (child.name === 'JBL_Bluetooth_Headphones' 
        || child.name === 'band'
        || child.name === 'earpiece'
        || child.name === 'earpiece001'
        || child.name === 'earpiece006'
        || child.name === 'head_band'
        || child.name === 'headband'
        || child.name === 'logo'
        || child.name === 'logo2') {
        headphoneMeshes.push(child);
        if (!originalHeadphoneMaterial) originalHeadphoneMaterial = child.material.clone();
      }
      // Add monkey detection
      if (child.name === 'Stuffed_monkey' || child.name === 'Stuffed_monkey_1' || child.name === 'Stuffed_monkey-01') {
        monkeyMeshes.push(child);
        if (!originalMonkeyMaterial) originalMonkeyMaterial = child.material.clone();
      }
    }
  });
  
  // Create clickable wrappers
  if (greenFolderBookMeshes.length > 0) {
    const greenFolderWrapper = createClickableWrapper('greenFolderWrapper', greenFolderBookMeshes);
    scene.add(greenFolderWrapper);
  }
  
  if (computerMeshes.length > 0) {
    const computerWrapper = createClickableWrapper('computerWrapper', computerMeshes);
    scene.add(computerWrapper);
  }

  if (bookMeshes.length > 0) {
    const bookWrapper = createClickableWrapper('bookWrapper', bookMeshes);
    scene.add(bookWrapper);
  }
  
  if (movieNumberMeshes.length > 0) {
    const movieNumberWrapper = createClickableWrapper('movieNumberWrapper', movieNumberMeshes);
    scene.add(movieNumberWrapper);
  }

  if (runningShoesMeshes.length > 0) {
    const runningShoesWrapper = createClickableWrapper('runningShoesWrapper', runningShoesMeshes);
    scene.add(runningShoesWrapper);
  }

  if (headphoneMeshes.length > 0) {
    const headphoneWrapper = createClickableWrapper('headphoneWrapper', headphoneMeshes);
    scene.add(headphoneWrapper);
  }

  if (monkeyMeshes.length > 0) {
    const monkeyWrapper = createClickableWrapper('monkeyWrapper', monkeyMeshes);
    scene.add(monkeyWrapper);
  }
  
  scene.add(gltf.scene);
}, undefined, (err) => {
  console.error('Error loading model:', err);
});

// Raycaster for interactivity
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  if (greenFolderBookMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(greenFolderBookMeshes, true);
    if (intersects.length > 0) {
      document.getElementById('resume-overlay').style.display = 'flex';
      return;
    }
  }
  if (computerMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(computerMeshes, true);
    if (intersects.length > 0) {
      document.getElementById('projects-overlay').style.display = 'flex';
      return;
    }
  }
  if (bookMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(bookMeshes, true);
    if (intersects.length > 0) {
      // Open a link when books are clicked
      window.open('https://www.goodreads.com/user/show/143791746-aadarsh-battula', '_blank');
      return;
    }
  }
  if (movieNumberMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(movieNumberMeshes, true);
    if (intersects.length > 0) {
      // Open IMDb profile when movie number is clicked
      window.open('https://www.imdb.com/user/ur205981400/?ref_=hm_nv_profile', '_blank');
      return;
    }
  }
  if (runningShoesMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(runningShoesMeshes, true);
    if (intersects.length > 0) {
      // Open a link when running shoes are clicked
      window.open('https://www.strava.com/athletes/108160379', '_blank');
      return;
    }
  }
  if (headphoneMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(headphoneMeshes, true);
    if (intersects.length > 0) {
      // Open headphone overlay when clicked
      document.getElementById('headphone-overlay').style.display = 'flex';
      return;
    }
  }
  if (monkeyMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(monkeyMeshes, true);
    if (intersects.length > 0) {
      document.getElementById('intro-overlay').style.display = 'flex';
      return;
    }
  }
}
window.addEventListener('click', onClick);

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  let hovering = false;
  
  // Reset all hover states first
  if (isHoveringGreenFolder) {
    isHoveringGreenFolder = false;
    document.body.style.cursor = '';
  }
  if (isHoveringComputer) {
    isHoveringComputer = false;
    document.body.style.cursor = '';
  }
  if (isHoveringBooks) {
    isHoveringBooks = false;
    document.body.style.cursor = '';
  }
  if (isHoveringMovieNumber) {
    isHoveringMovieNumber = false;
    document.body.style.cursor = '';
  }
  if (isHoveringRunningShoes) {
    isHoveringRunningShoes = false;
    document.body.style.cursor = '';
  }
  if (isHoveringHeadphones) {
    isHoveringHeadphones = false;
    document.body.style.cursor = '';
  }
  if (isHoveringMonkey) {
    isHoveringMonkey = false;
    document.body.style.cursor = '';
  }
  
  // Remove any existing highlight light
  removeTargetedHighlight();
  
  // Check for intersections and apply highlighting
  if (greenFolderBookMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(greenFolderBookMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringGreenFolder = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(greenFolderBookMeshes);
    }
  }
  if (computerMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(computerMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringComputer = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(computerMeshes);
    }
  }
  if (bookMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(bookMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringBooks = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(bookMeshes);
    }
  }
  if (movieNumberMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(movieNumberMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringMovieNumber = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(movieNumberMeshes);
    }
  }
  if (runningShoesMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(runningShoesMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringRunningShoes = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(runningShoesMeshes);
    }
  }
  if (headphoneMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(headphoneMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringHeadphones = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(headphoneMeshes);
    }
  }
  if (monkeyMeshes.length > 0) {
    const intersects = raycaster.intersectObjects(monkeyMeshes, true);
    if (intersects.length > 0) {
      hovering = true;
      isHoveringMonkey = true;
      document.body.style.cursor = 'pointer';
      applyTargetedHighlight(monkeyMeshes);
    }
  }
  
  if (!hovering) {
    document.body.style.cursor = '';
    removeTargetedHighlight(); // Ensure no outline is shown when not hovering
  }
}
window.addEventListener('mousemove', onMouseMove);

// Utility function to add click-outside-to-close for overlays
function setupOverlayClickOutside(overlayId, cardClass, closeBtnId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.addEventListener('mousedown', function(event) {
    // Only close if clicking directly on the overlay background, not the card or its children
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
  // Also allow pressing Escape to close
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && overlay.style.display === 'flex') {
      overlay.style.display = 'none';
    }
  });
}

// Setup click-outside-to-close for all overlays with cards
window.addEventListener('DOMContentLoaded', function() {
  setupOverlayClickOutside('projects-overlay', 'projects-card', 'close-projects');
  setupOverlayClickOutside('resume-overlay', 'projects-card', 'close-resume');
  setupOverlayClickOutside('github-overlay', 'projects-card', 'close-github');
  setupOverlayClickOutside('headphone-overlay', 'projects-card', 'close-headphone');
});

// Resize support
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.onload = function() {
  document.getElementById('resume-overlay').style.display = 'none';
};
