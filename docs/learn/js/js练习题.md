### 改造下面代码，输出1-10
```javascript
for (var i = 0; i< 10; i++){
	setTimeout(() => {
		console.log(i);
    }, 1000)
}
```
方法1，使用let
```javascript
for (let i = 0; i< 10; i++){
  setTimeout(() => {
    console.log(i);
  }, 1000)
}
```
循环时，当前i只在当前的循环有效，每次循环都会重新声明i，都是一个新的变量。
方法2，自执行函数
```javascript
for (var i = 0; i< 10; i++){
  ((i) => {
    setTimeout(() => {
      console.log(i);
    }, 1000)
 })(i)
}
```

### 练习题 下面代码输出内容
```javascript
var b = 10;
(function b() {
  b = 20;
  console.log(b)
})()
```
在自执行函数里，内部作用域，b变量已经声明为函数，函数内部无法给函数赋值，所以赋值无效。console.log(b)打印结果就是这个函数，如果打印window.b，则会打印10.因为var b=10是赋值是在全局作用域，会添加到window中。
如果是：
```javascript
var b = 10;
(function b() {
    var b = 20; // IIFE内部变量
    console.log(b); 
   console.log(window.b); 
})();
```
第一个console则会输出20.

### 练习题 下面代码a什么情况，会打印1
```javascript
var a = ?;
if(a == 1 && a == 2 && a == 3){
 	console.log(1);
}
```
因为==会进行隐式类型转换，只要重写toString或valueOf方法就好
```javascript
let a = {
    i:1,
    toString:()=>{
        this.i++;
    }
}

```
### 练习题数组
```javascript
var obj = {
    '2': 3,
    '3': 4,
    'length': 2,
    'splice': Array.prototype.splice,
    'push': Array.prototype.push
};
obj.push(1);
obj.push(2);
console.log(obj);
```
push方法是根据数组length参数，创建一个下标为length的属性。
![df90a2103e8915c2297c0d2bd8c08bf7.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p30)

### 实现 (5).add(3).minus(2) 功能 
```javascript
Number.prototype.add = function(n) {
  return this.valueOf() + n;
};
Number.prototype.minus = function(n) {
  return this.valueOf() - n;
};
```
