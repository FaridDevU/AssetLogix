// config-overrides.js
module.exports = {
  webpack: (config, env) => {
    // Esta línea asegura que se use la versión de tailwindcss correcta.
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: require.resolve('tailwindcss'),
    };
    return config;
  },
};
