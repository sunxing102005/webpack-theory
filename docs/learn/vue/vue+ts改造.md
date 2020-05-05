1.data定义在类的属性里，但是必须有初始值，否则后续属性变化不会触发视图变化。
```
export default class Breadcrumd extends Vue {
    levelList: Route[] | undefined = [];
 }
```
2.组件中是否可以判断slot是否有内容？
```
<hr v-if="$slots.default">
<slot></slot>
```
3.动态import 
路由import参数如果有字符串变量，.babelrc presets中@babel/preset-env的配置项modules要改为false。
```
{
    "presets": [
        "@babel/preset-typescript",
        [
            "@babel/preset-env",
            {
                "modules": false,
                "targets": {
                    "browsers": [
                        "> 1%",
                        "last 2 versions",
                        "not ie <= 8"
                    ],
                    "node": "current"
                }
            }
        ]
    ],
    "plugins": [
        "@babel/plugin-syntax-dynamic-import"
    ]
}
```
babel配置的参考文件：https://www.jb51.net/article/135225.htm

4.interview
vue监听数组改变原理，jsthis指向，promise实现原理，webpack代码切割优化，js bind 实现原理，import原理以及返回值，promise catch 与reject then接收的区别。vue生命周期以及destory里能不能访问组件，destory里用来做什么操作。

5.数组类型
```
Object.prototype.toString.call(arr) === '[object Array]'
arr instanceof Array
Array.isArray
```
6连接dev数据库
```

ssh -i ~/.ssh/xing.sun.private_key -p 2222 xing.sun@10.124.21.178
```

