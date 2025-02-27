import {text} from "../crc32"
import {default as van} from "../../third/van-1.5.3.min"
import {CaseHelper, Func, Helper} from "./types";
export {default as van} from "../../third/van-1.5.3.min"
export * as vanX from "../../third/van-x-0.6.2"
export const $substring = 'substring'
export const $indexOf = 'indexOf'
export const $replace = 'replace'
export const $replaceAll = 'replaceAll'
export const $querySelector = 'querySelector'
export const $startsWith = 'startsWith'
export const $getBoundingClientRect = 'getBoundingClientRect'
export const $documentElement = 'documentElement'
export const $createElement = 'createElement'
export const $getElementById = 'getElementById'
export const $scrollTo = 'scrollTo'
export const $location = 'location'
export const $search = 'search'

export const build = 'build'
export const builder = '_builder'
export const $keys = Object.keys
export const assign = Object.assign
export const proto = Object.getPrototypeOf
export const get = Reflect.get


export const isAsync = (fn: any) => fn && typeof fn === 'function' && fn.constructor?.name === 'AsyncFunction'
export const isState = (v: any) => v && typeof v === 'object' && proto(v) === stateProto
export const hasBuilder = (_, s) => s === builder || s === build
export const crc32 = v => text(v, 0xFFF).toString(16)

export const stateProto = proto(van.state())

export const log=console.log
export const words = (s: string):string[] => s?.[$replace]?.(/['\u2019]/g, '')?.match(/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g) ?? []
export const capitalize = (s: string) => s?.substring(0, 1).toUpperCase() + s.substring(1)
export const kebabCase = (s: string) => words(s).reduce((r, w, i) => r + (i ? '-' : '') + w.toLowerCase(), '')
export const camelCase = (s: string) => words(s).reduce((r, w, i) => r + i ? capitalize(w.toLowerCase()) : w.toLowerCase(), '')
export const pascalCase = (s: string) => words(s).reduce((r, w, i) => r + capitalize(w.toLowerCase()), '')

export const baseElement = () => document[$querySelector]('base')
export const baseUrl = (base: string = '') => {
    if (!base) {
        let baseEl = baseElement()
        base = ((baseEl && baseEl.getAttribute('href')) || '/')[$replace](/^\w+:\/\/[^\/]+/, '')
    }
    if (base[0] !== '/' && base[0] !== '#') base = '/' + base
    return base[$replace](/\/$/, '')
}
export const curry = (func: Function) =>
    function curried(...args: any[]) {
        return args.length >= func.length
            ? func.apply(this, args)
            : (...args2: any[]) => curried.apply(this, args.concat(args2))
    }

export const pipe = <T extends Func, U extends Func[], R extends Func>
(...fns: [T, ...U, R]): (...args:[...Parameters<T>]) => ReturnType<R> =>
    fns.reduce((f, g) => (...args: [...Parameters<T>]) => g(f(...args)))
export const compose = <T extends Func, U extends Func[], R extends Func>
(...fns: [T, ...U, R]): (...args: [...Parameters<T>]) => ReturnType<R> =>
    fns.reduceRight((f, g) => (...args: [...Parameters<T>]) => f(g(...args)))

export const helper: Helper = {
    crc32,
    isAsync,
    isState,
    pipe,
    compose,
    curry,

}
export const cases :CaseHelper= {
    kebab: kebabCase,
    camel: camelCase,
    pascal: pascalCase, words
}

