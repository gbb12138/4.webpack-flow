const {SyncHook} = require('tapable');
const Compilation = require('./Compilation');
const fs = require('fs');
/**
 * 编译对象，负责整个编译的过程，里面会保存所有编译的信息
 * Compiler类时实例时全局唯一的
 */
class Compiler {
    constructor(options) {
        this.options = options;
        // 存的时当前的Compiler的所有钩子
        this.hooks = {
            run: new SyncHook(), // 开始编译的时候触发
            done: new SyncHook() // 编译完成的时候触发
        }
    }

    run(callback) {
        // 开始编译钩子函数
        this.hooks.run.call(); // 执行run钩子的回调函数
        // 5. 根据配置中的entry找出入口文件
        function onCompiled (err, stats, fileDependencies) {
            console.log('onCompiled');
            // 遍历依赖的文件，监听文件，当文件变化时，重新执行compile
            fileDependencies.forEach(file => {
                fs.watch(file, () => this.compile(onCompiled));
            })
        }
        this.compile(onCompiled);

        // 结束编译钩子函数
        this.hooks.done.call(); // 执行run钩子的回调函数
    }

    compile (onCompiled) {
        // 以后每次开启一次新的编译，都会创建一个新的Compilation类的实例
        let compilation = new Compilation(this.options);
        compilation.build(onCompiled);
    }
}

module.exports = Compiler;
