import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'chat.beacon.app',
  appName: 'Beacon',
  webDir: '../web/dist',
  
  server: {
    androidScheme: 'https',
    cleartext: false,
    hostname: 'beacon.qzz.io',
    iosScheme: 'https',
  },
  
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB', // Android App Bundle for production
      signingType: 'apksigner',
    },
    minWebViewVersion: 55,
    allowMixedContent: false,
    backgroundColor: '#313338',
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 1100,
      backgroundColor: '#0E111C',
      androidScaleType: 'CENTER_INSIDE',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#313338',
      overlay: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#5865F2',
      sound: 'beep.wav',
    },
  },
  
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#313338',
  },
}

export default config
