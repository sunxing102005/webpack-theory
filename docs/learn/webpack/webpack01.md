#### webpack常用loader
样式：style-loader、css-loader、less-loader、sass-loader等
文件：raw-loader、file-loader 、url-loader等
编译：babel-loader、coffee-loader 、ts-loader等
校验测试：mocha-loader、jshint-loader 、eslint-loader等

```
module.exports = {
  module: {
    rules: [
        {
          test: /\.scss$/,
          use:[
              {loader:'style-loader'},
              {loader:'css-loader',options:{sourceMap:true,modules:true}},
              {loader:'sass-loader',options:{sourceMap:true}}
          ],
          exclude:/node_modules/
      }
    ]
  }
}
```
sass-loader将sass转化为css，css-loader处理其中的@import和url()，style-loader将创建style标签把css插入html。

file-loader、url-loader ：
file-loader将引用文件的url改为打包后的相对引用路径。
url-loader：将文件体积小于设定值的打成Base64格式。

#### 常用plugin

#### loader为什么从右往左执行
webpack采用compose方式执行，而不是pipe方式
例如
```javascript
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const add1 = n => n + 1; //加1
const double = n => n * 2; // 乘2
const add1ThenDouble = compose(
  double,
  add1
);
add1ThenDouble(2); // 6
// ((2 + 1 = 3) * 2 = 6) 
```

#### 打包优化
##### happypack
将文件解析任务分解成多个子进程并发执行，执行结束后再把结果返回给主进程。
例子：
```javascript
const HappyPack = require('happypack');

module.exports = {
    ...
    module: {
        rules: [
            test: /\.js$/,
            // use: ['babel-loader?cacheDirectory'] 之前是使用这种方式直接使用 loader
            // 现在用下面的方式替换成 happypack/loader，并使用 id 指定创建的 HappyPack 插件
            use: ['happypack/loader?id=babel'],
            // 排除 node_modules 目录下的文件
            exclude: /node_modules/
        ]
    },
    plugins: [
        ...,
        new HappyPack({
            /*
             * 必须配置
             */
            // id 标识符，要和 rules 中指定的 id 对应起来
            id: 'babel',
            // 需要使用的 loader，用法和 rules 中 Loader 配置一样
            // 可以直接是字符串，也可以是对象形式
            loaders: ['babel-loader?cacheDirectory']
        })
    ]
}

```
之前的loader改为'happy/loader?id=XX'，在pulgins里配置相应id的loader，一个plugin也可以对应多个loader。

#### 配置优化
##### no parse
它作为module的一个属性，用于不分析某个模块的依赖关系
```javascript
module.exports = {
    module: {
        noParse:/jquery/,//不去解析jquery中的依赖库
    }
}
```
这里让让webpack不去解析jquery的依赖关系，提高打包速度。
##### exclude
loader使用exclude排除对某些文件目录的文件处理。

##### IgnorePlugin
忽略某个模块里，某些目录的模块引用
项目根目录下有一个time包，其中有一个lang包，lang包中包含了各种语言输出对应时间的js文件，time
包下的index.js会引入lang包下所有的js文件，那么当我们引入time模块的时候，就会将lang包下的所有js文件都打包进去，添加如下配置:
```javascript
const webpack = require("webpack");
module.exports = {
    plugins: [
        new webpack.IgnorePlugin(/lang/, /time/)
    ]
}
```
这里/time/配置只会匹配名字对应的文件夹，只要对应，配置就会生效。

##### 按需加载
import()方法，传入要动态加载的模块，来动态加载指定的模块，当webpack遇到import()语句的时候，不会立即去加载该模块，而是在用到该模块的时候，再去加载

##### 开启模块热更新
只编译变化的模块，而不用全部模块重新打包，大大提高开发效率。

