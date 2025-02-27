import type {
    Component,
    ComponentFactory,
    Context,
    HistoryState,
    Locate,
    Path,
    Router,
    RouterHelper,
    RouterOption,
    To
} from "./types";

import {$querySelector, van,log} from "./util";
import dom from "./dom";

export enum Action {
    pop, push, replace
}

export const normalizeUrl = (s) => s ? s.replace(/([^:])\/\//g, '$1/') : s
export const parse = (p?: string): Partial<Path> => {
    if (p) {
        let parsed: Partial<Path> = {}
        let hashIndex = p.indexOf("#");
        if (hashIndex >= 0) {
            parsed.hash = p.substring(hashIndex);
            p = p.substring(0, hashIndex);
            let searchIndex = parsed.hash.indexOf("?")
            if (searchIndex >= 0) {
                parsed.search = parsed.hash.substring(searchIndex)
                parsed.hash = parsed.hash.substring(0, searchIndex)
            }
        }
        let searchIndex = p.indexOf("?");
        if (searchIndex >= 0) {
            parsed.search = p.substring(searchIndex);
            p = p.substring(0, searchIndex);
        }
        if (p) {
            parsed.pathname = p;
        }
        return parsed;
    }
    return {
        pathname: "/",
        search: "",
        hash: "",
    }

}
export const create = ({pathname = "/", search = "", hash = ""}: Partial<Path>): string => {
    if (search && search !== "?")
        pathname += search.charAt(0) === "?" ? search : "?" + search
    if (hash && hash !== "#")
        pathname += hash.charAt(0) === "#" ? hash : "#" + hash
    return pathname
}
const createKey = () => Math.random().toString(36).substring(2, 8)
export const createLocate = (current: string | Locate, to: To, state: unknown = null, key?: string): Readonly<Locate> => (
    {
        pathname: typeof current === "string" ? current : current.pathname,
        search: "",
        hash: "",
        ...(typeof to === "string" ? parse(to) : to),
        state,
        key: (to && (to as Locate).key) || key || createKey(),
    }
)
export const makeState = (locate: Locate, index: number): HistoryState => ({
    usr: locate.state,
    key: locate.key,
    idx: index,
})
const PopStateEventType = "popstate"
const HashChangeEventType = "hashchange"
export const namedMake = (option: RouterOption) => {
    let dbg=option?.debug??false
    let base = option.base ?? ''
    let src = option.src ?? ''
    let com = new Set(option.commons)
    let common = option.common ?? src
    let look = (n) => com.has(n) ? common : src
    return (to: To) => {
        if (!to || to === '/') {
            return ['index', normalizeUrl(`${look('index')}/index.js`)]
        }
        //abs
        if (typeof to === 'string') {
            if (to.startsWith(base)) to = to.replace(base, '')
            if (to.indexOf('://') >= 0) {
                let u = new URL(to).pathname
                let c = u.lastIndexOf('/')
                if (c >= 0) u = u.substring(c + 1)
                if (u.endsWith('.js')) u = u.substring(0, u.length - 3)
                return [u, to] // abs
            }
            let n = to
            let c = to.lastIndexOf('/')
            if (c >= 0) n = to.substring(c + 1)
            return [n, normalizeUrl(`${look(n)}/${to}.js`)]
        }
        let p = (to as Path).pathname
        if (p.startsWith(base)) p = p.replace(base, '')
        if (!p || p === '/') p = 'index'
        let n = p
        let c = p.lastIndexOf('/')
        if (c >= 0) n = p.substring(c + 1)
        return [n, normalizeUrl(`${look(n)}/${p}.js`)]
    }
}
export const pageLoader = (option: RouterOption, el: Element, ctx: Context) => {
    let cache = option.cache ?? false
    let dbg = option.debug ?? false
    let latest: Component | undefined
    let last: string
    let f = 0
    let named = namedMake(option)
    let display = async (name: string, show: boolean) => {
        const d = el[$querySelector]('#_' + name) as HTMLElement
        if (d) {
            dbg&&log('switch cached node')
            d.style.display = show ? 'block' : 'none'
            if (show) await latest.init(d)
            return true
        }
        dbg&&log('no cached node')
        return false
    }
    let free = async (name: string, cached: boolean) => {
        if (!(cached && await display(name, false))) {
            dbg && log('clean', name, cached)
            dom.clean(el)
            await latest.unload([(el[$querySelector]('#_' + name) as HTMLElement | undefined)].filter(x => !!x))
        }
    }
    let append = async (name: string, cached: boolean) => {
        if (!(cached && await display(name, true))) {
            dbg&&log('make',name,cached)
            let main = van.tags.main({id: '_' + name})
            await latest.make(main)
            await latest.init(main)
            van.add(el, main)
        }
        name !== '404' && await display('404', false)
    }
    let load = async (to: To, delta: number = 0, cached: boolean = cache) => {
        let [name, uri] = named(to)
        dbg&&log("loading",name,uri)
        if (name === last) return
        if (ctx.components[uri]) {
            latest && await free(last, cached)
        } else {
            let entry: ComponentFactory<Component>
            try {
                const {default: e} = await ctx.modules.require(name, uri)
                if (!e) {
                    console.error('missing component', uri, latest)
                    f++
                    if (f < 10) await load('404', 0, true)
                    f = 0
                    return
                }
                entry = e
            } catch (e) {
                console.error(e)
                f++
                if (f < 10) await load('404', 0, true)
                f = 0
                return
            }
            latest && await free(last, cached)
            ctx.components[uri] = await entry(ctx)
        }
        latest = ctx.components[uri]
        last = name
        await append(name, cached)
    }
    return load
}
export const createHash = async (options: RouterOption = {}, el: Element, ctx: Context): Promise<Router> => {
    function createHashLocation(
        window: Window,
        globalHistory: Window["history"]
    ) {
        let {
            pathname = "/",
            search = "",
            hash = "",
        } = parse(window.location.hash?.substring(1));

        // Hash URL should always have a leading / just like window.location.pathname
        // does, so if an app ends up at a route like /#something then we add a
        // leading slash so all of our path-matching behaves the same as if it would
        // in a browser router.  This is particularly important when there exists a
        // root splat route (<Route path="*">) since that matches internally against
        // "/*" and we'd expect /#something to 404 in a hash router app.
        if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
            pathname = "/" + pathname;
        }

        return createLocate(
            "",
            {pathname, search, hash},
            // state defaults to `null` because `window.history.state` does
            (globalHistory.state && globalHistory.state.usr) || null,
            (globalHistory.state && globalHistory.state.key) || "default"
        );
    }

    function createHashHref(window: Window, to: To) {
        let base = window.document.querySelector("base");
        let href = "";

        if (base && base.getAttribute("href")) {
            let url = window.location.href;
            let hashIndex = url.indexOf("#");
            href = hashIndex === -1 ? url : url.slice(0, hashIndex);
        }

        return href + "#" + (typeof to === "string" ? to : create(to));
    }

    let render = pageLoader(options, el, ctx)
    await render(parse(location.hash?.substring(1)))
    return makeRouter(
        render,
        createHashLocation,
        createHashHref,
        undefined,
        options,
        true
    );
}

