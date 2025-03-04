const { BannerPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const pkg = require('./package.json');

const rootPath = process.cwd();
const context = path.join(rootPath, 'src');
const examplesPath = path.join(rootPath, 'examples');
const wasmPath = path.join(rootPath, 'wasm');
const outputPath = path.join(rootPath, 'build');
const filename = path.parse(pkg.main).base;

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = ('0' + (today.getMonth() + 1)).slice(-2);
  const date = ('0' + today.getDate()).slice(-2);
  return `${year}-${month}-${date}`;
};

const getBanner = () => {
  return (
    `/*! ${pkg.name} - ${pkg.version} - ` +
    `${getCurrentDate()} ` +
    `| (c) 2025 ${pkg.author} | ${pkg.homepage} */`
  );
};

module.exports = {
  mode: 'production',
  context,
  entry: {
    dcmjsCodecs: './index.js',
  },
  target: 'web',
  output: {
    filename,
    library: {
      commonjs: 'dcmjs-codecs',
      amd: 'dcmjs-codecs',
      root: 'dcmjsCodecs',
    },
    libraryTarget: 'umd',
    path: outputPath,
    umdNamedDefine: true,
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        parallel: true,
        terserOptions: {
          sourceMap: true,
        },
      }),
    ],
  },
  externals: {
    dcmjs: 'dcmjs',
  },
  plugins: [
    new BannerPlugin({
      banner: getBanner(),
      entryOnly: true,
      raw: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.join(examplesPath, 'index.html'), to: path.join(outputPath, 'index.html') },
        {
          from: path.join(wasmPath, 'bin', 'dcmjs-native-codecs.wasm'),
          to: path.join(outputPath, 'dcmjs-native-codecs.wasm'),
        },
      ],
    }),
  ],
  node: {
    __dirname: false,
  },
};
