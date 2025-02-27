import {
    BindingFuncReference,
    ChildDom,
    ComponentFactory,
    Context,
    DeclareContext,
    ESModule,
    FuncComponent,
    ModuleSrc,
    Status,
    Primitive,
    Tag, TagName, DeclareComponent, Declare, BindingFunc, ComponentHelper
} from "./types";
import {$indexOf, $substring, get, $keys, van} from "./util";
import dom from "./dom";



const funcComponent = (dom: (c: Context, parent?: HTMLElement) => Promise<ChildDom>,
                       init:(c:Context,parent?:HTMLElement)=>Promise<void>,
                       free: (c: Context, parents?: HTMLElement[]) => Promise<void>): ComponentFactory<FuncComponent> =>
    async (ctx: Context) => ({
        context: ctx,
        async init(parent?: HTMLElement): Promise<void>{
            await init(ctx,parent)
        },
        async make(parent?: HTMLElement): Promise<ChildDom> {
            return await dom(ctx, parent)
        },
        async unload(parents?: HTMLElement[]): Promise<void> {
            return await free(ctx, parents)
        }
    })
const pfx = '=>'
const isFnRef = (v) => typeof v === "string" && v.startsWith(pfx)
const load = (name, v: string, ctx: Context) => v.indexOf('export') > -1 ? ctx.modules.use(name, v) : ctx.modules.require(name, v)
const make = async (id: string, ctx: Context, status: Status, o?: ModuleSrc | ModuleSrc[]): Promise<DeclareContext> => {
    switch (true) {
        case Array.isArray(o): {
            //@ts-ignore
            let cnt = 0, m: string = '', uses: Array<ModuleRefer> = []
            (o as ModuleSrc[]).forEach(x => {
                switch (typeof x) {
                    case "string":
                        if (cnt) throw TypeError('dump code')
                        cnt++
                        m = x
                        break
                    case "object":
                        if (x.name && x.url) {
                            uses.push(x)
                            return
                        }
                        throw TypeError(x.toString())
                    default:
                        throw TypeError(x.toString())
                }
            })
            await Promise.all(uses.map(x => load(x.name, x.url, ctx)))
            if (m) return makeContext(id, ctx, status, await load(id, m, ctx))
            return makeContext(id, ctx, status)
        }
        case typeof o === 'string':
            return makeContext(id, ctx, status, await load(id, o as string, ctx))
        //@ts-ignore
        case typeof o === 'object' && o.name && o.url:
            //@ts-ignore
            await load(o.name, o.url, ctx)
            return makeContext(id, ctx, status)
        default:
            return makeContext(id, ctx, status)
    }
}
const makeContext = (id: string, ctx: Context, status: Status, own = {}, m?: ESModule): DeclareContext => {
    const i = [new Proxy(ctx, {
        get: (_, name, __) => {
            if (name === 'id') return id
            if (name === 'instances') return i
            if (name === 'esm') return m
            if (name === 'own') return own
            if (name === 'status') return status
            if (name === 'clone') return (o) => {
                const x = makeContext(id, ctx, status, o, m)
                i.push(x)
                return x
            }
            if (name === 'lookupRefer') return fn => {
                if (fn[$indexOf]('.') > -1) {
                    return ctx.lookup(fn)
                }
                return m?.[fn[$substring](2)]
            }
            return get(_, name, __)
        }
    }) as DeclareContext]
    return i[0]
}
const parseProperty = (ctx: DeclareContext, p?: Record<string, any>) => {
    if (!p) return {}
    $keys(p).forEach(k => {
        const v = p[k]
        if (isFnRef(v))
            p[k] = ctx.lookupRefer(v)(ctx)
    })
    return p
}
const parse = (ctx: DeclareContext, v: Tag | TagName | BindingFuncReference | Primitive): ChildDom => {
    switch (typeof v) {
        case "string":
            return isFnRef(v) ? (ctx.lookup(v as BindingFuncReference)(ctx) as BindingFunc) : v
        case "object":
            return v.t ? ctx.make(v.t, v.ns)(parseProperty(ctx, v.p), ...(v.n && v.n.length ? v.n.map(x => parse(ctx, x)) : [])) : (v as any)
        default:
            return v
    }
}
const declare = async (d: string | Declare, ctx: Context): Promise<DeclareComponent> => {
    const dec = (typeof d === 'string' ? JSON.parse(d) : d) as Declare
    const status = Object.seal({owned: false, injected: false, instances: 0})
    const id = dec.i
    const c: DeclareContext = await make(id, ctx, status, dec.m)
    const {o: states, s: shares, n: tags, c: css} = dec
    if (shares) $keys(shares).forEach(k => {
        let v = shares[k]
        c[k] = isFnRef(v) ? c.lookupRefer(v)(ctx) : van.state(v)
    })
    const dc: DeclareComponent = {
        context: c,
        async init(parent?: HTMLElement): Promise<void>{
            c.esm?.init?.(c,parent)
        },
        async make(root?: HTMLElement): Promise<ChildDom> {
            let cx = status.instances > 0 ? c.clone({}) : c
            status.instances++
            if (states) $keys(states).forEach(k => {
                let v = states[k]
                //@ts-ignore
                cx.own[k] = isFnRef(v) ? cx.lookupRefer(v)(cx) : van.state(v)
            })
            if (css && css.length) {
                css.forEach(c => {
                    if (c.shadow && root && root.shadowRoot) {
                        dom.injectStyle(c.url, c.name, root.shadowRoot)
                    } else if (!status.injected) {
                        dom.injectStyle(c.url, c.name)
                    }
                })
                status.injected = true
            }
            return parse(cx, tags)
        },
        async unload(parents?: HTMLElement[]): Promise<void> {
            if (css && css.length) {
                css.forEach(c => {
                    if (c.shadow && parents && parents.length) {
                        parents.map(v => v.shadowRoot)
                            .filter(x => x)
                            .forEach(root => dom.uninjectStyle(c.url, c.name, root))
                    } else {
                        dom.uninjectStyle(c.url, c.name)
                    }
                })
            }
            c.esm?.unload?.(c,parents)
        },
    }
    ctx.components[dec.i] = dc
    return dc
}

export default {
    declare,
    pack:funcComponent
} as ComponentHelper
