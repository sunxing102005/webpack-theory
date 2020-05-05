### js事件循环
基础：
1.js分为同步和异步任务
2.同步任务在主线程执行，形成一个执行栈
3.异步任务执行有结果了后，会把回调函数放到一个异步任务队列。
4.执行栈任务执行完毕，系统会读取任务队列，将异步任务放到执行栈执行。

宏任务：
可以理解是，每次执行栈执行的任务就是宏任务。
浏览器为了使js任务与don渲染有序执行，在每次宏任务执行结束后，下一次执行之前，渲染页面。
macro task包括：UI交互，setTimeout,setInterval,I/O，postMessage。

微任务：
可以理解为每次执行栈里代码（宏任务）执行结束后立即执行的任务，在dom渲染前执行。
包括：Promise.then、MutaionObserver、process.nextTick(Node.js 环境)

运行机制：
事件循环中，每次循环称为一次tick，关键步骤如下：
1.执行栈里执行一个宏任务（没有就从事件队列里拿）
2.过程中遇到微任务，就放到微任务队列。
3.宏任务执行完毕后，立即执行微任务队列中的任务。
4.微任务执行完毕后，开始检查渲染，GUI线程接管渲染。
5.渲染完毕，js线程接管，开始下一个宏任务。

#### Promise的异步
Promise 的异步体现在then,所以写在promise里的代码被当作同步代码立即执行。
#### await/async
async/await中，在await出现之前，也是同步执行的。
实际上await是让出线程的标志
1.await后面的表达式会先执行一遍
2.将await后面的代码加入microtask里
3.然后跳出async函数，执行后面的代码。
```javascript
async function async1() {
	console.log('async1 start');
	await async2();
	console.log('async1 end');
}
```
等价于
``` javascript
async function async1() {
	console.log('async1 start');
	Promise.resolve(async2()).then(() => {
                console.log('async1 end');
        })
}
```
优点：
代码清晰，不用写一堆then，同时也避免回调地狱。
缺点：
如果多个异步函数没有依赖性而使用await，会降低性能。这个时候适合使用promise.all。


### es5/es6继承区别
1. class 声明会提升，不会初始化赋值，跟let const类似。
```javascript
const bar = new Bar(); // it's ok
function Bar() {
  this.bar = 42;
}

const foo = new Foo(); // ReferenceError: Foo is not defined
class Foo {
  constructor() {
    this.foo = 42;
  }
}
```
2.class 内部启用严格模式
3.class所有方法都是不可枚举的
4.class所有方法都不能用new调用，因为方法都没有prototype,[[constructor]]
5.必须使用new调用class
6.class内部无法重写类名

### 判断是不是数组类型
1.Object.prototype.toString.call()
每一个继承 Object 的对象都有 toString 方法，如果 toString 方法没有重写的话，会返回 [Object type]。
2.instanceof 判断对象原型链中能否找到该类型
3.Array.isArray()
### 发布订阅与观察者模式
观察者模式中主体和观察者都是相互感知的，发布订阅是通过第三方调度，他们是相互感知的。
![fc342c6082d3637b1bde3d507aa541c7.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p23)

### 关于 const 和 let 声明的变量不在 window 上 
在es5中，顶层对象（window）的属性跟全局变量的属性是一致的，var,function声明的是全局变量，自然也是顶层对象属性。
es6,全局作用域中，let const声明的，不在全局对象中，只在块级作用域中（Script）。因为let const会生成块级作用域，而不是添加到全局作用域中：
```javascript
let a = 10;
const b = 20;
//相当于：
(function(){
         var  a = 10;
         var b = 20;
})()
```
### requestAnimationFrame
js中通常使用setInterval,setTimeout实现动画效果，但是计时器设定事件并不可靠。
setTimeout等方法的回调，是在异步队列中，需要等到执行栈中内容执行结束后，再执行异步队列中的回调。如果同步代码执行事件过长，会影响时间精确度。同时也不能保证动画开始时间就是历览器刷新时间。
```javascript
var start = null;
var element = document.getElementById('SomeElementYouWantToAnimate');
element.style.position = 'absolute';

function step(timestamp) {
  if (!start) start = timestamp;
  var progress = timestamp - start;
  element.style.left = Math.min(progress / 10, 200) + 'px';
  if (progress < 2000) {
    window.requestAnimationFrame(step);
  }
}

window.requestAnimationFrame(step);
```
requestAnimationFrame 接收一个动画函数作为参数，告诉浏览器要执行动画。当浏览器显示频率刷新时会执行这个函数。若你想在浏览器下次重绘之前继续更新下一帧动画，那么回调函数自身必须再次调用window.requestAnimationFrame()。
递归执行requestAnimationFrame的时间间隔，与浏览器刷新时间间隔一致(16.7ms)，也就是浏览次每一帧渲染的时间间隔。
注意：若你想在浏览器下次重绘之前继续更新下一帧动画，那么回调函数自身必须再次调用window.requestAnimationFrame()
### Array.sort()排序
默认的排序方法会将数组元素转换为字符串，然后比较字符串中字符的UTF-16编码顺序来进行排序.所以全是数字的数组不能使用sort排序。需要
```javascript
[].sort((a,b)=>a-b)
```

