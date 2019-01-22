"use strict";
/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        Zoom Core
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/ethereum/web3.js/blob/develop/lib/web3/httpprovider.js
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ByteArray_1 = __importDefault(require("../utils/ByteArray"));
var Zoom = /** @class */ (function () {
    /**
     *
     * @param {options} - ZoomOptions
     */
    function Zoom(options) {
        this.version = 1;
        this.options = {
            clone_cache: false,
            use_reference_calls: true
        };
        this.cache = {};
        this.calls = {};
        this.binary = [];
        this.addressInAnyResultCache = {};
        if (typeof options !== "undefined") {
            this.options = Object.assign({}, options);
        }
    }
    /**
     * Assign cache and build the binary call
     *
     * @param {cache} - ZoomOptions
     * @returns Buffer containing resulting call
     */
    Zoom.prototype.getZoomCall = function (cache) {
        if (this.options.clone_cache === true) {
            this.cache = Object.assign({}, cache);
        }
        else {
            this.cache = cache;
        }
        this.groupCalls();
        this.generateBinaryCalls();
        return Buffer.from(this.addZoomHeader(this.getBinaryCall()), "hex");
    };
    /**
     * Concatenate all binary calls we have into one large string
     * @param data - the string containing all the calls we want to make
     * @returns string
     */
    Zoom.prototype.addZoomHeader = function (data) {
        var bytes = new ByteArray_1.default(Buffer.alloc(2 + 2 + 2));
        // add version
        bytes.writeUnsignedShort(this.version);
        // add call num
        bytes.writeUnsignedShort(this.binary.length);
        // add expected return size - 0 as it is no longer used
        bytes.writeUnsignedShort(0);
        // add 0x start and return
        return bytes.toString("hex") + data;
    };
    /**
     * Concatenate all binary calls we have into one large string
     * @returns string
     */
    Zoom.prototype.getBinaryCall = function () {
        // There is a case when a type 2 call might reference a later result
        // 
        // This can happen if the user first calls a contract with a hardcoded
        // address which is then found in a result of a call
        // 
        // sort our calls so type 1 are run first, otherwise we might end up with 
        // type 2 calls that cannot resolve their "toAddress" references
        this.binary.sort(function (objA, objB) {
            return (objA < objB) ? -1 : (objA > objB) ? 1 : 0;
        });
        var data = "";
        for (var i = 0; i < this.binary.length; i++) {
            data += this.binary[i].toString("hex");
        }
        return data;
    };
    /**
     * Iterate through our calls and create binaries
     */
    Zoom.prototype.generateBinaryCalls = function () {
        var _this = this;
        // clean our address cache
        this.addressInAnyResultCache = {};
        Object.keys(this.calls).forEach(function (callToAddress) {
            // for each grouped value
            _this.calls[callToAddress].forEach(function (callDataString) {
                // convert our hex string to a buffer so we can actually use it
                var callData = Buffer.from(_this.removeZeroX(callDataString), "hex");
                var packet = {
                    type: 1,
                    dataLength: callData.length,
                    resultId: 0,
                    offset: 0,
                    toAddress: Buffer.from(_this.removeZeroX(callToAddress), "hex"),
                };
                // if active then try to build type 2 calls
                if (_this.options.use_reference_calls === true) {
                    var _a = _this.findToAddressInAnyResult(callToAddress), found = _a.found, callNum = _a.callNum, bytePosition = _a.bytePosition;
                    if (found === true) {
                        packet.type = 2;
                        packet.toAddress = Buffer.from("");
                        packet.resultId = callNum.toString();
                        packet.offset = bytePosition.toString();
                    }
                }
                _this.binary.push(_this.createBinaryCallByteArray(packet, callData));
            });
        });
    };
    /**
     * create binary call byte array
     *
     * @param packet - {@link (packetFormat:interface)}
     * @param callData - Buffer containing method sha and hex encoded parameter values
     * @returns {ByteArray}
     */
    Zoom.prototype.createBinaryCallByteArray = function (packet, callData) {
        var bytes = new ByteArray_1.default(Buffer.alloc(8));
        // 1 byte - uint8 call type ( 1 normal / 2 - to address is result of a previous call )
        bytes.writeByte(packet.type);
        // 2 bytes - uint16 call_data length
        bytes.writeUnsignedShort(packet.dataLength);
        // 2 bytes - uint16 result_id that holds our call's address
        bytes.writeUnsignedShort(packet.resultId);
        // 2 bytes - bytes uint16 offset in bytes where the address starts in said result
        bytes.writeUnsignedShort(packet.offset);
        // 1 empty byte
        bytes.writeByte(0);
        // 20 bytes address / or none if type 2
        bytes.copyBytes(packet.toAddress, 0);
        // 4 bytes method sha + dynamic for the rest 0 to any
        bytes.copyBytes(callData, 0);
        return bytes;
    };
    /**
     * Remove 0x from string then return it
     * @param string
     * @returns string
     */
    Zoom.prototype.removeZeroX = function (string) {
        return string.replace("0x", "");
    };
    /**
     * Group calls by "to" address
     */
    Zoom.prototype.groupCalls = function () {
        var _this = this;
        Object.keys(this.cache).forEach(function (key) {
            var parts = key.split("_");
            var toAddress = parts[0];
            var toCall = parts[1];
            if (!_this.calls.hasOwnProperty(toAddress)) {
                _this.calls[toAddress] = [];
            }
            _this.calls[toAddress].push(toCall);
        });
    };
    /**
     * Search current calls for the "to address" and if found return index and byte offset
     *
     * @param to - the call address
     *
     * @returns { addressInResult }
     */
    Zoom.prototype.findToAddressInAnyResult = function (to) {
        var _this = this;
        if (typeof this.addressInAnyResultCache[to] === "undefined") {
            var cleanTo_1 = this.removeZeroX(to);
            var Result_1 = {
                callNum: 0,
                bytePosition: 0,
                found: false,
            };
            Object.keys(this.cache).some(function (key, index) {
                var position = _this.cache[key].indexOf(cleanTo_1);
                if (position > -1) {
                    Result_1.callNum = index;
                    Result_1.bytePosition = (position - 2) / 2; // adjust for 0x in result
                    Result_1.found = true;
                    return true;
                }
                return false;
            });
            this.addressInAnyResultCache[to] = Result_1;
        }
        return this.addressInAnyResultCache[to];
    };
    /**
     * Converts the binary returned by the Zoom Smart contract back into a cache object
     *
     * @param binaryString
     *
     * @returns new cache object
     */
    Zoom.prototype.resultsToCache = function (callResult, combinedBinaryCall) {
        var newData = {};
        var resultString = this.removeZeroX(callResult[0]);
        var resultOffsets = this.readOffsets(callResult[1]);
        // push resultString length as last offset, so we can the last result
        resultOffsets.push(resultString.length / 2);
        var bytes = new ByteArray_1.default(combinedBinaryCall);
        // Read Zoom Header
        // bypass version ( 2 bytes )
        bytes.advanceReadPositionBy(2);
        // read number of calls ( 2 bytes )
        var callLength = bytes.readUnsignedShort();
        // bypass unused space ( 2 bytes ) so bytes.readPosition is now at call data space.
        bytes.advanceReadPositionBy(2);
        // parse and index results
        var Results = [];
        for (var i = 0; i < callLength; i++) {
            Results.push(resultString.substring(resultOffsets[i] * 2, resultOffsets[i + 1] * 2));
        }
        for (var i = 0; i < callLength; i++) {
            // 1 byte - uint8 call type ( 1 normal / 2 - to address is result of a previous call )
            var type = bytes.readByte();
            // 2 bytes - uint16 call_data length
            var callDataLength = bytes.readUnsignedShort();
            var toAddress = void 0;
            if (type === 1) {
                // bypass 5 bytes used in type 2 for result id and offset and 1 byte for unused space
                bytes.advanceReadPositionBy(5);
                // normal call that contains toAddress and callData
                var AddressByteArray = new ByteArray_1.default(20);
                bytes.readBytes(AddressByteArray, 0, 20);
                toAddress = AddressByteArray.toString("hex");
            }
            else if (type === 2) {
                // referenced call that contains callData, toAddress is in result
                var resultId = bytes.readUnsignedShort();
                var resultOffset = bytes.readUnsignedShort();
                toAddress = Results[resultId].substring(resultOffset * 2, (resultOffset + 20) * 2);
                // bypass unused space ( 1 bytes ) so bytes.readPosition is now at callData space.
                bytes.advanceReadPositionBy(1);
            }
            var callData = new ByteArray_1.default(callDataLength);
            bytes.readBytes(callData, 0, callDataLength);
            // combine our call and data and attach result
            newData["0x" + toAddress + "_0x" + callData.toString("hex")] = "0x" + Results[i];
        }
        // make sure the result length matches our expected size,
        // otherwise let the user know something went wrong
        if (callLength !== Results.length) {
            throw new Error("Zoom: Result size error, something went wrong.");
        }
        return newData;
    };
    Zoom.prototype.toBuffer = function (string) {
        return Buffer.from(string, "hex");
    };
    Zoom.prototype.readOffsets = function (binaryString) {
        // strip out 0x
        var cleanBinary = this.removeZeroX(binaryString);
        // convert the result to a byte array so we can process it
        var bytes = new ByteArray_1.default(Buffer.from(cleanBinary, "hex"));
        // divide by 32 bytes to find the number of results we need to read
        var resultLenght = bytes.length / 32;
        var Results = [];
        for (var i = 0; i < resultLenght; i++) {
            // 4 byte - 32 bit uint max = 4,294,967,295
            // provides more than enough 4GB of data in the output buffer
            // so.. offset our read pointer by 28 bytes
            bytes.advanceReadPositionBy(28);
            // then read our offset
            Results.push(bytes.readUnsignedInt());
        }
        return Results;
    };
    return Zoom;
}());
exports.default = Zoom;
;
//# sourceMappingURL=core.js.map