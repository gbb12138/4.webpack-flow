const path = require('path');
let baseDir = process.cwd(); // 当前工作目录
console.log(baseDir, __filename,111);
let moduleId = path.relative(baseDir, __filename);
console.log(moduleId, 222);