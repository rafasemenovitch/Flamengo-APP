const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ponte temporária (ver scripts/link-zuno-modules.sh): se node_modules/ for
// feito de symlinks para outro projeto, o Metro precisa observar a pasta real.
const expoRealPath = fs.realpathSync(path.join(__dirname, 'node_modules', 'expo'));
const realNodeModules = path.dirname(expoRealPath);
if (!realNodeModules.startsWith(path.join(__dirname, 'node_modules'))) {
  config.watchFolders = [...(config.watchFolders ?? []), realNodeModules];
}

module.exports = config;
