const fs = require('fs');
const path = require('path');

let mergeData = async () => {
    let data = '';
    let dataPath = `${__dirname}/datas`;
    await fs.readdirSync(path.join(dataPath)).forEach(function (file) {
        if (file.indexOf('.json') > 0) {
            let content = require(path.join(dataPath, file));
            try {
                data += `var ${file.split('.')[0]}=${JSON.stringify(content)}\n`
            }
            catch{ }
        }
    });
    return data;
};

module.exports = class MockerPlugin {
    constructor(options) {
        const defaulOptions = {
            indexFileName: 'index.html',//html在发布包中的地址
            buildPath: './build',//文件输出路径
            publicPath: './',//文件发布路径
            filename: 'data.js'//文件名称
        };
        this.options = Object.assign(defaulOptions, options);
    }

    apply(compiler) {
        const options = this.options;
        //https://webpack.docschina.org/api/compiler-hooks/

        let emit = async(compilation, callback) => {
            const tag = `<script type="text/javascript" src="${options.publicPath}${options.filename}"></script>`;
            if (
                options.indexFileName &&
                options.indexFileName in compilation.assets
            ) {
                const index = compilation.assets[options.indexFileName];
                if (index) {
                    let content = index.source();
                    index.source = () =>
                        content.replace(tag, '').replace(/<\/body>/, `${tag}\n<\/body>`)
                    content = index.source();
                    index.size = () => content.length;
                }
            }
            let filePath = path.join(options.buildPath, options.publicPath + options.filename);
            if (process.env.NODE_ENV === 'development') {
                filePath = path.join(options.buildPath, options.filename);
            }
            let content = await mergeData();
            const outDir = path.dirname(filePath);
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            fs.writeFile(filePath, new Uint8Array(Buffer.from(content)), (err) => {
                if (err) throw err;
                console.log('Mocker data has been merged!');
            });
        };


        if (compiler.hooks) {
            //emit 生成资源到 output 目录之前。
            compiler.hooks.emit.tap('MockerPlugin', emit);
        } else {
            compiler.plugin('emit', emit);
        }
    }
}