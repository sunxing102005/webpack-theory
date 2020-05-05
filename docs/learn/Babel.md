### 插件
分为两种: 语法插件和转换插件。
1.这些插件只允许 Babel 解析（parse） 特定类型的语法（不是转换）
2.转换插件会启用相应的语法插件(因此不需要同时指定这两种插件)
### 预设
通过使用或创建一个 preset 即可轻松使用一组插件。
#### @babel/preset-env
主要作用是对我们所使用的并且目标浏览器中缺失的功能进行代码转换和加载 polyfill。
在不进行任何配置的情况下，@babel/preset-env 所包含的插件将支持所有最新的JS特性。
如果你的代码中使用了可选链(目前，仍在 stage 阶段)，那么只配置 @babel/preset-env，转换时会抛出错误，需要另外安装相应的插件。
@babel/preset-env 会根据你配置的目标环境，生成插件列表来编译，使用target选项配置。
注意：
语法转换只是将高版本的语法转换成低版本的，但是新的内置函数、实例方法无法转换。polyfill的中文意思是垫片，所谓垫片就是垫平不同浏览器或者不同环境下的差异，让新的内置函数、实例方法等在低版本浏览器中也可以使用。
#### Polyfill

@babel/polyfill 模块包括 core-js 和一个自定义的 regenerator runtime 模块，可以模拟完整的 ES2015+ 环境（不包含第4阶段前的提议）。
V7.4.0 版本开始，@babel/polyfill 已经被废弃(前端发展日新月异)，需单独安装 core-js 和 regenerator-runtime 模块。
我们更期望的是，如果我使用了某个新特性，再引入对应的 polyfill，避免引入无用的代码。
@babel/preset-env 提供了一个 useBuiltIns 参数，设置值为 usage 时，就只会包含代码需要的 polyfill 。有一点需要注意：配置此参数的值为 usage ，必须要同时设置 corejs (如果不设置，会给出警告，默认使用的是"corejs": 2) ，注意: 这里仍然需要安装 @babel/polyfill。
Babel 会使用很小的辅助函数来实现类似 createClass 等公共方法。默认情况下，它将被添加(inject)到需要它的每个文件中。@babel/plugin-transform-runtime 插件，所有帮助程序都将引用模块 @babel/runtime，这样就可以避免编译后的代码中出现重复的帮助程序，有效减少包体积。
#### @babel/plugin-transform-runtime
特点就是按需引入，它会根据你代码中使用到的新特性引入相应的包，不额外增加包的体积。缺点就是编译速度会变慢，因为每次都需要重复检测使用到的模块，此外，有一些 Array 的方法，例如 includes, filter, fill 无法使用。
除了前文所说的，@babel/plugin-transform-runtime 可以减少编译后代码的体积外，我们使用它还有一个好处，它可以为代码创建一个沙盒环境，如果使用 @babel/polyfill 及其提供的内置程序（例如 Promise ，Set 和 Map ），则它们将污染全局范围。
首先安装依赖，@babel/plugin-transform-runtime 通常仅在开发时使用，但是运行时最终代码需要依赖 @babel/runtime，所以 @babel/runtime 必须要作为生产依赖被安装，如下 :
```
npm install --save-dev @babel/plugin-transform-runtimenpm install --save @babel/runtime
```
如果我们希望 @babel/plugin-transform-runtime 不仅仅处理帮助函数，同时也能加载 polyfill 的话，我们需要给 @babel/plugin-transform-runtime 增加配置信息。
```
{    "presets": [   
    [    "@babel/preset-env"        ]    ],  
    "plugins": [ [      
    "@babel/plugin-transform-runtime",{"corejs": 3}]   
 ]}

```
### 插件/预设补充知识
#### 顺序
* 插件在 Presets 前运行。
* 插件顺序从前往后排列。
* Preset 顺序是颠倒的（从后往前）。

#### 插件参数
```
 plugins:[
            "@babel/plugin-proposal-decorators",
            {
                "legacy": true
            }
],
```
#### 短名称
如果插件名称为 @babel/plugin-XXX，可以使用短名称@babel/XXX 。
如果插件名称为 babel-plugin-XXX，可以使用短名称 XXX，该规则同样适用于带有 scope 的插件。
#### 创建 Preset
可以简单的返回一个插件数组，preset 中也可以包含其他的 preset，以及带有参数的插件。
### 配置文件
优先级：
babel.config.js> babelrc>webpack.config.js

