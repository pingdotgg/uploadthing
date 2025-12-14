/** @type {import("@babel/core").ConfigFunction} */
module.exports = function (api) {
  api.cache(true);
  return {
    plugins: ["react-native-reanimated/plugin"],
  };
};
