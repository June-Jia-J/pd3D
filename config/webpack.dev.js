const path = require('path');
const merge = require('webpack-merge');
const Copy = require('copy-webpack-plugin');
const webpackConfigBase = require('./webpack.base');
const MockerPlugin = require('../mocker');

//指定目录,合并打包
const resolve = (relatedPath) => path.join(__dirname, relatedPath);

// 开发服务绑定地址（使用 localhost，避免依赖已不可达的局域网 IP）
const host = 'localhost';
const port = '8100';

//development|production ( 生产环境会将代码压缩 )
const webpackConfigDev = {
	mode: process.env.NODE_ENV,
	output: {
		publicPath: `http://${host}:${port}/`,
		//配置文件输出路径
		filename: 'js/[name].js',
	},
	devtool: 'source-map',
	plugins: [
		new MockerPlugin({
			buildPath: resolve('../build'),
			publicPath: `http://${host}:${port}/build/`,
			filename: 'data.js'
		}),
		new Copy([
			{ from: './public/js', to: './js' },
			{ from: './public/styles', to: './styles' }
		]),
	],
	devServer: {
		host: host,
		port: port,
		compress: true,
		publicPath: '/',
		// 使 ./public/data/... 等相对路径在开发环境下可访问（与 index.html 中 resourceProUrl 为空时配合）
		contentBase: resolve('..'),
		historyApiFallback: {
			disableDotRule: true,
		},
	},
};

module.exports = merge(webpackConfigBase, webpackConfigDev);
