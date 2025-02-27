const charCodeAt = String.prototype.charCodeAt
const fromCharCode = String.fromCharCode;

export const MaxInt=4294967296
export const utf8 = {
    length(string) {
        let len = 0,
            c = 0;
        for (let i = 0; i < string.length; ++i) {
            c = charCodeAt.call(string, i)
            if (c < 128)
                len += 1;
            else if (c < 2048)
                len += 2;
            else if ((c & 0xFC00) === 0xD800 && (charCodeAt.call(string, i + 1) & 0xFC00) === 0xDC00) {
                ++i;
                len += 4;
            } else
                len += 3;
        }
        return len;
    }

    , read(buffer, start, end) {
        if (end - start < 1) {
            return "";
        }

        let str = "";
        for (let i = start; i < end;) {
            let t = buffer[i++];
            if (t <= 0x7F) {
                str += fromCharCode(t);
            } else if (t >= 0xC0 && t < 0xE0) {
                str += fromCharCode((t & 0x1F) << 6 | buffer[i++] & 0x3F);
            } else if (t >= 0xE0 && t < 0xF0) {
                str += fromCharCode((t & 0xF) << 12 | (buffer[i++] & 0x3F) << 6 | buffer[i++] & 0x3F);
            } else if (t >= 0xF0) {
                let t2 = ((t & 7) << 18 | (buffer[i++] & 0x3F) << 12 | (buffer[i++] & 0x3F) << 6 | buffer[i++] & 0x3F) - 0x10000;
                str += fromCharCode(0xD800 + (t2 >> 10));
                str += fromCharCode(0xDC00 + (t2 & 0x3FF));
            }
        }

        return str;
    }

    , write(string, buffer, offset) {
        let start = offset,
            c1, // character 1
            c2; // character 2
        for (let i = 0; i < string.length; ++i) {
            c1 = charCodeAt.call(string, i)
            if (c1 < 128) {
                buffer[offset++] = c1;
            } else if (c1 < 2048) {
                buffer[offset++] = c1 >> 6 | 192;
                buffer[offset++] = c1 & 63 | 128;
            } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = charCodeAt.call(string, i + 1)) & 0xFC00) === 0xDC00) {
                c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
                ++i;
                buffer[offset++] = c1 >> 18 | 240;
                buffer[offset++] = c1 >> 12 & 63 | 128;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            } else {
                buffer[offset++] = c1 >> 12 | 224;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            }
        }
        return offset - start;
    }
}
export const isString = (value) => typeof value === "string" || value instanceof String
export interface Long {
    low: number
    high: number
    unsigned: boolean
}

export class LongBits {
    static zeroHash = "\0\0\0\0\0\0\0\0";
    static zero = new LongBits(0, 0)

    lo: number
    hi: number

    constructor(lo, hi) {
        /**
         * Low bits.
         * @type {number}
         */
        this.lo = lo >>> 0;

        /**
         * High bits.
         * @type {number}
         */
        this.hi = hi >>> 0;
    }

    /**
     * Constructs new long bits from the specified number.
     * @param {number} value Value
     * @returns {LongBits} Instance
     */
    static fromNumber(value) {
        if (value === 0)
            return LongBits.zero;
        let sign = value < 0;
        if (sign)
            value = -value;
        let lo = value >>> 0,
            hi = (value - lo) / MaxInt >>> 0;
        if (sign) {
            hi = ~hi >>> 0;
            lo = ~lo >>> 0;
            if (++lo > 4294967295) {
                lo = 0;
                if (++hi > 4294967295)
                    hi = 0;
            }
        }
        return new LongBits(lo, hi);
    }

    /**
     * Constructs new long bits from a number, long or string.
     * @param {Long|number|string} value Value
     * @returns {LongBits} Instance
     */
    static from(value) {
        if (typeof value === "number")
            return LongBits.fromNumber(value);
        if (isString(value)) {
            return LongBits.fromNumber(parseInt(value, 10));
        }
        return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : LongBits.zero;
    }

    /**
     * Converts this long bits to a possibly unsafe JavaScript number.
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {number} Possibly unsafe number
     */
    toNumber(unsigned:boolean):number {
        if (!unsigned && this.hi >>> 31) {
            let lo = ~this.lo + 1 >>> 0,
                hi = ~this.hi >>> 0;
            if (!lo)
                hi = hi + 1 >>> 0;
            return -(lo + hi * MaxInt);
        }
        return this.lo + this.hi * MaxInt;
    }

