// const data = require("./test.json");
const zoomlib = require("../dist/lib/index.js");

const Zoom = new zoomlib["default"]();

const addr = "0x0dcd2f752394c41875e259e00bb44fd505297caf";
const method = "f8a8fd6d";

const data = {}

data[addr+"_f8a8fd6d"] = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
data[addr+"_0a8e8e01"] = "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000610013188ec3560119ee5bca02223fcbc9003072cf600030f7589000385fbe24004073002e0051fc6f590057945e3e006ad49245007278d62300919baade0091fa055500961ffc6800b37edb6600b8109e1a00e8be2e8e00efdee94f00fa9d235200";
data[addr+"_66e41cb7"] = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f30";

const binary = Zoom.buildCall(data);
Zoom.displayBinaryCalls();
console.log();
console.log("call number:", Zoom.binary.length, "buffer length:", binary.length, "words:", Zoom.getExpectedResultSizeInWords());

// muahaha: save each call to free memory, and combine into outputBuffer at the end :D

/*
const res = binary.replace(
    "0x8c1ed7e19abaa9f23c476da86dc1577f1ef401f5",
    "0x8c1ed7e19abaa9f23c476da86dc1577f1ef401f5".replace("0x","").toLowerCase()
)

0x
0000000000000000000000000000000000000000000000000000000000000220
0000000000000000000000000000000000000000000000000000000000000240
0000000000000000000000000000000000000000000000000000000000000260

    function test3() public pure returns ( bytes16 ) {
        return 0x1112131415161718191a1b1c1d1e1f40;
    }

*/
console.log( "0x"+binary );