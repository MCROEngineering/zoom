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
var ByteArray = /** @class */ (function () {
    function ByteArray(buffer) {
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
    Object.defineProperty(ByteArray.prototype, "bytesAvailable", {
        get: function () {
            return this.buffer.length - this.readPosition;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ByteArray.prototype, "length", {
        get: function () {
            return this.buffer.length;
        },
        enumerable: true,
        configurable: true
    });
    ByteArray.prototype.clear = function () {
        this.buffer = Buffer.alloc(this.DEFAULT_SIZE);
        this.reset();
    };
    ByteArray.prototype.reset = function () {
        this.writePosition = 0;
        this.readPosition = 0;
    };
    ByteArray.prototype.canWrite = function (length) {
        return this.length - this.writePosition >= length;
    };
    ByteArray.prototype.scaleBuffer = function (length) {
        var oldBuffer = this.buffer;
        this.buffer = Buffer.alloc(this.length + length);
        oldBuffer.copy(this.buffer);
    };
    ByteArray.prototype.readBoolean = function () {
        return this.readByte() !== 0;
    };
    ByteArray.prototype.readByte = function () {
        var value = this.buffer.readInt8(this.readPosition);
        this.readPosition += 1;
        return value;
    };
    ByteArray.prototype.readBytes = function (buffer, offset, length) {
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = 0; }
        if (offset < 0 || length < 0) {
            throw new RangeError("Offset/Length can't be less than 0");
        }
        if (length === 0) {
            length = this.bytesAvailable;
        }
        if (length > this.bytesAvailable) {
            throw new RangeError("Length can't be greater than the bytes available");
        }
        var total = offset + length;
        if (total !== offset + length) {
            throw new RangeError("32-bit overflow");
        }
        if (!buffer.canWrite(offset + length)) {
            buffer.scaleBuffer(offset + length);
        }
        if (length > 0) {
            for (var i = 0; i < length; i++) {
                buffer.writeByte(this.readByte());
            }
        }
    };
    ByteArray.prototype.readDouble = function () {
        var value = this.endian
            ? this.buffer.readDoubleBE(this.readPosition)
            : this.buffer.readDoubleLE(this.readPosition);
        this.readPosition += 8;
        return value;
    };
    ByteArray.prototype.readFloat = function () {
        var value = this.endian
            ? this.buffer.readFloatBE(this.readPosition)
            : this.buffer.readFloatLE(this.readPosition);
        this.readPosition += 4;
        return value;
    };
    ByteArray.prototype.readInt = function () {
        var value = this.endian
            ? this.buffer.readInt32BE(this.readPosition)
            : this.buffer.readInt32LE(this.readPosition);
        this.readPosition += 4;
        return value;
    };
    ByteArray.prototype.readMultiByte = function (length, charSet) {
        if (charSet === void 0) { charSet = "utf8"; }
        var position = this.readPosition;
        this.readPosition += length;
        if (Buffer.isEncoding(charSet)) {
            return this.buffer.toString(charSet, position, position + length);
        }
        else {
            throw new Error("Cannot read multi byte. Buffer encoding does not match");
        }
    };
    ByteArray.prototype.readShort = function () {
        var value = this.endian
            ? this.buffer.readInt16BE(this.readPosition)
            : this.buffer.readInt16LE(this.readPosition);
        this.readPosition += 2;
        return value;
    };
    ByteArray.prototype.readUnsignedByte = function () {
        var value = this.buffer.readUInt8(this.readPosition);
        this.readPosition += 1;
        return value;
    };
    ByteArray.prototype.readUnsignedInt = function () {
        var value = this.endian
            ? this.buffer.readUInt32BE(this.readPosition)
            : this.buffer.readUInt32LE(this.readPosition);
        this.readPosition += 4;
        return value;
    };
    ByteArray.prototype.readUnsignedShort = function () {
        var value = this.endian
            ? this.buffer.readUInt16BE(this.readPosition)
            : this.buffer.readUInt16LE(this.readPosition);
        this.readPosition += 2;
        return value;
    };
    ByteArray.prototype.readUTF = function () {
        var length = this.readShort();
        var position = this.readPosition;
        this.readPosition += length;
        return this.buffer.toString("utf8", position, position + length);
    };
    ByteArray.prototype.readUTFBytes = function (length) {
        return this.readMultiByte(length);
    };
    ByteArray.prototype.toJSON = function () {
        return this.buffer.toJSON();
    };
    ByteArray.prototype.toString = function (charSet, offset, length) {
        if (charSet === void 0) { charSet = "utf8"; }
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = this.length; }
        return this.buffer.toString(charSet, offset, length);
    };
    ByteArray.prototype.writeBoolean = function (value) {
        this.writeByte(value ? 1 : 0);
    };
    ByteArray.prototype.writeByte = function (value) {
        if (!this.canWrite(1)) {
            this.scaleBuffer(1);
        }
        this.buffer.writeInt8(value, this.writePosition);
        this.writePosition += 1;
    };
    ByteArray.prototype.writeBytes = function (buffer, offset, length) {
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = 0; }
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
            for (var i = offset; i < length; i++) {
                this.writeByte(buffer[i]);
            }
        }
    };
    ByteArray.prototype.writeDouble = function (value) {
        if (!this.canWrite(8)) {
            this.scaleBuffer(8);
        }
        this.endian
            ? this.buffer.writeDoubleBE(value, this.writePosition)
            : this.buffer.writeDoubleLE(value, this.writePosition);
        this.writePosition += 8;
    };
    ByteArray.prototype.writeFloat = function (value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeFloatBE(value, this.writePosition)
            : this.buffer.writeFloatLE(value, this.writePosition);
        this.writePosition += 4;
    };
    ByteArray.prototype.writeInt = function (value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeInt32BE(value, this.writePosition)
            : this.buffer.writeInt32LE(value, this.writePosition);
        this.writePosition += 4;
    };
    ByteArray.prototype.writeMultiByte = function (value, charSet) {
        if (charSet === void 0) { charSet = "utf8"; }
        var length = Buffer.byteLength(value);
        if (!this.canWrite(length)) {
            this.scaleBuffer(length);
        }
        if (Buffer.isEncoding(charSet)) {
            this.buffer.write(value, this.writePosition, length, charSet);
            this.writePosition += length;
        }
    };
    ByteArray.prototype.writeShort = function (value) {
        if (!this.canWrite(2)) {
            this.scaleBuffer(2);
        }
        this.endian
            ? this.buffer.writeInt16BE(value, this.writePosition)
            : this.buffer.writeInt16LE(value, this.writePosition);
        this.writePosition += 2;
    };
    ByteArray.prototype.writeUnsignedByte = function (value) {
        if (!this.canWrite(1)) {
            this.scaleBuffer(1);
        }
        this.buffer.writeUInt8(value, this.writePosition);
        this.writePosition += 1;
    };
    ByteArray.prototype.writeUnsignedInt = function (value) {
        if (!this.canWrite(4)) {
            this.scaleBuffer(4);
        }
        this.endian
            ? this.buffer.writeUInt32BE(value, this.writePosition)
            : this.buffer.writeUInt32LE(value, this.writePosition);
        this.writePosition += 4;
    };
    ByteArray.prototype.writeUnsignedShort = function (value) {
        if (!this.canWrite(2)) {
            this.scaleBuffer(2);
        }
        this.endian
            ? this.buffer.writeUInt16BE(value, this.writePosition)
            : this.buffer.writeUInt16LE(value, this.writePosition);
        this.writePosition += 2;
    };
    ByteArray.prototype.writeUTF = function (value) {
        var length = Buffer.byteLength(value);
        if (length > 65535) {
            throw new RangeError("Length can't be greater than 65535");
        }
        if (!this.canWrite(length)) {
            this.scaleBuffer(length);
        }
        this.writeUnsignedShort(length);
        this.buffer.write(value, this.writePosition, length);
        this.writePosition += length;
    };
    ByteArray.prototype.writeUTFBytes = function (value) {
        this.writeMultiByte(value);
    };
    ByteArray.prototype.copyBytes = function (buffer, offset, length) {
        if (offset === void 0) { offset = 0; }
        if (length === void 0) { length = 0; }
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
            for (var i = offset; i < length; i++) {
                this.writeUnsignedByte(buffer[i]);
            }
        }
    };
    ByteArray.prototype.advanceReadPositionBy = function (value) {
        this.readPosition += value;
    };
    return ByteArray;
}());
exports.default = ByteArray;
//# sourceMappingURL=ByteArray.js.map