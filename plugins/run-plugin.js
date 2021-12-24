// 插件就是一个类，含有apply方法

class RunPlugin{
    // 应用这个插件，参数是Compiler实例
    apply(compiler) {
        // 给compiler的run钩子函数注册回调函数
        compiler.hooks.run.tap('RunPlugin', () => {
            console.log('run 开始编译')
        })
    }
}
module.exports = RunPlugin;
