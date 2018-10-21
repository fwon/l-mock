#!/usr/bin/env node

const info = require('../package.json')
const chalk = require('chalk')
const cmdStart = require('../cmd/start')
const cmdAdd = require('../cmd/add')
const cmdInit = require('../cmd/init')
const mockDir = process.cwd()
const COMMANDS = [
  ['lmock --help|-h', '[List all commands]'],
  ['lmock --version|-v', '[lmock version]'],
  ['lmock init (--dir)', '[Init mock data directory and demo use case, --name is optional]'],
  ['lmock start (--port)', '[Start mock server, Please run in the mock data directory. --port is optional]']
]

const runCommand = (commands, options = []) => {
  const command = commands[0]
  const args = commands.join('|');
  if (command === '--help' || command === '-h') {
    console.log('*******************Local-Mock Commands*******************')
    COMMANDS.forEach(item => console.log(`${chalk.blue.bold(item[0])} ${item[1]}`))
    process.exit(0)
  }

  if (command === '--version' || command === '-v') {
    console.log(info.version);
    process.exit(0)
  } 

  if (command) {
    switch (command) {
      case 'init':
        const dir = /\-\-dir\|([^ ]+?)(?:\||$)/.test(args) ? RegExp.$1 : 'mock';
        cmdInit(mockDir, dir)
        break;
      // case 'add':
      //   cmdAdd(mockDir)
      //   break;
      case 'start':
        const port = /\-\-port\|(\d+)(?:\||$)/.test(args) ? ~~RegExp.$1 : 3000;
        cmdStart(mockDir, port)
        break;
      default:
        console.log(`Command ${command} not found, Please check local-mock --help`)
        break;
    }
  } else {
    console.log('Command parameters needed！Run [lmock --help] to get help')
    process.exitCode = 1
  }
}

// 获取命令的参数
const args = process.argv.slice(2)

if (args.length) {
  runCommand(args)
} else {
  console.log('Missing command parameters！Run help to get help')
  process.exitCode = 1
}