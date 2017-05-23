serial = require('serialport')

module.exports = class Programmer {
    constructor() {
        this.CRCLookup = [
            0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
            0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1c1, 0xf1ef
        ]
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

    }

    //
    // Unescape Control Characters
    //

    unescape(data) {

    }

    //
    // Send A Command
    //

    send(command) {

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
