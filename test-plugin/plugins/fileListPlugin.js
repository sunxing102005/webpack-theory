class FileListPlugin {
    apply(compiler) {
        compiler.plugin("emit", function(compilation, callback) {
            var filelist = "In this build:\n\n";

            // 循环得到所有文件名
            for (var filename in compilation.assets) {
                filelist += "- " + filename + "\n";
            }
            const plugins = compiler.options.plugins; //所有插件名
            filelist += ` all plugins: \n\n ${plugins}`;
            // 将文件名和插件名插入到新生成的文件中
            compilation.assets["filelist.md"] = {
                source: function() {
                    return filelist;
                },
                size: function() {
                    return filelist.length;
                }
            };

            callback();
        });
    }
}
// 导出插件
module.exports = FileListPlugin;
