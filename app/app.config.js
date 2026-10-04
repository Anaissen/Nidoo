// Lets the web build live under a sub-path (GitHub Pages serves the repo at /<repo-name>/).
// Usage: EXPO_BASE_URL=/nidoo npx expo export --platform web
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});