    /**
     * Converts this long bits to a long.
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {Long} Long
     */
    toLong(unsigned:boolean):Long {
        return {low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned)}
    }

    /**
     * Constructs new long bits from the specified 8 characters long hash.
     * @param {string} hash Hash
     * @returns {LongBits} Bits
     */
    fromHash(hash) {
        if (hash === LongBits.zeroHash)
            return LongBits.zero;
        return new LongBits(
            (charCodeAt.call(hash, 0)
                | charCodeAt.call(hash, 1) << 8
                | charCodeAt.call(hash, 2) << 16
                | charCodeAt.call(hash, 3) << 24) >>> 0
            ,
            (charCodeAt.call(hash, 4)
                | charCodeAt.call(hash, 5) << 8
                | charCodeAt.call(hash, 6) << 16
                | charCodeAt.call(hash, 7) << 24) >>> 0
        );
    }

    /**
     * Converts this long bits to a 8 characters long hash.
     * @returns {string} Hash
     */
    toHash() {
        return String.fromCharCode(
            this.lo & 255,
            this.lo >>> 8 & 255,
            this.lo >>> 16 & 255,
            this.lo >>> 24,
            this.hi & 255,
            this.hi >>> 8 & 255,
            this.hi >>> 16 & 255,
            this.hi >>> 24
        );
    }

    /**
     * Zig-zag encodes this long bits.
     * @returns {LongBits} `this`
     */
    zzEncode() {
        let mask = this.hi >> 31;
        this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
        this.lo = (this.lo << 1 ^ mask) >>> 0;
        return this;
    }

    /**
     * Zig-zag decodes this long bits.
     * @returns {LongBits} `this`
     */
    zzDecode() {
        let mask = -(this.lo & 1);
        this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
        this.hi = (this.hi >>> 1 ^ mask) >>> 0;
        return this;
    }

    /**
     * Calculates the length of this longbits when encoded as a varint.
     * @returns {number} Length
     */
    length() {
        let part0 = this.lo,
            part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
            part2 = this.hi >>> 24;
        return part2 === 0
            ? part1 === 0
                ? part0 < 16384
                    ? part0 < 128 ? 1 : 2
                    : part0 < 2097152 ? 3 : 4
                : part1 < 16384
                    ? part1 < 128 ? 5 : 6
                    : part1 < 2097152 ? 7 : 8
            : part2 < 128 ? 9 : 10;
    }
}

LongBits.zero.toNumber = function () {
    return 0;
}
LongBits.zero.zzDecode = function () {
    return this;
}
LongBits.zero.zzEncode = LongBits.zero.zzDecode
LongBits.zero.length = function () {
    return 1;
}

