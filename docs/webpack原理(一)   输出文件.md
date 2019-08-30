## 说明

本文将会介绍 wepack 实现 js 模块化，以及模块的同步，异步引入的基本原理。主要参考自 [webpack 原理](http://webpack.wuhaolin.cn/5%E5%8E%9F%E7%90%86/)，部分源码的分析加入了自己的理解，对 webpack 感兴趣的同学可以阅读参考文章进一步学习。

## 基本介绍

#### 概念

在了解 Webpack 原理前，需要掌握以下几个核心概念：

-   Entry：入口，Webpack 执行构建的第一步将从 Entry 开始，可抽象成输入。
-   Module：模块，在 Webpack 里一切皆模块，一个模块对应着一个文件。Webpack 会从配置的 Entry 开始递归找出所有依赖的模块。
-   Chunk：代码块，一个 Chunk 由多个模块组合而成，用于代码合并与分割。
-   Loader：模块转换器，用于把模块原内容按照需求转换成新内容。
-   Plugin：扩展插件，在 Webpack 构建流程中的特定时机会广播出对应的事件，插件可以监听这些事件的发生，在特定时机做对应的事情。

#### 流程概括

Webpack 的运行流程是一个串行的过程，从启动到结束会依次执行以下流程：

1.  初始化参数：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数；
2.  开始编译：用上一步得到的参数初始化 Compiler 对象，加载所有配置的插件，执行对象的 run 方法开始执行编译；
3.  确定入口：根据配置中的 entry 找出所有的入口文件；
4.  编译模块：从入口文件出发，调用所有配置的 Loader 对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；
5.  完成模块编译：在经过第 4 步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；
6.  输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；
7.  输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

#### 流程细节

Webpack 的构建流程可以分为以下三大阶段：

1.  初始化：启动构建，读取与合并配置参数，加载 Plugin，实例化 Compiler。
2.  编译：从 Entry 发出，针对每个 Module 串行调用对应的 Loader 去翻译文件内容，再找到该 Module 依赖的 Module，递归地进行编译处理。
3.  输出：对编译后的 Module 组合成 Chunk，把 Chunk 转换成文件，输出到文件系统。

如果只执行一次构建，以上阶段将会按照顺序各执行一次。但在开启监听模式下，流程将变为如下：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190822145030488.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM2MjI4NDQy,size_16,color_FFFFFF,t_70)

## 代码分析

### 同步依赖

