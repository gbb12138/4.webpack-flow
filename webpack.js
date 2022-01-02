const Compiler = require('./Compiler');
function webpack(options) {
    // 1. 初始化参数：从配置文件和 Shell 语句中读取并合并参数,得出最终的配置对象
    console.log(process.argv); // 获取Shell 语句的参数
    // process.argv = [
    //     '/usr/local/bin/node',
    //     '/Users/tal/project/study/webpack/4.flow/debugger.js',
    //     '--mode=production' // 运行文件时传入的参数
    // ]
    // ['--mode=production']
    let argv = process.argv.splice(2); // 前两个时运行文件的路径， 之后时传入的shell参数
    let shellOptions = argv.reduce((shellOptions, option) => {
        let [key, value] = option.split('=');
        shellOptions[key.slice(2)] = value; // 去掉--
        return shellOptions;
    }, {})
    let finalOptions = {...options, ...shellOptions}
    // 2. 用上一步得到的参数初始化 Compiler 对象
    let compiler = new Compiler(finalOptions);
    // 3. 加载所有配置的插件
    finalOptions.plugins.forEach(plugin => plugin.apply(compiler));
    return compiler;
}

module.exports = webpack;
