/**
 * 长整形
 */
export interface Long {
    low: number
    high: number
    unsigned: boolean
}


/**
 * Protobuf 序列读取
 */
export class Reader {
    public static create(buffer: Uint8Array ): Reader


    constructor(buf: Uint8Array )


    uint32(): number

    int32(): number

    sint32(): number

    bool(): boolean

    fixed32(): number

    sfixed32(): number

    float(): number

    double(): number

    bytes(): number

    string(): number

    /**
     * Skips the specified number of bytes if specified, otherwise skips a varint.
     * @param {number?} [length] Length if known, otherwise a varint is assumed
     * @returns {Reader} `this`
     */
    skip(length?: number): Reader

    int64(long: boolean): number | Long

    uint64(long: boolean): number | Long

    sint64(long: boolean): number | Long

    fixed64(long: boolean): number | Long

    sfixed64(long: boolean): number | Long
}

/**
 * Protobuf 序列写入
 */
export class Writer {
    public static create(): Writer

    public static alloc(size?: number): Uint8Array

    /**
     * Current length.
     * @type {number}
     */
    public len: number

    constructor()

    uint32(value: number): Writer

    int32(value: number): Writer

    sint32(value: number): Writer

    uint64(value: Long | number | string): Writer

    int64(value: Long | number | string): Writer

    sint64(value: Long | number | string): Writer

    bool(value: boolean): Writer

    fixed32(value: number): Writer

    sfixed32(value: number): Writer

    fixed64(value: Long | number | string): Writer

    sfixed64(value: Long | number | string): Writer

    float(value: number): Writer

    double(value: number): Writer

    bytes(value: Uint8Array | string): Writer

    string(value: string): Writer

    fork(): Writer

    reset(): Writer

    ldelim(): Writer

    finish(): Uint8Array
}

export const base64: {
    /**
     * compute binary length of base64 code
     * @param b64 base64 encoded string
     */
    length(b64: string): number
    /**
     * encode Binary to string same as window.btoa
     * @param buffer {Uint8Array}
     * @param start {number}
     * @param end {number}
     * @return {string}
     */
    encode(buffer: Uint8Array, start: number, end: number): string
    /**
     * decode b64 into buf
     * @param b64 {string} base64 encoded string
     * @param buffer {Uint8Array} the output buffer
     * @param offset {number} offset in buffer
     * @return {number} consumed bytes
     */
    decode(b64: string, buffer: Uint8Array, offset: number): number
}

/**
 * decode base64 encoded binary buffer to object
 * @param {Uint8Array} buf the binary data
 * @return {Record<string,any>} record
 *
 */
export function decodeBuffer(buf: Uint8Array): Record<string, any>

/**
 * decode base64 encoded binary buffer to object
 * @param {string} code the binary data
 * @return {Record<string,any>} record
 *
 */
export function decode(code: string): Record<string, any>

/**
 * encode a json object into writer and output as base64 encoded binary buffer
 * @param {Writer} w a writer
 * @param {Record<string,any>} record the record to append to
 * @return {string} code
 */
export function encodeInto(w: Writer, record: Record<string, any>): string

/**
 * encode a json object as base64 encoded binary buffer
 * @param {Record<string,any>} record to serialize
 * @return {string} code
 */
export function encode(record: Record<string, any>): string

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
