/*
  demo d: Model 的使用
 */

module.exports = {
  url: '/d',
  method: 'get',
  result: function (req, res) {
    const Mock = res.Mock
    const User = res.require("model/user");
    const json = {
      'status': "ok",
      'data': {
        user: User
      }
    }
    res.send(Mock.mock(json));
  }
}