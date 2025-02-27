
import ChildDom = vans.ChildDom;
import StateView = vans.StateView;
import Prop = vans.PropsWithKnownKeys;
import State = vans.State;
import BindingFunc = vans.BindingFunc;
//region tags
const {
    span,
    dialog,
    a,
    ul,
    li,
    nav,
    main,
    article,
    input,
    small,
    label,
    button,
    footer,
    header,
    p,
    form,
    details,
    summary,
    fieldset
} = vans.tags
//endregion
const assign = Object.assign
const keys = Object.keys
export const style={name:'pico',url:'css/pico.conditional.min.css'}
export const Field = (lbl: ChildDom, content: ChildDom, prop?: Prop<HTMLFieldSetElement>) => fieldset(prop, label(lbl), content)
export const Content = (prop?: Prop<HTMLElement>, style?: string, ...child: ChildDom[]) =>
    main(prop ? assign(prop, {class: `pico container`, style: style}) : {
        class: `pico container`,
        style: style
    }, ...child)
export const ContentFlex = (prop?: Prop<HTMLElement>, style?: string, ...child: ChildDom[]) =>
    main(prop ? assign(prop, {class: `pico container-fluid`, style: style}) : {
        class: `pico container-fluid`,
        style: style
    }, ...child)
export const Card = (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => article(prop, ...child)
export const Input = (id: string, prop?: Prop<HTMLInputElement> | ChildDom, ...child: ChildDom[]) => input(Object.assign({
    id,
    name: id
}, prop ?? {}), ...child)
export const Validate = (id: string, error: State<string>, prop?: Prop<HTMLInputElement> | ChildDom, ...child: ChildDom[]) => [
    input(Object.assign({
        id: id,
        name: id,
        ariaLabel: "Text",
        ariaInvalid: () => !!error.val,
        ariaDescribedby: `valid-${id}`,
    }, prop ?? {}), ...child),
    small({id: `valid-${id}`}, () => error.val),
]
export const Switch = (id: string, checked: State<boolean>, labeled: string | (() => string), prop?: Prop<HTMLInputElement>) =>
    label(input(Object.assign({
        id: id,
        name: id,
        type: "checkbox",
        role: "switch",
        checked,
        onchange: e => {
            checked.val = e.target.checked
        }
    }, prop ?? {})), labeled)
export const Button = (onclick: () => void, style?: ('outline' | 'secondary' | 'contrast')[], prop?: Prop<HTMLButtonElement> | ChildDom, ...child: ChildDom[]) =>
    button(Object.assign({onclick, type: "button", class: style ? style.join(" ") : ''}, prop ?? {}), ...child)
export const Footer = (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => footer(prop, ...child)
export const Header = (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => header(prop, ...child)
export const Text = (prop?: Prop<HTMLParagraphElement> | ChildDom, ...child: ChildDom[]) => p(prop, ...child)
export const Form = (prop?: Prop<HTMLFormElement> | ChildDom, ...child: ChildDom[]) => form(prop, ...child)
export type kind = 'details' | 'summary'
export const Accordion = (elements: { title: ChildDom, dom?: ChildDom[] }[], styler?: (v: { title: ChildDom, dom?: ChildDom[] }, kind: kind) => Record<string, any>) =>
    elements.map(v => (
        v.dom && v.dom.length
            ? details(styler ? styler(v, 'details') : {}, summary(styler ? styler(v, 'summary') : {}, v.title), ...v.dom)
            : details(styler ? styler(v, 'details') : {}, summary(styler ? styler(v, 'summary') : {}, v.title))
    ))
export const Nav = (menu: ChildDom[], prop?: Prop<HTMLElement>) => nav(prop, ...menu)
export const Loading = <T extends Element>(s: StateView<Boolean>, label?: StateView<string> | string | (() => string), prop?: Prop<T>): Prop<T> =>
    Object.assign(prop ?? {}, {'aria-busy': () => s.val}, label ? {'aria-label': typeof label === 'function' ? label : typeof label === 'string' ? label : () => label.val} : {}) as Prop<T>
export const Tooltip = <T extends HTMLElement>(txt: (() => string) | string, prop?: Prop<T>): Prop<T> => assign(prop ?? {}, {
    'data-tooltip': txt,
    style: prop.style ? prop.style + ';border-bottom-style:none;' : 'border-bottom-style:none'
}) as Prop<T>
export const LoadingTooltip = <T extends Element>(tips: (() => string) | string, s: StateView<Boolean>, label?: StateView<string> | string | (() => string), prop?: Prop<T>): Prop<T> =>
    vans.compose(Loading.bind(undefined, s, label), Tooltip.bind(undefined, tips))(prop)


//region dialog

const isOpenClass = "modal-is-open";
const openingClass = "modal-is-opening";
const closingClass = "modal-is-closing";
const showing: { current?: HTMLElement } = {current: undefined}

const isModalOpen = (modal) =>
    modal.hasAttribute("open") &&
    modal.getAttribute("open") !== "false"
const openModal = (modal: HTMLElement, cbb?: AsyncPredicate, cba?: Function, durMills?: number) => {
    if (showing.current) return
    showing.current = modal
    const opener = () => {
        const html = document.documentElement
        if (vans.dom.isScrollVisible) html.style.setProperty("--scrollbar-width", `${vans.dom.scrollWidth}px`)
        html.classList.add(isOpenClass, openingClass)
        setTimeout(() => {
            html.classList.remove(openingClass)
            if (cba) cba()
        }, durMills ?? 400)
        modal.setAttribute("open", String(true));
    }
    if (cbb) {
        cbb().then(r => {
            if (r) opener()
        }).catch(err => console.error(err))
    } else {
        opener()
    }
}
type AsyncPredicate = () => Promise<boolean>
const closeModal = (modal?: HTMLElement, cbb?: AsyncPredicate, cba?: Function, durMills?: number) => {
    modal = modal ?? showing.current
    const closer = () => {
        const html = document.documentElement
        html.classList.add(closingClass)
        setTimeout(() => {
            html.classList.remove(closingClass, isOpenClass)
            html.style.removeProperty("--scrollbar-width")
            modal.removeAttribute("open")
            showing.current = undefined
            if (cba) cba()
        }, durMills ?? 400)
    }
    if (cbb) {
        cbb().then(r => {
            if (r) closer()
        }).catch(err => console.error(err))
    } else {
        closer()
    }
}
const triggerModal = (e: MouseEvent | TouchEvent, cbb?: AsyncPredicate, cba?: Function, durMills?: number) => {
    e.preventDefault()
    // @ts-ignore
    const modal = document.getElementById(e.currentTarget.getAttribute("data-target"));
    !!modal && isModalOpen(modal)
        ? closeModal(modal, cbb, cba, durMills)
        : openModal(modal, cbb, cba, durMills);
}


export const AlertDialog = (id: string, ok: ChildDom,
                            caption: ChildDom,
                            body: State<BindingFunc>,
                            onBeforeOk?: AsyncPredicate,
                            onAfterOk?: Function,
                            props?: Prop<HTMLElement>,
                            animeMills?: number) =>
    dialog({id: id},
        article(props,
            header(span({
                class: 'close',
                'data-target': id,
                onclick: (e) => triggerModal(e, onBeforeOk, onAfterOk, animeMills)
            }), p(caption)),
            p(d => body.val(d)),
            footer(button({
                role: 'button',
                'data-target': id,
                onclick: (e) => triggerModal(e, onBeforeOk, onAfterOk, animeMills)
            }, ok))
        )
    )
export const ConfirmDialog = (id: string, ok, cancel: StateView<string>,
                              caption: ChildDom,
                              body: State<BindingFunc>,
                              onBeforeOk?: AsyncPredicate,
                              onAfterOk?: Function,
                              onBeforeCancel?: AsyncPredicate,
                              onAfterCancel?: Function,
                              props?: Prop<HTMLElement>,
                              animeMills?: number) =>
    dialog({id: id},
        article(props,
            header(p(caption)),
            p(d => body.val(d)),
            footer({},
                () => cancel.val ? button({
                    role: 'button',
                    class: 'secondary',
                    'data-target': id,
                    onclick: (e) => triggerModal(e, onBeforeCancel, onAfterCancel, animeMills)
                }, cancel) : span(),
                () => ok.val ? button({
                    role: 'button',
                    autofocus: 'true',
                    'data-target': id,
                    onclick: (e) => triggerModal(e, onBeforeOk, onAfterOk, animeMills)
                }, ok) : span(),
            )))


export const ShowDialog = (id: string,
                           onBeforeOpen?: AsyncPredicate, onAfterOpen?: AsyncPredicate,
                           animeMills?: number,
                           autoClose?: number,
                           onBeforeClose?: AsyncPredicate, onAfterClose?: AsyncPredicate,
) => {
    if (showing.current) return
    const dom = document.getElementById(id)
    openModal(dom, onBeforeOpen, onAfterOpen, animeMills)
    if (autoClose) {
        setTimeout(() => {
            if (showing.current) {
                closeModal(undefined, onBeforeClose, onAfterClose, animeMills)
            }
        }, autoClose)
    }
}
//endregion