##### 模块化引入
只引入工具库里用到的那部分
```javascript
import {chain, cloneDeep} from 'lodash';
// 可以改写为
import chain from 'lodash/chain';
import cloneDeep from 'lodash/cloneDeep';
```
##### cdn引入
一些常用的外部库，可以使用cdn引入来减少打包体积。
```html
// 在html中添加script引用
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
```
```javascript
// 这里externals的key指的是使用时需要require的包名，value指的是该库通过script引入后在全局注册的变量名
externals: {
  jquery: 'jQuery'
}
// 使用方法
require('jquery')
```
##### 通过DllPlugin和DLLReferencePlugin 拆分文件
项目中一些不常更新的库和框架进行单独编译打包，这样每次开发上线只需要对我们开发的文件编译打包，节省打包事件。
###### DLLPlugin
```javascript
module.exports = {
  entry: {
    lib: ['vue', 'vuex', 'vue-resource', 'vue-router']
  },
  output: {
    path: path.resolve(__dirname, '../dist', 'dll'),
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath,
    library: '[name]_library'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': '"production"'
    }),
    /**
     * path: manifest.json输出文件路径
     * name: dll对象名，跟output.library保持一致
     */ 
    new webpack.DllPlugin({
      context: __dirname,
      path: path.resolve(__dirname, '../dist/dll', 'lib.manifest.json'),
      name: '[name]_library'
    })
  ]
}

```
1.entry中写明所有要单独打包的模块
2.output的library属性可以将dll包暴露出来
3.DLLPlugin的配置中，path指明manifest.json文件的生成路径，name暴露出dll的函数名

###### DLLReferencePlugin
```javascript
new webpack.DllReferencePlugin({       
  context: __dirname,                  // 同dll配置的路径保持一致
  manifest: require('../dist/dll/lib.manifest.json') // manifest的位置
}),

```
在原本webpack配置里，只需要加入DLLReferencePlugin，配置好manifest的路径即可。

##### 开启Gzip压缩
压缩后，浏览器下载资源的时间减少，提高渲染速度。服务端也需要配置。
##### 压缩代码
TerserPlugin,OptimizeCssAssetsPlugin


#### webpack执行的过程
1.初始化参数：从配置文件和shell命令里得到参数并合并，得到最终参数。
2.开始编译：创建compiler对象，加载所有插件，调用插件的apply方法，执行compiler对象run方法开始编译。
3.编译模块：从入口文件出发，调用所有loader对模块进行翻译，再找出依赖模块，递归本步骤，直到所有文件编译结束。
4.完成模块编译：loader翻译过后，得到翻译后内容以及依赖关系。
5.输出资源：根据入口文件和依赖关系，将多个模块组装成一个个chunk，将每个chunk加入输出列表。
6.输出完成：根据配置的文件名和路径，输出文件。

#### 自定义loader
，loader 也是一个 node 模块，它导出一个函数，该函数的参数是 require 的源模块，处理 source 后把返回值交给下一个 loader。
```javascript
module: {
    rules: [{
        test: /\.html$/,
        use: ['html-loader', 'html-minify-loader'] // 处理顺序 html-minify-loader => html-loader => webpack
    }]
},
resolveLoader: {
    // 因为 html-loader 是开源 npm 包，所以这里要添加 'node_modules' 目录
    modules: [path.join(__dirname, './src/loaders'), 'node_modules']
}

```
```javascript
// src/loaders/html-minify-loader.js
var loaderUtils = require('loader-utils');
var Minimize = require('minimize');

module.exports = function(source) {
    var options = loaderUtils.getOptions(this) || {}; //这里拿到 webpack.config.js 的 loader 配置
    var minimize = new Minimize(options);
    return minimize.parse(source);
};

```

#### webpack执行过程
1.初始化参数：从配置文件和shell命令中读取与合并参数，得到最终的参数。
2.开始编译：从上一步得到的参数创建compiler对象，加载所有插件，执行compiler.run方法，开始编译。
3.确定入口：根据entry确定所有入口文件。
4.编译模块：从入口文件出发，根据配置的所有loader对模块进行编译，再找出改模块的依赖模块，递归编译，直到没有其他依赖。
5.完成模块编译：经过第四步loader翻译模块后，得到翻译后的模块内容以及依赖关系。
6.输出资源：根据入口文件及配置，生成包含一个或多个模块的chunk，将这些chunk转化成单独文件加入输出列表，这是修改输出的最后机会。
7.输出完成：确定好输出内容后，根据配置的文件名和输出路径，将文件内容写出到文件系统。

在以上过程中，webpack会在特定的编译阶段广播特定的事件，插件监听感兴趣的事件，执行自定义的逻辑，并且插件可以调用webpack api改变webpack运行结果。

compiler:
包含webpack所有配置信息，在启动时创建，是全局唯一的。

compilation:
包含当前模块资源，编译生成资源，变化文件。webpack watch模式运行时，每次更改都会创建新的Compilation。

参考：
[Webpack原理与实践（一）：打包流程](https://juejin.im/post/5be9297351882516f5786404)



