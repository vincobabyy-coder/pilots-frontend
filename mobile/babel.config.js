module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin is included automatically by
    // babel-preset-expo in SDK 54 — adding it manually causes a
    // "Cannot find module react-native-worklets/plugin" error.
  };
};
