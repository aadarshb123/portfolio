import { SceneManager } from './SceneManager.js';
import { InteractionManager } from './InteractionManager.js';
import { ModelLoader } from './ModelLoader.js';
import { UIManager } from './UIManager.js';

class PortfolioApp {
  constructor() {
    this.sceneManager = null;
    this.interactionManager = null;
    this.modelLoader = null;
    this.uiManager = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Initialize managers
      this.sceneManager = new SceneManager();
      this.interactionManager = new InteractionManager(this.sceneManager);
      this.uiManager = new UIManager();
      
      // Create model loader with callback for when loading completes
      this.modelLoader = new ModelLoader(
        this.sceneManager, 
        this.interactionManager,
        () => this.uiManager.onModelLoaded() // Callback to update UI when model loads
      );
      
      // Load the 3D model
      await this.modelLoader.loadModel();
      
      console.log('Portfolio app initialized successfully!');
    } catch (error) {
      console.error('Error initializing portfolio app:', error);
      // On error, still allow entering the portfolio
      if (this.uiManager) {
        this.uiManager.onModelLoaded();
      }
    }
  }
  
  dispose() {
    if (this.modelLoader) {
      this.modelLoader.dispose();
    }
    if (this.interactionManager) {
      this.interactionManager.dispose();
    }
  }
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioApp();
});

// Hide resume overlay on window load (legacy support)
window.addEventListener('load', () => {
  const resumeOverlay = document.getElementById('resume-overlay');
  if (resumeOverlay) {
    resumeOverlay.style.display = 'none';
  }
});