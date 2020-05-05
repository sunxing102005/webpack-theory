### redux简介
#### state
数据集合

#### action
action是操作state的指令，有多少操作state的动作就有多少action。
#### reducer
加工函数，触发action时，将state，action传入reducer，返回新的state。

#### store
Store：Store是Redux中的状态容器，它里面存储着所有的状态数据，整个应用只能有一个Store。
store有以下职责：
getState() 方法获取state
dispatch(action) 触发action改变state
subscribe(listener) 注册监听器
unsubscribe(listener) 注销
#### redux工作流程
1.用户（通过view）使用dispatch方法触发action。
2.store调用reducer，并传入action和当前state，reducer返回新state。
3.state有变化了，store就会触发view更新。
### redux 原理详解
简易版代码：
```javascript
/* counter 自己的 state 和 reducer 写在一起*/
let initState = {
  count: 0
}
function counterReducer(state, action) {
  /*注意：如果 state 没有初始值，那就给他初始值！！*/  
  if (!state) {
      state = initState;
  }
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + 1
      }
    default:
      return state;
  }
}
```
```javascript
const createStore = function (reducer, initState) {
  let state = initState;
  let listeners = [];
  function subscribe(listener) {
    listeners.push(listener);
  }
  function dispatch(action) {
    state = reducer(state, action);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }
  function getState() {
    return state;
  }
  /* 注意！！！只修改了这里，用一个不匹配任何计划的 type，来获取初始值 */
  dispatch({ type: Symbol() })
  return {
    subscribe,
    dispatch,
    getState
  }
}
```
[redux原理全解](https://github.com/Advanced-Interview-Question/front-end-interview/blob/dev/docs/guide/redux.md)
### react-redux
核心：
Provider store
Connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])

Provider内组件，如果想用state，必须使用connect包裹组件，connect允许我们将store中数据作为prop绑定到组件里。

* mapStateToProps 允许我们将 state 中的数据作为 props 绑定到组件上。
* mapDispatchToProps 将 action 作为 props 绑定到 MyComp 上。

### connect原理
``` javascript
import React,{Component} from 'react';
import {bindActionCreators} from 'redux';
import propTypes from 'prop-types';

export default function(mapStateToProps,mapDispatchToProps){
   return function(WrapedComponent){
      class ProxyComponent extends Component{
          static contextTypes = {
              store:propTypes.object
          }
          constructor(props,context){
            super(props,context);
            this.store = context.store;
            this.state = mapStateToProps(this.store.getState());
          }
          componentWillMount(){
              this.unsubscribe = this.store.subscribe(()=>{
                  this.setState(mapStateToProps(this.store.getState()));
              });
          }
          componentWillUnmount(){
              this.unsubscribe();
          }
          render(){
              let actions= {};
              if(typeof mapDispatchToProps == 'function'){
                actions = mapDispatchToProps(this.store.disaptch);
              }else if(typeof mapDispatchToProps == 'object'){
                  console.log('object', mapDispatchToProps)
                actions = bindActionCreators(mapDispatchToProps,this.store.dispatch);
              }
                return <WrapedComponent {...this.state} {...actions}/>
         }
      }
      return ProxyComponent;
   }
}

```

