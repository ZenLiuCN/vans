import {Reactive, ShareStates, State} from "./types";

export const isShared = (v: string) => v.startsWith('$')
export const sharedKey = (v: string | symbol) => (typeof v == 'string' && isShared(v)) ? Symbol.for(v)
    : (typeof v == 'symbol' && isShared(v.description)) ? v : undefined
export default  (h: { s?: Map<symbol, State<any> | Reactive> } = {}): ShareStates =>
    new Proxy(h.s ?? (h.s = new Map(), h.s), {
        set: (_, name, val, __) => {
            let key = sharedKey(name)
            if (!key) return false
            if (val) h.s.set(key, val)
            else if (!val && h.s.has(key)) h.s.delete(key)
            return true
        },
        get: (_, name, __) => {
            let key = sharedKey(name)
            if (!key) return undefined
            return h.s.get(key)
        },
        deleteProperty: (_, name) => {
            let key = sharedKey(name)
            if (!key) return false
            if (h.s.has(key)) h.s.delete(key)
            return true
        }
    }) as any as ShareStates
