const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devConfig = {
  entry: './src/examples/index.ts',
  devtool: 'inline-source-map',
  mode: 'development',
  watch: true,
  devServer: {
    static: path.join(__dirname, 'dist'),
    open: true,
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'CmD3Graphs',
      template: 'src/examples/index.html',
    }),
  ],
  module: {
    rules: [
      // ts compiler
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        exclude: [/node_modules/],
      },
      // css-loader
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

module.exports = [devConfig];
