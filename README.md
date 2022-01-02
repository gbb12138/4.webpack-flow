# webpack的工作流程
## 1
 初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象，执行debugger.js， node debugger.js --mode=production 
 ```
 [
     '/usr/local/bin/node',
     '/Users/tal/project/study/webpack/4.flow/debugger.js',
     '--mode=production' // 运行文件时传入的参数
   ]
 ```
## 2
 用上一步得到的参数初始化 Compiler 对象(主要进行赋值操作，options和Compiler的hooks)
## 3
加载所有配置的插件，执行插件的apply方法，并把Compiler的实例作为apply方法的参数
## 4
执行Compiler实例对象的 run 方法，触发编译钩子函数，开始执行编译（compile），创建compilation实例，执行compilation的编译（build）方法
##5
根据配置中的entry找出入口文件，获取入口文件的绝对路径
##6
遍历入口文件,加载入口文件源代码，拿到匹配入口文件的loader，从右向左调用Loader，将入口文件的源代码作为参数传入loader，得到loader处理过后的源代码，将源代码转为ast，解析ast节点，获取到入口文件依赖的文件，同时生成入口文件的module对象

```
id: moduleId, // ./src/entry1.js
dependencies: [{depModuleId, depModulePath}], // 入口文件依赖的模块对象
names: [name], // [entry1],
_source: code; // 将ast重新生成的代码
```

##7
遍历入口module对象的dependencies属性，找出该文件依赖的模块，再递归6步骤，得到依赖文件的module对象
```
module： 
{
    id: moduleId,  // ./title.js
    dependencies: [],  // 依赖的模块对象
    names: [entry1, entry2], // 当前文件被几个模块引入
}
```
直到所有入口依赖的文件都经过了6步骤的处理
##8
生成入口文件对应的chunk对象，得到所有入口文件的chunk列表（chunks），
```
chunk： 
{
    name: entryName, // 代码块的名字是入口的名字
    entryModule, // 入口模块(步骤6得到)的module对象
    modules: // 入口文件依赖的模块（步骤7得到）
}
```
##9
遍历chunks，生成对应的输出路径，生成所有输出资源的资源对象（assets）把每个 Chunk 转换成一个单独的文件加入到输出列表
```
assets: {
 './entry1.js': entry1模块，字符串类型的打包生成代码,
 './entry2.js': entry2模块，字符串类型的打包生成代码
}
```
##10
执行编译完成的回调函数onCompiled，得到参数中回传的资源，写入到文件系统，同时执行compiler的run方法的回调函数callback，监听打包涉及的所有文件fileDependencies，当其中文件改变时再次执行步骤4
```
onCompiled(err, stats, fileDependencies)
onCompiled(null, {
    module: this.modules, // 本次编译的全部模块
    chunks: this.chunks, // 所有输出路径对应的的chunk对象
    assets: this.assets, // 所有输出的资源
}, this.fileDependencies); // 所有文件的绝对路径的数组：['entry的绝对路径', 'title绝对路径', 'entry绝对路径', 'title绝对路径']
```
> 在以上过程中，Webpack 会在特定的时间点广播出特定的事件，插件在监听到感兴趣的事件后会执行特定的逻辑，并且插件可以调用 Webpack 提供的 API 改变 Webpack 的运行结果
  

