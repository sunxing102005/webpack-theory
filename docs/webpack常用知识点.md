### 新闻

[重磅！滴滴跨端框架 Chameleon 1.0 正式发布](https://mp.weixin.qq.com/s/kl9JwiS5_IHIZUAW-hPJBQ)
[前端也有 AI 代码补全工具了！](https://mp.weixin.qq.com/s/61lOnDzapIKrs_iXHUBVcw)
[Vue 最黑暗的一天](https://mp.weixin.qq.com/s/TbW6jCYIhu_cUl7mVIRU9Q)

### 默认配置

webpack 4 引入了零配置的概念，提供的默认配置来减少重复工作。
development 模式下，默认开启了 NamedChunksPlugin 和 NamedModulesPlugin 方便调试，提供了更完整的错误信息，更快的重新编译的速度。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190826150031596.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM2MjI4NDQy,size_16,color_FFFFFF,t_70)

production 模式下，由于提供了 splitChunks 和 minimize，所以基本零配置，代码就会自动分割、压缩、优化，同时 webpack 也会自动帮你 [Scope Hoisting](https://segmentfault.com/a/1190000012600832)， [Tree-shaking ](https://juejin.im/post/5a4dc842518825698e7279a9)。
注:v4.26 后，minimize 等于 true 默认使用的插件已由 UglifyJsPlugin 变为 TerserPlugin。
主要默认配置：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20190826150316482.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzM2MjI4NDQy,size_16,color_FFFFFF,t_70)
详细的 mode 默认配置，可以看[这里](https://segmentfault.com/a/1190000013712229)。

### 几种 hash

#### hash

hash 和每次 build 有关，没有任何改变的情况下，每次编译出来的 hash 都是一样的，但当你改变了任何一点东西，它的 hash 就会发生改变。

#### chunkhash

chunkhash 是根据具体每一个模块文件自己的的内容包括它的依赖计算所得的 hash，所以某个文件的改动只会影响它本身的 hash，不会影响其它文件。

#### contenthash

当一个 vue 文件打包成一个 js 时，使用 MiniCssExtractPlugin 会让 css 样式单独提取为一个 css 文件，这个提取出的 css 文件，与 vue 编译的 js 文件，有相同的 chunkid。而 contenthash 是根据 css 内容决定的，内容不变，contenthash 不变，所以应该使 contenthash 作为部分文件名。

```javascript
new MiniCssExtractPlugin({
    filename: "static/css/[name]-css-[contenthash:5].css"
});
```

### output：path 与 publicPath

path：指定输出文件的目标路径
publicPath:用于在生产模式下更新内嵌到 css、html 文件里的 url 值。
举个例子：
css 中，这样引用一个图片

```css
.image {
    background-image: url("./test.png");
}
```

但在生产环境下，需要引用 cdn 中的图片，这时通过定义 publicPath 来改变引用路径。

```javascript
module.exports = merge(baseConfig, {
    mode: "production",
    output: {
        publicPath:'https://someCDN'
    }
 }
```

打包后

```css
.image {
    background-image: url("https://someCDN/test.png");
}
```

### 代码分割

webpack 4 的 Code Splitting 它最大的特点就是配置简单，如果你的 mode 是 production，那么 webpack 4 就会自动开启 Code Splitting。
webpack 内置分包策略：

-   新代码块可以被共享引用，或者这些模块都是来自 node_modules 文件夹里面
-   新代码块大于 30kb（min+gziped 之前的体积）
-   按需加载的代码块，最大数量应该小于或者等于 5
-   初始加载的代码块，最大数量应该小于或等于 3

例子：

```javascript
// entry.js
import("./a");
import("./b");
// a.js
import "./helpers"; // helpers is 40kb in size
// ...
// b.js
import "./helpers";
import "./more-helpers"; // more-helpers is also 40kb in size
// ...
```

结果：webpack 会创建一个包含./helpers 的独立代码块，其他模块会依赖于它。
为什么会这样打包：

-   条件 1：这个代码块会被两个导入(import)调用依赖（指的是 a.js 和 b.js）
-   条件 2：helpers 体积大于 30kb
-   条件 3：按需请求的数量是 2（小于 5）
-   条件 4：不会影响初始代码请求数量

#### 配置

```javascript
optimization: {
  splitChunks: {
     chunks: "async", // 必须三选一： "initial" | "all"(推荐) | "async" (默认就是async)
     minSize: 30000, // 最小尺寸，30000
     minChunks: 1, // 最小 chunk ，默认1
     maxAsyncRequests: 5, // 最大异步请求数， 默认5
     maxInitialRequests : 3, // 最大初始化请求书，默认3
     automaticNameDelimiter: '~',// 打包分隔符
     name: function(){}, // 打包后的名称，此选项可接收 function
     cacheGroups:{ // 这里开始设置缓存的 chunks
         priority: 0, // 缓存组优先级
         vendor: { // key 为entry中定义的 入口名称
             chunks: "initial", // 必须三选一： "initial" | "all" | "async"(默认就是async)
             test: /react|lodash/, // 正则规则验证，如果符合就提取 chunk
             name: "vendor", // 要缓存的 分隔出来的 chunk 名称
             minSize: 30000,
             minChunks: 1,
             enforce: true,
             maxAsyncRequests: 5, // 最大异步请求数， 默认1
             maxInitialRequests : 3, // 最大初始化请求书，默认1
             reuseExistingChunk: true // 可设置是否重用该chunk
         }
     }
  }
 }
```

##### chunks

demo 里，如果 chunks 赋值为：

-   initial:将所有非动态加载的模块放到 vendor 里
-   async：将所有动态加载的模块打包到 vendor
-   all：把动态和非动态模块同时进行优化打包，放到 vendor 里
    详细讲解可以看[这里](https://juejin.im/post/5c08fe7d6fb9a04a0d56a702)。

##### cacheGroups

cacheGroups：缓存组，可以设置缓存的 chunks。
注意：

-   cacheGroups 会继承和覆盖 splitChunks 的配置项，但是 test、priorty 和 reuseExistingChunk 只能用于配置缓存组。
-   cacheGroups 里的每一项最好都要加上 chunks 参数，不然可能打包不出来你想要的东西。

##### optimization.runtimeChunk

通过 optimization.runtimeChunk: true 选项，webpack 会添加一个只包含运行时(runtime)额外代码块到每一个入口。

### 参考资料

[手摸手，带你用合理的姿势使用 webpack4](https://juejin.im/post/5b5d6d6f6fb9a04fea58aabc#heading-7)
[Webpack——解决疑惑,让你明白](https://www.jianshu.com/p/dcb28b582318)
