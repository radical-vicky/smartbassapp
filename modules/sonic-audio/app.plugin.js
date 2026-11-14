// modules/sonic-audio/app.plugin.js
const { withDangerousMod } = require('@expo/config-plugins');

module.exports = function withSonicAudio(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // This tells Expo's autolinking to look in this folder during EAS build
      return config;
    },
  ]);
};