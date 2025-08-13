// Configuration constants
export const CONFIG = {
  // GitHub Releases URL for large assets
  RELEASE_BASE: 'https://d2pnbujiw3xzto.cloudfront.net/',
  
  // Camera settings
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 100,
    POSITION: { x: 2, y: 2, z: 3 }
  },
  
  // Renderer settings
  RENDERER: {
    TONE_MAPPING_EXPOSURE: 0.75
  },
  
  // Controls settings
  CONTROLS: {
    TARGET: { x: 0, y: 1, z: 0 }
  },
  
  // Lighting settings
  LIGHTS: {
    AMBIENT: { color: 0xffffff, intensity: 0.5 },
    DIRECTIONAL: { color: 0xffffff, intensity: 2, position: { x: 5, y: 10, z: 7.5 } }
  },
  
  // Highlight settings
  HIGHLIGHT: {
    SCALE_FACTOR: 1.15,
    OUTLINE_COLOR: 0x00BFFF,
    OUTLINE_OPACITY: 0.9
  }
};

// Clickable objects configuration
export const CLICKABLE_OBJECTS = [
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
    target: 'https://www.imdb.com/user/ur205981400/?ref_=hm_nv_profile'
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