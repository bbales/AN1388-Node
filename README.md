# AN1388-Node

Implementation of Microchip's [AN1388][an1388] in Node.js using UART.

Adapted from Camil Staps' python implementation.

  [an1388]: http://ww1.microchip.com/downloads/en/AppNotes/01388B.pdf

Its a good idea to add the current user to the dialout group, allowing access to reading and writing /dev/ devices.

`usermod -a -G dialout $USER`
