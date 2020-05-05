### context
注意事项：
当provider重新渲染时，可能会触发consumer意外的重新渲染。比如：
```
class App extends React.Component {
  render() {
    return (
      <Provider value={{something: 'something'}}>
        <Toolbar />
      </Provider>
    );
  }
}
```
为了防止这种情况，将value状态提升到state里：
```
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: {something: 'something'},
    };
  }

  render() {
    return (
      <Provider value={this.state.value}>
        <Toolbar />
      </Provider>
    );
  }
}
```

### 转发refs
React.forward 将refs转发到内部的组件，React.forward接受一个函数，props ref作为参数，返回一个React节点。
```javascript
function logProps(Component) {
  class LogProps extends React.Component {
    componentDidUpdate(prevProps) {
      console.log('old props:', prevProps);
      console.log('new props:', this.props);
    }

    render() {
      const {forwardedRef, ...rest} = this.props;

      // 将自定义的 prop 属性 “forwardedRef” 定义为 ref
      return <Component ref={forwardedRef} {...rest} />;
    }
  }

  // 注意 React.forwardRef 回调的第二个参数 “ref”。
  // 我们可以将其作为常规 prop 属性传递给 LogProps，例如 “forwardedRef”
  // 然后它就可以被挂载到被 LogProps 包裹的子组件上。
  return React.forwardRef((props, ref) => {
    return <LogProps {...props} forwardedRef={ref} />;
  });
}
```
### 受控组件
组件value与state绑定，同时会随着用户输入自动改变state的值。
```javascript
class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    alert('提交的名字: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          名字:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="提交" />
      </form>
    );
  }
}
```
简单来说，就是表单组件，input,textarea,select等，他们的value等于state的一个属性值，同时用户input 或change时，会改变这个属性。有点类似vue 的v-model。
### React组件复用指南
#### hoc
高阶组件就是一个 React 组件包裹着另外一个 React 组件.
这种模式通常用函数实现，基本上是类工厂，伪代码表示为：
```
hocFactory:: W: React.Component => E: React.Component
```
按功能主要分为以下两种：
1.属性代理：HOC对传递给wrappedComponent props属性进行操作.
2.反向继承：HOC继承wrappedComponent

#### 属性代理
最简单的例子：
```javascript
function ppHOC(WrappedComponent) {  
  return class PP extends React.Component {
    render() {
      return <WrappedComponent {...this.props}/>
    }  
  }
}
```
这里只是把传给hoc的props向下传给了WrappedComponent并返回WrappedComponent。

使用 Props Proxy 可以做什么？

1.操作props
可以读取，添加，删除编辑传给 WrappedComponent 的props。

2.转发refs

3.提取state

#### 反向继承
最简单实现：
```javascript
function iiHOC(WrappedComponent) {
  return class Enhancer extends WrappedComponent {
    render() {
      return super.render()
    }
  }
}
```
反向继承允许hoc通过this访问WrappedComponent，也就是可以访问他的state,props,render，生命周期函数等。

#### Inheritance Inversion 的高阶组件不一定会解析完整子树
可以用反向继承做什么？
1.渲染劫持
2.操作state
##### 渲染劫持
通过渲染劫持，你可以
* 在由 render输出的任何 React 元素中读取、添加、编辑、删除 props
* 读取和修改由 render 输出的 React 元素树
* 有条件地渲染元素树
* 把样式包裹进元素树（就像在 Props Proxy 中的那样）

```javascript
function iiHOC(WrappedComponent) {
  return class Enhancer extends WrappedComponent {
    render() {
      if (this.props.loggedIn) {
        return super.render()
      } else {
        return null
      }
    }
  }
}
```
#### 操作state
```javascript
export function IIHOCDEBUGGER(WrappedComponent) {
  return class II extends WrappedComponent {
    render() {
      return (
        <div>
          <h2>HOC Debugger Component</h2>
          <p>Props</p> <pre>{JSON.stringify(this.props, null, 2)}</pre>
          <p>State</p><pre>{JSON.stringify(this.state, null, 2)}</pre>
          {super.render()}
        </div>
      )
    }
  }
}
```
### 生命周期
#### 初始化阶段
##### constructor
##### static getDerivedStateFromProps（props, state）
返回一个对象用来更新state。
##### render
##### componentDidMount
#### 更新阶段
##### static getDerivedStateFromProps（props, state）
##### shouldComponentUpdate
##### render
##### getSnapshotBeforeUpdate(prevProps, prevState)
使得组件能够在发生更改之前，从dom获取一些信息。此生命周期返回值作为参数传给componentDidUpdate。
##### componentDidUpdate(prevProps, prevState, snapshot)
#### 卸载
##### componentWillUnmount()
组件从dom移除




