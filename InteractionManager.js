import * as THREE from 'three';
import { CLICKABLE_OBJECTS, CONFIG } from './config.js';

export class InteractionManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickableObjects = new Map();
    this.outlineMeshes = [];
    this.originalMaterials = new Map();
    this.currentlyHighlighted = null;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    window.addEventListener('click', (event) => this.onClick(event));
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }
  
  registerClickableObject(name, meshes, action, target) {
    this.clickableObjects.set(name, {
      meshes: meshes,
      action: action,
      target: target,
      originalMaterials: meshes.map(mesh => mesh.material.clone())
    });
  }
  
  updateMousePosition(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());
  }
  
  onClick(event) {
    this.updateMousePosition(event);
    
    for (const [name, obj] of this.clickableObjects) {
      const intersects = this.raycaster.intersectObjects(obj.meshes, true);
      if (intersects.length > 0) {
        this.handleObjectClick(obj);
        return;
      }
    }
  }
  
  handleObjectClick(obj) {
    if (obj.action === 'overlay') {
      document.getElementById(obj.target).style.display = 'flex';
    } else if (obj.action === 'link') {
      window.open(obj.target, '_blank');
    }
  }
  
  onMouseMove(event) {
    this.updateMousePosition(event);
    
    // Remove current highlight
    this.removeHighlight();
    
    let hovering = false;
    
    // Check for intersections
    for (const [name, obj] of this.clickableObjects) {
      const intersects = this.raycaster.intersectObjects(obj.meshes, true);
      if (intersects.length > 0) {
        hovering = true;
        this.currentlyHighlighted = name;
        this.applyHighlight(obj.meshes);
        document.body.style.cursor = 'pointer';
        break;
      }
    }
    
    if (!hovering) {
      document.body.style.cursor = '';
    }
  }
  
  applyHighlight(meshes) {
    this.createOutlineEffect(meshes);
  }
  
  removeHighlight() {
    this.removeOutlineEffect();
    this.currentlyHighlighted = null;
  }
  
  createOutlineEffect(meshes) {
    meshes.forEach(mesh => {
      if (!this.originalMaterials.has(mesh)) {
        this.originalMaterials.set(mesh, {
          scale: mesh.scale.clone(),
          material: mesh.material.clone()
        });
      }
      
      // Create outline mesh
      const outlineMesh = mesh.clone();
      
      // Copy world transform
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
      
      this.outlineMeshes.push(outlineMesh);
      this.sceneManager.addToScene(outlineMesh);
    });
  }
  
  removeOutlineEffect() {
    this.outlineMeshes.forEach(mesh => {
      this.sceneManager.removeFromScene(mesh);
      mesh.material.dispose();
    });
    this.outlineMeshes = [];
  }
  
  dispose() {
    this.removeOutlineEffect();
    this.originalMaterials.clear();
    this.clickableObjects.clear();
  }
}