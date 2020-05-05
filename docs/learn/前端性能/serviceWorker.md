### 简介
Service Worker
本质是作为服务器与客户端之间的代理服务器，伴随着PWA出现。Service Worker真正意义上将缓存控制权交给了前端，相比于LocalStorage、SessionStorage，后两者只是单纯的接口数据缓存，例如用户信息（一个对象）、列表信息（一个数组），而前者可以缓存静态资源，甚至拦截网络请求，根据网络状况作出不同的缓存策略。
memory cache
将资源缓存在了内存中。事实上，所有的网络请求都会被浏览器缓存到内存中，当然，内存容量有限，缓存不能无限存放在内存中，因此，注定是个短期缓存。
内存缓存的控制权在浏览器，前后端都不能干涉。
disk cache
将资源缓存在硬盘中，disk cache也叫http cahce，因为其严格遵守http响应头字段来判断哪些资源是否要被缓存，哪些资源是否已经过期。绝大多数缓存都是disk cache。硬盘缓存的控制权在后端
disk cahce分为强制缓存与对比缓存。

浏览器缓存优先级，从上至下依次降低
* Service Worker
* Memory Cache
* Disk Cache
* Push Cache
真正的网络请求（显示资源的具体大小）

浏览器的资源缓存分为 from disk cache 和 from memory cache 两类。当首次访问网页时，资源文件被缓存在内存中，同时也会在本地磁盘中保留一份副本。当用户刷新页面，如果缓存的资源没有过期，那么直接从内存中读取并加载。当用户关闭页面后，当前页面缓存在内存中的资源被清空。当用户再一次访问页面时，如果资源文件的缓存没有过期，那么将从本地磁盘进行加载并再次缓存到内存之中。

参考：
[深入理解浏览器的缓存机制](https://www.jianshu.com/p/54cc04190252)
[Service Worker：简介](https://developers.google.com/web/fundamentals/primers/service-workers)
[Service Worker和cacheStorage缓存及离线开发](https://www.zhangxinxu.com/wordpress/2017/07/service-worker-cachestorage-offline-develop/?shrink=1)
[memoryCache和diskCache产生的浏览器缓存机制的思考](https://segmentfault.com/a/1190000011286027)
[Cache Storage & Cache](https://juejin.im/post/5c6ee4f5f265da2dd218caac)
[一文读懂前端缓存](https://zhuanlan.zhihu.com/p/44789005)

### App中使用
#### 环境支持
android 5之后webview就支持sw了，ios 11.3以后safari也支持sw。但是在IOS App内WKWebview不支持sw！
#### ServiceWorkerGlobalScope
sw是在js线程外的线程执行的，有自己的全局作用域，有自己的全局变量。但是在sw中断或重启后，全局变量会重置，而不是**持久化**。因此不应该在这里设置全局变量。
#### 事件
1.install
初次安装sw，在sw内触发install事件，可以在这个事件里缓存静态资源。
2.active
sw激活后，会触发该方法，可以在方法中删除旧版本缓存
3.fetch：在控制的页面内，发起请求，会触发该事件。可以将响应替换成sw缓存的资源。
4.更新
当有新的sw，它会install，但是不会activate，会等旧的sw退出--刷新页面没有用，需要旧sw控制标签页全部关闭--新的sw才会activate。
#### sw与主页面通信
1.主页面向sw发消息
```javascript
// in app.js
navigator.serviceWorker.controller.postMessage({
    name: 'hello',
    age: 30,
    deep: {
        arr: [ 1, 2, 3],
        test: true,
    }
});
// in sw.js
self.addEventListener('message', function (event) {
    console.log(event.data);
});
```
2.sw向主页面发消息
```javascript
// in sw.js
self.clients.matchAll().then(function (clients) {
    console.log('clients in sw: ', clients);
    clients.forEach(function (client) {
        client.postMessage({
            hello: "word",
            yes: true,
            nest: {
                obj: {age: 31},
                num: -23,
                bool: false,
            },
        });
    });
});
// in app.js
navigator.serviceWorker.addEventListener('message', function(event){
    console.log('message from sw: ', event.data);
});
```
#### 跨域请求

sw在获取资源时，使用fetch API。api中存在Request,Response对象。其中Request.mode与Response.type规定了在跨域情况中，对于响应数据（比如headers,status）的访问权限。
##### Request.mode
包括以下几个值： same-origin no-cors cors navigate 。在不同的情况下，Request.mode的默认值是不一样的，这里需要重点关注no-cors,cors。
* no-cors:只允许发出HEAD,GET,POST 请求，js不能读取任何Response的属性值。在html中，不设置crossorigin，默认都是no-cors，包括这些标签：<link><script><img><audio><video><object><embed><iframe>。
* cors：遵循cors协议，允许js访问response。

##### Response.type
用来判断当前的响应是什么类型的请求。
* basic: 正常的、满足 同源策略 的请求，允许JS读取 除了 Set-Cookie 和 Set-Cookie2 以外的，所有响应header
* cors: 合法的跨域请求，能读取部分响应header，包括http状态码。
* opaque：对应request.mode是no-cors，不能读取任何属性，包括状态码，headers,body。详细限制 [请看这里](https://stackoverflow.com/questions/39109789/what-limitations-apply-to-opaque-responses)。
* error: 网络错误. 没有有用的描述错误的信息。响应的状态为0，header为空且不可变。
##### CORS crossorigin
在 html5 里允许我们设置元素的 crossorigin 属性，来设置上request header的origin，也可以主动控制是否发送用户的credentials，包括 Cookie 。
* anonymous: 发起 CORS 请求，header里带origin，并且将 credentials 设置为 same-origin，即只有同源情况下带cookie。
* use-credentials: 发起 CORS 请求，并且将 credentials 设置为 include。这个就同时会在跨域请求中带上cookie和其他的一些认证信息.
这两个属性使用都需要设置response Access-Control-Allow-Credentials
##### workbox缓存跨域资源
当使用CacheFirst缓存资源时，不能缓存Reponse.type=opaque的，因为不透明响应无法读取statusCode，不知道资源请求是否成功，长时间缓存它可能会导致该资源available之后仍然无法获取。
但workbox规定在NetworkFirst和StaleWhileRevalidate策略中可以缓存不透明响应。因为这些策略会定期更新缓存起源，即使缓存了不好的资源，也只存在很短时间。

参考：
[Service Worker: H5页面性能优化](https://zhuanlan.zhihu.com/p/59165459)
[处理第三方请求（workbox官网）](https://developers.google.com/web/tools/workbox/guides/handle-third-party-requests)
[FetchAPI--Response](https://developer.mozilla.org/zh-CN/docs/Web/API/Response)

##### 问题
发现在调试工具中cache storage体积非常大
![3da3660490fe6f35560dcaa3a2823b13.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p87)
这是因为 为了避免跨域信息泄露，不透明响应的大小被添加大量填充填充大小由浏览器而异，chrome缓存单个不透明响应至少占用7m。来自[What limitations apply to opaque responses?](https://stackoverflow.com/questions/39109789/what-limitations-apply-to-opaque-responses)。
所以使用sw时，尽量把img ,script, link 设置属性 crossorigin="anonymous"。
参考：[一个由不透明响应引发的灾难](https://moe.best/nodejs-memo/opaque-responses.html/comment-page-1)

##### 缓存时间
staleWhileRevalidate与networkFirst不需要设置缓存时间，因为他们会通过定期的通过网络更新缓存，而使用cacheFirst策略需要定义缓存时间，项目中定义一周。


