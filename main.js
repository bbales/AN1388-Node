const process = require('process')
const Programmer = new(require('./programmer'))()

Programmer.onceConnected().then(() => {
    // Programmer.version().then(() => {
    //     process.exit()
    // }).catch(() => {
    //     process.exit()
    // })

    Programmer.on('uploadProgress', e => {
        // console.log(e.percent)
    })

    Programmer.upload().then(() => {
        console.log('Upload Complete')
        Programmer.run()
        process.exit()
    }).catch(e => {
        console.log('Upload Failure')
        process.exit()
    })
})

console._debug = 1
console.debug = (...args) => console._debug && console.log(...args)
