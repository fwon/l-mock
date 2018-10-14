/*
  启动Mock服务
 */

const path = require('path')
const nodemon = require('nodemon')

function start (mockDir, port) {
  const entry = path.join(__dirname, '../index.js')
  const options = {
    script: entry,
    restartable: 're',
    watch: [
      entry,
      mockDir
    ],
    args: [`${mockDir}`, `${port}`],
    verbose: true
  }

  nodemon(options).on('start', function () {
    console.log('Just-Mock Started!')
  }).on('quit', function () {
    console.log('Just-Mock Quit!')
    process.exit()
  })
}

module.exports = start