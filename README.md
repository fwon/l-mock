# l-mock

## 安装
```
npm i l-mock -g
```
## Quick Start

### 第一步：
定位到项目目录

```
cd path/to/project
```

### 第二步：
初始化:

```
lmock init
```

> `init`  命令会在项目根目录下创建默认文件夹mock，通过`--dir`参数可指定目录名

### 第三步：
定位到mock目录

```
cd mock
```

运行mock服务

```
lmock start
```
> 默认监听3000端口，可通过`--port`配置端口，支持多项目同时mock


访问`localhost:3000/a` 成功返回数据

## 使用说明

| Params | Description |
|--------|-------------|
|url|请求api|
|method|get/post/put/delete|
|contentType|当方法为`post`且请求类型为`multipart/form-data`时，需配置该参数|
|result|**JSON**直接配置静态/动态数据，动态数据的配置可参考 [Mockjs](http://mockjs.com/examples.html)<br>**Function**支持返回一个方法，你可以读取请求参数进行一些判断, 并返回自定义内容，支持Mock和文件读取|


## 例子
### 1. 返回JSON格式数据

```javascript
/*
  返回简单的json数据，变量语法可参考 http://mockjs.com/examples.html
 */

module.exports = {
  url: '/a',
  method: 'get',
  result: {
    'status|1': ["no_login", "OK", "error", "not_registered", "account_reviewing"],
    'msg': '@csentence()',
    'data': {
      a: 2
    }
  }
}
```

### 2. 自定义函数
```javascript
/*
  用户可以自定义返回函数，采用express语法
  当请求方法为post且Content-Type为multipart/form-data，需设置contentType参数
 */

module.exports = {
  url: '/b',
  method: 'post',
  contentType: 'multipart/form-data',
  result: function (req, res) {
    // POST方法req.body获取请求信息
    if (req.body.name === 'admin' && req.body.password === 'admin') {
      res.send({"msg": "登录成功！","code": 0,"authorization":"fdjflsjflfds4f5df5s4f5d4f5s"});
    }else {
      res.send({"msg": "账号或者密码错误！", "code": 1});
    }
  }
}
```
### 3. 动态Mock和文件读取
```javascript
/*
  demo c: url 请求接口支持动态url参数，:id
  just-mock 提供了暴露Mock方法和require方法，当数据量大时，用户可以直接引入独立json文件, 或进行Mock操作
 */

module.exports = {
  url: '/c/:id',
  method: 'get',
  result: function (req, res) {
    const Mock = res.Mock
    const json = res.require('./c.json')
    // url 参数通过req.params获取，?xxx=xx参数通过req.query获取
    if (req.params.id === '1') {
      // res.cookie('name', 'tobi', { domain: '.example.com', path: '/admin', secure: true });
      res.send({"msg": "获取用户" + req.params.id + "信息成功"});
    } else { 
      res.send(Mock.mock(json));
    }
  }
}
```

## 项目快速配置
修改package.json中的scripts
```
"scripts": {
  "mock": "lmock start",
}
```
运行时执行 `npm run mock`

### TODO
fetch

jsonp


### License
[MIT](http://opensource.org/licenses/MIT)