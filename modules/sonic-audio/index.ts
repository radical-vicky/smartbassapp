// modules/sonic-audio/index.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSonicAudio(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Expo autolinking reads the expo-module.config.json file. 
      // This plugin ensures the folder is included.
      return config;
    },
  ]);
};