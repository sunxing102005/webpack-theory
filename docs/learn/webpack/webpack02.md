### webpack3与webpack4
仅引入需要用的库？？？
#### css提取
mini-css-extract-plugin与extract-text-webpack-plugin最大区别：
在code spliting的时候，会把原来内联写在每个js chunk中的css，单独拆成一个个css。
### CommonsChunkPlugin的缺点
场景：项目里有很多异步加载的模块。

CommonsChunkPlugin 可以做到将这些异步模块引用的公用模块，统一抽取出来。但是由于之前graph是通过父子依赖和包含modules关系连接chunk。抽离出来的chunk作为旧chunk（被抽离的异步加载chunk）的父依赖。所以它必须提前于子模块加载，首屏需要加载公用模块。如果它太大会导致加载过慢，如果不抽离又会重复打包，需要做权衡。
另一个缺点是配置复杂。
SplitChunksPlugin：
它的出现可以很好解决CommonsChunkPlugin的问题。他能抽出懒加载公用模块，并且不会抽到父级，而是与首次懒加载模块并行加载。
#### 提高速度
参考：[使用webpack4提升180%编译速度](http://louiszhai.github.io/2019/01/04/webpack4/)

### webpack打包原理
#### 模块规范
1.CommonJs
单个值导出，导出的是变量的一份拷贝。动态引入，运行时引入。
```javascript
// CommonJS 导出
module.exports = { age: 1, a: 'hello', foo:function(){} }

// CommonJS 导入
const foo = require('./foo.js')

```

2.UMD
根据当前运行环境的判断，如果是 Node 环境 就是使用 CommonJS 规范， 如果不是就判断是否为 AMD 环境， 最后导出全局变量。
```javascript
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.libName = factory());
}(this, (function () { 'use strict';})));

```
3.ES6
ES6 模块的设计思想是尽量的静态化，使得编译时就能确定模块的依赖关系，以及输入和输出的变量。导出的是模块的引用。

#### Webpack模块打包
webpack会根据配置，从入口文件开始识别依赖文件。不管是用commonJs还是es6，最终生成文件中模块化是基于webpack自己实现的webpack_require（es5代码），所以可以运行在浏览器。

所以在webpack环境下，可以使用commonJs,es6等模块化，最后编译结果都是一样的。从webpack2开始，内置了对ES6、CommonJS、AMD 模块化语句的支持。但es6语法不会帮你自动转化es5。

#### Webpack ES6语法支持
需要使用babel-loader及其插件@babel/preset-env进行处理，把ES6代码转换成可在浏览器中跑的es5代码。
```javascript
// webpack.config.js
module.exports = {
  ...,
  module: {
    rules: [
      {
        // 对以js后缀的文件资源，用babel进行处理
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
```

#### 模块打包原理
具体同步/异步加载实现代码参考自己博客。
总结：
1.遇到异步模块时，使用__webpack_require__.e函数去把异步代码加载进来。该函数会在html的head中动态增加script标签，src指向指定的异步模块存放的文件。
2.加载的异步模块文件会执行webpackJsonpCallback函数，把异步模块加载到主文件中。
3.所以后续可以像同步模块一样,直接使用__webpack_require__("./src/async.js")加载异步模块。

参考：
[Webpack 模块打包原理](https://lq782655835.github.io/blogs/project/webpack4-1.module.html#webpack-%E6%A8%A1%E5%9D%97%E5%BC%82%E6%AD%A5%E5%8A%A0%E8%BD%BD)

### side effects
无副作用模块，导出的结果不受模块运行代码影响，每次都是导出相同的值。
副作用模块：导出结果不可预测，可能受到外部环境影响，比如polyfill，比如一个导出对象依赖其他导出模块。
side effects影响模块tree shaking，如果引入在package.json里side effect:false，需要在项目里设置optimize:sideEffect:true。
参考：
[What Does Webpack 4 Expect From A Package With sideEffects: false](https://stackoverflow.com/questions/41127479/es6-import-for-side-effects-meaning)
[es6 import for side effects meaning](https://stackoverflow.com/questions/41127479/es6-import-for-side-effects-meaning)

tree shaking应用：
[Webpack 4教程 - 第七部分 减少打包体积与Tree Shaking](https://blog.51cto.com/powertoolsteam/2371307)

### gulp与webpack
gulp是task runner，webpack属于moduler bundler。他们都有95%对方不能代替的功能。
#### gulp核心功能
* 任务的定义和组织
* 基于文件流的构建
* 插件体系

gulp本身对于具体的构建任务没有要求，但通常都是文件流的操作。
gulp适用于任何基于js构建的场合，无论前端还是后端，甚至可以在gulp调用webpack。

#### webpack核心功能
* 按照模块依赖构建目标文件
* loader体系支持不同的模块
* 插件体系提供额外功能

![a1335a6dbd38d67d99d379acfc5654b9.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p86)

1.需要把各种文件都看成模块。
2.各个模块必须相互依赖，在 js 里 import 模板、图片、样式文件等等，样式文件通过 url() 和图片字体关联；这种依赖关系必须是 webpack 既定的或者是通过插件可以理解的关系。

webpack的核心就是模块化组织，模块化依赖，模块化打包。相对来说局限在前端模块化打包上。但在这一方法，gulp很难代替。
#### 那些功能对方不能替代
gulp的任务定义和文件管理webpack做不到；webpack基于模块化的依赖构建，gulp做不好。
gulp做的好的场景：
1.替换所有资源的版本号
2.将所有静态资源上传cdn。
gulp做不好的：
1.对于前端模块化完善解决方案的欠缺。
2.缺少工具优化整合资源，减小http请求数量。
#### 什么情况用哪种工具
除了前端模块化开发和模块之间充分依赖的项目，都不值得用webpack构建。反之，如果要用 Webpack，请确保模块化，模块之间充分依赖。
除此之外构建工作，都应该交给gulp。目前大点的项目，Webpack 和 gulp 都是同时存在的，只是各自负责擅长的那部分，比如 Webpack 将模块的、互相依赖的分散的代码打包成数个文件，然后再使用 gulp 任务去做压缩，加版本号，替换等等其他工作。

参考：
[gulp 有哪些功能是 webpack 不能替代的？](https://www.zhihu.com/question/45536395)
[前端构建工具之争——Webpack vs Gulp 谁会被拍死在沙滩上](https://juejin.im/entry/5a4470f85188252b145b5742)