// let { SyncHook } = require('tapable');
class SyncHook {
    constructor(args) {
        this.args = args;
        this.taps = [];
    }
    tap(name, fn) {
        this.taps.push(fn);
    }
    call (...args) {
        this.taps.forEach(fn => fn(...args));
    }
}
let syncHook = new SyncHook(['name', 'age']); // 回调函数需要接受两个参数
syncHook.tap('监听器的名字', (name, age) => {  // 注册回调函数
    console.log(name, age);
});
syncHook.call('zf', 10);  // 调用回调