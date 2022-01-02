const path = require('path');
const {SyncHook} = require('tapable');
const baseDir = toUnixPath(process.cwd()); // 当前的工作目录 /Users/tal/project/study/webpack/4.flow/
const fs = require('fs');
const parser = require('@babel/parser'); // 生成ast
const traverse = require('@babel/traverse').default; // 遍历ast, 通过es module导出的才有default
const generator = require('@babel/generator').default; // 重新生成ast
const types = require('@babel/types'); // 生成某种类型的节点，或判断节点的类型


function toUnixPath (filePath) {
    return filePath.replace(/\\/g, '/'); // 把所有的 \ 转化成 /
}

// Compilation相当于一次编译的过程
class Compilation{
    constructor(options) {
        // webpack.config.js中的options和shell命令中的参数合并后的options
        this.options = options;
        this.modules = []; // 存放本次编译所有的模块
        this.fileDependencies = []; // 编译入口文件以及依赖的所有文件
        this.chunks = []; // 放所有的代码块
        this.assets = {}; // 存放每个出口的打包后生成的代码
        this.hooks = {
            chunkAsset: new SyncHook(["chunk", "filename"])
        }
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
            //6.从入口文件出发,调用所有配置的Loader对模块进行编译
            let entryModule = this.buildModule(entryName, entryPath);
            console.log(entryModule, '编译后的模块');
            console.log(this.modules, '所有的模块');
            // 8. 根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
            let chunk = {
                name: entryName, // 代码块的名字是入口的名字
                entryModule, // 入口模块
                modules: this.modules.filter(module => module.names.includes(entryName)), //依赖的模块
            }
            this.chunks.push(chunk);
            // 9. 再把每个 Chunk 转换成一个单独的文件加入到输出列表
            this.chunks.forEach(chunk => {
                let filename = this.options.output.filename.replace('[name]', chunk.name);
                this.hooks.chunkAsset.call(chunk, filename);
                this.assets[filename] = getSource(chunk);
            })
        }
        // 错误对象，stats， 依赖的文件
        onCompiled(null, {
            module: this.modules,
            chunks: this.chunks,
            assets: this.assets,
        }, this.fileDependencies);
    }
/**
 * 编译模块， 返回编译过的模块
 * 从入口文件出发,调用所有配置的Loader对模块进行编译
 * @param name  模块名称
 * @param modulePath 模块绝对路径
 */
    buildModule (name, modulePath) {
        // 拿到入口文件的源代码
        let sourceCode = fs.readFileSync(modulePath, 'utf8');
        // 拿到所有的loader
        let { rules } = this.options.module;
        let loaders = []; // 能够匹配当前文件的loader地址
        // 拿到匹配得上当前文件的loader
        rules.forEach(rule => {
            if (modulePath.match(rule.test)) {
                // use可以是数组，对象, push可以同时加入多个数据
                loaders.push(...rule.use);
            }
        });
        // 拿到loader编译后的源代码
        sourceCode = loaders.reduceRight((sourceCode, loader) => {
            // 拿到loader函数，执行
            return require(loader)(sourceCode);
        }, sourceCode);

        // 7.找出当前模块依赖的模块，再递归本步骤（buildModule）直到所有入口依赖的文件都经过了本步骤的处理

        // 去编译依赖的模块
        // 得到ast
        let ast = parser.parse(sourceCode, {sourceType: 'module'});
        // moduleId = ./src/entry1.js， 相对于项目根目录的路径
        let moduleId = "./" + path.relative(baseDir, modulePath);
        // 模块对象
        let module = {
            id: moduleId,
            dependencies: [],  // 依赖的模块对象
            names: [name], // 当前模块被几个模块引入
        }
        // 编译ast节点
        traverse(ast, {
            // 拦截type == CallExpression的节点
            CallExpression:({ node }) => {
                // 是require
                if(node.callee.name === 'require') {
                    let depModuleName = node.arguments[0].value; // 相对于当前模块的相对路径./title
                    let dirname = path.dirname(modulePath); // 当前模块所在的文件夹的绝对路径 /Users/tal/project/study/webpack/4.flow/src/
                    let depModulePath = path.join(dirname, depModuleName);///Users/tal/project/study/webpack/4.flow/src/title 没有后缀名
                    let extensions = this.options.resolve.extensions;
                    depModulePath = tryExtensions(depModulePath, extensions); // 需要拼上后缀名
                    // 加入依赖的模块的绝对路径，当文件变化了，会重新启动编译，创建一个新的compilation
                    this.fileDependencies.push(depModulePath);
                    // 获取当前模块依赖的模块的模块Id(相对路径)
                    let depModuleId = './' + path.relative(baseDir, depModulePath);
                    // 修改ast， 将require('./title') => ./title修改成 ./title.js
                    node.arguments = [types.stringLiteral(depModuleId)];
                    module.dependencies.push({depModuleId, depModulePath});
                }
            }
        });

        let { code } = generator(ast);// 重新生成文件
        module._source = code;
        module.dependencies.forEach(({depModuleId, depModulePath}) => {
            let buildModule = this.modules.find(module => module.id === depModuleId)
            if (buildModule) {
                // title这个模块module.names = [entry1, entry2]
                buildModule.names.push(name)
            } else {
                // 递归依赖的模块，编译依赖的模块
                let depModule = this.buildModule(name, depModulePath);
                this.modules.push(depModule);
            }
        });
        return module;
    }
}

/**
 * 给文件添加后缀名，查询文件是否存在
 * @param modulePath
 * @param extensions
 * @returns {*}
 */
function tryExtensions (modulePath, extensions) {
    if (fs.existsSync(modulePath)) {
        return modulePath
    }
    for(let i = 0; i < extensions.length; i++) {
        let filePath = modulePath + extensions[i];
        // 拼上后缀名，看文件是否存在
        if(fs.existsSync(filePath)) {
            return filePath;
        }
    }
    throw new Error(`找不到${modulePath}`);
}

/**
 * 打包后的代码
 * @param chunk
 * @returns {string}
 */
function getSource (chunk) {
    console.log(chunk, 99999)
    return `
   (() => {
    var modules = {
      ${chunk.modules.map(
        (module) => `
        "${module.id}": (module) => {
          ${module._source}
        },
      `
    )}  
    };
    var cache = {};
    function require(moduleId) {
      var cachedModule = cache[moduleId];
      if (cachedModule !== undefined) {
        return cachedModule.exports;
      }
      var module = (cache[moduleId] = {
        exports: {},
      });
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    var exports ={};
    ${chunk.entryModule._source}
  })();
   `;
}

module.exports = Compilation;
