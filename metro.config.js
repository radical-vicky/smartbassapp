// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to ignore CSS files completely (fixes the @expo/log-box crash)
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'css');
config.resolver.assetExts.push('css');

module.exports = config;