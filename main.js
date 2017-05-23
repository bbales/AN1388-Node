const Programmer = new(require('./programmer'))()

// Test byte array
let dataw = [
    0x0001, 0x0002, 0x0003, 0x0004,
    0x0005, 0x0006, 0x0007, 0x0008,
    0x0009, 0x000A, 0x000B, 0x000C,
    0x000D, 0x000E, 0x000F, 0x0010,
    0x0011, 0x0012, 0x0013, 0x0014,
    0x001
].map(byte => String.fromCharCode(byte))

// Calculate the CRC
// console.log(Programmer.crc16(dataw))

Programmer.onceConnected().then(() => {
    console.log(Programmer._port)
})