export const createHistory = async (options: RouterOption = {}, el: Element, ctx: Context): Promise<Router> => {
    function createBrowserLocation(
        window: Window,
        globalHistory: Window["history"]
    ) {
        let {pathname, search, hash} = window.location;
        return createLocate(
            "",
            {pathname, search, hash},
            // state defaults to `null` because `window.history.state` does
            (globalHistory.state && globalHistory.state.usr) || null,
            (globalHistory.state && globalHistory.state.key) || "default"
        );
    }

    function createBrowserHref(window: Window, to: To) {
        return typeof to === "string" ? to : create(to);
    }

    let render = pageLoader(options, el, ctx)
    await render(location)
    return makeRouter(
        render,
        createBrowserLocation,
        createBrowserHref,
        null,
        options
    );
}
const makeRouter = (
    render: (to: To, delta?: number) => Promise<void>,
    getLocation: (window: Window, globalHistory: Window["history"]) => Locate,
    createHref: (window: Window, to: To) => string,
    validateLocation: ((location: Locate, to: To) => void) | null,
    options: { window?: Window } = {},
    hash: boolean = false): Router => {
    let {window = document.defaultView!} = options;
    let globalHistory = window.history;
    let action: Action = Action.pop;
    let getIndex = (): number => (globalHistory.state || {idx: null}).idx
    let index = getIndex()!
    // Index should only be null when we initialize. If not, it's because the
    // user called history.pushState or history.replaceState directly, in which
    // case we should log a warning as it will result in bugs.
    if (index == null) {
        index = 0;
        globalHistory.replaceState({...globalHistory.state, idx: index}, "");
    }

    const handlePop = async () => {
        let nextIndex = getIndex();
        let delta = nextIndex == null ? null : nextIndex - index;
        index = nextIndex;
        await render(router.location, delta)
    }

    function push(to: To, state?: any) {
        action = Action.push;
        let location = createLocate(router.location, to, state);
        if (validateLocation) validateLocation(location, to);

        index = getIndex() + 1;
        let historyState = makeState(location, index);
        let url = router.createHref(location);

        // try...catch because iOS limits us to 100 pushState calls :/
        try {
            globalHistory.pushState(historyState, "", url);
        } catch (error) {
            // If the exception is because `state` can't be serialized, let that throw
            // outwards just like a replace call would so the dev knows the cause
            // https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps
            // https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
            if (error instanceof DOMException && error.name === "DataCloneError") {
                throw error;
            }
            // They are going to lose state here, but there is no real
            // way to warn them about it since the page will refresh...
            window.location.assign(url);
        }
    }

    function replace(to: To, state?: any) {
        action = Action.replace;
        let location = createLocate(router.location, to, state)
        if (validateLocation) validateLocation(location, to)
        index = getIndex()
        let historyState = makeState(location, index);
        let url = router.createHref(location);
        globalHistory.replaceState(historyState, "", url);
    }

    function createURL(to: To): URL {
        // window.location.origin is "null" (the literal string value) in Firefox
        // under certain conditions, notably when serving from a local HTML file
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=878297
        let base =
            window.location.origin !== "null"
                ? window.location.origin
                : window.location.href;

        let href = typeof to === "string" ? to : create(to);
        // Treating this as a full URL will strip any trailing spaces so we need to
        // pre-encode them since they might be part of a matching splat param from
        // an ancestor route
        href = href.replace(/ $/, "%20");
        return new URL(href, base);
    }

    let router: Router = {
        get action() {
            return action
        },
        get location() {
            return getLocation(window, globalHistory);
        },
        createHref(to) {
            return createHref(window, to);
        },
        createURL,
        encodeLocation(to) {
            // Encode a Location the same way window.location would
            let url = createURL(to);
            return {
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
            } as Path;
        },
        push,
        replace,
        go(n) {
            return globalHistory.go(n)
        },
        close() {
            window.removeEventListener(PopStateEventType, handlePop)
            if (hash) window.removeEventListener(HashChangeEventType, handlePop)
        }
    }
    window.addEventListener(PopStateEventType, handlePop)
    if (hash) window.addEventListener(HashChangeEventType, handlePop)


    return router
}

export default {
    hash: createHash,
    history: createHistory,
} as RouterHelper
