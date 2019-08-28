const path = require("path");
const ReplaceTextWebpackPlugin = require("./plugins/replaceTextWebpackPlugin");
const FileListPlugin = require("./plugins/fileListPlugin");
const EmitPlugin = require("./plugins/emitPlugin");
module.exports = {
    // JavaScript 执行入口文件
    entry: "./main.js",
    output: {
        // 把所有依赖的模块合并输出到一个 bundle.js 文件
        filename: "bundle.js",
        // 输出文件都放到 dist 目录下
        path: path.resolve(__dirname, "./dist")
    },
    plugins: [
        new ReplaceTextWebpackPlugin(),
        new FileListPlugin(),
        new EmitPlugin()
    ]
};
