class EmitPlugin {
    apply(compiler) {
        // 当依赖的文件发生变化时会触发 watch-run 事件
        compiler.plugin("watch-run", (watching, callback) => {
            // 获取发生变化的文件列表
            const changedFiles = compiler.watchFileSystem.watcher.mtimes;
            // changedFiles 格式为键值对，键为发生变化的文件路径。
            // if (changedFiles[filePath] !== undefined) {
            //     // filePath 对应的文件发生了变化
            // }
            console.log("emit changed files", changedFiles);
            callback();
        });
    }
}
module.exports = EmitPlugin;
