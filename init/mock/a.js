/*
  demo a: 返回简单的json数据，变量语法可参考 http://mockjs.com/examples.html
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