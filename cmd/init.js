/*
  初始化mock目录
 */

const fs = require('fs-extra')
const path = require('path')
const ora = require('ora')

function init (mockDir, dir) {
  const target = path.join(mockDir, dir)
  const source = path.resolve(__dirname, '../init/mock')
  const spinner = ora('Initializing Mock Data...').start();
  if (fs.existsSync(target)) {
    spinner.text = `Folder /${dir} existed, Please use another folder name!`
    spinner.fail()
    return
  }
  try {
    fs.copySync(source, target)
    spinner.text = 'Mock Data initial succeed!'
    spinner.succeed()
  } catch (err) {
    spinner.text = err
    spinner.fail()
  }
}

module.exports = init