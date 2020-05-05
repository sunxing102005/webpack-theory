1.手写
构造函数
```javascript
function MyPromise(executor){
    let self = this;
    self.value = undefined;
    self.status = 'pending';
    self.reason = undefined;
    self.onResolvedCallback = [];
    self.onRejectedCallback = [];
    function resolve(value){
        if(self.status == 'pending'){
            self.value = value;
            self.status = 'fulfilled';
            self.onResolvedCallback.forEach(fn=>{
                fn();
            })
        
        }
    }
    
    function reject(reason){
        if(self.status == 'pending'){
            self.reason = reason;
            self.status = 'rejected';
            self.onRejectedCallback.forEach(fn=>{
                fn();
            })
        }
    }
    try{
        executor(resolve,reject);
    }catch(error){
        reject(error)
    }
    
}
```
then方法
```javascript
MyPromise.prototype.then = function(onFulfilled,onRejected){
    let self = this;
    let promise2;
    promise2 = new MyPromise((resolve,reject)=>{
        if(self.status == 'fulfilled'){
            try {
                let x = onFulfilled(self.value);
                resolvePromise(promise2,x,resolve,reject);
            }catch (e) {
                reject(e);
            }
        
        }
        if(self.status == 'rejected'){
            try {
            let x = onRejected(self.reason);
            resolvePromise(promise2,x,resolve,reject);
            }catch (e) {
                reject(e);
            }
        }
        
        if(self.status == 'pending'){
            self.onResolvedCallback.push(()=>{
            try {
                let x = onFulfilled(self.value);
                resolvePromise(promise2,x,resolve,reject);
            }catch (e) {
                reject(e);
            }
            
            })
        
            self.onResolvedCallback.push(()=>{
             try {
                let x = onRejected(self.reason);
                resolvePromise(promise2,x,resolve,reject);
            }catch (e) {
                reject(e);
            }
            })
        }
    
    })

} 
```
catch 方法
```javascript
    MyPromise.prototype.catch = function(fn){
        return this.then(null,fn);
    }
```
resolvePromise 方法
```javascript
function resolvePromise(promise2,x,resolve,reject){
    if(promise2==x){
        return reject(new TypeError('循环引用')) 
    }
    // 防止多次调用
    let called;
    if(x!==null&&(typeof x =='object' ||typeof x=='function')){
    try{
        let then = x.then;
        if(typeof x =='function'){
            then.call(x,y=>{
                if(called) return;
                called = true;
                resolvePromise(promise2,y,resolve,reject);
            },e=>{
                if(called) return;
                called = true;
                reject(e)
            })
        }else{
            resolve(x)
        }
    }catch(error){
        if(called) return;
        called = true;
        reject(error)
    }
    
    }else{
        resolve(x)
    }

}
```
参考文档：[史上最最最详细的手写Promise教程](https://my.oschina.net/u/2436852/blog/1837552)
2.catch与then第二个参数使用区别
```javascript
p
  .then(function () {
    throw new Error()
  }, function () {
    // won't capture this error
  })
  .catch(function () {
    // will capture the error
  })
```
如果在 then 的第一个函数里抛出了异常，后面的 catch 能捕获到，而第二个函数捕获不到.

3.promise.all原理：

```javascript
function promiseAll(promises){
    return new Promise((resolve,reject)=>{
        let fulfuilledArr = [];
        fulfuilledArr.length = promises.length;
        for(let i=0;i<promises.length;i++){
            (function(index){
                promises[index]().then(value=>{
                    fulfuilledArr[index]= value;
                    if(index == promises.length-1){
                        return resolve(fulfuilledArr);
                    }
                }).catch(error=>{
                    return reject(error);
        
                })
            
            })(i)
        }
    
    })


}

```
5.promise、async await、Generator的区别

**async / await**
async:
用来表示函数是异步的，定义的函数会返回一个promise对象，可以使用then方法添加回调函数.
await:
必须出现在async函数内部,当await 后面是promise对象时，会阻塞后面代码的执行，等到promise对象resolve，得到resolve的值，再接着执行函数中await后的代码。

Generator:
```javascript
function* helloWorldGenerator() {
  yield 'hello';
  yield 'world';
  return 'ending';
}

var hw = helloWorldGenerator();
hw.next()
// { value: 'hello', done: false }

hw.next()
// { value: 'world', done: false }

hw.next()
// { value: 'ending', done: true }

hw.next()
// { value: undefined, done: true }
```
第一次调用，Generator 函数开始执行，直到遇到第一个yield表达式为止。next方法返回一个对象，它的value属性就是当前yield表达式的值hello，done属性的值false，表示遍历还没有结束。

第二次调用，Generator 函数从上次yield表达式停下的地方，一直执行到下一个yield表达式。next方法返回的对象的value属性就是当前yield表达式的值world，done属性的值false，表示遍历还没有结束。

第三次调用，Generator 函数从上次yield表达式停下的地方，一直执行到return语句（如果没有return语句，就执行到函数结束）。next方法返回的对象的value属性，就是紧跟在return语句后面的表达式的值（如果没有return语句，则value属性的值为undefined），done属性的值true，表示遍历已经结束。

第四次调用，此时 Generator 函数已经运行完毕，next方法返回对象的value属性为undefined，done属性为true。以后再调用next方法，返回的都是这个值。

6.promise.race
方法返回一个 promise，一旦迭代器中的某个promise解决或拒绝，返回的 promise就会解决或拒绝。

实现:
```javascript
race = function(promiseArr){
    return new Promise((resolve,reject)=>{
        
        promiseArr.forEach(promiseItem=>{
            promiseItem.then(resolve,reject);
        
        })
    })

}

```




