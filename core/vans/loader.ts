import {LoaderBuildFunc, ModuleLoader} from "./types";
import {crc32, get} from "./util";
const makeModule = (o, id) => new Proxy(o, {get: (_, n, __) => n === 'hashId' ? id : get(_, n, __)})
const loaderMake:LoaderBuildFunc=  (cache = {}): ModuleLoader => new Proxy(cache, {
    get: (_, p: string | symbol, __) => {
        if (p === 'use') return async (i, u) => {
            let x = crc32(u)
            if (cache[x]) return cache[x]
            if (cache[i]) return cache[i]
            // @ts-ignore
            return (cache[i] = makeModule(await import(URL.createObjectURL(new Blob([u], {type: 'application/javascript'}))), x),
                cache[x] = cache[i],
                cache[i])
        }
        if (p === 'require') return async (i, u) => {
            let x = crc32(i)
            if (cache[x]) return cache[x]
            if (cache[u]) return cache[u]
            if (cache[i]) return cache[i]
            // @ts-ignore
            return (cache[u] = makeModule(await import(u), x),
                cache[x] = cache[u],
                cache[i] = cache[u],
                cache[u])
        }
        return get(_, p, __)
    },
    set: (_, name) => false
}) as ModuleLoader
export default loaderMake
