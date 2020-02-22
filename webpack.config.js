const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/hybrid.ts',
  output: {
    filename: 'hybrid.js',
    path: path.resolve(__dirname, 'src/assets'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        use: { loader: 'ts-loader' },
      },
    ],
  },
  watch: true,
};
