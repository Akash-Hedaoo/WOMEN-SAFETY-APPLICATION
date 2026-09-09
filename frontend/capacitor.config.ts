import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safeera.app',
  appName: 'Safe-Era',
  webDir: 'dist',
  // For development on a physical device, uncomment and set your PC's local IP:
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF8F5',
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
