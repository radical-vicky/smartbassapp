// app.config.js
const { ExpoConfig, ConfigContext } = require('expo/config');

module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      // This explicitly tells EAS to look for your module
      "./modules/sonic-audio/app.plugin.js"
    ],
  };
};