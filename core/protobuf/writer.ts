// a copy impl of protobuf writer
import {base64, float, isString, Long, LongBits, Uint8ArrayPool, utf8} from './common'

interface Operate {
    next: Operate | undefined
    fn: Operation

    len: number
    val: any
}

type Operation = (val: any, buf: Uint8Array, pos: number) => void

class Op implements Operate {
    next: Op | undefined

    constructor(public fn: Operation, public len: number, public val: any) {
        this.next = undefined
    }

}

class State {
    /**
     * Current head.
     */
    head: Operate
    /**
     * Current tail.
     */
    tail: Operate
    /**
     * Current buffer length.
     * @type {number}
     */
    len: number
    /**
     * Next state.
     * @type {State|null}
     */
    next: State

    constructor(writer: Writer) {
        this.head = writer.head
        this.tail = writer.tail
        this.len = writer.len
        this.next = writer.states
    }
}

class VarintOp implements Operate {
    next: Operate | undefined

    constructor(public len: number, public val: any) {
        this.next = undefined
    }

    fn = writeVarint32
}


const noop: Operation = (val, buf, pos) => {
}
const writeVarint64: Operation = (val, buf, pos) => {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0
        val.hi >>>= 7
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128
        val.lo = val.lo >>> 7
    }
    buf[pos++] = val.lo
}
const writeByte: Operation = (val, buf, pos) => {
    buf[pos] = val & 255
}
const writeVarint32: Operation = (val, buf, pos) => {
    while (val > 127) {
        buf[pos++] = val & 127 | 128
        val >>>= 7
    }
    buf[pos] = val
}
const writeFixed32: Operation = (val, buf, pos) => {
    buf[pos] = val & 255
    buf[pos + 1] = val >>> 8 & 255
    buf[pos + 2] = val >>> 16 & 255
    buf[pos + 3] = val >>> 24
}
const writeBytes: Operation = (val, buf, pos) => {
    buf.set(val, pos)
}


export class Writer {
    public static create(): Writer {
        return new Writer()
    }

    public static alloc = Uint8ArrayPool

    /**
     * Current length.
     * @type {number}
     */
    public len: number

    /**
     * Operations head.
     * @type {Object}
     */
    public head: Op
    /**
     * Operations tail
     * @type {Object}
     */
    public tail: Op
    /**
     * Linked forked states.
     * @type {Object|null}
     */
    public states: State | null

    constructor() {
        this.len = 0
        this.head = new Op(noop, 0, 0)
        this.tail = this.head
        this.states = null
    }

    private _push(fn, len, val) {
        this.tail = this.tail.next = new Op(fn, len, val)
        this.len += len
        return this
    }

    uint32(value: number): Writer {
        // here, the call to this.push has been inlined and a varint specific Op subclass is used.
        // uint32 is by far the most frequently used operation and benefits significantly from this.
        this.len += (this.tail = this.tail.next = new VarintOp(
            (value = value >>> 0)  < 0x80 ? 1
                : value < 0x4000 ? 2
                    : value < 0x200000 ? 3
                        : value < 0x10000000 ? 4
                            : 5,
            value)).len
        return this
    }

    int32(value: number): Writer {
        return value < 0
            ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
            : this.uint32(value)
    }

    sint32(value: number): Writer {
        return this.uint32((value << 1 ^ value >> 31) >>> 0)
    }

    uint64(value: Long | number | string): Writer {
        let bits = LongBits.from(value)
        return this._push(writeVarint64, bits.length(), bits)
    }

    int64 = this.uint64

    sint64(value: Long | number | string): Writer {
        let bits = LongBits.from(value).zzEncode()
        return this._push(writeVarint64, bits.length(), bits)
    }

    bool(value: boolean): Writer {
        return this._push(writeByte, 1, value ? 1 : 0)
    }

    fixed32(value: number): Writer {
        return this._push(writeFixed32, 4, value >>> 0)
    }

    sfixed32 = this.fixed32

    fixed64(value: Long | number | string): Writer {
        let bits = LongBits.from(value)
        return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi)
    }

    sfixed64 = this.fixed64

    float(value: number) {
        return this._push(float.writeFloatLE, 4, value)
    }

    double(value: number) {
        return this._push(float.writeDoubleLE, 8, value)
    }

    bytes(value: Uint8Array | string) {
        let len = value.length >>> 0
        if (!len) return this._push(writeByte, 1, 0)
        if (isString(value)) {
            let buf = Writer.alloc(len = base64.length(value))
            base64.decode(value, buf, 0)
            value = buf
        }
        return this.uint32(len)._push(writeBytes, len, value)
    }

    string(value: string) {
        let len = utf8.length(value)
        return len
            ? this.uint32(len)._push(utf8.write, len, value)
            : this._push(writeByte, 1, 0)
    }

    fork(): Writer {
        this.states = new State(this)
        this.head = this.tail = new Op(noop, 0, 0)
        this.len = 0
        return this
    }

    reset(): Writer {
        if (this.states) {
            this.head = this.states.head
            this.tail = this.states.tail
            this.len = this.states.len
            this.states = this.states.next
        } else {
            this.head = this.tail = new Op(noop, 0, 0)
            this.len = 0
        }
        return this
    }

    ldelim(): Writer {
        let head = this.head,
            tail = this.tail,
            len = this.len
        this.reset().uint32(len)
        if (len) {
            this.tail.next = head.next; // skip noop
            this.tail = tail
            this.len += len
        }
        return this
    }

    finish(): Uint8Array {
        let head = this.head.next, // skip noop
            buf = Writer.alloc(this.len),
            pos = 0
        while (head) {
            head.fn(head.val, buf, pos)
            pos += head.len
            head = head.next
        }
        // this.head = this.tail = null
        return buf
    }
}




