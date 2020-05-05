### 简介
这里的路由就是SPA（单页应用）的路径管理器。路由模块的本质 就是建立起url和页面之间的映射关系。

#### 模式
1.hash模式
hash（#）是url锚点，当#后面改变时，不会重新请求服务端，重新刷新页面，同时每改变一次，浏览历史里添加一条记录，点击后退可以返回。
每次#后url变化，可以通过hashchange监听。监听时就可以根据url更新页面。

2.history模式
h5增加了两个api，pushState和replaceState，可以实现改变url地址而不重新发送请求。同时还有popstate 事件。通过这些就能用另一种方式来实现前端路由了，但原理都是跟 hash 实现相同的。
刷新页面时，还是会重新请求服务器，所以服务端需要添加一个候选资源，当url匹配不到任何资源时，返回根页面。
*注：*
pushState:
浏览器不会向服务端请求数据，直接改变url地址，可以类似的理解为变相版的hash；但不像hash一样，浏览器会记录pushState的历史记录，可以使用浏览器的前进、后退功能作用。
replaceState：
与pushState类似，不同是只修改浏览记录，不会添加一条。
popstate：
当用户在浏览器点击进行后退、前进，或者在js中调用histroy.back()，history.go()，history.forward()等，会触发popstate事件。但pushState,replaceState不会触发它。
手写实现一个router：
[动手撸一个 router](https://github.com/muwoo/blogs/tree/master/src/router)

参考：
[前端路由简介以及vue-router实现原理](https://juejin.im/post/5b10b46df265da6e2a08a724#heading-5)
#### 守卫
##### 全局路由守卫：
1.全局前置守卫:
router.beforeEach:
```javascript
const router = new VueRouter({ ... })

router.beforeEach((to, from, next) => {
  // ...
})
```
2.全局后置守卫：
```javascript
router.afterEach((to, from) => {
  // ...
})
```
##### 路由独享守卫：
在路由配置里添加；
```javascript
const router = new VueRouter({
  routes: [
    {
      path: '/foo',
      component: Foo,
      beforeEnter: (to, from, next) => {
        // ...
      }
    }
  ]
})
```
##### 组件内守卫
```javascript
const Foo = {
  template: `...`,
  beforeRouteEnter (to, from, next) {
    // 在渲染该组件的对应路由被 confirm 前调用
    // 不！能！获取组件实例 `this`
    // 因为当守卫执行前，组件实例还没被创建
  },
  beforeRouteUpdate (to, from, next) {
    // 在当前路由改变，但是该组件被复用时调用
    // 举例来说，对于一个带有动态参数的路径 /foo/:id，在 /foo/1 和 /foo/2 之间跳转的时候，
    // 由于会渲染同样的 Foo 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
    // 可以访问组件实例 `this`
  },
  beforeRouteLeave (to, from, next) {
    // 导航离开该组件的对应路由时调用
    // 可以访问组件实例 `this`
  }
}
```