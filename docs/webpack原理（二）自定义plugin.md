### 概览

Webpack 通过 Plugin 机制让其更加灵活，以适应各种应用场景。 在 Webpack 运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果。
我们先看一个最基础的 Plugin 的代码例子：

```javascript
class BasicPlugin {
    // 在构造函数中获取用户给该插件传入的配置
    constructor(options) {}

    // Webpack 会调用 BasicPlugin 实例的 apply 方法给插件实例传入 compiler 对象
    apply(compiler) {
        compiler.plugin("compilation", function(compilation) {});
    }
}

// 导出 Plugin
module.exports = BasicPlugin;
```

plugin 的使用：

```javascript
const BasicPlugin = require("./BasicPlugin.js");
module.export = {
    plugins: [new BasicPlugin(options)]
};
```

插件的执行过程

1.  执行 new BasicPlugin(options) 初始化一个 BasicPlugin 获得其实例。
2.  初始化 compiler 对象后，再调用 basicPlugin.apply(compiler) 给插件实例传入 compiler 对象
3.  获取到 compiler 对象后，就可以通过 compiler.plugin(事件名称, 回调函数) 监听到 Webpack 广播出来的事件，并且可以通过 compiler 对象去操作 Webpack。

### Compiler 和 Compilation

在开发 Plugin 时最常用的两个对象就是 Compiler 和 Compilation，它们是 Plugin 和 Webpack 之间的桥梁。 Compiler 和 Compilation 的含义如下：

-   Compiler 对象包含了 Webpack 环境所有的的配置信息，包含 options，loaders，plugins 这些信息，这个对象在 Webpack 启动时候被实例化，它是全局唯一的，可以简单地把它理解为 Webpack 实例；
-   Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。当 Webpack 以开发模式运行时，每当检测到一个文件变化，一次新的 Compilation 将被创建。Compilation 对象也提供了很多事件回调供插件做扩展。通过 Compilation 也能读取到 Compiler 对象。

Compiler 和 Compilation 的区别在于：Compiler 代表了整个 Webpack 从启动到关闭的生命周期，而 Compilation 只是代表了一次新的编译。
compiler 事件钩子:
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190823144604249.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM2MjI4NDQy,size_16,color_FFFFFF,t_70)
compilation 事件钩子:
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190823144625964.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM2MjI4NDQy,size_16,color_FFFFFF,t_70)
上面列举了 compiler 和 compilation 的主要钩子函数，详细信息可以查看[plugin API](https://github.com/webpack/docs/wiki/plugins)文档。

### 事件流

Webpack 的事件流机制应用了观察者模式，和 Node.js 中的 EventEmitter 非常相似。Compiler 和 Compilation 都继承自 Tapable，可以直接在 Compiler 和 Compilation 对象上广播和监听事件，方法如下：

```javascript
/**
 * 广播出事件
 * event-name 为事件名称，注意不要和现有的事件重名
 * params 为附带的参数
 */
compiler.apply("event-name", params);

/**
 * 监听名称为 event-name 的事件，当 event-name 事件发生时，函数就会被执行。
 * 同时函数中的 params 参数为广播事件时附带的参数。
 */
compiler.plugin("event-name", function(params) {});
```

同理，compilation.apply 和 compilation.plugin 使用方法和上面一致。
注意：

-   只要能拿到 Compiler 或 Compilation 对象，就能广播出新的事件，所以在新开发的插件中也能广播出事件，给其它插件监听使用。
-   传给每个插件的 Compiler 和 Compilation 对象都是同一个引用。也就是说在一个插件中修改了 Compiler 或 Compilation 对象上的属性，会影响到后面的插件。
-   有些事件是异步的，这些异步的事件会附带两个参数，第二个参数为回调函数，在插件处理完任务时需要调用回调函数通知 Webpack，才会进入下一处理流程。例如：

```javascript
compiler.plugin("emit", function(compilation, callback) {
    // 支持处理逻辑

    // 处理完毕后执行 callback 以通知 Webpack
    // 如果不执行 callback，运行流程将会一直卡在这不往下执行
    callback();
});
```

### 常用 API

#### 读取 assets, chunks, modules, 以及 dependencies

```javascript
class Plugin {
    apply(compiler) {
        compiler.plugin("emit", function(compilation, callback) {
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
```

#### 修改输出资源

有些场景下插件需要修改、增加、删除输出的资源，要做到这点需要监听 emit 事件，因为发生 emit 事件时所有模块的转换和代码块对应的文件已经生成好， 需要输出的资源即将输出，因此 emit 事件是修改 Webpack 输出资源的最后时机。
所有需要输出的资源会存放在 compilation.assets 中，compilation.assets 是一个键值对，键为需要输出的文件名称，值为文件对应的内容。
下面我们来看个例子：

```javascript
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
```

这里生成了一个 markdown 文件，内容是读取所有的资源文件名。
如果想要读取 compilation.assets ，代码如下：

```javascript
compiler.plugin("emit", (compilation, callback) => {
    // 读取名称为 fileName 的输出资源
    const asset = compilation.assets[fileName];
    // 获取输出资源的内容
    asset.source();
    // 获取输出资源的文件大小
    asset.size();
    callback();
});
```

#### 监听文件变化

Webpack 会从配置的入口模块出发，依次找出所有的依赖模块，当入口模块或者其依赖的模块发生变化时， 就会触发一次新的 Compilation。

在开发插件时经常需要知道是哪个文件发生变化导致了新的 Compilation，为此可以使用如下代码：

```javascript
// 当依赖的文件发生变化时会触发 watch-run 事件
compiler.plugin("watch-run", (watching, callback) => {
    // 获取发生变化的文件列表
    const changedFiles = watching.compiler.watchFileSystem.watcher.mtimes;
    // changedFiles 格式为键值对，键为发生变化的文件路径。
    if (changedFiles[filePath] !== undefined) {
        // filePath 对应的文件发生了变化
    }
    callback();
});
```
