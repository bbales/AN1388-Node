serial = require('serialport')


//
// Cyclic Redundency Check (CRC) 16-bit data
//

const CRCLookup = [
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
    0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1c1, 0xf1ef
]

function crc16(data) {
    let i = 0
    let crc = 0
    data.forEach(byte => {
        i = (crc >> 12) ^ (byte.charCodeAt(0) >> 4)
        crc = CRCLookup[i & 0x0f] ^ (crc << 4)

        i = (crc >> 12) ^ (byte.charCodeAt(0) >> 0)
        crc = CRCLookup[i & 0x0f] ^ (crc << 4)
    })

    // Return character string
    return String.fromCharCode(crc & 0xff) + String.fromCharCode((crc >> 8) & 0xff)

    // Return Unicode representation
    // return '\\x' + (crc & 0xff).toString(16) + '\\x' + ((crc >> 8) & 0xff).toString(16)
}

let dataw = [
    0x0001, 0x0002, 0x0003, 0x0004,
    0x0005, 0x0006, 0x0007, 0x0008,
    0x0009, 0x000A, 0x000B, 0x000C,
    0x000D, 0x000E, 0x000F, 0x0010,
    0x0011, 0x0012, 0x0013, 0x0014,
    0x001
].map(byte => String.fromCharCode(byte))

console.log(crc16(dataw));
