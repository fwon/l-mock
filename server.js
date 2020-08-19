const fs = require('fs')
const path = require('path')
const express = require('express')
const chalk = require('chalk');
const cors = require('cors')
const Mock = require('mockjs')
const proxyMiddleware = require('http-proxy-middleware')
const proxyPostFix = require('coexist-parser-proxy');
const bodyParser = require('body-parser')
const multer = require('multer')
const dirTree = require('directory-tree')
const upload = multer() // for parsing multipart/form-data
const app = express()
const supportExtension = ['.js']

const finger = Math.round(Math.random() * 100000000).toString(16); // 进程指纹，用于区分服务是否重启
const args = process.argv.slice(2)
let mockDir = port = ui = null

if (args.length) {
  mockDir = args[0]
  port = args[1]
  ui = args[2]
} else {
  console.log('Please run [lmock start] in mock directory')
  return;
}

// 跨域请求
app.use(cors({
  origin: true, // Access-Control-Allow-Origin 为请求页面
  credentials: true,  // 运行上传cookie
  // preflightContinue: true // OPTIONS请求
}))
app.use(proxyPostFix) // bodyParser 会导致proxy的post失败
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

// 启动UI界面
if (ui === 'true') {
  // static
  app.use('/ui', express.static(path.join(__dirname, 'ui')));
  app.set('views', __dirname + '/ui');
  app.set('view engine', 'ejs');
  app.get('/ui', function(req, res) {
    res.render('index', {PORT: port});
  });

  // api
  app.get('/ui/directory', function(req, res) {
    const directory = dirTree(mockDir)
    res.send({dir: directory});
  });
  app.get('/ui/file', function(req, res) {
    const url = req.query.path
    const isUpdate = req.query.update
    if (url && fs.existsSync(url)) {
      const content = fs.readFileSync(url, 'utf8');
      // 更新内容删除文件缓存
      if (isUpdate) {
        delete require.cache[url];
        // 删除缓存后重新mock
        // mockFile(url);
      }
      let apiMap = {}
      try {
        apiMap = require(url)
      } catch(err) {
        console.log('getFile error:')
        console.log(err.stack.split('\n\n')[0])
        apiMap = {
          status: 500,
          msg: err.stack.split('\n\n')[0]
        }
      }
      res.send({content: content, api: apiMap, finger: finger});
    } else {
      res.send({status: 404})
    }
  });
  app.post('/ui/file', function(req, res) {
    const url = req.body.path;
    const value = req.body.value;
    if (url && fs.existsSync(url)) {
      fs.writeFile(url, value, (err) => {
        if (err) {
          res.send({status: 500});
          throw err
        };
        res.send({status: 200});
      });
    } else {
      res.send({status: 404})
    }
  });
  app.post('/ui/create', function (req, res) {
    const url = req.body.path;
    const type = req.body.type;
    
    if (url && fs.existsSync(url)) {
      res.send({status: 400, msg: type === 'file' ? '文件' : '目录' + '已存在'});
    } else {
      if (type === 'file') {
        const file = fs.readFileSync(path.resolve(__dirname, 'init/base.js'));
        fs.writeFile(url, file, (err) => {
          if (err) {
            res.send({status: 500});
            throw err
          };
          const directory = dirTree(mockDir);
          res.send({status: 200, dir: directory});
        });
      } else {
        fs.mkdir(url, { recursive: true }, (err) => {
          if (err) {
            res.send({status: 500});
            throw err;
          }
          const directory = dirTree(mockDir);
          res.send({status: 200, dir: directory});
        });
      }
    }
  });
}

function mockFile (filePath) {
  let mock = null
  // file format error
  try {
    mock = require(filePath)
  } catch(err) {
    console.log('mock file error')
    console.log(err)
    return
  }
  const dataType = mock.dataType
  const target = mock.product || mock.test
  let method = mock.method && mock.method.toLowerCase() || 'get'
  let callback = null

  if (dataType === 'jsonp') {
    method = 'get'
  }

  // 启动代理
  if (target) {
    console.log(`Api ${chalk.yellow(mock.url)} use proxy ${chalk.yellow(target)}`);
    callback = function(req, res, next) {
      const proxy = proxyMiddleware({
        target: target,
        headers: req.headers,
        changeOrigin: true
      });
      proxy(req, res, next)
    }
    
  // result 是自定义方法
  } else if (typeof mock.result === 'function') {
    callback = mock.result
  // result 是mock数据
  } else {
    callback = function (req, res) {
      let data = Mock.mock(mock.result)
      if (dataType === 'jsonp') {
        let jsonpCallbackName = req.query.callback || 'callback'
        res.send(jsonpCallbackName + '(' + JSON.stringify(data) + ')')
      } else {
        res.send(data)
      }
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
  console.log("Mocking Api on " + `${chalk.yellow(mockDir)}` + "\nAPI host is " + `${chalk.yellow("http://localhost:" + port)}`)
})