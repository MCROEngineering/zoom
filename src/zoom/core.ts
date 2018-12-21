/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        Zoom Core
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/ethereum/web3.js/blob/develop/lib/web3/httpprovider.js
*/

import ByteArray from "../utils/ByteArray";

/**
 * Zoom Constructor options
 * 
 * clone_cache - boolean - "clone or reference the cache variable"
 * use_reference_calls - boolean - replace calls in binary by result reference and offsets
 * 
 */
interface ZoomOptions {
    clone_cache: boolean;
    use_reference_calls?: boolean;
}

interface addressInResult {
    callNum: number;
    bytePosition: number;
    found: boolean;
}

interface packetFormat {
    type: number;
    dataLength: number;
    resultId: number;
    offset: number;
    toAddress: Buffer;
}

export default class Zoom {

    public version: number = 1;
    public options: ZoomOptions = {
        clone_cache: false,
        use_reference_calls: true
    };

    public cache: {} = {};
    public calls: {} = {};
    public binary: any = [];

    private addressInAnyResultCache: {} = {};

    /**
     * 
     * @param {options} - ZoomOptions
     */
    constructor(options?: ZoomOptions) {
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
    public getZoomCall(cache: {}): any {

        if (this.options.clone_cache === true) {
            this.cache = Object.assign({}, cache);
        } else {
            this.cache = cache;
        }

        this.groupCalls();
        this.generateBinaryCalls();

        return Buffer.from(
            this.addZoomHeader(
                this.getBinaryCall()
            ),
            "hex"
        );

    }

    /** 
     * Concatenate all binary calls we have into one large string
     * @param data - the string containing all the calls we want to make
     * @returns string
     */
    public addZoomHeader(data: string): string {

        const bytes = new ByteArray(Buffer.alloc(2 + 2 + 2));
        // add version
        bytes.writeUnsignedShort(this.version);

        // add call num
        bytes.writeUnsignedShort(this.binary.length);

        // add expected return size - 0 as it is no longer used
        bytes.writeUnsignedShort(0);

        // add 0x start and return
        return bytes.toString("hex") + data;
    }

    /** 
     * Concatenate all binary calls we have into one large string
     * @returns string
     */
    public getBinaryCall(): string {

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

        let data = "";
        for (let i = 0; i < this.binary.length; i++) {
            data += this.binary[i].toString("hex");
        }
        return data;
    }

    /** 
     * Iterate through our calls and create binaries
     */
    public generateBinaryCalls() {

        // clean our address cache
        this.addressInAnyResultCache = {};

        Object.keys(this.calls).forEach((callToAddress) => {

            // for each grouped value
            this.calls[callToAddress].forEach((callDataString) => {

                // convert our hex string to a buffer so we can actually use it
                const callData = Buffer.from(this.removeZeroX(callDataString), "hex");

                const packet: packetFormat = {
                    type: 1,
                    dataLength: callData.length,
                    resultId: 0,
                    offset: 0,
                    toAddress: Buffer.from(this.removeZeroX(callToAddress), "hex"), // key contains to address
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
    public createBinaryCallByteArray(packet: packetFormat, callData: Buffer): ByteArray {

        const bytes: ByteArray = new ByteArray(Buffer.alloc(8));

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
    public removeZeroX(string: string): string {
        return string.replace("0x", "");
    }

    /** 
     * Group calls by "to" address
     */
    public groupCalls(): void {
        Object.keys(this.cache).forEach((key: string) => {
            const parts = key.split("_");
            const toAddress = parts[0];
            const toCall = parts[1];

            if (!this.calls.hasOwnProperty(toAddress)) {
                this.calls[toAddress] = [];
            }

            this.calls[toAddress].push(toCall)
        });
    }

    /** 
     * Search current calls for the "to address" and if found return index and byte offset
     * 
     * @param to - the call address
     * 
     * @returns { addressInResult }
     */
    public findToAddressInAnyResult(to: string): any {

        if (typeof this.addressInAnyResultCache[to] === "undefined") {

            const cleanTo = this.removeZeroX(to);
            const Result: addressInResult = {
                callNum: 0,
                bytePosition: 0,
                found: false,
            };

            Object.keys(this.cache).some((key: string, index: number) => {
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
    public resultsToCache(callResult: any, combinedBinaryCall: Buffer): {} {

        const newData = {};

        const resultString = this.removeZeroX(callResult[0]);
        const resultOffsets = this.readOffsets(callResult[1]);

        // push resultString length as last offset, so we can the last result
        resultOffsets.push(resultString.length / 2);

        const bytes: ByteArray = new ByteArray(combinedBinaryCall);

        // Read Zoom Header
        // bypass version ( 2 bytes )
        bytes.advanceReadPositionBy(2);

        // read number of calls ( 2 bytes )
        const callLength = bytes.readUnsignedShort();

        // bypass unused space ( 2 bytes ) so bytes.readPosition is now at call data space.
        bytes.advanceReadPositionBy(2);

        // parse and index results
        const Results = [];
        for (let i = 0; i < callLength; i++) {
            Results.push(
                resultString.substring(
                    resultOffsets[i] * 2,
                    resultOffsets[i + 1] * 2
                )
            );
        }

        for (let i = 0; i < callLength; i++) {

            // 1 byte - uint8 call type ( 1 normal / 2 - to address is result of a previous call )
            const type = bytes.readByte();

            // 2 bytes - uint16 call_data length
            const callDataLength = bytes.readUnsignedShort();

            let toAddress: string;

            if (type === 1) {
                
                // bypass 5 bytes used in type 2 for result id and offset and 1 byte for unused space
                bytes.advanceReadPositionBy(5);

                // normal call that contains toAddress and callData
                const AddressByteArray = new ByteArray(20);
                bytes.readBytes(AddressByteArray, 0, 20);
                toAddress = AddressByteArray.toString("hex");

            } else if (type === 2) {

                // referenced call that contains callData, toAddress is in result
                const resultId = bytes.readUnsignedShort();
                const resultOffset = bytes.readUnsignedShort();

                toAddress = Results[resultId].substring(
                    resultOffset * 2,
                    (resultOffset + 20) * 2
                );

                // bypass unused space ( 1 bytes ) so bytes.readPosition is now at callData space.
                bytes.advanceReadPositionBy(1);
            }

            const callData = new ByteArray(callDataLength);
            bytes.readBytes(callData, 0, callDataLength);

            // combine our call and data and attach result
            newData["0x" + toAddress + "_0x" + callData.toString("hex")] = "0x"+Results[i];
        }

        // make sure the result length matches our expected size,
        // otherwise let the user know something went wrong
        if (callLength !== Results.length) {
            throw new Error("Zoom: Result size error, something went wrong.");
        }

        return newData;
    }

    public toBuffer(string) {
        return Buffer.from(string, "hex");
    }

    private readOffsets(binaryString: string): any {

        // strip out 0x
        const cleanBinary = this.removeZeroX(binaryString);

        // convert the result to a byte array so we can process it
        const bytes: ByteArray = new ByteArray(
            Buffer.from(cleanBinary, "hex")
        );

        // divide by 32 bytes to find the number of results we need to read
        const resultLenght = bytes.length / 32;
        const Results = [];

        for (let i = 0; i < resultLenght; i++) {
            // 4 byte - 32 bit uint max = 4,294,967,295
            // provides more than enough 4GB of data in the output buffer

            // so.. offset our read pointer by 28 bytes
            bytes.advanceReadPositionBy(28);

            // then read our offset
            Results.push(
                bytes.readUnsignedInt()
            )
        }

        return Results;
    }
};
