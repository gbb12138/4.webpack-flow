# webpack的工作流程
1. 初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象
- 执行debugger.js， node debugger.js --mode=production

```[
    '/usr/local/bin/node',
    '/Users/tal/project/study/webpack/4.flow/debugger.js',
    '--mode=production' // 运行文件时传入的参数
  ]
  ```

2. 用上一步得到的参数初始化 Compiler 对象
3. 加载所有配置的插件
4. 执行对象的 run 方法开始执行编译
5. 根据配置中的entry找出入口文件
6. 从入口文件出发,调用所有配置的Loader对模块进行编译
7. 再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理
8. 根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
9. 再把每个 Chunk 转换成一个单独的文件加入到输出列表
10. 在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统
> 在以上过程中，Webpack 会在特定的时间点广播出特定的事件，插件在监听到感兴趣的事件后会执行特定的逻辑，并且插件可以调用 Webpack 提供的 API 改变 Webpack 的运行结果
  

