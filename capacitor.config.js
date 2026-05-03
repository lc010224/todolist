const { CapacitorConfig } = require('@capacitor/cli');

const config: CapacitorConfig = {
  appId: 'com.todo.app',
  appName: '待办清单',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
    },
  },
};

module.exports = config;
