# l-mock

## 安装
`npm i l-mock -g`
## Quick Start

### 第一步：
定位到项目目录

`cd path/to/project`

### 第二步：
初始化:

`lmock init`

> `init`  命令会在项目根目录下创建默认文件夹mock，通过`--dir`参数可指定目录名
### 第三步：
定位到mock目录

`cd mock` 

运行mock服务

`lmock start`
> 默认监听3000端口，可通过`--port`配置端口，支持多项目同时mock

## 项目快速配置
修改package.json中的scripts
`
"scripts": {
  "mock": "lmock start",
}
`
运行时执行 `npm run mock`

## 使用说明
### 1. 文件格式
### TODO
fetch

jsonp