7.webpack 生产配置
代码切割：
[没有了CommonsChunkPlugin，咱拿什么来分包](https://segmentfault.com/a/1190000013476837)
[一步一步的了解webpack4的splitChunk插件](https://juejin.im/post/5af1677c6fb9a07ab508dabb#heading-6)

提取css：
[mini-css-extract-plugin](https://www.jianshu.com/p/91e60af11cc9)
8.webpack output filename 和chunkFilename
filename：决定了entry入口文件输出bundle的名称。
chunkFilename:决定了非入口(non-entry) chunk 文件的名称.包含异步加载的和代码分割的。

注意：设置optimization  runtimeChunk：'single'，entry文件打包后文件名，也按照chunkFilename生成。原因不清楚

8.css position：absolute垂直居中
```
    <style>
       .father{width:400px; height:200px; border:1px solid #000;position:relative;}
 
        .son{width:200px; height:100px; background:red;position:absolute; left:50%; top:50%;transform:translate(-50%,-50%);}
    </style>
 
    <div class="father">
        <div class="son">
            position:absolute;</br>left:50%;top:50%;</br>transform
        </div>
    </div>
```
10.打包时css中的图片和字体路径错误
修改loader的publicPath
```
{
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                use: {
                    loader: "url-loader",
                    options: {
                        limit: 10000,
                        name: utils.assetsPath("media/[name].[hash:7].[ext]"),
                        publicPath: "/"
                    }
                }
            },
```
11.下载时，设置requestHeader
```
export function downloadFile(url: string) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", cookie.getCookie(config.tokenKey));
    xhr.responseType = "blob";
    xhr.onload = function() {
        if (this.status === 200) {
            let blob = this.response;
            let filename = "订单导出结果.xlsx";
            let a = document.createElement("a");
            // blob.type = "application/octet-stream";
            //创键临时url对象
            let url = URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };
    xhr.send();
}
```
**URL.createObjectURL()**
1.返回一段带hash的url，并且一直存储在内存中，直到document触发了unload事件（例如：document close）或者执行revokeObjectURL来释放。
2.是同步执行的。、
注：
[URL.createObjectURL\(\)的使用方法](https://blog.csdn.net/qq_39258552/article/details/84133770)
[JS中的Blob对象](https://www.jianshu.com/p/b322c2d5d778)

13.div中img垂直居中
除了外界div符合line-height=height;vertical-aligin=middle;
内部img也要vertical-aligin=middle;

14.vue slot 的新用法

```

// current-user.vue 子组件
<template>
  <span>
    <slot name='header' :user="user">
      {{ user.lastName }}
    </slot>
  </span>
</template>

<script>
export default {
  data () {
    return {
      user: ...
    }
  }
}
</script>
```
```
// app.vue 父组件
<template>
  <current-user>
    <template v-slot:header="slotProps">{{ slotProps.user.firstName }}</template>    
  </current-user>
</template>
```

 slotProps代表子组件 slot 上所有的属性，所以slotProps中就有user属性，这个属性值也就是子组件的user值。
 简写
 ```
 // app.vue
<template>
  <current-user #header="{user}">
    {{ user.firstName }}
  </current-user>
</template>
```
 
 关于slot的详细用法：
 [vue 2.6 中 slot 的新用法](https://segmentfault.com/a/1190000019702966)
 [Vue.js 你需要知道的 scopedSlots](https://juejin.im/post/5c65511ce51d457fd23cf56b)
 
 15.Vue2.4+新增属性.sync、$attrs、$listeners
 
 sync:sync其实就是在父组件定义了一update:val方法，来监听子组件修改值的事件.
 
 $attrs:
 
 ```
 //父组件
<my-input placeholder="请输入你的姓名" type="text" title="姓名" v-model="name"/>
```
```
<template>
    <div>
        <label>输入框：</label><input v-bind="$attrs" :value="value" @input="$emit('input',$event.target.value)"/>
    </div>
</template>
<script>
export default {
    inheritAttrs:false,
    props:['value']
}
</script>
```
子组件通过v-bind="$attrs" 绑定父组件传递的所有属性，value除外。

$listener：
```
<my-input @focus="focus" placeholder="请输入你的姓名" type="text" title="姓名" v-model="name"/>
```
```
<template>
    <div>
        <label>输入框：</label><input v-bind="$attrsAll" v-on="$listenserAll"/>
    </div>
</template>
<script>
export default {
    inheritAttrs:false,
    props:['value'],
    computed:{
         $attrsAll() {
            return {
                value: this.value,
                ...this.$attrs
            }
        },
        $listenserAll(){
            return Object.assign(
                {},
                this.$listeners,
                {input:(event) => this.$emit('input',event.target.value)})
        }
    }
}
</script>

```

listens得到父组件传递所有方法。

参考：
[Vue2.4+新增属性.sync、$attrs、$listeners](https://www.jianshu.com/p/4649d317adfe)

16.vue Lifecycle hook

生命周期钩子函数可以是数组类型的，且数组中函数会依次执行。
```
export default {
 ...
 created: [
   function one () {
     console.log(1)
   },
   function two () {
     console.log(2)
   }
 ]
 ...
}

```

@hook 可以用父组件中的方法来初始化子组件的生命周期钩子
```
<!-- Child.vue -->
<template>
  <h3>I'm child!</h3>
</template>

<!-- Parent.vue -->
<template>
 <child @hook:created="handleChildCreated"></child>
</template>

<script>
   import Child from './child.vue'
   export default {
     components: [ Child ],
     methods: {
       handleChildCreated () {
         console.log('handle child created...')
       }
     }
   }
</script>
```


17. v-once

```
<body>

<div id="app">
    <h2>{{message}}</h2>
    <!--
    v-once : 只渲染元素和组件一次, 这可以用优化更新性能
    执行一次性插值指令,当改变数据时,插值处的内容不会更新
    -->
    <h2 v-once>{{message}}</h2>
</div>

</body>
<script src="js/vue.js"></script>
<script>
    var vm = new Vue({
        el:"#app",
        data:{
            message:'明天sk也是一样的666!'
        }
    })
</script>
```
18.生命周期
![0a7a48661064271e86e12d762149b995.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p12)
![d6b2aa2a512d4a675591c2879638c910.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p14)
![85c99f4d7bdf5a52dd7707f18d036c4e.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p13)

* beforeUpdated与updated都能得到变化后的data，只是beforeUpdated没有渲染，是更改data的最后机会。
* beforeDestroy和destroyed都可以得到data,el,都可以清除dom监听与计时器，只是destroyed改变数据，视图也不会变了。

详细参考：
[详解vue生命周期](https://segmentfault.com/a/1190000011381906)

19. v-on 修饰符

.native:监听组件根元素的原生事件，用于给自定义组件添加事件。

20.操作子组件
```
  <template>
    <el-progress type="circle" :percentage="O" ref="progress"></el-progress></template>
  <script>
    this.$refs.progress //组件对象实例， 可以手动调用组件的内置方法和属性
    this.$refs.progress.$el //组件 对象的最外层dom元素
  </script>
```
20.深入理解响应式

![be9e42e537785b6f892274c15fd8f911.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p15)

vue 通过object.defineProperty劫持数据的getter/setter方法。每个组件存在一个watcher实例，当组件渲染时，watcher会记录视图依赖数据属性，当修改属性，触发set方法时，会通知watcher，watcher调用update方法更新视图。

#### 检测变化的注意事项

 Vue 无法检测到对象属性的添加或删除

Vue.set(object, propertyName, value) 方法向嵌套对象添加响应式属性
你可能需要为已有对象赋值多个新属性，在这种情况下，你应该用原对象与要混合进去的对象的属性一起创建一个新的对象。
```
// 代替 `Object.assign(this.someObject, { a: 1, b: 2 })`
this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 })
```

#### 异步更新队列
Vue 在更新 DOM 时是异步执行的,但是如果你想基于更新后的 DOM 状态来做点什么,就需要使用Vue.nextTick(callback)。这样回调函数将在 DOM 更新完成后被调用。
```
     this.message = '已更新'
      console.log(this.$el.textContent) // => '未更新'
      this.$nextTick(function () {
        console.log(this.$el.textContent) // => '已更新'
      })
```
因为 $nextTick() 返回一个 Promise 对象，所以你可以使用新的 ES2016 async/await 语法完成相同的事情：
```
methods: {
  updateMessage: async function () {
    this.message = '已更新'
    console.log(this.$el.textContent) // => '未更新'
    await this.$nextTick()
    console.log(this.$el.textContent) // => '已更新'
  }
}
```
相关必读：[Vue.nextTick 的原理和用途](https://segmentfault.com/a/1190000012861862)
[JavaScript 运行机制--Event Loop详解](https://juejin.im/post/5aab2d896fb9a028b86dc2fd)
21.Vue数组/对象更新视图不更新
很多时候我们习惯于这样操作数组和对象,视图不会更新
```
  data() { 
    return {
        arr: [1,2,3],
        obj:{
          a: 1,
          b: 2 
        }
    }; 
  },

  // 数组更新视图不更新
  this.arr[0] = 'OBKoro1';
  this.arr.length = 1;
  console.log(arr);// ['OBKoro1']; 
  // 数据更新，对象视图不更新     
  this.obj.c = 'OBKoro1';
  delete this.obj.a;
  console.log(obj);  // {b:2,c:'OBKoro1'}
 
```

解决方法：

1. this. $set(你要改变的数组/对象，你要改变的位置/key,你要改成什么value)

2.变异方法
Vue 将被侦听的数组的变异方法进行了包裹，所以它们也将会触发视图更新。这些被包裹过的方法包括：
push()
pop()
shift()
unshift()
splice()  //会改变原数组，返回被修改的内容
sort()
reverse()

3.替换数组
非变异 (non-mutating method) 方法，例如 filter()、concat() 和 slice()，不会改变原数组，会返回一个新数组。当使用非变异方法时，可以用新数组替换旧数组：
```
example1.items = example1.items.filter(function (item) {
  return item.message.match(/Foo/)
})
```

注意事项：
vue不能检测以下数组变化：
1.通过数组索引设置一个数组项：vm.items[indexOfItem] = newValue
2.直接改变数组长度：vm.items.length = newLength

为了解决第一类问题，通常使用：
```
// Vue.set
Vue.set(vm.items, indexOfItem, newValue)
// Array.prototype.splice
vm.items.splice(indexOfItem, 1, newValue)
```
为了解决第二类问题，可以：
```
vm.items.splice(newLength)
```

22.vue 深度watch与watch立即触发回调
```
  watch: {
    obj: {
        handler(val, oldVal) {
          console.log('属性变化触发这个回调',val, oldVal); 
        },
        deep: true // 监测这个对象中每一个属性的变化
    },
    step: { // 属性 //watch
       handler(val, oldVal) {
        console.log("默认触发一次", val, oldVal); 
       },
       immediate: true // 默认触发一次
    }
  }
```
deep:监听对象子属性变化。
immediate：立即以表达式的当前值触发回调，也就是默认触发一次。