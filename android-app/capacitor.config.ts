import type { CapacitorConfig } from '@capacitor/cli';

// Rebuild the local Affinova mobile shell with the latest admin theme.
const config: CapacitorConfig = {
  appId: 'com.affinova.admin',
  appName: 'Affinova',
  webDir: 'www',
  androidScheme: 'https'
};

export default config;
