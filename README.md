# AN1388-Node

Implementation of Microchip's [AN1388][an1388] in Node.js using UART. Adapted from Camil Staps' python implementation.

  [an1388]: http://ww1.microchip.com/downloads/en/AppNotes/01388B.pdf

It is a good idea to add the current user to the dialout group, allowing access to reading and writing `/dev/` devices using this command: `usermod -a -G dialout $USER`. Most methods accept byte array arguments.

# API
<a name="Programmer"></a>

### Programmer ⇐ <code>EventEmitter</code>
Instantiable bootloader programmer class. Provides access to serial port UART programmer

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Programmer](#Programmer) ⇐ <code>EventEmitter</code>
    * [new Programmer(baudRate)](#new_Programmer_new)
    * [.connected](#Programmer+connected) ⇒ <code>boolean</code>
    * [.debugEnable()](#Programmer+debugEnable)
    * [.onceConnected()](#Programmer+onceConnected) ⇒ <code>Promise</code>
    * [.crc16(data)](#Programmer+crc16) ⇒ <code>array</code>
    * [.escape(data)](#Programmer+escape) ⇒ <code>array</code>
    * [.unescape(data)](#Programmer+unescape) ⇒ <code>array</code>
    * [.send(command)](#Programmer+send) ⇒ <code>number</code>
    * [.upload(filename)](#Programmer+upload) ⇒ <code>Promise</code>
    * [.version()](#Programmer+version) ⇒ <code>Promise</code>
    * [.run()](#Programmer+run)
    * ["uploadProgress"](#Programmer+event_uploadProgress)

<a name="new_Programmer_new"></a>

### new Programmer(baudRate)
Create a programmer instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| baudRate | <code>number</code> | <code>115200</code> | A standard UART baudrate, defaults to 115200 |

<a name="Programmer+connected"></a>

### programmer.connected ⇒ <code>boolean</code>
Alias for checking connection status

**Kind**: instance property of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>boolean</code> - - connection status  
<a name="Programmer+debugEnable"></a>

### programmer.debugEnable()
Enable debugging

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
<a name="Programmer+onceConnected"></a>

### programmer.onceConnected() ⇒ <code>Promise</code>
This resolves when the device is properly connected - a good starting point for a program

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>Promise</code> - - a promise that resolves when the programmer is connected  
<a name="Programmer+crc16"></a>

### programmer.crc16(data) ⇒ <code>array</code>
Cyclic Redundency Check (CRC) 16-bit data - Verified

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>array</code> - - an array of 2 bytes that represent the CRC  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>array</code> | an array of bytes to calculate the CRC for |

<a name="Programmer+escape"></a>

### programmer.escape(data) ⇒ <code>array</code>
Escape Control Characters

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>array</code> - - escaped byte array  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>array</code> | array of bytes to escape |

<a name="Programmer+unescape"></a>

### programmer.unescape(data) ⇒ <code>array</code>
Unescape Control Characters

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>array</code> - - unescaped byte array  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>array</code> | array of bytes to unescape |

<a name="Programmer+send"></a>

### programmer.send(command) ⇒ <code>number</code>
Send A Command - synchronous

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>number</code> - - length of command sent  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>array</code> | byte array representing command |

<a name="Programmer+upload"></a>

### programmer.upload(filename) ⇒ <code>Promise</code>
Upload/Flash a Hex File

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>Promise</code> - - promise that resolves on upload success, rejects on error  
**Emits**: [<code>uploadProgress</code>](#Programmer+event_uploadProgress)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filename | <code>string</code> | <code>&quot;test.hex&quot;</code> | location of Intel formatted hexfile to upload |

<a name="Programmer+version"></a>

### programmer.version() ⇒ <code>Promise</code>
Fetch bootloader version

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
**Returns**: <code>Promise</code> - - promise that resolves when the version is returned  
<a name="Programmer+run"></a>

### programmer.run()
Run program

**Kind**: instance method of [<code>Programmer</code>](#Programmer)  
<a name="Programmer+event_uploadProgress"></a>

### "uploadProgress"
Upload Progress events

**Kind**: event emitted by [<code>Programmer</code>](#Programmer)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| total | <code>number</code> | Total bytes to be sent |
| sent | <code>number</code> | Bytes sent |
| percent | <code>number</code> | Percentage of bytes sent |
