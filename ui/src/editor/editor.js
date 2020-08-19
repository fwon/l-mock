(function() {

  let global_file_finger = null;

  // 获取目录结构
  function getDirectory() {
    return $.ajax({
      url: 'http://localhost:' + __PORT__ + '/ui/directory',
      method: 'GET'
    })
  }

  // 获取文件内容
  function getFile(path, isUpdate) {
    return $.ajax({
      url: 'http://localhost:' + __PORT__ + '/ui/file',
      method: 'GET',
      data: {
        path: path,
        update: isUpdate
      },
      error: res => {
        console.log('after getFile')
        console.log(res)
      }
    })
  }

  function createFile(path, type) {
    return $.ajax({
      url: 'http://localhost:' + __PORT__ + '/ui/create',
      method: 'POST',
      data: {
        path: path,
        type: type
      },
      error: res => {
        console.log('after create')
        console.log(res)
      }
    })
  }

  // 更新文件内容
  function postChange(path, value) {
    return $.ajax({
      url: 'http://localhost:' + __PORT__ + '/ui/file',
      method: 'POST',
      data: {
        path: path,
        value: value
      }
    })
  }

  // 获取API结果
  function getResult(url, method, params, headers) {
    return $.ajax({
      url: 'http://localhost:' + __PORT__ + url,
      method: method,
      headers: headers,
      data: params
    })
  }

  Vue.use(window.VueCodemirror);

  var demo = new Vue({
    el: "#lm_container",
    data: {
      // v-tree
      tree: [],
      openFolder: ['mock'],
      files: {
        file: 'mdi-file-document-outline',
        folder: 'mdi-folder',
        html: 'mdi-language-html5',
        js: 'mdi-nodejs',
        json: 'mdi-code-json',
        md: 'mdi-markdown',
        pdf: 'mdi-file-pdf',
        png: 'mdi-file-image',
        txt: 'mdi-file-document-outline',
        xls: 'mdi-file-excel',
      },
      treeData: [],
      // editor
      apiMap: {},
      code: "",
      baseCode: "", // 用于对比
      jsonCode: '',
      // tag
      currentEditFolder: null, // 当前编辑的文件夹
      currentEditName: '', // 当前正在编辑的文件/文件夹名
      currentEditing: false, // 当前有正在新建的文件/文件夹
      currentPath: '', // 当前选中的文件/文件夹
      hasChanged: false,
      loadingResult: 0,
      showAlert: false,
      showAlertText: '',
      showAlertType: 'warning',
      showAlertIcon: {
        warning: 'mdi-alert-circle-outline',
        success: 'mdi-check-circle',
        error: 'mdi-alert',
        info: 'mdi-information'
      },
  
      // codemirror options
      cmOption: {
        mode:  "javascript",
        lineNumbers: true,
        theme: "dracula",
        autoCloseBrackets: true,
        matchBrackets: true, // 括号高亮
        showCursorWhenSelecting: true,
        tabSize: 2,
        autofocus: true,
        indentWithTabs: true,
        smartIndent: true, // 自动缩进
        styleActiveLine: true, // 当前行高亮
        scrollbarStyle: "simple",
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
        lint: true,
        foldOptions: {
          widget: this.foldWidget
        },
        keyMap: 'sublime'
        // extraKeys: {
        //  "Cmd-S": (instance) => { 
        //    console.log('save file');
        //    this.postChange()
        //  }
        // }
        // extraKeys: {"'@'": "autocomplete"} // 自动填充关键字
      },
      cmResultOption: {
        readOnly: true,
        mode: {name: "javascript", json: true},
        lineNumbers: true,
        lineWrapping: true,
        extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        foldOptions: {
          widget: this.foldWidget
        }
      },

      // 请求设置弹窗
      dialog: false,
      requestForm: {
        method: '',
        url: '',
        headers: [{
          param: '',
          value: ''
        }],
        params: []
      },
      formLabelWidth: '80px',
      showRawInput: false,
      rawRequestBody: ''
    },
    computed: {
      cm() {
        return this.$refs.cm.codemirror;
      },
      res_cm() {
        return this.$refs.res_cm.codemirror;
      }
    },
    created() {
      getDirectory().done(res => {
        this.treeData = [res.dir];
      })
    },
    mounted() {
      this.cm.setSize("100%", "100%")
      this.res_cm.setSize("100%", "100%")
      // show hint
      this.cm.setOption('extraKeys', {
        "'@'": () => {
          this.snippet();
        }
      })
      if (this.jsonCode) {
        this.res_cm.foldCode(CodeMirror.Pos(5, 0));
      }
      this.initCommands();
      this.initResize();
    },
    methods: {
      sendRequest() {
        const form = this.requestForm;
        const headers = {};
        let params = {};
        form.headers.forEach(item => {
          if (item.param) {
            headers[item.param] = item.value;
          }
        })
        if (this.showRawInput) {
          params = this.rawRequestBody;
        } else {
          form.params.forEach(item => {
            if (item.param) {
              params[item.param] = item.value
            }
          })
        }
        getResult(form.url, form.method, params, headers).done(res => {
          this.jsonCode = JSON.stringify(res, null, "\t");
        }).catch(res => {
          const result = res.responseJSON || res.responseText;
          this.jsonCode = JSON.stringify(result, null, "\t");
        });
      },
      addHeaderItem() {
        this.requestForm.headers.push({
          param: '',
          value: ''
        })
      },
      deleteHeaderItem(index) {
        this.requestForm.headers.splice(index, 1);
      },
      addParamItem() {
        this.requestForm.params.push({
          param: '',
          value: ''
        })
      },
      deleteParamItem(index) {
        this.requestForm.params.splice(index, 1);
      },
      showDialog() {
        this.dialog = true;
      },
      // resetCurrentEditFile(e, item) {
      //   if (e.currentTarget && e.currentTarget.value) {
      //     const name = e.currentTarget.value;
      //     item.name = name;
      //     createFile(item.path + '/' + name, item.type).done(res => {
      //       this.treeData = [res.dir];
      //     })
      //   }
      //   this.currentEditFolder = null;
      // },
      filterTree(value, data) {
        return !!data.name
      },
      setCurrentEditFolder(item) {
        if (item.type === 'directory') {
          this.currentEditFolder = item.path;
        } else {
          this.currentEditFolder = null;
        }
      },
      validataFileName(name, type) {
        if (type === 'file') {
          if (name.substr(-3) !== '.js' && name.substr(-5) !== '.json') {
            this.$message({
              message: '文件格式必须为 .js 或 .json',
              type: 'warning'
            });
            return false
          }
        }
        return true
      },
      blurEditName(node, data) {
        const parent = node.parent;
        const children = parent.data.children || parent.data;
        // const index = children.findIndex(d => d.id === data.id);
        // children.splice(index, 1);
        
        if (!this.currentEditName) {
          this.currentEditing = false;
          children.splice(0, 1);
        } else {
          if (!this.validataFileName(this.currentEditName, data.type)) return;
          createFile(data.path + '/' + this.currentEditName, data.type).done(res => {
            if (res.status === 200) {
              this.currentEditing = false;
              children.splice(0, 1);
              if (data.type === 'file') {
                children.unshift({
                  extension: '.file',
                  path: data.path + '/' + this.currentEditName,
                  name: this.currentEditName,
                  type: 'file'
                });
              } else {
                children.unshift({
                  extension: '.folder',
                  path: data.path + '/' + this.currentEditName,
                  name: this.currentEditName,
                  type: 'directory',
                  children: []
                });
              }
            } else {
              this.currentEditName = '';
              this.$message({
                message: res.msg,
                type: 'warning'
              });
            }
          })
        }
        // this.$refs.rf_folder.filter();
      },
      startProgress() {
        this.loadingResult = 0;
        this.progress_interval = setInterval(() => {
          if (this.loadingResult < 99) {
            this.loadingResult += 10;
          }
        }, 100)
      },
      stopProgress() {
        clearInterval(this.progress_interval);
        this.loadingResult = 100;
        const to = setTimeout(() => {
          clearTimeout(to);
          this.loadingResult = 0;
        }, 300);
      },
      createFile(node, item) {
        if (this.currentEditing) return;
        this.currentEditing = true;
        item.children.unshift({
          extension: '.file',
          path: item.path,
          type: 'file'
        });
      },
      createFolder(node, item) {
        if (this.currentEditing) return;
        this.currentEditing = true;
        item.children.unshift({
          extension: '.folder',
          path: item.path,
          type: '"directory"'
        });
      },
      openFile(item, node, e) {
        const path = item.path;
        if (item.type === 'directory') return;
        if (!path || path === this.currentPath) return;
        if (path !== this.currentPath) {
          if (this.hasChanged) {
            // e.$el.preventDefault()
            this.$message({
              message: '请先保存 ' + this.currentPath.split('/').pop(),
              type: 'warning'
            })
            return;
          }
        }
        this.loadingResult = 0;
        getFile(path).done(res => {
          global_file_finger = res.finger;
          // 初始化代码
          res.initialCode = true;
          if (res.content) {
            this.baseCode = res.content;
            this.updateCode(res);
            this.currentPath = path;
          }
        })
      },
      initCommands() {
        document.onkeydown = e => {
          var currKey = 0, e = e || event || window.event;
          currKey = e.keyCode || e.which || e.charCode;
          if(currKey == 83 && (e.ctrlKey || e.metaKey)){
            e.preventDefault();
            this.hasChanged = false;
            this.postChange();
            return false;
          }
        }
      },
      initResize() {
        const drawer = document.getElementById("el-drawer__wrapper");
        const folder = document.getElementById("lm_editor_folder");
        const resize1 = document.getElementById("lm_editor_resize1");
        const resize2 = document.getElementById("lm_editor_resize2");
        const left = document.getElementById("lm_editor");
        const right = document.getElementById("lm_editor_result");
        const box = document.getElementById("lm_container");
        resize1.onmousedown = function(e) {
          const resizeWidth = resize1.offsetWidth;
          const foldWidth = folder.offsetWidth;
          const boxWidth = folder.offsetWidth + left.offsetWidth + resizeWidth;
          const startX = e.clientX;
          resize1.left = resize1.offsetLeft;
          document.onmousemove = function(e){
            var endX = e.clientX;
            var moveLen = resize1.left + (endX - startX);
            var maxT = boxWidth - resizeWidth;
            if(moveLen < 0) moveLen = 0;
            if(moveLen > maxT - 300) moveLen = maxT - 300;
      
            resize1.style.left = moveLen + "px";
            folder.style.width = moveLen + "px";
            left.style.width = (boxWidth - moveLen - 4) + "px";
            drawer.style.left = (moveLen + 3) + "px";
            drawer.style.width = left.style.width;
          }
          document.onmouseup = function(evt){
            document.onmousemove = null;
            document.onmouseup = null; 
            resize1.releaseCapture && resize1.releaseCapture();
          }
          resize1.setCapture && resize1.setCapture();
          return false;
        }
        resize2.onmousedown = function(e) {
          const resizeWidth = resize2.offsetWidth;
          const foldWidth = folder.offsetWidth;
          const boxWidth = box.clientWidth - foldWidth;
          const startX = e.clientX;
          resize2.left = resize2.offsetLeft;
          document.onmousemove = function(e){
            var endX = e.clientX;
            var moveLen = resize2.left - foldWidth + (endX - startX);
            var maxT = boxWidth - resizeWidth;
            if(moveLen < 300) moveLen = 300; 
            if(moveLen > maxT - 300) moveLen = maxT - 300;
      
            resize2.style.left = moveLen + "px";
            left.style.width = moveLen + "px";
            drawer.style.width = left.style.width;
            right.style.width = (boxWidth - moveLen - 4) + "px";
          }
          document.onmouseup = function(evt){
            document.onmousemove = null;
            document.onmouseup = null; 
            resize2.releaseCapture && resize2.releaseCapture();
          }
          resize2.setCapture && resize2.setCapture();
          return false;
        }
      },
      snippet() {
        CodeMirror.showHint(this.cm, () => {
          const cursor = this.cm.getCursor()
          const token = this.cm.getTokenAt(cursor)
          const start = token.start
          const end = cursor.ch
          const line = cursor.line
          const currentWord = token.string
    
          const list = global_snippets.filter((item) => {
            return item.text.indexOf(currentWord) >= 0
          })
    
          return {
            list: list.length ? list : global_snippets,
            from: CodeMirror.Pos(line, start),
            to: CodeMirror.Pos(line, end)
          }
        }, { completeSingle: false })
      },
      onCmBlur() {
      },
      onCmFocus() {
      },
      onCmReady() {},
      onChange(instance, changes) {
        if (this.initialCode) {
          this.initialCode = false;
          return;
        }
        if(instance.getValue() !== this.baseCode) {
          this.hasChanged = true;
        } else {
          this.hasChanged = false;
        }
        // 区分是选中文件还是修改文件
        
        // clearTimeout(input_timeout);
        // input_timeout = setTimeout(() => {
        //   this.postChange()
        // }, 500)
      },
      postChange() {
        this.startProgress();
        this.jsonCode = '';
        const value = this.cm.getValue();
        postChange(this.currentPath, value).done(res => {
          if (res.status === 200) {
            this.$message({
              message: '保存成功',
              type: 'success'
            });
            this.loopToUpdateResult();
          }
        });
      },
      loopToUpdateResult() {
        getFile(this.currentPath, true).done(res => {
          if (res.finger !== global_file_finger) {
            this.stopProgress();
            global_file_finger = res.finger;
            if (res.content) {
              this.updateCode(res);
            } else {
              this.jsonCode = '格式错误';
            }
          } else {
            const to = setTimeout(() => {
              clearTimeout(to);
              this.loopToUpdateResult()
            }, 1000);
          }
        })
      },
      updateCode(res) {
        this.initialCode = res.initialCode;
        this.code = res.content;
        this.apiMap = res.api;
        const url = this.apiMap.url;
        if (this.apiMap.status === 500) {
          this.jsonCode = this.apiMap.msg
        } else {
          if (!url) {
            this.jsonCode = "{error: '文件格式错误'}"
          // url 是正则表达式
          } else if (url.fast_slash === false && url.fast_star === false || typeof url !== 'string') {
            this.apiMap.url = ''
            this.initialRequestForm(this.apiMap);
            this.jsonCode = "{error: '请在设置面板中根据正则表达式配置URL'}"
          // url 中有动态参数
          } else if (url.indexOf(':') > -1) {
            const params = [];
            const rex = /(:[^\/]+)/g;
            while ((m = rex.exec(url))) {
              params.push(m[1]);
            }
            this.initialRequestForm(this.apiMap);
            this.jsonCode = "{error: '请在设置面板中修改URL中的动态参数'" + params.join() + "}"
          } else {
            getResult(this.apiMap.url, this.apiMap.method).done(res => {
              this.initialRequestForm(this.apiMap);
              this.jsonCode = JSON.stringify(res, null, "\t");
            });
          }
        }
      },
      initialRequestForm(api) {
        const url = api.url;
        const method = api.method && api.method.toUpperCase();
        this.requestForm = {
          method: method,
          url: url,
          headers: [{
            param: api.contentType ? 'Content-Type': '',
            value: api.contentType || ''
          }],
          params: method === 'GET' ? [] : [{
            param: '',
            value: ''
          }]
        }
      },
      updateCurrentPath(path) {
        this.currentPath = path;
      },
      foldWidget(from, to) {
        var count = undefined;

        // Get open / close token
        var startToken = '{', endToken = '}';        
        var prevLine = this.res_cm.getLine(from.line);
        if (prevLine.lastIndexOf('[') > prevLine.lastIndexOf('{')) {
          startToken = '[', endToken = ']';
        }

        // Get json content
        var internal = this.res_cm.getRange(from, to);
        var toParse = startToken + internal + endToken;

        // Get key count
        try {
          var parsed = JSON.parse(toParse);
          count = Object.keys(parsed).length;
        } catch(e) { }        

        return count ? `\u21A4${count}\u21A6` : '\u2194';
      }
    }
  });
})()