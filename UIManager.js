export class UIManager {
  constructor() {
    this.overlays = [
      'intro-overlay',
      'resume-overlay', 
      'projects-overlay',
      'headphone-overlay'
    ];
    
    this.init();
  }
  
  init() {
    this.setupCloseButtons();
    this.setupClickOutside();
    this.setupKeyboardShortcuts();
    this.setupIntroButtons();
  }
  
  setupCloseButtons() {
    // Close button event listeners
    const closeButtons = [
      { id: 'close-intro', overlay: 'intro-overlay' },
      { id: 'close-resume', overlay: 'resume-overlay' },
      { id: 'close-projects', overlay: 'projects-overlay' },
      { id: 'close-headphone', overlay: 'headphone-overlay' }
    ];
    
    closeButtons.forEach(({ id, overlay }) => {
      const button = document.getElementById(id);
      if (button) {
        button.onclick = () => this.hideOverlay(overlay);
      }
    });
  }
  
  setupIntroButtons() {
    const enterButton = document.getElementById('enter-portfolio');
    if (enterButton) {
      enterButton.onclick = () => this.hideOverlay('intro-overlay');
    }
  }
  
  setupClickOutside() {
    this.overlays.forEach(overlayId => {
      const overlay = document.getElementById(overlayId);
      if (overlay) {
        overlay.addEventListener('mousedown', (event) => {
          if (event.target === overlay) {
            this.hideOverlay(overlayId);
          }
        });
      }
    });
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Close any visible overlay
        this.overlays.forEach(overlayId => {
          const overlay = document.getElementById(overlayId);
          if (overlay && overlay.style.display === 'flex') {
            this.hideOverlay(overlayId);
          }
        });
      }
    });
  }
  
  showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }
  
  hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
  
  hideAllOverlays() {
    this.overlays.forEach(overlayId => {
      this.hideOverlay(overlayId);
    });
  }
}