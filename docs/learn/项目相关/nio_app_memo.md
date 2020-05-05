1.webpack升级
code splitting
```javascript
 optimization: {
        moduleIds: "hashed", // keep module.id stable when vender modules does not change
        splitChunks: {
            cacheGroups: {
                default: false, // 防止打包到default
                vendors: false, // 防止打包到默认vendors.XX chunk里
                common: {
                    name: "common-react",
                    minChunks: 5,
                    priority: -10,
                    chunks(chunk) {
                        return commonReactChunks.includes(chunk.name);
                    }
                },
                reactVendor: {
                    test: /babel-polyfill|react|react-dom|prop-types|classnames/,
                    name: "react.vendor",
                    priority: 0,
                    chunks(chunk) {
                        return commonReactChunks.includes(chunk.name);
                    }
                },
                commonZepto: {
                    name: "common-zepto",
                    priority: 1,
                    minChunks: 2,
                    chunks(chunk) {
                        return commonZeptoChunks.includes(chunk.name);
                    }
                },
                trdPartyVender: {
                    name: "3rdParty.vendor",
                    priority: 10,
                    chunks(chunk) {
                        return commonZeptoChunks.includes(chunk.name);
                    },
                    test: /babel-polyfill|jquery/
                }
            }
        }
    },
```

chunks:表示从哪些chunk里提取公用代码
test：表示公用代码里模块符合什么样的正则表达式。
vendors: false，很重要。

2.app调试h5

01 charles将app上请求代理到本地服务
02 Android手机：使用 weinre 做前端调试
参考：[手机H5 web调试利器——WEINRE \(WEb INspector REmote\)](https://www.cnblogs.com/fanyong/p/4767867.html)

3.css 多行（折行）与单行垂直居中
外层display:table,line-height等于外层高度，内层display:table-cell,line-height等与每行行高[如何使CSS单行及多行文字水平垂直居中](https://www.jianshu.com/p/54ccbf9f959d)

4.setState在react生命周期执行情况
![3a7088393fa2c7e660fd3de5f2c307af.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p22)

参考：[React 组件生命周期函数里 setState 调用分析](http://varnull.cn/set-state-in-react-component-life-cycle/)
react 17.X不推荐使用componentWillReceiveProps，可以使用componentDidUpdate 代替。如果想要setState，可以使用memoization或者static getDerivedStateFromProps。

memoization可以参考:
[React优化-记忆化技术-使用闭包提升你的React性能](https://segmentfault.com/a/1190000015301672)

5.简化webpack控制台输出
```javascript
stats: {
        warnings: false,
        builtAt: false,
        modules: false,
        entrypoints: false
    }
```
[Stats | webpack](https://webpack.js.org/configuration/stats/#statswarnings)

6.Object.entries
Object.entries()方法返回一个给定对象自身可枚举属性的键值对数组，其排列与使用 for...in 循环遍历该对象时返回的顺序一致（区别在于 for-in 循环还会枚举原型链中的属性）。
```javascript
const object1 = {
  a: 'somestring',
  b: 42
};

for (let [key, value] of Object.entries(object1)) {
  console.log(`${key}: ${value}`);
}

```
[Object.entries\(\) MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)

7.Content Security Policy
CSP实质是一种白名单制度，开发者告诉客户端，哪些资源可以加载执行。
开启方法：
1.http头 设置Content-Security-Policy
```
Content-Security-Policy: script-src 'self'; object-src 'none';
style-src cdn.example.org third-party.org; child-src https:
```
2.meta标签里
```html

<meta http-equiv="Content-Security-Policy" content="script-src 'self'; object-src 'none'; style-src cdn.example.org third-party.org; child-src https:">
```
参考：
[Content Security Policy 入门教程](http://www.ruanyifeng.com/blog/2016/09/csp.html)

3.提交代码规范
![86ca25b940f1291985c339d925ce37af.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p25)

参考：[优雅的提交你的 Git Commit Message](https://juejin.im/post/5afc5242f265da0b7f44bee4)