参考文档：
[不容错过的 Babel7 知识](https://juejin.im/post/5ddff3abe51d4502d56bd143)
相关阅读：
[Babel7 使用配置详解](https://github.com/lilins/Blog/issues/1)
[@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)[你真的会用 Babel 吗?](https://juejin.im/post/59b9ffa8f265da06710d8e89#heading-23)

### 问题
#### 添加polyfill
在preset-env中设置useBuiltIns会按项目中用到的来引入polyfill，但是只会引入稳定的es功能的polyfill。如果想引入match-all等一些已在浏览器中发布一段时间的提案（proposal），将shippedProposals选项设置为true。
参考：
[@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env#usebuiltins)

### preset-env 与transform-runtime
@babel/preset-env 与 @babel/plugin-transform-runtime都可以用来支持es6+新特性，这里讲下区别
#### @babel/preset-env
虽然包含了大部分 ES6 的新特性，但是有一些特性例如 Promise, Map, Set 等都无法使用，为了能够使用所有的特性，我们需要引入一些补充的工具库。之前可以使用babel-polyfill，但全部引入体积过大。
@babel/preset-env 提供了一个 useBuiltIns 参数，设置值为 usage 时，就只会包含代码需要的 polyfill。
注意：使用时需要配置corejs版本，推荐使用corejs3，因为corejs2不再添加新特性，并且不支持Array.prototype.flat。
效果：
```javascript
const isHas = [1,2,3].includes(2);const p = new Promise((resolve, reject) => {    resolve(100);});
```
```javascript
"use strict";
require("core-js/modules/es.array.includes");
require("core-js/modules/es.object.to-string");
require("core-js/modules/es.promise");
var isHas = [1, 2, 3].includes(2);
var p = new Promise(function (resolve, reject) {    resolve(100);});
```
##### 缺点
* 通过修改全局对象或者原型方法来支持es6+语言特性，会造成全局污染。如果项目发布为其他人使用的库，显然这种方式不适合。
#### @babel/plugin-transform-runtime
使用它时，@babel/runtime 也需要被安装。
@babel/runtime 转换插件负责三个任务：
* 当你使用 generators/async，自动引入 @babel/runtime/regenerator。
* 按需要动态引入core-js，取代全部引入。
* 移除内联的 Babel helpers 代码，并使用模块化引入 @babel/runtime/helpers。

如果想支持promise,map等es6+特性，需要配置corejs。
效果：
```javascript
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
var _context;
var isHas = (0, _includes.default)(_context = [1, 2, 3]).call(_context, 2);
new _promise.default(function (resolve, reject) {  resolve(100);});
```
可以看出，这里不会污染全局环境，而是使用core-js模块导出对象，替换promise,includes等这些方法。
注意：如果我们配置的 corejs 是 3 版本，那么不管是实例方法还是全局方法，都不会再污染全局环境。
##### 配置
* corejs：默认值 false，可填写 2，3.
* helpers： 默认值 true，会使用引入模块化代码的方式
* regenerator： 默认值 true，如果值为 false 的时候会将方法挂载到 Global 对象上，污染全局变量；
* useESModules： 默认值 false，如果为 true 的时候，将不会使用 commonjs 的方法来加载，这个对某些打包工具例如 webpack 来说，能够打出更小的包来。

##### 缺点
* 有些Array方法，比如includes,filter都无法支持
* @babel/runtime-corejs3/XXX 比corejs/XXX体积更大。


### preset-env的进化
#### presets-2015
presets-2015 将支持es6语法的的一系列插件.
babel7中使用@babel/preset-env代替preset-es2015，preset-es2016等。
#### stagex
stagex预设允许开发者使用一些处于标准提案阶段的功能。
* stage-0：transform-do-expressions；transform-function-bind；还包含stage-1，stage-2，stage-3的插件
* stage-1：transform-class-constructor-call；transform-export-extensions；还包含stage-2，stage-3的插件；
* stage-2：syntax-dynamic-import；transform-class-properties；还包含stage-3的插件。
* stage-3：transform-object-rest-spread；transform-async-generator-functions；

但在V7以后，stagex被弃用了。
原因：stagex效果过于好，使得大量开发者可以轻松使用提案性功能，但毕竟这些标准只在提案阶段，如果这些标准在之后更改了，很多人会遇到麻烦。
具体原因：[Removing Babel's Stage Presets](https://www.babeljs.cn/docs/babel-preset-stage-0)



