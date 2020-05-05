### 渐进式网页性能指标（Progressive Web Metrics）
#### 首次绘制（FP）
代表浏览器第一次向屏幕传输像素的时间，页面首次发生视觉变化的时间。
注意：不包含默认背景绘制，包含非默认背景绘制。
#### 首次内容绘制（FCP）

浏览器第一次向屏幕绘制‘内容’。
注意：只有首次绘制 文本，图片，非白色canvas，svg时才算FCP。

*FP与FTP区别*

FP是当浏览器向屏幕绘制内容的时候，只要视觉上发生，无论什么触发的，这一刻都是FP。
FCP是浏览器首次绘制来自dom的内容，例如来自 文本，图片，SVG，canvas元素等，这个时间点叫FCP。

#### 首次有效绘制（FMP）
表示页面有效内容开始的时间点，本质是通过一个算法猜测某个时间点可能是FMP，所以可能会不准。

#### Largest Contentful Paint（LCP）
表示可见区域 内容 最大的元素开始出现在屏幕的时间点。

#### 可交互时间（TTL）
页面第一次完全达到可交互状态的时间点。
可交互状态指 UI组件是可以交互的，主线程达到流畅程度，主线程任务不超过50ms。

#### First CPU Idle（FCI）
首次CPU空闲，线程空闲就代表可以接收用户的响应了。
与TTL区别：FCI表示浏览器第一次可响应用户的输入，TTL代表浏览器可以持续性响应用户输入。
#### 首次输入延迟（FID）
是用户首次与产品进行交互时，我们产品可以在多长时间给出反馈。
#### DCL
DCL 表示DomContentloaded事件触发的时间。即浏览器解析HTML这个操作完成后立刻触发
#### L
表示onLoad事件触发的时间。页面所有资源都加载完毕后（比如图片，CSS），才会触发onLoad事件。
详情区别请看：[再谈 load 与 DOMContentLoaded](https://juejin.im/post/5b2a508ae51d4558de5bd5d1#heading-10)。
参考：
[Web性能领域常见的专业术语](https://zhuanlan.zhihu.com/p/98880815)

[性能指标都是些什么鬼?](https://llp0574.github.io/2017/10/19/performance-metrics-whats-this-all-about/)


* 资源下载时间
* dom解析时间
* request请求耗时
* 

