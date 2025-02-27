// a copy impl of protobuf reader
import {LongBits, float, utf8, WireType, Long} from "./common";

function indexOutOfRange(reader, writeLength?) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    let bits = new LongBits(0, 0);
    let i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

export class Reader {
    public static create(buffer: Uint8Array ): Reader {
        return new Reader(buffer)
    }

    public pos: number = 0
    public len: number = 0

    constructor(public buf: Uint8Array ) {
        this.len = buf.length;
    }

    private _slice = Uint8Array.prototype.subarray
    uint32 = (function () {
        let value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
        return function () {
            value = (this.buf[this.pos] & 127) >>> 0;
            if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
            if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
            if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
            if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
            if (this.buf[this.pos++] < 128) return value;
            if ((this.pos += 5) > this.len) {
                this.pos = this.len;
                throw indexOutOfRange(this, 10);
            }
            return value;
        };
    })()

    int32(): number {
        return this.uint32() | 0
    }

    sint32(): number {
        const value = this.uint32();
        return value >>> 1 ^ -(value & 1) | 0;
    }

    bool(): boolean {
        return this.uint32() !== 0;
    }
    static  readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
        return (buf[end - 4]
            | buf[end - 3] << 8
            | buf[end - 2] << 16
            | buf[end - 1] << 24) >>> 0;
    }
    fixed32(): number {
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);
        return Reader.readFixed32_end(this.buf, this.pos += 4);
    }

    sfixed32(): number {
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);
        return Reader.readFixed32_end(this.buf, this.pos += 4) | 0;
    }

    float() {
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);
        const value = float.readFloatLE(this.buf, this.pos);
        this.pos += 4;
        return value;
    }
    double() {
        if (this.pos + 8 > this.len) throw indexOutOfRange(this, 4);
        const value = float.readDoubleLE(this.buf, this.pos);
        this.pos += 8;
        return value;
    };
    bytes() {
        let length = this.uint32(),
            start = this.pos,
            end = this.pos + length;
        if (end > this.len)
            throw indexOutOfRange(this, length);

        this.pos += length;
        if (Array.isArray(this.buf)) // plain array
            return this.buf.slice(start, end);

        if (start === end) { // fix for IE 10/Win8 and others' subarray returning array of size 1
            return new Uint8Array(0)
        }
        return this._slice.call(this.buf, start, end);
    }
    string() {
        let bytes = this.bytes();
        return utf8.read(bytes, 0, bytes.length);
    }
    /**
     * Skips the specified number of bytes if specified, otherwise skips a varint.
     * @param {number?} [length] Length if known, otherwise a varint is assumed
     * @returns {Reader} `this`
     */
    skip(length?:number):Reader {
        if (typeof length === "number") {
            if (this.pos + length > this.len)
                throw indexOutOfRange(this, length);
            this.pos += length;
        } else {
            do {
                if (this.pos >= this.len)
                    throw indexOutOfRange(this);
            } while (this.buf[this.pos++] & 128);
        }
        return this;
    }
    skipType(wireType:WireType) :Reader{
        switch (wireType) {
            case 0:
                this.skip();
                break;
            case 1:
                this.skip(8);
                break;
            case 2:
                this.skip(this.uint32());
                break;
            case 3:
                while ((wireType = this.uint32() & 7) !== 4) {
                    this.skipType(wireType);
                }
                break;
            case 5:
                this.skip(4);
                break;
            default:
                throw Error("invalid wire type " + wireType + " at offset " + this.pos);
        }
        return this;
    }

    int64(long:boolean):number|Long {
        return readLongVarint.call(this)[long?ln:num](false);
    }

    uint64(long:boolean):number|Long {
        return readLongVarint.call(this)[long?ln:num](true);
    }

    sint64(long:boolean):number |Long{
        return readLongVarint.call(this).zzDecode()[long?ln:num](false);
    }

    fixed64(long:boolean):number|Long {
        return readFixed64.call(this)[long?ln:num](true);
    }

    sfixed64(long:boolean):number|Long {
        return readFixed64.call(this)[long?ln:num](false);
    }


}
const ln='toLong'
const num='toNumber'
function readFixed64() {
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);
    return new LongBits(Reader.readFixed32_end(this.buf, this.pos += 4), Reader.readFixed32_end(this.buf, this.pos += 4));
}







