import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.beacon.app',
  appName: 'Beacon',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https',
    hostname: 'beacon.app',
    iosScheme: 'ionic',
    cleartext: false
  },
  android: ({
    buildToolsVersion: '34.0.0',
    minSdkVersion: 30, // Android 11+ only
    targetSdkVersion: 35, // Android 15 (latest)
    compileSdkVersion: 35,
    allowMixedContent: false,
    useLegacyBridge: false,
    backgroundColor: '#1e1e1e',
    flavor: 'prod',
    path: 'android',
    webContentsDebuggingEnabled: false
  } as any),
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#5865F2',
      sound: 'beep.wav'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e1e1e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e1e1e'
    },
    App: {
      preserveStateOnExit: true
    },
    Network: {
      enabled: true
    },
    Permissions: {
      camera: {
        promptMessage: 'Beacon needs camera access to share photos'
      },
      photos: {
        promptMessage: 'Beacon needs photo library access to share images' 
      },
      microphone: {
        promptMessage: 'Beacon needs microphone access for voice channels'
      },
      notifications: {
        promptMessage: 'Beacon needs notification permission to alert you of new messages'
      }
    }
  },
  cordova: {}
}

export default config
