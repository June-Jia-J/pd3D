const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const pkg = require('../package.json');

const release = process.env.NODE_ENV == 'production'
// The path to the CesiumJS source code
const cesiumSource = './node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';
const cesiumAssets = '../Build/Cesium/Assets';
const cesiumWidgets = '../Build/Cesium/Widgets';
const cesiumThirdParty = '../Build/Cesium/ThirdParty';

//指定目录,合并打包
const resolve = (relatedPath) => path.join(__dirname, relatedPath);

// 接口转发配置（若后续在 devServer 中启用 proxy，请与此保持一致）
const proxy = {
    target: 'http://localhost:8081/',
    secure: false,
    changeOrigin: true,
};

//向外暴露一个配置对象，commonjs规范（因为webpack是基于node构建）
//在webpack4中有一大特性是约定大于配置，默认打包入口路径是'src/index.js'，打包输出路径是'build/main.js'
const webpackConfigBase = {
    entry: {
        pd3d: pkg.main
    },
    output: {
        library: pkg.name,
        libraryTarget: "umd",
        sourcePrefix: ''
    },
    // 指定库目录，减少webpack寻找时间
    resolve: {
        extensions: ['.js', 'jsx', '.json'],
        modules: [resolve('../node_modules')],
        alias: {
            cesium: resolve('../node_modules/cesium/Source')
        },
        mainFiles: ['index', 'Cesium']
    },

    amd: {
        // Enable webpack-friendly use of require in Cesium
        toUrlUndefined: true
    },
    node: {
        fs: 'empty',
        Buffer: false,
        http: 'empty',
        https: 'empty',
        zlib: 'empty'
    },
    plugins: [
        //创建一个HtmlWebpackPlugin插件实例
        new HtmlWebpackPlugin({
            title: pkg.description,
            //模板文件
            template: resolve('../public/index.html'),
            //生成文件名
            filename: 'index.html',
        }),
        // Copy Cesium Assets, Widgets, and Workers to a static directory
        new CopyWebpackPlugin([
            { from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' },
            { from: path.join(cesiumSource, cesiumAssets), to: 'Assets' },
            { from: path.join(cesiumSource, cesiumWidgets), to: 'Widgets' },
            { from: path.join(cesiumSource, cesiumThirdParty), to: 'ThirdParty' }
        ]),
        new webpack.DefinePlugin({
            // Define relative base path in cesium for loading assets
            CESIUM_BASE_URL: JSON.stringify('../')
        }),
    ],
    module: {
        //解决Critical dependency: require function is used in a way in which dependencies cannot be statically extracted的问题
        unknownContextCritical: false,
        //webpack默认只能打包处理.js后缀的文件，像.jpg .vue等文件无法主动处理，所以需要配置第三方loader
        rules: [
            // 解析js|jsx文件
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                // 在使用babel-loader时候一定要加上exclude,排除node_modules文件夹
                exclude: /node_modules/,
            },
            // 解析css文件
            {
                test: /\.css$/,
                use: ['style-loader', { loader: 'css-loader', options: { sourceMap: true } }],
            },
            // 解析图片文件
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            // 当图片小于10k,生成一个base64的图片,如果大于这个值，生成一个的图片url
                            limit: 10240,
                            // 指定打包后的图片位置
                            outputPath: 'images/',
                            name: '[name].[contenthash:4].[ext]',
                        },
                    },
                ],
            },
            // 解析svg图片或字体等
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'svg-sprite-loader',
                include: [resolve('src/icons')],
                options: {
                    symbolId: 'icon-[name]'
                }
            },
            {
                test: /\.js$/,
                use: {
                    loader: '@open-wc/webpack-import-meta-loader',
                },
            },
        ],
    },
};
module.exports = webpackConfigBase;