export const base64 = (() => {
    const invalidEncoding = "invalid encoding"
// Base64 encoding table
    const b64 = new Array(64);

// Base64 decoding table
    const s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
    for (let i = 0; i < 64;)
        s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    return {
        /**
         * compute binary length of base64 code
         * @param string {string}
         */
        length(string) {
            let p = string.length;
            if (!p)
                return 0;
            let n = 0;
            while (--p % 4 > 1 && string.charAt(p) === "=")
                ++n;
            return Math.ceil(string.length * 3) / 4 - n;
        }
        ,
        /**
         * encode Binary to string same as window.btoa
         * @param buffer {Uint8Array}
         * @param start {number}
         * @param end {number}
         * @return {string}
         */
        encode(buffer, start, end) {
            let parts = null,
                chunk = [];
            let i = 0, // output index
                j = 0, // goto index
                t;     // temporary
            while (start < end) {
                let b = buffer[start++];
                switch (j) {
                    case 0:
                        chunk[i++] = b64[b >> 2];
                        t = (b & 3) << 4;
                        j = 1;
                        break;
                    case 1:
                        chunk[i++] = b64[t | b >> 4];
                        t = (b & 15) << 2;
                        j = 2;
                        break;
                    case 2:
                        chunk[i++] = b64[t | b >> 6];
                        chunk[i++] = b64[b & 63];
                        j = 0;
                        break;
                }
                if (i > 8191) {
                    (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
                    i = 0;
                }
            }
            if (j) {
                chunk[i++] = b64[t];
                chunk[i++] = 61;
                if (j === 1)
                    chunk[i++] = 61;
            }
            if (parts) {
                if (i)
                    parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
                return parts.join("");
            }
            return String.fromCharCode.apply(String, chunk.slice(0, i));
        }
        ,
        /**
         * decode src into buf
         * @param string {string}
         * @param buffer {Uint8Array}
         * @param offset {number} offset in buffer
         * @return {number} consumed bytes
         */
        decode(string, buffer, offset) {
            let start = offset;
            let j = 0, // goto index
                t;     // temporary
            for (let i = 0; i < string.length;) {
                let c = string.charCodeAt(i++);
                if (c === 61 && j > 1)
                    break;
                if ((c = s64[c]) === undefined)
                    throw Error(invalidEncoding);
                switch (j) {
                    case 0:
                        t = c;
                        j = 1;
                        break;
                    case 1:
                        buffer[offset++] = t << 2 | (c & 48) >> 4;
                        t = c;
                        j = 2;
                        break;
                    case 2:
                        buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                        t = c;
                        j = 3;
                        break;
                    case 3:
                        buffer[offset++] = (t & 3) << 6 | c;
                        j = 0;
                        break;
                }
            }
            if (j === 1)
                throw Error(invalidEncoding);
            return offset - start;
        }
    }
})()
export const float = (() => {
    const f32 = new Float32Array([-0]),
        f8b = new Uint8Array(f32.buffer),
        le = f8b[3] === 128;

    const writeFloat_f32_cpy = (val, buf, pos) => {
        f32[0] = val;
        buf[pos] = f8b[0];
        buf[pos + 1] = f8b[1];
        buf[pos + 2] = f8b[2];
        buf[pos + 3] = f8b[3];
    }

    const writeFloat_f32_rev = (val, buf, pos) => {
        f32[0] = val;
        buf[pos] = f8b[3];
        buf[pos + 1] = f8b[2];
        buf[pos + 2] = f8b[1];
        buf[pos + 3] = f8b[0];
    }

    const readFloat_f32_cpy = (buf, pos) => {
        f8b[0] = buf[pos];
        f8b[1] = buf[pos + 1];
        f8b[2] = buf[pos + 2];
        f8b[3] = buf[pos + 3];
        return f32[0];
    }

    const readFloat_f32_rev = (buf, pos) => {
        f8b[3] = buf[pos];
        f8b[2] = buf[pos + 1];
        f8b[1] = buf[pos + 2];
        f8b[0] = buf[pos + 3];
        return f32[0];
    }

    const f64 = new Float64Array([-0]),
        d8b = new Uint8Array(f64.buffer),
        dle = d8b[7] === 128;

    const writeDouble_f64_cpy = (val, buf, pos) => {
        f64[0] = val
        buf[pos] = d8b[0]
        buf[pos + 1] = d8b[1]
        buf[pos + 2] = d8b[2]
        buf[pos + 3] = d8b[3]
        buf[pos + 4] = d8b[4]
        buf[pos + 5] = d8b[5]
        buf[pos + 6] = d8b[6]
        buf[pos + 7] = d8b[7]
    }

    const writeDouble_f64_rev = (val, buf, pos) => {
        f64[0] = val
        buf[pos] = d8b[7]
        buf[pos + 1] = d8b[6]
        buf[pos + 2] = d8b[5]
        buf[pos + 3] = d8b[4]
        buf[pos + 4] = d8b[3]
        buf[pos + 5] = d8b[2]
        buf[pos + 6] = d8b[1]
        buf[pos + 7] = d8b[0]
    }

    const readDouble_f64_cpy = (buf, pos) => {
        d8b[0] = buf[pos];
        d8b[1] = buf[pos + 1];
        d8b[2] = buf[pos + 2];
        d8b[3] = buf[pos + 3];
        d8b[4] = buf[pos + 4];
        d8b[5] = buf[pos + 5];
        d8b[6] = buf[pos + 6];
        d8b[7] = buf[pos + 7];
        return f64[0];
    }
    const readDouble_f64_rev = (buf, pos) => {
        d8b[7] = buf[pos]
        d8b[6] = buf[pos + 1]
        d8b[5] = buf[pos + 2]
        d8b[4] = buf[pos + 3]
        d8b[3] = buf[pos + 4]
        d8b[2] = buf[pos + 5]
        d8b[1] = buf[pos + 6]
        d8b[0] = buf[pos + 7]
        return f64[0]
    }
    return {
        writeFloatLE: le ? writeFloat_f32_cpy : writeFloat_f32_rev,
        writeFloatBE: le ? writeFloat_f32_rev : writeFloat_f32_cpy,
        readFloatLE: le ? readFloat_f32_cpy : readFloat_f32_rev,
        readFloatBE: le ? readFloat_f32_rev : readFloat_f32_cpy,
        readDoubleLE: dle ? readDouble_f64_cpy : readDouble_f64_rev,
        readDoubleBE: dle ? readDouble_f64_rev : readDouble_f64_cpy,
        writeDoubleLE: dle ? writeDouble_f64_cpy : writeDouble_f64_rev,
        writeDoubleBE: dle ? writeDouble_f64_rev : writeDouble_f64_cpy,
    }
})()
export const  pool=(alloc: (size: number) => Uint8Array, slice: Function, size?: number)=> {
    let SIZE = size || 8192;
    let MAX = SIZE >>> 1;
    let slab = null;
    let offset = SIZE;
    return (size: number) => {
        if (size < 1 || size > MAX)
            return alloc(size)
        if (offset + size > SIZE) {
            slab = alloc(SIZE)
            offset = 0
        }
        let buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf
    };
}
export type WireType=0|1|2|3|4|5|Exclude<number, 0|1|2|3|4|5>
export const Uint8ArrayPool= pool((size: number) => new Uint8Array(size), Uint8Array.prototype.subarray)
