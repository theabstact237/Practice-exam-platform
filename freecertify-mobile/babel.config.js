module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo handles expo-router and react-native-reanimated/worklets
    // automatically for SDK 56.
    presets: ['babel-preset-expo'],
  };
};
