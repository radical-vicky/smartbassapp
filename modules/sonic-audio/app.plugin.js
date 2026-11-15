// modules/sonic-audio/app.plugin.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSonicAudio(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // 1. Verify the expo-module.config.json exists so autolinking works
      const moduleConfigPath = path.join(
        config.modRequest.projectRoot,
        'modules',
        'sonic-audio',
        'expo-module.config.json'
      );

      if (!fs.existsSync(moduleConfigPath)) {
        throw new Error(
          '🚨 [SonicAudio] Missing expo-module.config.json. ' +
          'EAS will not compile the native Kotlin code without it.'
        );
      }

      // 2. Log a confirmation during the EAS build process
      console.log('✅ [SonicAudio] Config plugin executed. Native module will be linked.');

      return config;
    },
  ]);
};