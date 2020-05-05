### watch和computed区别
computed:
实际上是计算属性，会根据你依赖的数据动态显示新的计算结果。计算结果会被缓存，computed的值在getter执行后是会缓存的，只有在它依赖的属性值改变之后，下一次获取computed的值时才会重新调用对应的getter来计算
watch:
watcher 更像是一个 data 的数据监听回调，当依赖的 data 的数据变化，执行回调，在方法中会传入 newVal 和 oldVal。

### vue nextTick与异步更新队列的原理
#### nextTick用法：
在dom更新结束后，执行的延迟回调。在修改数据后立即执行此方法，会得到更改后的dom。
异步更新
1.遍历属性为其增加get，set方法，在get方法中会收集依赖(dep.subs.push(watcher))，而set方法则会调用dev的notify方法，此方法的作用是通知subs中的所有的watcher并调用watcher的update方法
2.watcher update方法将watcher本身加到一个队列里
3.定义一个flushSchedulerQueue方法，用户循环执行之前队列里watcher.run方法。
4.调用nextTick(flushSchedulerQueue)，将flushSchedulerQueue加入到callbacks数组里，再把执行数组内所有函数的方法放到 js event loop 中异步队列里执行--宏任务队列或者微任务队列。
以上是异步更新dom的过程，nextTick的使用其实就是在更新dom的函数队列后，再加上自己定义的回调函数，因为这个回调在dom更新函数之后，所以执行时dom已经更新成功了，达到想要的效果。
#### 异步更新优势：
减少重复的多次赋值造成的不必要的计算和dom操作。
#### 注意事项：
1.this.$nextTick 默认把回调加入微任务队列执行，事件处理方法中修改data，会将修改加入宏任务队列。
2.执行栈里代码运行结束，微任务队列运行结束后，一次事件循环结束了，这时才会开始根据dom重绘。
3.当终于执行到watcher.run方法后，根据diff等一系列计算，dom已经改变了，只是dom的渲染要等到这次事件循环结束才执行。
#### 使用场景：
1.初始化阶段
在created,mounted,updated阶段，如果要操作渲染后的视图，需要在nextTick里执行。
官方说明：
mounted周期里不会承诺所有子组件被挂载，所以如果希望等到整个视图都渲染完毕，需要在nextTick里执行。
2.更新阶段
属性更新后，希望拿到更新后的dom元素。

#### $nextTick
与全局方法VUe.nextTick一样，只不过内部this指向当前vue实例



