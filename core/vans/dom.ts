import type {
    CSSStyleDeclare,
    CssStyleDeclare,
    DomHelper,
    InjectStatus,
    Properties,
    PropertyBuilder,
    StyleBuilder,
    StylerSheetBuilder
} from './types'
import {
    $createElement,
    $documentElement,
    $getBoundingClientRect,
    $getElementById,
    $indexOf,
    $location,
    $querySelector,
    $scrollTo,
    $search,
    $startsWith,
    $substring,
    assign,
    build,
    builder,
    hasBuilder,
    kebabCase
} from "./util";


const posOf = (el: Element | undefined, offset) => {
    if (!el) return {
        left: window.scrollX - (offset.left || 0),
        top: window.scrollY - (offset.top || 0),
        behavior: offset.behavior,
    }
    const docRect = document[$documentElement][$getBoundingClientRect]()
    const elRect = el[$getBoundingClientRect]()
    return {
        behavior: offset.behavior,
        left: elRect.left - docRect.left - (offset.left || 0),
        top: elRect.top - docRect.top - (offset.top || 0),
    }
}
const scroll = (position) => {
    let opt
    if ('el' in position) {
        const positionEl = position.el
        const el = typeof positionEl === 'string'
            ? positionEl[$startsWith]('#')
                ? document[$getElementById](positionEl.slice(1))
                : document[$querySelector](positionEl)
            : positionEl

        if (!el) return
        opt = posOf(el, position)
    } else opt = position
    if (document.documentElement.style.scrollBehavior)
        window[$scrollTo](opt)
    else
        window[$scrollTo](opt?.left ?? window.scrollX, opt?.top ?? window.scrollY)


}
const pos = () => ({
    left: window.scrollX,
    top: window.scrollY,
})

const injectStyle = (url, name: string, root?: ShadowRoot): InjectStatus => {
    const h = document.head
    const v = h.getElementsByTagName('link')
    if (v.length == 0 || !v.namedItem(name)) {
        if (root) {
            root.appendChild(assign(document.createElement('link'), {
                id: name,
                rel: 'stylesheet',
                href: url
            }))
            return 2
        } else {
            h.appendChild(assign(document.createElement('link'), {
                id: name,
                rel: 'stylesheet',
                href: url
            }))
            return 1
        }
    } else {
        return 0 //already exists
    }

}
const uninjectStyle = (url, name: string, root?: ShadowRoot) => {
    if (!root) {
        const h = document.head
        const v = h.getElementsByTagName('link')
        if (v.length != 0 && v.namedItem(name))
            for (let i = 0; i < v.length; i++) {
                let el = v.item(i)
                if (el.id == name && el.href == url) {
                    h.removeChild(el)
                    break
                }
            }
    } else {
        const v = root.getElementById(name)
        if (v) root.removeChild(v)
    }

}

const props = <T extends Element>(...args: Properties<T>[]) => {
    return new Proxy((...a: Properties<T>[]) => props(...(args?.concat(a) ?? a)), {
        get: (_, s) => {
            if (s === build) return assign({}, ...args)
        },
        has: hasBuilder
    }) as PropertyBuilder<T>
}
const sheet = (...args: CSSStyleDeclare[]) => {
    return new Proxy((...a: CSSStyleDeclare[]) => sheet(...(args?.concat(a) ?? a)), {
        get: (_, s) => {
            if (s === build) {
                return args.map(x => `${x.selectorText} {${Object.keys(x.style).map(v => `${kebabCase(v)}:${x.style[v]}`)}}`).join('\n')
            }
        },
        has: hasBuilder
    }) as StylerSheetBuilder
}
const style = (...args: CssStyleDeclare[]) => {
    return new Proxy((...a: CssStyleDeclare[]) => style(...(args?.concat(a) ?? a)), {
        get: (_, s) => {
            if (s == build) {
                let d = Object.assign(args[0], ...args.slice(1))
                return Object.keys(d).map(k => `${kebabCase(k)}:${d[k]}`).join("")
            }
        },
        has: hasBuilder
    }) as StyleBuilder
}
const root = (base: string = '') => {
    let {href, pathname} = window.location
    href = href[$substring](0, href[$indexOf](pathname))
    if (base[$indexOf]('#') >= 0) base = base[$substring](0, base[$indexOf]('#'))
    if (base && base !== '/') href = href + '/' + base
    return href.replace(/([^:])\/\//g,'$1/')
}
const clean = (el: Element) => {
    while (el.lastChild) {
        el.removeChild(el.lastChild)
    }
}
const MuteEvent = (evt: Event) => (evt.preventDefault(), false)
const MuteInput = evt => evt.metaKey ? true : (evt.preventDefault(), false)
const dom: DomHelper = {
    MuteEvent,
    MuteInput,
    PreventDefault: <E extends Event>(fn: (evt: E) => any) => (evt: E) => {
        evt.preventDefault()
        return fn(evt)
    },
    ReadOnlyEditable: (prop) => assign({
        contentEditable: true,
        oncut: MuteEvent,
        onpaste: MuteEvent,
        onkeydown: MuteInput,
    }, prop),
    clean,
    positionOf: posOf,
    root,
    scrollTo: scroll,
    injectStyle,
    uninjectStyle,
    get position() {
        return pos()
    },
    get query(): URLSearchParams {
        return new URLSearchParams(window[$location][$search])
    },
    get scrollWidth(): number {
        const outer = document[$createElement]("div")
        outer.style.visibility = "hidden"
        outer.style.overflow = "scroll"
        // @ts-ignore
        outer.style.msOverflowStyle = "scrollbar"
        document.body.appendChild(outer)
        const inner = document.createElement("div")
        outer.appendChild(inner)
        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
        outer.parentNode.removeChild(outer)
        return scrollbarWidth
    },
    get isScrollVisible(): boolean {
        return document.body.scrollHeight > screen.height
    },
    props,
    sheet,
    style,
    isBuilder: (v: any) => v && typeof v === 'object' && builder in v && v[builder] === undefined
}
export default dom
