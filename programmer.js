'use strict'

const Serial = require('serialport')
const EventEmitter = require('events').EventEmitter

const fs = require('fs')
const readline = require('readline')
const stream = require('stream')


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

    //
    // Set up the UART port
    //

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

    //
    // Private incoming data handler
    //

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
        let response = this.unescape(output.slice(1, -1))

        // Set the last response
        this.lastResponse = response.slice(1, -2)

        // Emit new processed data event
        this.emit('newData', this.lastResponse)
    }

    //
    // Alias for checking connection status
    //

    get connected() {
        return !!this.port && this.port.isOpen()
    }

    //
    // This resolves when the device is properly connected - a good starting point for a program
    //

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
    // Cyclic Redundency Check (CRC) 16-bit data - Verified
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

        // Return unicode array
        return [String.fromCharCode(crc & 0xff), String.fromCharCode((crc >> 8) & 0xff)]
    }

    //
    // Escape Control Characters
    //

    escape(data) {
        const check = ['\x10', '\x01', '\x04']
        let escaped = []
        data
            .map(d => check.indexOf(d) >= 0 ? '\x10' + d : d)
            .forEach(c => escaped.push(...c))

        // Return unicode array
        return escaped
    }

    //
    // Unescape Control Characters
    //

    unescape(data) {
        let escaping = false
        let unescaped = []
        data.forEach(c => {
            if (escaping) {
                unescaped.push(c)
                escaping = false
            } else if (c.charCodeAt(0) == '\x10'.charCodeAt(0)) {
                escaping = true
            } else unescaped.push(c)
        })

        // Return unicode array
        return unescaped
    }

    //
    // Send A Command
    //

    async send(command) {
        // Escape control characters
        command = this.escape(command)

        // Build request
        let request = ['\x01', ...command, ...this.escape(this.crc16(command)), '\x04'].map(c => c.charCodeAt(0))

        // Verify connection
        if (!this.connected) throw 'Port not connected, unable to write.'

        // Write request to serial
        await new Promise((resolve, reject) => {
            this.port.write(request, e => e ? resolve(false) : resolve(true))
        })

        // Start timeout
        clearTimeout(this.responseTimeout)
        this.responseTimeout = setTimeout(() => {
            console.debug('Bootloader response timeout.')
            this.emit('responseTimeout', 'Error on command: ' + [...command])
        }, 5000)

        return request.length
    }

    //
    // Upload/Flash a Hex File
    //

    upload(filename = 'test.hex') {
        // Read file line-by-line syncronously
        var lines = fs.readFileSync(filename, 'utf-8').split('\n')

        // Allow enough listeners to accomodate for each line
        this.setMaxListeners(lines.length + 10)

        // Check Intel HEX format
        if (lines.find(l => l.length < 7)) throw ('Invalid hex file')

        // Byte progress object
        let bytes = {
            total: lines.reduce((total, l) => total += (l.length - 1) / 2, 0),
            sent: 0,
            get percent() {
                return bytes.sent / bytes.total
            }
        }

        // Current line being sent
        var currentLine = 0

        // Send each line individually
        return new Promise((resolve, reject) => {
            var sendLine = () => {
                let line = lines[currentLine]

                // Remove colon and convert to byte array
                line = line.slice(1).match(/.{1,2}/g).map(c => parseInt(c, 16)).map(c => String.fromCharCode(c))

                // Send the line
                this.send(['\x03', ...line])

                // If the command times out, reject promise
                const timeoutCb = e => reject(e)

                this.once('responseTimeout', timeoutCb)

                // Wait for new data to be received
                this.once('newData', d => {
                    // Remove timeout listener
                    this.removeListener('responseTimeout', timeoutCb)

                    // Update status bytes
                    bytes.sent += line.length
                    this.emit('uploadProgress', bytes)

                    // Write a dot to terminal
                    process.stdout.write('.')
                    currentLine++
                    if (currentLine < lines.length - 1) sendLine()
                    else resolve(true)
                })
            }
            sendLine()
        })
    }

    //
    // Fetch bootloader version
    //

    version() {
        console.debug('Querying Bootloader Version..')

        // Send version command
        this.send(['\x01'])

        // Create a promise
        return new Promise((resolve, reject) => {
            // If the command times out, reject promise
            const timeoutCb = e => reject(e)
            this.once('responseTimeout', timeoutCb)

            // Once new data arrives, print the version (if not corrupted)
            this.once('newData', d => {
                // Verify command in response
                if (d[0] !== '\x01') reject('Unexpected response type from bootloader')

                // Format version hex characters
                var prettyVersion = d.map(c => '0' + c.charCodeAt(0)).join('')

                // Print version in debug mode
                console.debug(`Version: ${prettyVersion}`)

                // Remove timeout listener
                this.removeListener('responseTimeout', timeoutCb)

                // Resolve promise with formatted version string
                resolve(prettyVersion)
            })
        }).catch(() => {
            console.debug('Problem running program.')
        })
    }

    //
    // Run program
    //

    run() {
        console.debug('Running Program..')

        // Send run command
        this.send(['\x05'])
    }
}
