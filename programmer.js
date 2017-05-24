'use strict'

const Serial = require('serialport')

module.exports = class Programmer {
    constructor(baudRate = 115200) {
        this.CRCLookup = [
            0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
            0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1c1, 0xf1ef
        ]

        // Set serial baud rate
        this.baudRate = baudRate

        // Open the USB port
        this._configurePort().then(() => console.log((`Port '${this._port}' opened sucessfully!`)))
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

        // Wait for port to open
        let success = await new Promise((resolve, reject) => this.port.on('open', () => resolve(true)))

        return success
    }

    get connected() {
        return !!this.port && this.port.isOpen()
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
        return data.map(d => check.indexOf(d) >= 0 ? '\x10' + d : d)
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

    send(command) {
        command = this.escape(command)

        request = `\x01` + command + this.escape(crc16(command)) + `\x04`

        return request.length
    }

    //
    // Read the Response
    //

    response(command) {

    }

    //
    // Upload/Flash a Hex File
    //

    upload(filename) {

    }
}
