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
const ByteArray_1 = __importDefault(require("../utils/ByteArray"));
class Zoom {
    /**
     *
     * @param {options} - ZoomOptions
     */
    constructor(options) {
        this.version = 1;
        this.options = {
            clone_cache: false,
            use_reference_calls: true
        };
        this.cache = {};
        this.calls = {};
        this.refcalls = {};
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
     * @returns hex string
     */
    getZoomCall(cache) {
        if (this.options.clone_cache === true) {
            this.cache = Object.assign({}, cache);
        }
        else {
            this.cache = cache;
        }
        this.groupCalls();
        this.generateBinaryCalls();
        return this.addZoomHeader(this.getBinaryCall());
    }
    /**
     * Concatenate all binary calls we have into one large string
     * @param data - the string containing all the calls we want to make
     * @returns string
     */
    addZoomHeader(data) {
        const bytes = new ByteArray_1.default(Buffer.alloc(2 + 2 + 2));
        // add version
        bytes.writeUnsignedShort(this.version);
        // add call num
        bytes.writeUnsignedShort(this.binary.length);
        // add expected return size - 0 as it is no longer used
        bytes.writeUnsignedShort(0);
        return bytes.toString("hex") + data;
    }
    /**
     * Concatenate all binary calls we have into one large string
     * @returns string
     */
    getBinaryCall() {
        // make sure to sort these by type and have type 1 first, as we need to index them
        // in order to use the results for addresses / other things
        let data = "";
        for (let i = 0; i < this.binary.length; i++) {
            data += this.binary[i].toString("hex");
        }
        return data;
    }
    /**
     * Iterate through our calls and create binaries
     */
    generateBinaryCalls() {
        // clean our address cache
        this.addressInAnyResultCache = {};
        Object.keys(this.calls).forEach((callToAddress) => {
            // for each grouped value
            this.calls[callToAddress].forEach((callDataString) => {
                // convert our hex string to a buffer so we can actually use it
                const callData = Buffer.from(this.removeZeroX(callDataString), "hex");
                const packet = {
                    type: 1,
                    dataLength: callData.length,
                    resultId: 0,
                    offset: 0,
                    toAddress: Buffer.from(this.removeZeroX(callToAddress), "hex"),
                };
                // if active then try to build type 2 calls
                if (this.options.use_reference_calls === true) {
                    const { found, callNum, bytePosition } = this.findToAddressInAnyResult(callToAddress);
                    if (found === true) {
                        packet.type = 2;
                        packet.toAddress = Buffer.from("");
                        packet.resultId = callNum.toString();
                        packet.offset = bytePosition.toString();
                    }
                }
                this.binary.push(this.createBinaryCallByteArray(packet, callData));
            });
        });
    }
    /**
     * create binary call byte array
     *
     * @param packet - {@link (packetFormat:interface)}
     * @param callData - Buffer containing method sha and hex encoded parameter values
     * @returns {ByteArray}
     */
    createBinaryCallByteArray(packet, callData) {
        const bytes = new ByteArray_1.default(Buffer.alloc(8));
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
    }
    /**
     * Remove 0x from string then return it
     * @param string
     * @returns string
     */
    removeZeroX(string) {
        return string.replace("0x", "");
    }
    /**
     * Group calls by "to" address
     */
    groupCalls() {
        Object.keys(this.cache).forEach((key) => {
            const parts = key.split("_");
            const toAddress = parts[0];
            const toCall = parts[1];
            if (!this.calls.hasOwnProperty(toAddress)) {
                this.calls[toAddress] = [];
            }
            this.calls[toAddress].push(toCall);
        });
    }
    /**
     * Search current calls for the "to address" and if found return index and byte offset
     *
     * @param to - the call address
     *
     * @returns { addressInResult }
     */
    findToAddressInAnyResult(to) {
        if (typeof this.addressInAnyResultCache[to] === "undefined") {
            const cleanTo = this.removeZeroX(to);
            const Result = {
                callNum: 0,
                bytePosition: 0,
                found: false,
            };
            Object.keys(this.cache).some((key, index) => {
                const position = this.cache[key].indexOf(cleanTo);
                if (position > -1) {
                    Result.callNum = index;
                    Result.bytePosition = (position - 2) / 2; // adjust for 0x in result
                    Result.found = true;
                    return true;
                }
                return false;
            });
            this.addressInAnyResultCache[to] = Result;
        }
        return this.addressInAnyResultCache[to];
    }
    /**
     * Converts the binary returned by the Zoom Smart contract back into a cache object
     *
     * @param binaryString
     *
     * @returns new cache object
     */
    resultsToCache(binaryString) {
        const newData = {};
        return newData;
    }
}
exports.default = Zoom;
;
//# sourceMappingURL=core.js.map