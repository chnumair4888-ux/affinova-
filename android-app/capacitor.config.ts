import type { CapacitorConfig } from '@capacitor/cli';

// Rebuild the local Affinova mobile shell after the responsive admin styling update.
const config: CapacitorConfig = {
  appId: 'com.affinova.admin',
  appName: 'Affinova',
  webDir: 'www',
  androidScheme: 'https'
};

export default config;
