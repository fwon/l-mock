const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const Mock = require('mockjs')
const proxyMiddleware = require('http-proxy-middleware')
const bodyParser = require('body-parser')
const multer = require('multer')
const upload = multer() // for parsing multipart/form-data
const app = express()
const supportExtension = ['.js']

const args = process.argv.slice(2)
let mockDir = port = null

if (args.length) {
  mockDir = args[0]
  port = args[1]
} else {
  console.log('Please run [lmock start] in mock directory')
  return;
}

app.use(cors())
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
  res.Mock = Mock
  res.require = (jsonPath) => {
    const absoluteJsonPath = path.resolve(mockDir, jsonPath)
    return require(absoluteJsonPath)
  }
  next()
})

function mockFile (filePath) {
  const mock = require(filePath)
  const method = mock.method.toLocaleLowerCase()
  const target = mock.product || mock.test
  let callback = null

  // 启动代理
  if (target) {
    callback = proxyMiddleware({
      target: target, 
      changeOrigin: true
    })
  // result 是自定义方法
  } else if (typeof mock.result === 'function') {
    callback = mock.result
  // result 是mock数据
  } else {
    callback = function (req, res) {
      let data = Mock.mock(mock.result)
      res.send(data)
    }
  }

  if (method === 'post' && mock.contentType === 'multipart/form-data') {
    app[method](mock.url, upload.array(), callback);
  } else {
    app[method](mock.url, callback);
  }
}

(function mockDir (dir) {
  fs.readdir(dir, function (err, files) {
    if (err) throw err
    files.forEach( function (file) {
      let filePath = path.resolve(dir, file)
      fs.stat(filePath, function (err, stats) {
        if (err) throw err
        if (stats.isFile() && supportExtension.indexOf(path.extname(file)) > -1) {
          mockFile(filePath)
        } else if (stats.isDirectory()) {
          mockDir(filePath)
        }
      })
    })
  })
})(mockDir)

app.listen(port, function () {
  console.log(`Mocking data on ${mockDir}, Server port ${port}`)
})