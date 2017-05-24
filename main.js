const process = require('process')
const Programmer = new(require('./programmer'))()

Programmer.onceConnected().then(() => {
    Programmer.version().then(() => {
        process.exit()
    }).catch(() => {
        process.exit()
    })
})

console._debug = 0
console.debug = (...args) => console._debug && console.log(...args)
