module.exports = {
  dependencies: {
    '@nozbe/simdjson': {
      platforms: {
        ios: null, // Disable autolinking for iOS - handled by expo plugin
      },
    },
  },
};
