const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Modelo de pose de MediaPipe (assets/models/pose_landmarker_full.task)
config.resolver.assetExts.push('task');

module.exports = config;
