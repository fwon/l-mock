/*
  demo b: 用户可以自定义返回函数，采用express语法
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