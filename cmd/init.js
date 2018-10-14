/*
  初始化mock目录
 */

const fs = require('fs')
const path = require('path')
const ora = require('ora')

function copyFileSync( source, target ) {
  var targetFile = target;

  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source))
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source))
}

function copyFolderRecursiveSync( source, target ) {
  var files = []

  if ( !fs.existsSync(target)) {
    fs.mkdirSync(target)
  }

  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source)
    files.forEach(function (file) {
      var curSource = path.join(source, file)
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, target)
      } else {
        copyFileSync(curSource, target)
      }
    })
  }
}

function init (mockDir, dir) {
  const target = path.join(mockDir, dir)
  const source = path.resolve(__dirname, '../init/mock')
  const spinner = ora('Initializing Mock Data...').start();
  if (fs.existsSync(target)) {
    spinner.text = `Folder /${dir} existed, Please use another folder name!`
    spinner.fail()
    return
  }
  copyFolderRecursiveSync(source, target)
  spinner.text = 'Mock Data initial succeed!'
  spinner.succeed()
}

module.exports = init