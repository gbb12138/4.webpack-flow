const path = require('path');
console.log(path.join('a', 'b')); // a/b || a\b 不同操作系统，/\
console.log(path.posix.join('a', 'b')); // a/b  都是/