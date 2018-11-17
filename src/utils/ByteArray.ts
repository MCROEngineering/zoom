/*

 * source       https://github.com/MCROEngineering/zoom/
 * @name        ByteArray
 * @package     ZoomDev
 * @author      Micky Socaci <micky@mcro.tech>
 * @license     MIT
 
 based on https://github.com/Zaseth/bytearray-node
*/

export default class ByteArray {

	public DEFAULT_SIZE:number = 2048;
	public start_size:number = 0;
	public writePosition:number = 0;
	public readPosition:number = 0;
	public endian:boolean = true;
	public buffer:Buffer;

	constructor(buffer: ByteArray | Buffer | number ) {

		if (buffer instanceof ByteArray) {
			this.buffer = buffer.buffer;
		} else if (Buffer.isBuffer(buffer)) {
			this.buffer = buffer;
		} else {
			if( typeof buffer === "number" ) {
				this.start_size = buffer;
			} else {
				this.start_size = this.DEFAULT_SIZE;
			}
			this.buffer = Buffer.alloc(this.start_size);
		}
	}

	public get bytesAvailable(): number {
		return this.buffer.length - this.readPosition;
	}

	public get length(): number {
		return this.buffer.length;
	}

	public clear(): void {
		this.buffer = Buffer.alloc(this.DEFAULT_SIZE);
		this.reset();
	}

	public reset(): void {
		this.writePosition = 0;
		this.readPosition = 0;
	}

	public canWrite(length: number): boolean {
		return this.length - this.writePosition >= length;
	}

	public scaleBuffer(length: number): void {
		const oldBuffer = this.buffer;
		this.buffer = Buffer.alloc(this.length + length);
		oldBuffer.copy(this.buffer);
	}

	public readBoolean(): boolean {
		return this.readByte() !== 0;
	}

	public readByte(): number {
		const value = this.buffer.readInt8(this.readPosition);
		this.readPosition += 1;
		return value;
	}

	public readBytes(buffer: ByteArray, offset: number = 0, length: number = 0): void {

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

	public readDouble(): number {
		const value = this.endian
			? this.buffer.readDoubleBE(this.readPosition)
			: this.buffer.readDoubleLE(this.readPosition);
		this.readPosition += 8;
		return value;
	}

	public readFloat(): number {
		const value = this.endian
			? this.buffer.readFloatBE(this.readPosition)
			: this.buffer.readFloatLE(this.readPosition);
		this.readPosition += 4;
		return value;
	}

	public readInt(): number {
		const value = this.endian
			? this.buffer.readInt32BE(this.readPosition)
			: this.buffer.readInt32LE(this.readPosition);
		this.readPosition += 4;
		return value;
	}

	public readMultiByte(length: number, charSet: string = "utf8"): string {
		const position = this.readPosition;
		this.readPosition += length;
		if (Buffer.isEncoding(charSet)) {
			return this.buffer.toString(charSet, position, position + length);
		} else {
			throw new Error("Cannot read multi byte. Buffer encoding does not match");
		}
	}

	public readShort(): number {
		const value = this.endian
			? this.buffer.readInt16BE(this.readPosition)
			: this.buffer.readInt16LE(this.readPosition);

		this.readPosition += 2;
		return value;
	}

	public readUnsignedByte(): number {
		const value = this.buffer.readUInt8(this.readPosition);
		this.readPosition += 1;
		return value;
	}

	public readUnsignedInt(): number {
		const value = this.endian
			? this.buffer.readUInt32BE(this.readPosition)
			: this.buffer.readUInt32LE(this.readPosition);

		this.readPosition += 4;
		return value;
	}

	public readUnsignedShort(): number {
		const value = this.endian
			? this.buffer.readUInt16BE(this.readPosition)
			: this.buffer.readUInt16LE(this.readPosition);

		this.readPosition += 2;
		return value;
	}

	public readUTF(): string {
		const length = this.readShort();
		const position = this.readPosition;
		this.readPosition += length;
		return this.buffer.toString("utf8", position, position + length);
	}

	public readUTFBytes(length: number): string {
		return this.readMultiByte(length);
	}

	public toJSON(): { type: "Buffer"; data: any[]; } {
		return this.buffer.toJSON();
	}

	public toString(charSet: string = "utf8", offset: number = 0, length: number = this.length): string {
		return this.buffer.toString(charSet, offset, length);
	}

	public writeBoolean(value: number | boolean): void {
		this.writeByte(value ? 1 : 0);
	}

	public writeByte(value: number): void {
		if (!this.canWrite(1)) {
			this.scaleBuffer(1);
		}

		this.buffer.writeInt8(value, this.writePosition);
		this.writePosition += 1;
	}

	public writeBytes(buffer: Buffer | ByteArray, offset: number = 0, length: number = 0): void {
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

	public writeDouble(value: number): void {
		if (!this.canWrite(8)) {
			this.scaleBuffer(8);
		}

		this.endian
			? this.buffer.writeDoubleBE(value, this.writePosition)
			: this.buffer.writeDoubleLE(value, this.writePosition);

		this.writePosition += 8;
	}

	public writeFloat(value: number): void {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4);
		}

		this.endian
			? this.buffer.writeFloatBE(value, this.writePosition)
			: this.buffer.writeFloatLE(value, this.writePosition);

		this.writePosition += 4;
	}

	public writeInt(value: number): void {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4);
		}

		this.endian
			? this.buffer.writeInt32BE(value, this.writePosition)
			: this.buffer.writeInt32LE(value, this.writePosition);

		this.writePosition += 4;
	}

	public writeMultiByte(value: string, charSet: string = "utf8"): void {
		const length = Buffer.byteLength(value)

		if (!this.canWrite(length)) {
			this.scaleBuffer(length);
		}

		if (Buffer.isEncoding(charSet)) {
			this.buffer.write(value, this.writePosition, length, charSet);
			this.writePosition += length;
		}
	}

	public writeShort(value: number): void {
		if (!this.canWrite(2)) {
			this.scaleBuffer(2);
		}

		this.endian
			? this.buffer.writeInt16BE(value, this.writePosition)
			: this.buffer.writeInt16LE(value, this.writePosition);

		this.writePosition += 2;
	}

	public writeUnsignedByte(value: number): void {
		if (!this.canWrite(1)) {
			this.scaleBuffer(1);
		}

		this.buffer.writeUInt8(value, this.writePosition);
		this.writePosition += 1;
	}

	public writeUnsignedInt(value: number): void {
		if (!this.canWrite(4)) {
			this.scaleBuffer(4);
		}

		this.endian
			? this.buffer.writeUInt32BE(value, this.writePosition)
			: this.buffer.writeUInt32LE(value, this.writePosition);

		this.writePosition += 4;
	}

	public writeUnsignedShort(value: number): void {
		if (!this.canWrite(2)) {
			this.scaleBuffer(2);
		}

		this.endian
			? this.buffer.writeUInt16BE(value, this.writePosition)
			: this.buffer.writeUInt16LE(value, this.writePosition);

		this.writePosition += 2;
	}

	public writeUTF(value: string): void {
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

	public writeUTFBytes(value: string): void {
		this.writeMultiByte(value);
	}

	public copyBytes(buffer: Buffer | ByteArray, offset: number = 0, length: number = 0): void {
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

	public advanceReadPositionBy(value: number) {
		this.readPosition += value;
	}
}