首先我们构建一个简单的 webpack 项目，构建过程可以[参照这里](http://webpack.wuhaolin.cn/1%E5%85%A5%E9%97%A8/1-3%E5%AE%89%E8%A3%85%E4%B8%8E%E4%BD%BF%E7%94%A8.html)。

```javascript
//main.js
// 通过 CommonJS 规范导入 show 函数
const show = require("./show.js");
// 执行 show 函数
show("Webpack");
```

可以看到 main.js 同步的引用了 show.js。这种模块引用是怎么在浏览器端实现的呢？
我们知道在 node 中，对于一个引用的模块，通过读取模块路径 -> 编译模块代码 -> 执行模块来载入模块。这是因为 node 是服务端语言，模块都是本地文件，可同步阻塞进行模块文件寻址、读取、编译和执行，这些过程在模块 require 的时候再“按需”执行即可。
而 webpack 运行在客户端（浏览器），显然不能在需要时再通过网络加载 js 文件，因为网络加载是异步进行的，不能满足同步的要求。我们通过分析编译后的 bundle.js 分析同步依赖的实现。

```javascript
// webpackBootstrap 启动函数
// modules 即为存放所有模块的数组，数组中的每一个元素都是一个函数
(function(modules) {
    // 安装过的模块都存放在这里面
    // 作用是把已经加载过的模块缓存在内存中，提升性能
    var installedModules = {};

    // 去数组中加载一个模块，moduleId 为要加载模块在数组中的 index
    // 作用和 Node.js 中 require 语句相似
    function __webpack_require__(moduleId) {
        // 如果需要加载的模块已经被加载过，就直接从内存缓存中返回
        if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
        }

        // 如果缓存中不存在需要加载的模块，就新建一个模块，并把它存在缓存中
        var module = (installedModules[moduleId] = {
            // 模块在数组中的 index
            i: moduleId,
            // 该模块是否已经加载完毕
            l: false,
            // 该模块的导出值
            exports: {}
        });

        // 从 modules 中获取 index 为 moduleId 的模块对应的函数
        // 再调用这个函数，同时把函数需要的参数传入
        modules[moduleId].call(
            module.exports,
            module,
            module.exports,
            __webpack_require__
        );
        // 把这个模块标记为已加载
        module.l = true;
        // 返回这个模块的导出值
        return module.exports;
    }

    // Webpack 配置中的 publicPath，用于加载被分割出去的异步代码
    __webpack_require__.p = "";

    // 使用 __webpack_require__ 去加载 index 为 0 的模块，并且返回该模块导出的内容
    // index 为 0 的模块就是 main.js 对应的文件，也就是执行入口模块
    // __webpack_require__.s 的含义是启动模块对应的 index
    return __webpack_require__((__webpack_require__.s = 0));
})(
    // 所有的模块都存放在了一个数组里，根据每个模块在数组的 index 来区分和定位模块
    [
        /* 0 */
        function(module, exports, __webpack_require__) {
            // 通过 __webpack_require__ 规范导入 show 函数，show.js 对应的模块 index 为 1
            const show = __webpack_require__(1);
            // 执行 show 函数
            show("Webpack");
        },
        /* 1 */
        function(module, exports) {
            function show(content) {
                window.document.getElementById("app").innerText =
                    "Hello," + content;
            }
            // 通过 CommonJS 规范导出 show 函数
            module.exports = show;
        }
    ]
);
```

以上看上去复杂的代码其实是一个立即执行函数，可以简写为如下：

```javascript
(function(modules) {
    // 模拟 require 语句
    function __webpack_require__() {}

    // 执行存放所有模块数组中的第0个模块
    __webpack_require__(0);
})([
    /*存放所有模块的数组*/
]);
```

这是一个自执行的函数，参数是所有 modules 的数组，**webpack_require**是在浏览器执行的，模拟 node 中 require 的函数，用于加载模块，加载模块的来源就是作为参数的 modules 数组。这是因为浏览器端不可能每次加载都通过网络请求，所以将全部模块通过一次 请求加载到数组中，在需要时，再通过**webpack_require**加载依赖模块。
如果仔细分析 **webpack_require** 函数的实现，你还有发现 Webpack 做了缓存优化： 执行加载过的模块不会再执行第二次，执行结果会缓存在内存中，当某个模块第二次被访问时会直接去内存中读取被缓存的返回值。

### 异步依赖

当我们将 main.js 改为下面的形式，对 show.js 的依赖变为异步。

```javascript
// 异步加载 show.js
import("./show").then(show => {
    // 执行 show 函数
    show("Webpack");
});
```

重新构建后会输出两个文件，分别是执行入口文件 bundle.js 和 异步加载文件 0.bundle.js（以下简称 bundle0.js）。
其中 bundle0.js 内容如下：

```javascript
// 加载在本文件(0.bundle.js)中包含的模块
webpackJsonp(
    // 在其它文件中存放着的模块的 ID
    [0],
    // 本文件所包含的模块
    [
        // show.js 所对应的模块
        function(module, exports) {
            function show(content) {
                window.document.getElementById("app").innerText =
                    "Hello," + content;
            }

            module.exports = show;
        }
    ]
);
```

bundle.js

```javascript
(function(modules) {
    /***
     * webpackJsonp 用于从异步加载的文件中安装模块。
     * 把 webpackJsonp 挂载到全局是为了方便在其它文件中调用。
     *
     * @param chunkIds 异步加载的文件中存放的需要安装的模块对应的 Chunk ID
     * @param moreModules 异步加载的文件中存放的需要安装的模块列表
     * @param executeModules 在异步加载的文件中存放的需要安装的模块都安装成功后，需要执行的模块对应的 index
     */
    window["webpackJsonp"] = function webpackJsonpCallback(
        chunkIds,
        moreModules,
        executeModules
    ) {
        // 把 moreModules 添加到 modules 对象中
        // 把所有 chunkIds 对应的模块都标记成已经加载成功
        var moduleId,
            chunkId,
            i = 0,
            resolves = [],
            result;
        for (; i < chunkIds.length; i++) {
            chunkId = chunkIds[i];
            if (installedChunks[chunkId]) {
                resolves.push(installedChunks[chunkId][0]);
            }
            installedChunks[chunkId] = 0;
        }
        for (moduleId in moreModules) {
            if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
                modules[moduleId] = moreModules[moduleId];
            }
        }
        while (resolves.length) {
            resolves.shift()();
        }
    };

    // 缓存已经安装的模块
    var installedModules = {};

    // 存储每个 Chunk 的加载状态；
    // 键为 Chunk 的 ID，值为0代表已经加载成功
    var installedChunks = {
        1: 0
    };

    // 模拟 require 语句，和上面介绍的一致
    function __webpack_require__(moduleId) {
        // ... 省略和上面一样的内容
    }

    /**
     * 用于加载被分割出去的，需要异步加载的 Chunk 对应的文件
     * @param chunkId 需要异步加载的 Chunk 对应的 ID
     * @returns {Promise}
     */
    __webpack_require__.e = function requireEnsure(chunkId) {
        // 从上面定义的 installedChunks 中获取 chunkId 对应的 Chunk 的加载状态
        var installedChunkData = installedChunks[chunkId];
        // 如果加载状态为0表示该 Chunk 已经加载成功了，直接返回 resolve Promise
        if (installedChunkData === 0) {
            return new Promise(function(resolve) {
                resolve();
            });
        }

        // installedChunkData 不为空且不为0表示该 Chunk 正在网络加载中
        if (installedChunkData) {
            // 返回存放在 installedChunkData 数组中的 Promise 对象
            return installedChunkData[2];
        }

        // installedChunkData 为空，表示该 Chunk 还没有加载过，去加载该 Chunk 对应的文件
        var promise = new Promise(function(resolve, reject) {
            installedChunkData = installedChunks[chunkId] = [resolve, reject];
        });
        installedChunkData[2] = promise;

        // 通过 DOM 操作，往 HTML head 中插入一个 script 标签去异步加载 Chunk 对应的 JavaScript 文件
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.charset = "utf-8";
        script.async = true;
        script.timeout = 120000;

        // 文件的路径为配置的 publicPath、chunkId 拼接而成
        script.src = __webpack_require__.p + "" + chunkId + ".bundle.js";

        // 设置异步加载的最长超时时间
        var timeout = setTimeout(onScriptComplete, 120000);
        script.onerror = script.onload = onScriptComplete;

        // 在 script 加载和执行完成时回调
        function onScriptComplete() {
            // 防止内存泄露
            script.onerror = script.onload = null;
            clearTimeout(timeout);

            // 去检查 chunkId 对应的 Chunk 是否安装成功，安装成功时才会存在于 installedChunks 中
            var chunk = installedChunks[chunkId];
            if (chunk !== 0) {
                if (chunk) {
                    chunk[1](
                        new Error("Loading chunk " + chunkId + " failed.")
                    );
                }
                installedChunks[chunkId] = undefined;
            }
        }
        head.appendChild(script);

        return promise;
    };

    // 加载并执行入口模块，和上面介绍的一致
    return __webpack_require__((__webpack_require__.s = 0));
})(
    // 存放所有没有经过异步加载的，随着执行入口文件加载的模块
    [
        // main.js 对应的模块
        function(module, exports, __webpack_require__) {
            // 通过 __webpack_require__.e 去异步加载 show.js 对应的 Chunk
            __webpack_require__
                .e(0)
                .then(__webpack_require__.bind(null, 1))
                .then(show => {
                    // 执行 show 函数
                    show("Webpack");
                });
        }
    ]
);
```

可以简化为

```javascript
(function(modules) {
    window["webpackJsonp"] = function(chunkIds, moreModules, executeModules) {
        //....
    };
    // 缓存已经安装的模块
    var installedModules = {};

    // 存储每个 Chunk 的加载状态；
    // 键为 Chunk 的 ID，值为0代表已经加载成功
    var installedChunks = {
        1: 0
    };

    // 模拟 require 语句，和上面介绍的一致
    function __webpack_require__(moduleId) {
        // ... 省略和上面一样的内容
    }
    __webpack_require__.e = function requireEnsure(chunkId) {
        // ...
    };
    // 加载并执行入口模块，和上面介绍的一致
    return __webpack_require__((__webpack_require__.s = 0));
})([
    function(module, exports, __webpack_require__) {
        __webpack_require__
            .e(0)
            .then(__webpack_require__.bind(null, 1))
            .then(show => {
                // 执行 show 函数
                show("Webpack");
            });
    }
]);
```

接下来按照执行顺序来讲下代码逻辑。

#### 执行参数模块

首先通过**webpack_require**(**webpack_require**.s = 0)方法，会执行参数数组里第一个元素，即下面的函数。

```javascript
function (module, exports, __webpack_require__) {
      __webpack_require__.e(0).then(__webpack_require__.bind(null, 1)).then((show) => {
        // 执行 show 函数
        show('Webpack');
      });
}
```

这里通过 **webpack_require**.e(0) 加载 0.bundle.js，加载完毕后，通过**webpack_require**通过加载 moduleId 是 1 的模块，即来自于 show.js 的模块。最后通过得到的 show 参数，执行 show('Webpack')。

#### **webpack_require**.e

简单来说**webpack_require**.e 会根据 chunkId 判断这个 chunk 是否已经加载，如果没有将会在 html body 里插入 script 标签，加载 bundle0，并返回一个 promise 对象。

#### webpackJsonp

当 bundle0.js 被加载到 body 里，就开始执行 webpackJsonp 方法。我们先看下它是做什么的。

```javascript
window["webpackJsonp"] = function webpackJsonpCallback(
    chunkIds,
    moreModules,
    executeModules
) {
    // 把 moreModules 添加到 modules 对象中
    // 把所有 chunkIds 对应的模块都标记成已经加载成功
    var moduleId,
        chunkId,
        i = 0,
        resolves = [],
        result;
    for (; i < chunkIds.length; i++) {
        chunkId = chunkIds[i];
        if (installedChunks[chunkId]) {
            resolves.push(installedChunks[chunkId][0]);
        }
        installedChunks[chunkId] = 0;
    }
    for (moduleId in moreModules) {
        if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
            modules[moduleId] = moreModules[moduleId];
        }
    }
    while (resolves.length) {
        resolves.shift()();
    }
};
```

简单来说他做了三件事：

-   将 installedChunks[chunkId] 置为 0，用于**webpack_require**.e 中判断文件加载状态
-   将异步的 module 加入 modules 对象里，key 值为 moduleId。
-   执行 promise 的 resolve 方法。

#### **webpack_require**(1)

当执行到

```javascript
then(__webpack_require__.bind(null, 1));
```

也就是执行**webpack_require**（1），运行时执行 moduleId 等于 1 的 module，即运行下面的函数：

```javascript
function (module, exports) {
      function show(content) {
        window.document.getElementById('app').innerText = 'Hello,' + content;
      }

      module.exports = show;
    }
```

show 函数作为返回值，传给下一个 then。

#### show('Webpack')

最后执行到这里，整个过程结束。

这里的 bundle.js 和上面所讲的同步依赖的 bundle.js 非常相似，区别在于：

-   多了一个 **webpack_require**.e 用于加载被分割出去的，需要异步加载的 Chunk 对应的文件;
-   多了一个 webpackJsonp 函数用于从异步加载的文件中安装模块。

在配置 splitChunks 去提取公共代码时输出的文件和使用了异步加载时输出的文件是一样的，都会有 **webpack_require**.e 和 webpackJsonp。 原因在于提取公共代码和异步加载本质上都是代码分割。

### 参考

[webpack 原理-输出文件分析](https://juejin.im/post/5a4ccce0f265da432b4b3801)
[前端运行时的模块化设计与实现](https://www.jianshu.com/p/b52b6996d612)
