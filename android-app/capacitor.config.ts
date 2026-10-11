import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.affinova.admin',
  appName: 'Affinova Admin',
  webDir: 'www',
  server: {
    url: 'https://affinova.cyou/admin',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
