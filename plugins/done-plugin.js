class DonePlugin {
    apply (compiler) {
        compiler.hooks.done.tap('donePlugin', () => {
            console.log('done，编译结束');
        })
    }
}
module.exports = DonePlugin;
