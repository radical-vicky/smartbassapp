const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSonicAudio(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = config.modRequest.platformProjectRoot;

      const sourceDir = path.join(projectRoot, 'modules', 'sonic-audio', 'android', 'src', 'main', 'java', 'expo', 'modules', 'sonicaudio');
      const targetDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'expo', 'modules', 'sonicaudio');

      if (fs.existsSync(sourceDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
          if (file.endsWith('.kt')) {
            fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
          }
        }
        console.log('✅ [SonicAudio] Copied Kotlin files to Android project.');
      } else {
        console.error('❌ [SonicAudio] Source directory not found.');
      }
      return config;
    },
  ]);
};
