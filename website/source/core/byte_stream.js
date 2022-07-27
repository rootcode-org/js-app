// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class ByteStream {

    constructor(buffer=null) {
        // Start write buffer at 256 bytes and grow from there as needed
        if (!buffer) buffer = new ArrayBuffer(256);
        this.isLittleEndian = true;
        this.index = 0;
        this.buffer = buffer;
        this.bufferLength = buffer.byteLength;
        this.data = new DataView(this.buffer);          // this view is used for most read/write operations
        this.u8array = new Uint8Array(this.buffer);     // this view is used for string and byte array operations
    }

    reset() {
        this.index = 0;
    }

    setBuffer(buffer) {
        this.buffer = buffer;
        this.bufferLength = buffer.byteLength;
        this.data = new DataView(this.buffer);          // this view is used for most read/write operations
        this.u8array = new Uint8Array(this.buffer);     // this view is used for string and byte array operations
    }

    setBigEndian() {
        this.isLittleEndian = false;
    }

    getRawBuffer() {
        return this.buffer;
    }

    getWriteBuffer() {
        return this.buffer.slice(0, this.index);
    }

    getU8array() {
        return this.u8array;
    }

    getDataView() {
        return this.data;
    }

    getIndex() {
        return this.index;
    }

    _expandBuffer(expansionSize=0) {
        // Expand by the larger of the provided size or the existing buffer length
        expansionSize = expansionSize > this.bufferLength ? expansionSize : this.bufferLength;

        // Resize the buffer by creating a new buffer and copying the existing data
        let newBuffer = new ArrayBuffer(this.bufferLength + expansionSize);
        let oldBuffer = this.buffer;
        this.setBuffer(newBuffer);
        this.u8array.set(new Uint8Array(oldBuffer));
    }

    readByte() {
        let value = this.data.getUint8(this.index);
        this.index += 1;
        return value;
    }

    readShort() {
        let value = this.data.getUint16(this.index, this.isLittleEndian);
        this.index += 2;
        return value;
    }

    readInt() {
        let value = this.data.getUint32(this.index, this.isLittleEndian);
        this.index += 4;
        return value;
    }

    readLong() {
        let vl = this.data.getUint32(this.index, this.isLittleEndian);
        let vr = this.data.getUint32(this.index+4, this.isLittleEndian);
        this.index += 8;
        return (vl * 4294967296) + vr;
    }

    readFloat() {
        let value = this.data.getFloat32(this.index, this.isLittleEndian);
        this.index += 4;
        return value;
    }

    readDouble() {
        let value = this.data.getFloat64(this.index, this.isLittleEndian);
        this.index += 8;
        return value;
    }

    readBytes(length) {
        let value = this.buffer.slice(this.index, this.index + length);
        this.index += length;
        return value;
    }

    readVLUQ() {
        let accumulator = 0;
        let value = this.readByte();
        while (value > 0x7f) {
            accumulator += value & 0x7f;
            accumulator <<= 7;
            value = this.readByte();
        }
        return accumulator + value;
    }

    readVLSQ() {
        let value = this.readVLUQ();
        let sign = value & 1;
        value >>= 1;
        if (sign) return -value;
        else return value;
    }

    readString(length) {
        let stringView = this.u8array.slice(this.index, this.index + length);
        this.index += length;
        return String.fromCharCode.apply(null, stringView);
    }

    readNTString() {
        let i = this.index;
        while (this.u8array[i] !== 0) i++;
        let stringView = this.u8array.slice(this.index, i);
        this.index = i + 1;     // +1 to skip null terminator
        return String.fromCharCode.apply(null, stringView);
    }

    readVLUQString() {
        let length = this.readVLUQ();
        return this.readString(length);
    }

    writeByte(value) {
        if (this.index+1 > this.bufferLength) this._expandBuffer();
        this.data.setUint8(this.index, value);
        this.index += 1;
    }

    writeShort(value) {
        if (this.index+2 > this.bufferLength) this._expandBuffer();
        this.data.setUint16(this.index, value, this.isLittleEndian);
        this.index += 2;
    }

    writeInt(value) {
        if (this.index+4 > this.bufferLength) this._expandBuffer();
        this.data.setUint32(this.index, value, this.isLittleEndian);
        this.index += 4;
    }

    writeLong(value) {
        let vl = Math.floor(value / 4294967296);
        let vr = value & 0xffffffff;
        this.writeInt(vl);
        this.writeInt(vr);
    }

    writeFloat(value) {
        if (this.index+4 > this.bufferLength) this._expandBuffer();
        this.data.setFloat32(this.index, value, this.isLittleEndian);
        this.index += 4;
    }

    writeDouble(value) {
        if (this.index+8 > this.bufferLength) this._expandBuffer();
        this.data.setFloat64(this.index, value, this.isLittleEndian);
        this.index += 8;
    }

    writeBytes(array) {
        if (this.index + array.length > this.bufferLength) this._expandBuffer(array.length);
        this.u8array.set(array, this.index);
        this.index += array.length;
    }

    writeVLUQ(value) {
        let nbytes = 1;
        if (value > 0) nbytes = Math.floor(Math.log(value) / Math.log(128)) + 1;
        let shift = (nbytes - 1) * 7;
        while (shift > 0) {
            let bits = (value >> shift) & 0x7f;
            this.writeByte(bits + 0x80);
            shift -= 7;
        }
        this.writeByte(value & 0x7f);
    }

    writeVLSQ(value) {
        let sign = 0;
        if (value < 0) sign = 1;
        value = (Math.abs(value) << 1) + sign;
        this.writeVLUQ(value);
    }

    writeString(str) {
        for (let i = 0; i < str.length; i++) {
            this.writeByte(str.charCodeAt(i));
        }
    }

    writeNTString(str) {
        this.writeString(str);
        this.writeByte(0);
    }

    writeVLUQString(str) {
        this.writeVLUQ(str.length);
        this.writeString(str);
    }
}
