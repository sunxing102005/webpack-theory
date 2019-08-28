class ReplaceTextWebpackPlugin {
    // constructor(doneCallback, failCallback) {
    //     // 存下在构造函数中传入的回调函数
    //     this.doneCallback = doneCallback;
    //     this.failCallback = failCallback;
    // }

    apply(compiler) {
        compiler.plugin("compilation", compilation => {
            compilation.moduleTemplate.plugin(
                "module",
                (source, module, options, dependencyTemplates) => {
                    if (/show.js/.test(module.request)) {
                        let newSource = source
                            .source()
                            .replace(/Hello/g, "Fuck You");
                        return newSource;
                    } else {
                        return source;
                    }
                }
            );
        });
    }
}
// 导出插件
module.exports = ReplaceTextWebpackPlugin;