### React与Vue
#### diff算法
vue因为数据劫持和发布订阅模式为核心，可以跟踪每个组件的依赖关系。更新时可以只更新一个组件。
react每次显示更新状态，都会使整个组件重新渲染，之后根据diff来更新，增加或删除dom。所以需要shouldComponentUpdate判断是否更新组件。
#### 更新机制
vue修改属性，会异步更新dom。将更新callback加入异步队列（默认微任务），所以更新数据后无法直接获取dom变化。
react在合成事件和生命周期钩子里，看起来是异步更新，因为setState后，得不到变化后的state。实际上因为合成事件和钩子函数里，函数执行完才会执行setState，实际上setState还是同步执行的。
两种更新机制都会有个优点，就是可以批量更新。
vue对同一属性更新，watcher只会被添加一次到队列里，多次改变同一个属性值，dom也只会更新一次，取最后一次的更新值。这样避免了多余的性能消耗。
react在合成事件和生命周期里，多次setState同一个属性，也会取最后一次更新。设置不同属性，也会合并批量更新。


#### 性能优化

##### vue
每个组件相当于自动实现了shouldComponentUpdate。由于数据劫持&发布监听模式，数据变化时，每个组件都清楚的知道自己该不该变化。所以基本去除手动优化的必要性。
但当组件很大，需要监听的数据多时，vue的watcher也会特别多，影响性能。所以大型项目倾向使用react。
##### react
当state或prop改变，都会触发组件更新。
shouldComponentUpdate生命周期，可以用来控制组件是否用来重新渲染。
```javascript
shouldComponentUpdate(nextProps, nextState) {
}
```
也可以继承React.PureComponent，会自动实现对props的浅比较，相同就不更新。

#### 销毁组件
##### vue
vue调用$destory方法，首先会执行beforeDestory生命周期函数，再执行destoryed，这时组件dom还存在于页面，如果想要对残留dom操作，需要在destoryed钩子里执行。
##### react
react执行完componentWillUnmount后，数据，方法，dom全部销毁，所以这时也就不需要其他比如componentDidUnmount的钩子函数了。

总的来说根本差异是，vue销毁组件后组件dom依然存在，只不过数据，方法已经无效。react组件销毁后，dom已经不在了，所以不需要销毁后钩子。


#### 总结
作为框架，vue比react其实做了更多的事。vue提供了很多方便开发的功能，比如指令，双向绑定，计算属性等等。有的开发者认为，直接使用这些功能，不仅方便开发，而且使代码整洁好理解。react实现相同的功能采取了更通用的方法，即在框架本身的设计优势下，不需要额外api就会实现相同功能，有的开发者认为这是一种更加灵活且“大巧不工”的框架。

在更新机制方面，vue采用属性劫持&发布订阅模式，数据改变后可以直接定位需要更新的组件。而react在state和props改变时，组件都会重渲染，除了开发者使用shouldComponentUpdate方法自定义更新机制外，不存在其他性能优化。并且两者都使用virtual dom diff计算，所以看起来与vue相比，react会增大diff的计算量（因为react组件要整个更新，diff也就是整个组件了）。中小项目确实会有这样的问题，但大型项目中，vue机制会创建过多的watcher，与react相比反而存在性能上的劣势。
此外vue更改data，react setState时，react使用的是伪异步，即在生命周期和合成事件里，执行完函数后再setState。vue采用真异步，通过nextTick方法把更新dom放在异步队列里。同时vue与react都实现了批量更新操作，避免多次更改同一个属性造成的不必要的多次渲染。
在提取共用逻辑方面，vue使用的是mixin，还有slot,react有HOC，Render Props。此外也有两个框架都可以用的装饰器。mixin与HOC对比，劣势明显，mixin使用可能会造成mixin与引用组件间方法冲突。另外mixin与组件或其他mixin可能会有互相依赖的方法，增加引用者出错概率。Render Props与slot有类似的作用，使用起来render props更灵活些。总的来说在公用逻辑抽取方面，react占优。

总的来说vue对新手更友好，文件结构更接近传统js,css,html分离的开发结构，更多api使开发更便利，以及在中小项目里有不错的性能优势。react有更高的灵活性，虽然不像vue有那么多便利的api，但实现类似功能在react中也并不复杂。react的简单和灵活使他更适用于大型项目。


### 生命周期中使用setState
可以正常使用：
componentDidMount;
有条件使用：
componentDidUpdate;
禁止使用：
getDerivedStateFromProps,getSnapshotBeforeUpdate,render,shouldComponentUpdate;
无意义使用：
componentWillUnmount：
 首先生命状态也会被赋予值为UNMOUNTING， 然后执行componentWillUnmount，最后生命状态重置为null，做卸载页面组件和状态等处理。在componentWillUnmount中使用setStat，因为等待的是页面卸载，所以改变state是没有意义的。
 