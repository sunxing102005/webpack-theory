### setState的调用
1.setState只在合成事件（onClick等）和钩子函数中是”异步“的，在原生事件（addEventListener）和setTimeout/setInterval中都是同步的。
2.setState中异步不是真的异步执行，其实本身执行过程跟代码都是同步的，只不过合成事件和钩子函数在更新之前调用，导致在合成事件和钩子里没发立刻拿到更新后的值，形成异步效果。
3.setState的批量更新也建立在钩子和合成事件里，原生事件和setTimeout里setState还是会一个一个执行的。在“异步”中如果对同一个值进行多次 setState ， setState 的批量更新策略会对其进行覆盖，取最后一次的执行，如果是同时 setState 多个不同的值，在更新时会对其进行合并批量更新。

### 练习题
```javascript
class Example extends React.Component {
  constructor() {
    super();
    this.state = {
      val: 0
    };
  }
  
  componentDidMount() {
    this.setState({val: this.state.val + 1});
    console.log(this.state.val);    // 第 1 次 log

    this.setState({val: this.state.val + 1});
    console.log(this.state.val);    // 第 2 次 log

    setTimeout(() => {
      this.setState({val: this.state.val + 1});
      console.log(this.state.val);  // 第 3 次 log

      this.setState({val: this.state.val + 1});
      console.log(this.state.val);  // 第 4 次 log
    }, 0);
  }

  render() {
    return null;
  }
};
```
1.第一次，第二次都是在生命周期内，isBatchUpdates是true，也就是钩子函数中会后执行，且批量执行setState方法，所以前两个console.log输出都是0.
2.在执行完钩子里的同步代码后，两次 setState 时，获取到 this.state.val 都是 0，所以执行时都是将 0 设置成 1，在 react 内部会被合并掉，只执行一次。设置完成后 state.val 值为 1.
3.setTimeout里，isBatchUpdates是false，同步更新，setState执行两次，输出2，3.

