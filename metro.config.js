const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow .wasm files to be bundled as assets
config.resolver.assetExts.push("wasm");

module.exports = config;
