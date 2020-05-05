### let const var 区别

1. let,const 使用块级作用域

es5中只有全局作用域和函数作用域，块级作用域中let,const声明的变量，只在块内可见。

2. let,const 约束了变量提升而不是没有变量提升

在js中，函数和用var修饰的变量都会提升
```
function fn() {
   console.log('a',a);
   var a = 1;  // undefind
}
fn()
```
a 其实在使用前声明了，只不过没有初始化。
变量提升指的是声明的提升，而不会提升初始化和赋值。
函数提升优先级大于变量。
```javascript
let a = 'outside';
if(true) {
   console.log(a);//Uncaught ReferenceError: a is not defined
    let a = "inside";
}
```
报出错误 a 没有被定义，而不是引用了全局作用域里的 a，说明 let 声明的 a 也被提升了。
let设计中暂时性的死区：
当前作用域的顶部到变量声明位置的中间部分，叫做死区，这里禁止访问该变量。
let声明的变量存在变量提升， 但是由于死区我们无法在声明前访问这个变量。

3.let禁止重复声明变量
4.let声明变量不会成为全局变量属性。
5.const声明用于常量

### 箭头函数与普通函数的区别
1.函数内部没有this，this是继承自外部的，就是定义时所在对象，而不是调用时所在对象。
2.不能使用arguments对象。
3.不能使用yield，也就是箭头函数不能作为Generator函数。
4.不可以当作构造函数，不能使用new命令。
原因是：
* 箭头函数没有this无法使用call，apply。
* 箭头函数没有prototype，而new的过程中需要把构造函数的prototype给对象赋值_proto

### ES5的继承和ES6的继承有什么区别？

### es6 模块 与commonjs模块差异
它们有两个重要差异：
* CommonJs 模块输出的是值的浅拷贝，es6输出的是值的引用
* CommonJs是运行时加载，es6模块是编译时输出接口

第二个差异是因为CommonJs输出是对象，该对象只有在运行时才会生成，而es6模块不是对象，它的对外接口只是一种静态的定义，在代码静态解析阶段就会生成。

下面解释第一个差异：
commonjs输出值的浅拷贝，就是说，一旦输出这个值，模块内部的改变不会影响它。
比如：
```javascript
// lib.js
var counter = 3;
function incCounter() {
  counter++;
}
module.exports = {
  counter: counter,
  incCounter: incCounter,
};
// main.js
var mod = require('./lib');

console.log(mod.counter);  // 3
mod.incCounter();
console.log(mod.counter); // 3
```
相反，es6输出的变量是活的，模块改变，它的引用也会改变。

注意：
es6输出是只读的，不能修改变量值，但是可以修改变量的属性值。可以对commonJs重新赋值。

### Symbol类型
Symbol是一种原始类型，表示独一无二的值。可以作为对象的属性。
```javascript
let s1 = Symbol('foo');
let s2 = Symbol('bar');

s1 // Symbol(foo)
s2 // Symbol(bar)
```
接受一个字符串作为参数，表示对Symbol实例的描述。因此相同参数的symbol值是不相等的。

Symbol可以转为字符串，boolean值，不能转为数字、

```javascript
// string
let sym = Symbol('My symbol');

String(sym) // 'Symbol(My symbol)'
sym.toString() // 'Symbol(My symbol)'

//boolean
let sym = Symbol();
Boolean(sym) // true
!sym  // false

if (sym) {
  // ...
}
// number
Number(sym) // TypeError
sym + 2 // TypeError
```
属性名遍历
Symbol作为属性名，不会出现在for...in,for...of,Object.keys(),Object.getOwnPropertyNames()中。可以用Object.getOwnPropertySymbols()方法获取对象所有Symbol类型属性。

重新使用同一个Symbol值
Symbol.for()
```javascript
let s1 = Symbol.for('foo');
let s2 = Symbol.for('foo');

s1 === s2 // true
```



注意：
1.作为属性名时，不能用点运算符取值
```javascript
const key = Symbol();

const a[key] = 'ss'
console.log(a.key) //undefined

```

### proxy
代理器，用于代理对对象的一些操作。
可以理解成在目标对象之前架设一道拦截，外界对该对象的访问修改，都必须通过这层拦截，因此提供一种机制，可以对外界访问进行过滤和改写。
```javascript
var proxy = new Proxy({}, {
  get: function(target, propKey) {
    return 35;
  }
});

proxy.time // 35
proxy.name // 35
proxy.title // 35
```
![3cccfcfd84a6a4c482bad54b487742e1.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p31)

对于对象属性新增，修改，删除等操作都可以代理。弥补Object.defineProperty一些不足，比如无法监听数组通过下标添加元素，删除元素等。

