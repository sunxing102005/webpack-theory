### 发送请求
```javascript
axios.get({})
axios({
    method:'get',
    ...

})
```
支持promiseAPI
### 拦截器
```javascript
axios.interceptors.request.use(config => {
  if (store.getters.token) {
    config.headers['access_token'] = getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
  }
  return config
}, error => {
  // Do something with request error
  console.log(error) // for debug
  Promise.reject(error)
})
```
可以拦截request，response。
### 设置
可以用于设置跨域携带cookie
```javascript
axios.defaults.withCredentials = true;
```
用于设置过期时间,baseurl等
```javascript
axios.defaults.baseURL = '/app/web/v2';

axios.defaults.timeout = Timeout;

```
用于设置取消请求
```javascript
 let self = this
 axios.get('http://jsonplaceholder.typicode.com/comments', {
          cancelToken: new CancelToken(function executor(c) {
            self.cancel = c
            console.log(c)
            // 这个参数 c 就是CancelToken构造函数里面自带的取消请求的函数，这里把该函数当参数用
          })
        }).then(res => {
          this.items = res.data
        }).catch(err => {
          console.log(err)
        })


        //手速够快就不用写这个定时器了，点击取消获取就可以看到效果了
        setTimeout(function () {
          //只要我们去调用了这个cancel()方法，没有完成请求的接口便会停止请求
          self.cancel()
        }, 100)
```
用于取消重复点击
