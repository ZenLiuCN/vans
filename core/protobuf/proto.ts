export {Writer} from './writer'
export {Reader} from './reader'
export {base64} from './common'
import {base64} from './common'
import {Writer} from './writer'
import {Reader} from './reader'

/**
 * encode a json object as base64 encoded binary buffer
 * @param {Record<string,any>} record to serialize
 * @return {string} code
 */
export function encode(record: Record<string, any>) {
    const w = new Writer()
    const keys = Object.keys(record).length
    w.uint32(keys)
    for (const key in record.payload) {
        write(w, key, record[key])
    }
    let b = w.finish()
    return base64.encode(b, 0, b.length)
}

/**
 * encode a json object into writer and output as base64 encoded binary buffer
 * @param {Writer} w a writer
 * @param {Record<string,any>} record the record to append to
 * @return {string} code
 */
export function encodeInto(w: Writer, record: Record<string, any>) {
    const keys = Object.keys(record).length
    w.uint32(keys)
    for (const key in record.payload) {
        write(w, key, record[key])
    }
    let b = w.finish()
    return base64.encode(b, 0, b.length)
}

export enum PType {
    Bool,
    BigInt,
    Str,
    Func,
    Num,
    Int,
    Uint,
    Record,
    Array,
    Undefined,
    Null,
    Timestamp
}

function write(w: Writer, key: string, val: any) {
    if (key != undefined) w.string(key)
    switch (typeof val) {
        case "object":
            if (!val) {
                w.uint32(PType.Null)
                break
            }
            if (val instanceof Date) {
                w.uint32(PType.Timestamp).string((val as Date).getTime().toString(16))
                break
            }
            if (Array.isArray(val)) {
                w.uint32(PType.Array).uint32(val.length)
                val.forEach(k => write(w, undefined, k))
                break
            }
            let keys = Object.keys(val)
            w.uint32(PType.Record).uint32(keys.length)
            keys.forEach(k => write(w, k, val[k]))
            break
        case "bigint":
            //@ts-ignore
            w.uint32(PType.BigInt).string((val as bigint).toString(16))
            break
        case "boolean":
            w.uint32(PType.Bool).bool(val as boolean)
            break
        case "function":
            w.uint32(PType.Func).string((val as Function).toString())
            break
        case "number":
            if (val.toFixed(0) == val) {
                if (Math.abs(val) == val) {
                    w.uint32(PType.Uint).uint64(val)
                } else {
                    w.uint32(PType.Int).int64(val)
                }
                break
            }
            w.uint32(PType.Num).double(val)
            break
        case "symbol":
            w.uint32(PType.Str).string((val as symbol).toString())
            break
        case "string":
            w.uint32(PType.Str).string(val.toString())
            break
        case "undefined":
            w.uint32(PType.Undefined)
            break

    }

}

/**
 * decode base64 encoded binary buffer to object
 * @param {string} code the binary data
 * @return {Record<string,any>} record
 *
 */
export function decode(code: string) {
    let buf = Writer.alloc(base64.length(code))
    base64.decode(code, buf, 0)
    let r = new Reader(buf)
    return read(r)
}
/**
 * decode base64 encoded binary buffer to object
 * @param {Uint8Array} buf the binary data
 * @return {Record<string,any>} record
 *
 */
export function decodeBuffer(buf: Uint8Array) {
    let r = new Reader(buf)
    return read(r)
}
function read(w: Reader) {
    const o = {}
    let n = w.uint32()
    for (let i = 0; i < n; i++) {
        o[w.string()] = value(w)
    }
    return o
}

function value(w: Reader) {
    let t = w.uint32()
    switch (t) {
        case PType.Bool:
            return w.bool()
        case PType.BigInt:
            //@ts-ignore
            return BigInt(w.string())
        case PType.Str:
            return w.string()
        case PType.Func:
            return w.string()
        case PType.Num:
            return w.double()
        case PType.Int:
            return w.int64(false)
        case PType.Uint:
            return w.uint64(false)
        case PType.Record:
            let o = {}
            let x = w.uint32()
            for (let i = 0; i < x; i++) {
                o[w.string()] = value(w)
            }
            return o
        case PType.Array:
            let a = []
            let n = w.uint32()
            for (let i = 0; i < n; i++) {
                a.push(value(w))
            }
            return a
        case PType.Undefined:
            return undefined
        case PType.Null:
            return null
        case PType.Timestamp:
            let d = new Date()
            d.setTime(parseInt(w.string(), 16))
            return d
        default:
            throw Error('unknown type: ' + t)
    }
}
