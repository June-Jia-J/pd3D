const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const webpackConfigBase = require('./webpack.base');
const MockerPlugin = require('../mocker');
const pkg = require('../package.json');

//指定目录,合并打包
const resolve = (relatedPath) => path.join(__dirname, relatedPath);
//判断是否生成发布包
const release = process.env.NODE_ENV == 'production';

//生产环境会将自动代码压缩
const webpackConfigProd = {
  mode: process.env.NODE_ENV,
  output: {
    path: resolve('../build'),
    //打包文件中所有通过相对路径引用的资源都会被配置的路径所替换。
    publicPath: './',
    //配置文件输出路径
    filename: release
      ? 'js/[name].min.js'
      : 'js/[name].js',
  },
  devtool: release
    ? false
    : 'source',
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      dry: false,
      verbose: true,
    }),
    new MockerPlugin({
      buildPath: resolve('../build'),
      publicPath: `./`,
      filename: 'data.js'
    }),
    new webpack.BannerPlugin({
      banner: 
`Info:
Bundle of ${pkg.name}
Version: ${pkg.version}
Generated: ${new Date()}
Author: ${pkg.author}
Copyright: ${pkg.copyright}
License: ISC,

Dependencies:
echarts -- 4.2.1
echarts-gl -- 1.1.1

Log:
${pkg.loginfo.join('\r\n')}
`
    }),
    // 分析代码
    new BundleAnalyzerPlugin({
      analyzerPort: 3030,
      openAnalyzer: release
    }),
    new FileManagerPlugin({
      onEnd: {
        mkdir: ['./build', './release'],
        copy: [
          { source: './public/js', destination: './build/js' },
          { source: './public/styles', destination: './build/styles' },
        ],
        archive: release
          ? [{ source: './build', destination: `./release/${pkg.name}-v${pkg.version}.zip` }]
          : []
      }
    }),
  ],
};

module.exports = merge(webpackConfigBase, webpackConfigProd);
