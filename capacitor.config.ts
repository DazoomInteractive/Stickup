interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
}

const config: CapacitorConfig = {
  appId: 'com.dazoom.stickup',
  appName: 'StickUp 2D',
  webDir: 'dist'
};

export default config;
