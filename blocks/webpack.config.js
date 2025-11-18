const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

module.exports = {
  ...defaultConfig,

  entry: async () => {
    const entries = await defaultConfig.entry();

    // Keep block entries (auto-discovery) AND add frontend hydration bundle
    entries["appointment-form-frontend"] = path.resolve(
      __dirname,
      "src/appointment-form/appointment-form.js"
    );

    return entries;
  },

  module: {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules,
      // Ensure classic JSX runtime so WP's wp-element works
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              [
                require.resolve("@babel/preset-react"),
                { runtime: "classic" } // force React.createElement
              ]
            ]
          }
        }
      }
    ]
  },

  resolve: {
    ...defaultConfig.resolve,
    alias: {
      "@shared": path.resolve(__dirname, "../shared-styles"),
    },
  },
};