参考：[Vue异步更新队列原理从入门到放弃](https://juejin.im/post/5a45fdeb6fb9a044ff31c9a8)
[Vue.nextTick 的原理和用途](https://segmentfault.com/a/1190000012861862)
[全面解析Vue.nextTick实现原理](https://juejin.im/entry/5aced80b518825482e39441e)
[为什么Vue使用异步更新队列？ #22](https://github.com/berwin/Blog/issues/22)
[Vue nextTick 机制了解一下](https://zhuanlan.zhihu.com/p/36553258)


### Vue中父子组件生命周期执行顺序
![1c380b009e36a6dd947128b047a9260a.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p16)

参考：
[Vue中父子组件生命周期执行顺序初探](https://segmentfault.com/a/1190000015890245)

### 组件通信
1.props 和$emit

2.$attrs和$listeners

$attrs:包含了父作用域中不被本级prop获取的属性（class和style除外），当一个组件没有声明任何 prop 时，这里会包含所有父作用域的绑定属性 (class和 style 除外)，并且可以通过 v-bind="$attrs" 传入内部组件。

$listeners:包含父作用域（不包含native修饰的）v-on的事件监听器，它可以通过 v-on="$listeners" 传入内部组件。

$attrs和$listeners主要用在父组件与孙组件的消息传递。

3.中央事件总线 EventBus
EventBus通过新建一个Vue实例 bus，通过bus.$emit触发事件，通过bus.$on监听触发的事件。

4.inject和provide
父组件通过privide提供属性，子孙组件通过inject注入数据
![e6d4e075203e5cf65dcefe9f298df19c.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p17)

5.$parent和$children

这里要说的这种方式就比较直观了，直接操作父子组件的实例。$parent 就是父组件的实例对象，而 $children 就是当前实例的直接子组件实例了，不过这个属性值是数组类型的，且并不保证顺序，也不是响应式的。

### 自定义组件
例子：全局注册指令
```javascript
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
  // 当被绑定的元素插入到 DOM 中时……
  inserted: function (el) {
    // 聚焦元素
    el.focus()
  }
})
```
组件内局部注册
```javascript
directives: {
  focus: {
    // 指令的定义
    inserted: function (el) {
      el.focus()
    }
  }
}
```
使用
```javascript
<input v-focus>
```
钩子函数：
1.bind：只调用一次，指令第一次绑定到元素时调用。这里可以进行初始化设置
2.inserted：被绑定元素插入父节点时调用 (仅保证父节点存在，但不一定已被插入文档中)。
3.update：所在组件的 VNode 更新时调用，但是可能发生在其子 VNode 更新之前。指令的值可能发生了改变，也可能没有。但是你可以通过比较更新前后的值来忽略不必要的模板更新 (详细的钩子函数参数见下)。
4.componentUpdated：指令所在组件的 VNode 及其子 VNode 全部更新后调用。
5.unbind：只调用一次，指令与元素解绑时调用。

钩子函数参数
![622f008ab2d605fd5945c58f55329fee.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p18)

详情参考：
[自定义指令](https://cn.vuejs.org/v2/guide/custom-directive.html)


### Vue diff
virtual DOM 是js对象
#### diff
只会在同层级进行, 不会跨层级比较。
![be79183e44e764793ea8e3ee36cb5167.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p19)
数据变化更新dom时，就调用patch方法。
```javascript
function patch (oldVnode, vnode) {
    // some code
    if (sameVnode(oldVnode, vnode)) {
    	patchVnode(oldVnode, vnode)
    } else {
    	const oEl = oldVnode.el // 当前oldVnode对应的真实元素节点
    	let parentEle = api.parentNode(oEl)  // 父元素
    	createEle(vnode)  // 根据Vnode生成新元素
    	if (parentEle !== null) {
            api.insertBefore(parentEle, vnode.el, api.nextSibling(oEl)) // 将新元素添加进父元素
            api.removeChild(parentEle, oldVnode.el)  // 移除以前的旧元素节点
            oldVnode = null
    	}
    }
    // some code 
    return vnode
}
```
如果两个时相同节点，调用patchVnode，如果不是，添加新dom，移除旧dom。
```javascript
function sameVnode (a, b) {
  return (
    a.key === b.key &&  // key值
    a.tag === b.tag &&  // 标签名
    a.isComment === b.isComment &&  // 是否为注释节点
    // 是否都定义了data，data包含一些具体信息，例如onclick , style
    isDef(a.data) === isDef(b.data) &&  
    sameInputType(a, b) // 当标签是<input>的时候，type必须相同
  )
}
```
如果有key，根据key判断是否samenode，没有则根据tag,data判断。
patchVnode方法
```javascript
patchVnode (oldVnode, vnode) {
    const el = vnode.el = oldVnode.el
    let i, oldCh = oldVnode.children, ch = vnode.children
    if (oldVnode === vnode) return
    if (oldVnode.text !== null && vnode.text !== null && oldVnode.text !== vnode.text) {
        api.setTextContent(el, vnode.text)
    }else {
        updateEle(el, vnode, oldVnode)
    	if (oldCh && ch && oldCh !== ch) {
            updateChildren(el, oldCh, ch)
    	}else if (ch){
            createEle(vnode) //create el's children dom
    	}else if (oldCh){
            api.removeChildren(el)
    	}
    }
}

```

* 找到对应的真实dom，称为el
* 判断Vnode和oldVnode是否指向同一个对象，如果是，那么直接return
* 如果是文本节点且不相等，替换文本
* 如果oldVode有子节点，Vnode没有，则删除el的子节点
* 如果VNode有子节点而oldVnode没有，则将Vnode的子节点真实化之后添加到el
* 如果两者都有子节点，则执行updateChildren函数比较子节点


updateChildren 方法
参考：[深入Vue2.x的虚拟DOM diff原理](https://blog.csdn.net/m6i37jk/article/details/78140159)

如果两个两个vnode相同，就继续调用patchVnode，比较下一层children，再接着移动指针。

语言描述：
diff是同级比较相同dom的子虚拟dom。新虚拟dom与旧虚拟dom分别是两个数组，它们各自有两个指针指向头尾。指针指向vdom比较分为四种情况：
1.头指针指向的新vnode如果与旧vnode数组的头部指针指向的vnode相同，则不移动真事dom，两个头指针向前移动。
2.如果新vnode头指针指向的vnode与旧vnode尾指针指向相同，则把真实dom最后的dom移到最前头去。
尾指针出现相同情况也这么移动。
3.如果新头指针，和旧的头尾指针指向都不是同一个dom，则从其他旧vnode里找，如果相同，则把这个dom移动到最前面。
4.如果找不到，则新增一个dom插入。
停止条件：
1.旧头尾指针交叉，说明旧vnode遍历结束，剩下的新vnode直接插入就行。
2.新头尾指针交叉，说明剩下的旧dom可以删除了。
### vue key的作用
在vue diff时，在对比子节点updateChildren函数中，新旧节点头尾指针交叉对比没有结果时，会根据key（这里对应的是一个key => index 的map映射），在oldch中查找key相同的旧节点来移动dom。没有找到就认为是新节点。
如果没有key，只能遍历来寻找相同节点。
``` javascript
// vue项目  src/core/vdom/patch.js  -488行
// 以下是为了阅读性进行格式化后的代码

// oldCh 是一个旧虚拟节点数组
if (isUndef(oldKeyToIdx)) {
  oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
}
if(isDef(newStartVnode.key)) {
  // map 方式获取
  idxInOld = oldKeyToIdx[newStartVnode.key]
} else {
  // 遍历方式获取
  idxInOld = findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
}
```
创建map的函数
```javascript
function createKeyToOldIdx (children, beginIdx, endIdx) {
  let i, key
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key
    if (isDef(key)) map[key] = i
  }
  return map
}
```

没有key时遍历查找
```javascript
// sameVnode 是对比新旧节点是否相同的函数
 function findIdxInOld (node, oldCh, start, end) {
    for (let i = start; i < end; i++) {
      const c = oldCh[i]
      
      if (isDef(c) && sameVnode(node, c)) return i
    }
  }
```
除此之外，key可以使更新更准确快速，避免多余的就地复用。
比如一组相同tag元素
![4fe9343f3ff56e6f23eee678bf9fac64.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p28)

F节点插入列表，没有key时，他们会就地复用，也就是更新。
![b7a2bfa28fa9b12b0b59ecd9830d2ced.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p29)

c更新为f，d更新为c，e更新为d。
这样显然做了无谓的性能消耗，直接创建并移动f节点，只渲染一个节点更有效率。
所以，key的作用有两点：
1.更准确更新，减少不必要的就地复用，在不是简单列表渲染情况下，会更快。
2.diff 新旧vnodes头尾指针都不一致时，利用key唯一性生成map获取节点，比遍历更快。
参考：
[写 React / Vue 项目时为什么要在列表组件中写 key，其作用是什么](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/1)
[为什么使用v-for时必须添加唯一的key?](https://juejin.im/post/5aae19aa6fb9a028d4445d1a)
### vue computed
我们根据下面的代码，来简易拆解获取依赖并更新的过程

```javascript
var vm = new Vue({
  el: '#example',
  data: {
    message: 'Hello'
  },
  computed: {
    // 计算属性的 getter
    reversedMessage: function () {
      // `this` 指向 vm 实例
      return this.message.split('').reverse().join()
    }
  }
})
vm.reversedMessage // =>  olleH
vm.message = 'World' // 
vm.reversedMessage // =>  dlroW
```
1.初始化data和computed，分别代理set，get方法，对data每一属性生成唯一dep。
2.对computed中reversedMessage生成唯一watcher，并保存到vm.computedWatchers中。
3.访问reversedMessage，将Dep.target指向reversedMessage的watcher,调用该属性具体方法reversedMessage。
4.reversedMessage方法中访问this.message，将reversedMessage对应的wathcer加入this.message的dep。
5.设置vm.message = 'world'，调用this.message

### vue 使用Object.defineProperty缺陷是什么，为什么vue3改用了proxy。
1.defineProp 不能监测数组删除与新增一个元素，但是可以监听原有元素的变化，不过因为性能原因vue没有使用。
2.defineProp只能监听对象属性，从而需要对每个对象每个属性遍历，而proxy可以劫持整个对象。
3.proxy可以代理数组，还可以代理动态添加的属性。
[Vue 的响应式原理中 Object.defineProperty 有什么缺陷？为什么在 Vue3.0 采用了 Proxy，抛弃了 Object.defineProperty？](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/90)

### MVVM
Model:通过ajax等api完成客户端与服务端model同步。
view：显示层，是一个动态模版，view层做的是绑定数据声明，指令的声明，事件绑定声明。
ViewModel：viewmodel相当于vue实例，数据的变化会导致view层的更新，反过来view层的值的变化，事件的触发，也会改变viewmodel层数据，已经触发绑定的事件。

优点：
1.分离视图层和逻辑层，降低耦合度，提高视图和逻辑的重用性。
2.帮助开发者更好编写测试代码。
3.将dom操作从开发者转为viewmodel自动操作，解放繁琐重复的工作。
缺点：
1.bug调试较麻烦。
2.功能复杂单页面，可能viewmodel会维护一个大的model，长期持有会占用较大内存，带来性能问题。

### 生命周期
![63fe1e53d4c09e09ba619353edfef68e.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p26)
![0761d4630647fc285de29534c8e6a2bb.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p27)

### vue,react变化监测原理

react:
通过setState API显示的更新，然后react会经过层层diff找到差异，然后patch到dom上。react从一开始setState，只知道组件变化了，然后通过diff来变化dom。

vue：
当vue初始化时，就会对数据data进行依赖收集，一旦数据变化，我们会知道需要对应需要变化的元素。再通过virtual dom diff 比较具体差异来patch dom。

### 面试问题
1.vue-router传参数几种方法。
2.vuex组件通信。
3.async 修饰函数返回字符串，打印是什么结果。
4.刷新页面，vuex的值还有没有.
5.打印 const u = async ()=>{return'1111'}

