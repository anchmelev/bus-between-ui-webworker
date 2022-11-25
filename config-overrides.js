const { override: customizeOverride } = require("customize-cra");

function override(config, env) {
  config.module.rules[1].oneOf.unshift({
    test: /\.worker\.js$/,
    use: { loader: "worker-loader" },
  });
  return config;
}

module.exports = customizeOverride(override);
