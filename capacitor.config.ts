import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pongmobile.game',
  appName: 'Pong Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f2847'
    },
    ScreenOrientation: {
      orientation: 'landscape'
    },
    DeviceMotion: {
      enabled: true
    },
    Haptics: {
      enabled: true
    }
  }
};

export default config;
