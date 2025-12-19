const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");

module.exports = {
  ...defaultConfig,

  entry: async () => {
    const entries = await defaultConfig.entry();

    // Appointment frontend
    entries["appointment-form-frontend"] = path.resolve(
      __dirname,
      "src/appointment-form/appointment-form.js"
    );

    // Providers frontend
    entries["providers-frontend"] = path.resolve(
      __dirname,
      "src/providers/providers-frontend.js"
    );

    // 🔥 Comparison frontend
    entries["comparison-frontend"] = path.resolve(
      __dirname,
      "src/comparison/comparison-frontend.js"
    );

    // 🔥 Auth Forms
    entries["auth-forms"] = path.resolve(
      __dirname,
      "src/auth-forms/auth-forms.js"
    );

    return entries;
  },

  // ✅ SAFE ADDITION (no side effects)
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      ...(defaultConfig.resolve?.alias || {}),
      "@comparison": path.resolve(__dirname, "src/comparison"),
      "@auth": path.resolve(__dirname, "src/auth-forms"),
    },
  },

  module: {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules,
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              [
                require.resolve("@babel/preset-react"),
                { runtime: "classic" }
              ]
            ]
          }
        }
      }
    ]
  }
};
