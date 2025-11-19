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
    entries["providers-frontend"] = path.resolve(
      __dirname,
      "src/providers/providers-frontend.js"
    );

    return entries;
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
