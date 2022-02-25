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