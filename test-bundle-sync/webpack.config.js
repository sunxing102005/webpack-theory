const path = require("path");
module.exports = {
    // JavaScript 执行入口文件
    entry: "./main.js",
    mode: "development",
    output: {
        publicPath: "/",
        filename: "[name].js",
        chunkFilename: "[name].bundle.js"
    },
    optimization: {
        // moduleIds: "hashed", // keep module.id stable when vender modules does not change
        // runtimeChunk: "single" //webpack runtime codes
    }
};
