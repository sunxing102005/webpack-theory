### 虚拟dom优劣
优势：
1.虚拟dom可以通过diff算出最小差异，再批量patch，比直接替换dom更高效。
2.无需手动操作dom
3.虚拟dom本质是js对象，而dom与浏览器平台强相关，相比之下虚拟dom更能跨平台，比如服务端渲染，移动端开发。

### 生命周期
#### 废弃的
componentWillMount,componentWillUpdate,componentWillReceiveProps,

#### 挂载阶段

getDerivedStateFromProps:
static getDerivedStateFromProps(props, state)
静态方法，在render之前调用，在初始化以及更新时都会调用，返回一个对象，用于更新state
#### 更新阶段
* getDerivedStateFromProps
* shouldComponentUpdate：有两个参数nextProps和nextState，表示新的属性和变化之后的state，返回一个布尔值，true表示会触发重新渲染，false表示不会触发重新渲染
* getSnapshotBeforeUpdate:这个方法在render之后，componentDidUpdate之前调用，有两个参数prevProps和prevState，表示之前的属性和之前的state，这个函数有一个返回值，会作为第三个参数传给componentDidUpdate，如果你不想要返回值，可以返回null，此生命周期必须与componentDidUpdate搭配使用

* componentDidUpdate: componentDidUpdate(prevProps, prevState, snapshot),

#### 卸载阶段
componentWillUnmount：组件被卸载或者销毁时被调用，用于清除一些定时器，取消网络请求，清理无效dom等。

### setState同步还是异步
1.在合成事件和钩子函数中是“异步的”，在原生事件和setTimeout里是同步的。
2.setState的异步其实本身也是同步执行代码，只不过在合成事件或者钩子函数执行结束后，才会setState，所以函数的内部得不到更新后的state，造成异步的效果。
3.setState批量更新优化也建立在“异步执行”上，在原生事件跟setTimeout里不会批量执行。批量执行就是对同一个值多次setState，更新策略会将其覆盖，取最后一次的执行。
如果同时setState多个不同的值，更新时会批量合并更新。

### 组件间通信
1.父组件向子组件：传递props。
2.子组件向父组件：父组件传递函数作为子组件props，子组件通过调用该函数，将子组件想要传递的信息，作为参数，传递到父组件的作用域中。
3.跨层级通信：context。
4.发布订阅模式
5.全局状态管理工具：mobx,redux。

### React如何进行组件/逻辑复用
 Mixin的缺陷
* mixin中一般存在隐式依赖，就是mixin依赖组件中的方法，但当其他组件引用mixin时可能并不知道这种依赖关系。
* 多个mixin可能存在冲突-- state或methods。
* 难以快速理解组件行为，需要查看所有依赖mixin。
* 不敢轻易删除组件的属性或方法，mixin可能会依赖他们。
* 所有mixin最终都是会打平合并到一起，很难搞清楚一个mixin的输入输出。

Hoc对比mixin的优势：
* HOC通过props影响内部组件状态，所以不存在冲突和互相干扰，降低耦合度。
* 不同于 Mixin 的打平+合并，HOC 具有天然的层级结构（组件树结构），这又降低了复杂度。

HOC的劣势：
* 扩展性限制：hoc无法获取内部组件state，所以无法使用shouldComponentUpdate过滤不必要更新，React 在支持 ES6 Class 之后提供了React.PureComponent来解决这个问题.
* ref传递问题：Ref被隔断，后React.forwardRef解决。
* Wrapper hell:HOC会出现多层包裹，增加复杂度和理解成本。
* 不可见性: HOC相当于在原有组件外层再包装一个组件,你压根不知道外层的包装是啥,对于你是黑盒。

注：
1.pureComponent
自己实现了shouldComponentUpdate方法，通过浅比较props和state，判断是否需要更新组件。
2.forwardRef
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
可以解决ref被隔断的问题，通过forwardRef将挂载到hoc的props，挂载到包裹的子组件。


* render props

具有render prop 的组件接受一个函数，函数返回一个React元素并调用它，而不是实现自己的渲染逻辑。
```javascript
<DataProvider render={data => (
  <h1>Hello {data.target}</h1>
)}/>
```
这个prop可以不叫render， 任何被用于告知组件需要渲染什么内容的函数 prop 在技术上都可以被称为 “render prop”.
render props可以实现大部分hoc。

注意：
1.小心使用render props与pureComponent
render props会抵消pureComponent的优势，因为每次浅比较props总是false，因为父组件每次render，对于render prop都是新的值。
方案：
```javascript
class MouseTracker extends React.Component {
  // 定义为实例方法，`this.renderTheCat`始终
  // 当我们在渲染中使用它时，它指的是相同的函数
  renderTheCat(mouse) {
    return <Cat mouse={mouse} />;
  }

  render() {
    return (
      <div>
        <h1>Move the mouse around!</h1>
        <Mouse render={this.renderTheCat} />
      </div>
    );
  }
}
```
定义一个实例方法作为prop

### context

#### 静态context
```javascript
// Context 可以让我们无须明确地传遍每一个组件，就能将值深入传递进组件树。
// 为当前的 theme 创建一个 context（“light”为默认值）。
const ThemeContext = React.createContext('light');

class App extends React.Component {
  render() {
    // 使用一个 Provider 来将当前的 theme 传递给以下的组件树。
    // 无论多深，任何组件都能读取这个值。
    // 在这个例子中，我们将 “dark” 作为当前的值传递下去。
    return (
      <ThemeContext.Provider value="dark">
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}

// 中间的组件再也不必指明往下传递 theme 了。
function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

class ThemedButton extends React.Component {
  // 指定 contextType 读取当前的 theme context。
  // React 会往上找到最近的 theme Provider，然后使用它的值。
  // 在这个例子中，当前的 theme 值为 “dark”。
  static contextType = ThemeContext;
  render() {
    return <Button theme={this.context} />;
  }
}
```

#### 动态context
```javascript
import {ThemeContext} from './theme-context';

function ThemeTogglerButton() {
  // Theme Toggler 按钮不仅仅只获取 theme 值，它也从 context 中获取到一个 toggleTheme 函数
  return (
    <ThemeContext.Consumer>
      {({theme, toggleTheme}) => (
        <button
          onClick={toggleTheme}
          style={{backgroundColor: theme.background}}>

          Toggle Theme
        </button>
      )}
    </ThemeContext.Consumer>
  );
}

export default ThemeTogglerButton;
```

