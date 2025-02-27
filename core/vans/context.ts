import {ChildDom, Component, Configurer, Context, ContextBuildFunc, FuncRefer, ModuleLoader} from "./types";
import {assign, get, van, vanX} from "./util";
import loader from "./loader";
import shared from "./shared";


export const factory= (units:Record<string|symbol, any>, h: Record<string, any> = {},c?: Configurer, m?: ModuleLoader):Context=>
    new Proxy(assign({
        conf: c ?? {shadow: false},
        components: (h.c ?? (h.c = {}, h.c)) as { [key: string]: Component },
        modules: m ?? loader(h.m ?? (h.m = {}, h.m)),
        shared: shared(h),
        _ns: h.ns ?? (h.ns = {}, h.ns),
        _tags: h.ts ?? (h.ts = {}, h.ts),
    }, van, vanX), {
        get: (_, name, __) => {
            switch (name) {
                case 'may':
                    return (c: ChildDom, p?: Element, shadow?: boolean): Element | ChildDom => {
                        let sh= shadow!==undefined?shadow:_.conf.shadow
                        if (sh) {
                            p = p ?? van.tags.main()
                            let root = p.shadowRoot
                            if (!root) root = p.attachShadow({mode: "open"})
                            root.appendChild(van.tags.main(c))
                            return p
                        } else {
                            return (p ? van.add : (_, v) => v)(p, c)
                        }
                    }
                case 'namespace':
                    return s => {
                        if (_._ns[s]) return _._ns[s]
                        _._ns[s] = _.tags(s)
                        return _._ns[s]
                    }
                case 'make':
                    return (m, s) => {
                        let f = (s ?? 'd') + '/' + m
                        if (_._tags[f]) return _._tags[f]
                        const t = !!s ? __.namespace(s) : _.tags
                        _._tags[f] = t[m]
                        return _._tags[f]
                    }
                case 'lookup':
                    return (id: FuncRefer | string) => {
                        id = id.substring(2)
                        if (id.indexOf('.') > -1) {
                            const [mod, name] = id.split('.')
                            return _.modules[mod][name]
                        } else {
                            return undefined
                        }
                    }
                default:
                    if (name in units) return units[name]
                    return get(_, name, __)
            }
        },
        set: () => false,
        deleteProperty: () => false,
    })  as any as Context
export const binder=(units:Record<string|symbol, any>):ContextBuildFunc=>factory.bind(undefined,units)
