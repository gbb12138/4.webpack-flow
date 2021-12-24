const path = require('path');
const baseDir = toUnixPath(process.cwd()); // 当前的工作目录 /Users/tal/project/study/webpack/4.flow/

function toUnixPath (filePath) {
    return filePath.replace(/\\/g, '/'); // 把所有的 \ 转化成 /
}

// Compilation相当于一次编译的过程
class Compilation{
    constructor(options) {
        // webpack.config.js中的options和shell命令中的参数合并后的options
        this.options = options;
        this.fileDependencies = []; // 编译依赖的文件
    }

    build (onCompiled) {
        // 根据配置中的entry找出入口文件
        let entry = {};
        // 兼容entry的值可能是字符串，或者是一个对象
        if (typeof this.options.entry === 'string') {
            entry.main = this.options.entry;
        } else {
            entry = this.options.entry;
        }
        // 配置中的entry路径是一个相对路径， 变成绝对路径
        for (let entryName in entry) {
            let entryPath = path.posix.join(baseDir, entry[entryName]);
            this.fileDependencies.push(entryPath);
        }
        // 错误对象，stats， 依赖的文件
        onCompiled(null, {}, this.fileDependencies);

    }
}

module.exports = Compilation;