### 对象键名转化
* 对象键名只能是字符串和symbol类型
* 其他类型键名自动转化为字符串类型
* 对象做键名会调用toString方法

[输出以下代码运行结果](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/125)
### js预解释
#### 从一个实例开始
```javascript
var a= 1;
function f() {
  console.log(a);
  var a = 2;
}
f();
```
执行结果：undefined
js在浏览器运行阶段分为 预解释阶段（parser 编译阶段）执行阶段，以var a=2为例，js引擎处理阶段如下：
1.读取var a后，在当前作用域查找有没有同名的变量，没有则在当前作用域创建一个名为a的变量，有则忽略此声明继续编译。
2.v8处理a=2，首先询问当前作用域是否有a的变量，有则赋值，没有则向上访问。
#### js执行环境
我们用一段伪代码表示创立的执行环境
```javascript
executionContextObj = {
    'scopeChain': { /* 变量对象 + 所有父级执行上下文中的变量对象 */ },
    'variableObject': { /*  函数参数 / 参数, 内部变量以及函数声明 */ },
    'this': {}
}
```
scoprChain:作用域链包括下面提到的变量对象，以及所有父级上下文的变量对象。
variableObject:存储上下文定义的函数声明和变量，包括：
* 变量
* 函数声明
* 函数形参

变量对象创建过程：
* 根据函数参数，创建arguments对象。
* 扫描函数内部代码，对于所有找到的函数声明，将函数名和函数引用存入变量对象中，如果变量对象中已经有同名的函数，那么就进行覆盖。
* 扫描函数内部代码，查找所有变量声明。将所有找到的变量声明，将变量名放到变量对象，设置值为undefined。*如果变量名跟已声明的形参和函数相同，则不会覆盖已存在的这些属性*

### 变量提升/函数声明提升
#### 预编译
* 页面创建GO全局对象（Global object）window对象。
* 加载第一个脚本文件
* 开始预编译，查找函数声明作为GO属性，赋值为函数体
* 查找var变量声明，作为GO属性，赋值为undefined，运行时才会把声明的变量赋值

只有函数声明会变量提升，函数表达式不会提升。
函数和变量相比，会被优先提升。这意味着函数会被提升到更靠前的位置。
#### 冲突处理
1.变量冲突：后声明覆盖前者
```javascript
var a = 3;
var a = 4;
console.log(a);
```
2.函数之间冲突：后者覆盖前者
3.函数与变量之间冲突：
```javascript
console.log(f);

function f() {
    console.log('f');
}
var f ='g';
```
f = undefined不会出现，因为函数声明优先级高，f已经被声明了。
### undefined与null区别
null:
表示没有对象，即此处不应该有值，转化数字为0.
undefined:
表示缺少值，就是此处应该有值，但是未定义。
典型用法：
1.变量被声明了，但是没有被赋值时。
2.调用参数时，应该提供的参数没有赋值。
3.对象没有赋值属性也是undefined
4.函数没有返回值，返回的是undefined。

### 计算题
01
```javascript
['1','2','3'].map(parseInt)
```
parseInt(string,radix)
将一个字符串 string 转换为 radix 进制的整数， radix 为介于2-36之间的数。

1.当radix等于0，会根据string判断基数，如果 string 以 1 ~ 9 的数字开头，parseInt() 将把它解析为十进制的整数。
2.当radix小于2时，返回NaN。
3.当radix等于2，二进制没有3，所以·1返回NaN。
02
```javascript
1 == ['1']  // true
```
原因：==会触发隐式类型转化，['1'] 会转化为'1'，所以相等。

### == 与 ===
双等号：
1.如果两个值类型相等，再进行三等号比较
2.如果类型不想等：
01.一个是null,一个是undefined，相等
02.原始类型都转化为数字类型，再比较。
03.一个复杂类型跟基本类型比较，会把对象转化为原始值，也就是调用Object.prototype.valueOf()方法
04.两个复杂类型，比较两者引用地址。