### Reflect
Reflect对象与Proxy一样，也是Es6为了操作对象提供的新API。
设计目的：
1.将Object，Function对象上一些方法，放到Reflect对象上，比如Object.defineProperty,apply等。
2.将Object操作变成函数行为，比如 name in obj ,delete obj.name ，对应Reflect.has(obj,name),Reflect.deleteProperty(obj,name)。
3.只要Proxy含有的方法，Reflect都提供对应方法，用来完成默认行为。
```javascript
var loggedObj = new Proxy(obj, {
  get(target, name) {
    console.log('get', target, name);
    return Reflect.get(target, name);
  },
  deleteProperty(target, name) {
    console.log('delete' + name);
    return Reflect.deleteProperty(target, name);
  },
  has(target, name) {
    console.log('has' + name);
    return Reflect.has(target, name);
  }
});
```
![148cf526005e3b2b15a4bc00734c02ae.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p32)

参考：
[Reflect —es6入门](http://es6.ruanyifeng.com/#docs/reflect)

### 装饰器
装饰器是与类有关的语法，用来修饰或修改类和类方法。
```javascript
@frozen class Foo {
  @configurable(false)
  @enumerable(true)
  method() {}

  @throttle(500)
  expensiveMethod() {}
}
```
#### 类装饰器
```javascript
@decorator
class A {}

// 等同于

class A {}
A = decorator(A) || A;
```
装饰器函数接收一个参数，是被装饰得类。
如果一个参数不够，可以在装饰器外部再套一层函数
```javascript
function testable(isTestable) {
  return function(target) {
    target.isTestable = isTestable;
  }
}

@testable(true)
class MyTestableClass {}
MyTestableClass.isTestable // true
```
#### 类方法装饰器
```javascript
class Person {
  @readonly
  name() { return `${this.first} ${this.last}` }
}

function readonly(target, name, descriptor){
  // descriptor对象原来的值如下
  // {
  //   value: specifiedFunction,
  //   enumerable: false,
  //   configurable: true,
  //   writable: true
  // };
  descriptor.writable = false;
  return descriptor;
}

readonly(Person.prototype, 'name', descriptor);
```
方法装饰器第一个参数是类的原型，第二个参数是所要装饰的属性名，第三个参数是属性的描述对象。

### for of 与for in 
一个数据结构只要部署了Symbol.iterator属性 ，具有 iterator 接口，比如Array,Set,Map，都可以使用for of遍历成员。 
for in:
遍历对象可枚举属性，包含原型链上的属性。

Object.keys:
返回object自身的可枚举数据

Object.getOwnPropertyNames：
返回object自身可枚举与不可枚举属性。

```javascript
function MyPromise(execute){
    this.value = null;
    this.onresolveCb = [];
    this.onrejectCb = [];
    this.reason = null;
    this.status = 'pending';
    function resolve(val){
        this.status = 'fulfilled';
        this.value = val;
        this.onresolveCb.forEach(fn=>{
            fn();
        })
       
    }
    
    function reject(val){
         this.status = 'rejected';
        this.reason = val;
        this.onrejectCb.forEach(fn=>{
            fn();
        })
    }
    try{
        execute(resolve,reject);
    
    }catch(e){
        reject(e)
    }
}

MyPromise.prototype.then = function(onFulfilled,onRejected){
    const self = this;
    const promise2 = new Promise((resolve,reject)=>{
    
    if(self.status === 'pending'){
        self.onresolveCb.push(()=>{
            try{
            const x = onFulfilled(self.value);
            resolvePromise(promise2,x,resolve,reject);
            }catch(e){
                reject(e)
            
            }
        })
        self.onrejectCb.push(()=>{
            try{
            const x = onRejected(self.reason);
            resolvePromise(promise2,x,resolve,reject);
            }catch(e){
                reject(e)
            }
        })
    
    }
    
    if(self.status === 'resolved'){
        try{
            const x = onFulfilled(self.value);
            resolvePromise(promise2,x,resolve,reject);
            }catch(e){
                reject(e)
            
            }
    }
    if(self.status === 'rejected'){
        try{
            const x = onRejected(self.reason);
            resolvePromise(promise2,x,resolve,reject);
            }catch(e){
                reject(e)
            
            }
    }
    })
}

function resolvePromise(promise2,x,reject,resolve){
    if(typeof x =='object' && typeof x.then == 'function'){
        const then = x.then;
        then(y=>{
            resolvePromise(x,y,resolve,reject);
        },
        z=>{
             resolvePromise(x,z,resolve,reject);
        }
        )
    
    }else{
        
        resolve(x);
    }

}
```

