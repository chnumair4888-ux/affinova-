import type { CapacitorConfig } from '@capacitor/cli';

// Rebuild local Affinova mobile shell after navy/mint admin workspace refresh; preserve the existing hosted admin features.
const config: CapacitorConfig = {
  appId: 'com.affinova.admin',
  appName: 'Affinova',
  webDir: 'www',
  androidScheme: 'https'
};

export default config;
