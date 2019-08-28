class EmitPlugin {
    apply(compiler) {
        compiler.plugin("emit", function(compilation, callback) {
            console.log("compilation.modules", compilation.modules.length);
            // compilation.chunks 存放所有代码块，是一个数组
            compilation.chunks.forEach(function(chunk) {
                // chunk 代表一个代码块
                // 代码块由多个模块组成，通过 chunk.forEachModule 能读取组成代码块的每个模块
                chunk.forEachModule(function(module) {
                    // module 代表一个模块
                    // module.fileDependencies 存放当前模块的所有依赖的文件路径，是一个数组
                    module.fileDependencies.forEach(function(filepath) {});
                });

                // Webpack 会根据 Chunk 去生成输出的文件资源，每个 Chunk 都对应一个及其以上的输出文件
                // 例如在 Chunk 中包含了 CSS 模块并且使用了 ExtractTextPlugin 时，
                // 该 Chunk 就会生成 .js 和 .css 两个文件
                chunk.files.forEach(function(filename) {
                    // compilation.assets 存放当前所有即将输出的资源
                    // 调用一个输出资源的 source() 方法能获取到输出资源的内容
                    let source = compilation.assets[filename].source();
                });
            });

            // 这是一个异步事件，要记得调用 callback 通知 Webpack 本次事件监听处理结束。
            // 如果忘记了调用 callback，Webpack 将一直卡在这里而不会往后执行。
            callback();
        });
    }
}
module.exports = EmitPlugin;
