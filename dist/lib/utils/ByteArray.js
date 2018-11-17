"use strict";
/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        ByteArray
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/Zaseth/bytearray-node
*/
Object.defineProperty(exports, "__esModule", { value: true });
class ByteArray {
    constructor(buffer) {
        this.DEFAULT_SIZE = 2048;
        this.start_size = 0;
        this.writePosition = 0;
        this.readPosition = 0;
        this.endian = true;
        if (buffer instanceof ByteArray) {
            this.buffer = buffer.buffer;
        }
        else if (Buffer.isBuffer(buffer)) {
            this.buffer = buffer;
        }
        else {
            if (typeof buffer === "number") {
                this.start_size = buffer;
            }
            else {
                this.start_size = this.DEFAULT_SIZE;
            }
            this.buffer = Buffer.alloc(this.start_size);
        }
    }
    get bytesAvailable() {
        return this.buffer.length - this.readPosition;
    }
    get length() {
        return this.buffer.length;
    }
    clear() {
        this.buffer = Buffer.alloc(this.DEFAULT_SIZE);
        this.reset();
    }
    reset() {
        this.writePosition = 0;
        this.readPosition = 0;
    }
    canWrite(length) {
        return this.length - this.writePosition >= length;
    }
    scaleBuffer(length) {
        const oldBuffer = this.buffer;
        this.buffer = Buffer.alloc(this.length + length);
        oldBuffer.copy(this.buffer);
    }
    readBoolean() {
        return this.readByte() !== 0;
    }
    readByte() {
        const value = this.buffer.readInt8(this.readPosition);
        this.readPosition += 1;
        return value;
    }
    readBytes(buffer, offset = 0, length = 0) {
        if (offset < 0 || length < 0) {
            throw new RangeError("Offset/Length can't be less than 0");
        }
        if (length === 0) {
            length = this.bytesAvailable;
        }
        if (length > this.bytesAvailable) {
            throw new RangeError("Length can't be greater than the bytes available");
        }
        const total = offset + length;
        if (total !== offset + length) {
            throw new RangeError("32-bit overflow");
        }
        if (!buffer.canWrite(offset + length)) {
            buffer.scaleBuffer(offset + length);
        }
        if (length > 0) {
            for (let i = 0; i < length; i++) {
                buffer.writeByte(this.readByte());
            }
        }
    }
    readDouble() {
        const value = this.endian
            ? this.buffer.readDoubleBE(this.readPosition)
            : this.buffer.readDoubleLE(this.readPosition);
        this.readPosition += 8;
        return value;
    }
    readFloat() {
        const value = this.endian
            ? this.buffer.readFloatBE(this.readPosition)
            : this.buffer.readFloatLE(this.readPosition);
        this.readPosition += 4;
        return value;
    }
    readInt() {
        const value = this.endian
            ? this.buffer.readInt32BE(this.readPosition)
            : this.buffer.readInt32LE(this.readPosition);
        this.readPosition += 4;
        return value;
    }
    readMultiByte(length, charSet = "utf8") {
        const position = this.readPosition;
        this.readPosition += length;
        if (Buffer.isEncoding(charSet)) {
            return this.buffer.toString(charSet, position, position + length);
        }
        else {
            throw new Error("Cannot read multi byte. Buffer encoding does not match");
        }
    }
    readShort() {
        const value = this.endian
            ? this.buffer.readInt16BE(this.readPosition)
            : this.buffer.readInt16LE(this.readPosition);
        this.readPosition += 2;
        return value;
    }
    readUnsignedByte() {
        const value = this.buffer.readUInt8(this.readPosition);
        this.readPosition += 1;
        return value;
    }
    readUnsignedInt() {
        const value = this.endian
            ? this.buffer.readUInt32BE(this.readPosition)
            : this.buffer.readUInt32LE(this.readPosition);
        this.readPosition += 4;
        return value;
    }
    readUnsignedShort() {
        const value = this.endian
            ? this.buffer.readUInt16BE(this.readPosition)
            : this.buffer.readUInt16LE(this.readPosition);
        this.readPosition += 2;
        return value;
    }
    readUTF() {
        const length = this.readShort();
        const position = this.readPosition;
        this.readPosition += length;
        return this.buffer.toString("utf8", position, position + length);
    }
    readUTFBytes(length) {
        return this.readMultiByte(length);
    }
    toJSON() {
        return this.buffer.toJSON();
    }
    toString(charSet = "utf8", offset = 0, length = this.length) {
        return this.buffer.toString(charSet, offset, length);
    }
    writeBoolean(value) {
        this.writeByte(value ? 1 : 0);
    }
    writeByte(value) {
        if (!this.canWrite(1)) {
            this.scaleBuffer(1);
        }
        this.buffer.writeInt8(value, this.writePosition);
        this.writePosition += 1;
    }
    writeBytes(buffer, offset = 0, length = 0) {
        if (offset < 0 || length < 0) {
            throw new Error("Offset/Length can't be less than 0");
        }
        if (offset > buffer.length) {
            offset = buffer.length;
        }
        if (length === 0) {
            length = buffer.length - offset;
        }
        if (length > buffer.length - offset) {
            throw new RangeError("Length can't be greater than the buffer length");
        }
        if (length > 0) {
            for (let i = offset; i < length; i++) {
                this.writeByte(buffer[i]);
            }
        }
    }
    writeDouble(value) {
        if (!this.canWrite(8)) {
            this.scaleBuffer(8);
        }
        this.endian
            ? this.buffer.writeDoubleBE(value, this.writePosition)
            : this.buffer.writeDoubleLE(value, this.writePosition);
        this.writePosition += 8;
    }
    writeFloat(value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeFloatBE(value, this.writePosition)
            : this.buffer.writeFloatLE(value, this.writePosition);
        this.writePosition += 4;
    }
    writeInt(value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeInt32BE(value, this.writePosition)
            : this.buffer.writeInt32LE(value, this.writePosition);
        this.writePosition += 4;
    }
    writeMultiByte(value, charSet = "utf8") {
        const length = Buffer.byteLength(value);
        if (!this.canWrite(length)) {
            this.scaleBuffer(length);
        }
        if (Buffer.isEncoding(charSet)) {
            this.buffer.write(value, this.writePosition, length, charSet);
            this.writePosition += length;
        }
    }
    writeShort(value) {
        if (!this.canWrite(2)) {
            this.scaleBuffer(2);
        }
        this.endian
            ? this.buffer.writeInt16BE(value, this.writePosition)
            : this.buffer.writeInt16LE(value, this.writePosition);
        this.writePosition += 2;
    }
    writeUnsignedByte(value) {
        if (!this.canWrite(1)) {
            this.scaleBuffer(1);
        }
        this.buffer.writeUInt8(value, this.writePosition);
        this.writePosition += 1;
    }
    writeUnsignedInt(value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeUInt32BE(value, this.writePosition)
            : this.buffer.writeUInt32LE(value, this.writePosition);
        this.writePosition += 4;
    }
    writeUnsignedShort(value) {
        if (!this.canWrite(2)) {
            this.scaleBuffer(2);
        }
        this.endian
            ? this.buffer.writeUInt16BE(value, this.writePosition)
            : this.buffer.writeUInt16LE(value, this.writePosition);
        this.writePosition += 2;
    }
    writeUTF(value) {
        const length = Buffer.byteLength(value);
        if (length > 65535) {
            throw new RangeError("Length can't be greater than 65535");
        }
        if (!this.canWrite(length)) {
            this.scaleBuffer(length);
        }
        this.writeUnsignedShort(length);
        this.buffer.write(value, this.writePosition, length);
        this.writePosition += length;
    }
    writeUTFBytes(value) {
        this.writeMultiByte(value);
    }
    copyBytes(buffer, offset = 0, length = 0) {
        if (offset < 0 || length < 0) {
            throw new Error("Offset/Length can't be less than 0");
        }
        if (offset > buffer.length) {
            offset = buffer.length;
        }
        if (length === 0) {
            length = buffer.length - offset;
        }
        if (length > buffer.length - offset) {
            throw new RangeError("Length can't be greater than the buffer length");
        }
        if (length > 0) {
            for (let i = offset; i < length; i++) {
                this.writeUnsignedByte(buffer[i]);
            }
        }
    }
    advanceReadPositionBy(value) {
        this.readPosition += value;
    }
}
exports.default = ByteArray;
//# sourceMappingURL=ByteArray.js.map