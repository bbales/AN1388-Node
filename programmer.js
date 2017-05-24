'use strict'

const Serial = require('serialport')
const EventEmitter = require('events').EventEmitter;

module.exports = class Programmer extends EventEmitter {
    constructor(baudRate = 115200) {
        super()

        this.CRCLookup = [
            0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
            0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1c1, 0xf1ef
        ]

        // Debug level
        this.debug = 1

        // Set serial baud rate
        this.baudRate = baudRate

        // Open the USB port
        this._configurePort().then(() => console.debug((`Port '${this._port}' opened sucessfully!`)))
    }

    async _configurePort(port = '/dev/ttyUSB0') {
        // Fetch available USB ports
        let usbPorts = await new Promise((resolve, reject) => {
            return Serial.list((e, p) => {
                if (e) return reject(e)
                return resolve(p.filter(n => n.comName.indexOf('USB') > -1))
            })
        })

        // Set instance port
        this._port = usbPorts[0].comName

        // Set up UART
        const serialOptions = {
            baudRate: this.baudRate
        }

        // Open first available (for now)
        this.port = new Serial(this._port, serialOptions)

        this.responseData = []

        // Read data when it is received
        this.port.on('data', data => this._handleData(data))

        return true
    }

    get connected() {
        return !!this.port && this.port.isOpen()
    }

    _handleData(data) {
        // Clear response timeout
        clearTimeout(this.responseTimeout)

        // Create a new array for buffer conversion
        var output = []

        // Fill array with contents of buffer and convert to unicode
        for (var i = 0; i < data.length; i++) output.push(String.fromCharCode(data[i]))

        // Check sequence characters
        if (output[0] !== '\x01' || output[output.length - 1] !== '\x04') throw ('Bad response')

        // Unescape control characters and strip front and back
        let response = this.unescape(output.slice(1, -1)).split('')

        // Set the last response
        this.lastResponse = response.slice(1, -2)

        // Emit new processed data event
        this.emit('newData', this.lastResponse)
    }

    onceConnected() {
        return new Promise((resolve, reject) => {
            let f;
            (f = () => {
                if (this.connected) return resolve()
                else if (this.stopped) return reject()
                else return setTimeout(() => f(), 100)
            })()
        })
    }

    //
    // Cyclic Redundency Check (CRC) 16-bit data
    //

    crc16(data) {
        data = typeof(data) == 'string' ? data.split('') : data
        let i = 0
        let crc = 0
        data.forEach(byte => {
            i = (crc >> 12) ^ (byte.charCodeAt(0) >> 4)
            crc = this.CRCLookup[i & 0x0f] ^ (crc << 4)

            i = (crc >> 12) ^ (byte.charCodeAt(0) >> 0)
            crc = this.CRCLookup[i & 0x0f] ^ (crc << 4)
        })

        // Return character string
        return String.fromCharCode(crc & 0xff) + String.fromCharCode((crc >> 8) & 0xff)

        // Return Unicode representation
        // return '\\x' + (crc & 0xff).toString(16) + '\\x' + ((crc >> 8) & 0xff).toString(16)
    }

    //
    // Escape Control Characters
    //

    escape(data) {
        const check = ['\x10', '\x01', '\x04']
        data = typeof(data) == 'string' ? data.split('') : data
        return data.map(d => check.indexOf(d) >= 0 ? '\x10' + d : d).toString()
    }

    //
    // Unescape Control Characters
    //

    unescape(data) {
        data = typeof(data) == 'string' ? data.split('') : data
        let escaping = false
        let str = ''
        data.forEach(c => {
            if (escaping) {
                str += c
                escaping = false
            } else if (c.charCodeAt(0) == '\x10'.charCodeAt(0)) {
                escaping = true
            } else str += c
        })
        return str
    }

    //
    // Send A Command
    //

    async send(command) {
        // Escape control characters
        command = this.escape(command)

        // Build request
        let request = `\x01` + command + this.escape(this.crc16(command)) + `\x04`

        // Verify connection
        if (!this.connected) throw 'Port not connected, unable to write.'

        // Write request to serial
        await new Promise((resolve, reject) => {
            this.port.write(new Buffer(request), e => e ? reject(e) : resolve())
        })

        // Start timeout
        this.responseTimeout = setTimeout(() => {
            console.debug('Bootloader response timeout.')
            this.emit('responseTimeout', 'Error on command: ' + command)
        }, 5000)

        return request.length
    }

    //
    // Read the Response
    //

    response(command) {
        console.log(command)
        // response = unescape(response[1: -1])
        //
        // # Verify SOH, EOT and command fields
        // if response[0] != command:
        //     raise IOError('Unexpected response type from bootloader')
        // if crc16(response[: -2]) != response[-2: ]:
        //     raise IOError('Invalid CRC from bootloader')
        //
        // return response[1: -2]
    }

    //
    // Upload/Flash a Hex File
    //

    upload(filename) {

    }

    version() {
        console.debug('Querying Bootloader Version..')

        // Send version command
        this.send('\x01')

        // Create a promise
        return new Promise((resolve, reject) => {
            // If the command times out, reject promise
            this.once('responseTimeout', e => reject(e))

            // Once new data arrives, print the version (if not corrupted)
            this.once('newData', d => {
                if (d[0] !== '\x01') reject('Unexpected response type from bootloader')

                var prettyVersion = d.map(c => '0' + c.charCodeAt(0)).join('')

                console.log(`Version: ${prettyVersion}`)

                resolve(prettyVersion)
            })
        })
    }
}
