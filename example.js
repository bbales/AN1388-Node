const process = require('process')
const Programmer = new(require('./programmer'))(115200)

Programmer.onceConnected()
    .then(() => {
        // Enable verbose execution
        Programmer.debugEnable()

        Programmer.identifier().then((r) => {
            console.log(r)
        })
    })
    .catch((e) => {})
