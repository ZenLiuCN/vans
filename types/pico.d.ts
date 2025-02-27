import type {
ChildDom,
StateView,
PropsWithKnownKeys as Prop,
State,
BindingFunc
} from "vans.d.ts";


export declare const style: {
    name: string;
    url: string;
};
export declare const Field: (lbl: ChildDom, content: ChildDom, prop?: Prop<HTMLFieldSetElement>) => HTMLFieldSetElement;
export declare const Content: (prop?: Prop<HTMLElement>, style?: string, ...child: ChildDom[]) => HTMLElement;
export declare const ContentFlex: (prop?: Prop<HTMLElement>, style?: string, ...child: ChildDom[]) => HTMLElement;
export declare const Card: (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => HTMLElement;
export declare const Input: (id: string, prop?: Prop<HTMLInputElement> | ChildDom, ...child: ChildDom[]) => HTMLInputElement;
export declare const Validate: (id: string, error: State<string>, prop?: Prop<HTMLInputElement> | ChildDom, ...child: ChildDom[]) => HTMLElement[];
export declare const Switch: (id: string, checked: State<boolean>, labeled: string | (() => string), prop?: Prop<HTMLInputElement>) => HTMLLabelElement;
export declare const Button: (onclick: () => void, style?: ('outline' | 'secondary' | 'contrast')[], prop?: Prop<HTMLButtonElement> | ChildDom, ...child: ChildDom[]) => HTMLButtonElement;
export declare const Footer: (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => HTMLElement;
export declare const Header: (prop?: Prop<HTMLElement> | ChildDom, ...child: ChildDom[]) => HTMLElement;
export declare const Text: (prop?: Prop<HTMLParagraphElement> | ChildDom, ...child: ChildDom[]) => HTMLParagraphElement;
export declare const Form: (prop?: Prop<HTMLFormElement> | ChildDom, ...child: ChildDom[]) => HTMLFormElement;
export type kind = 'details' | 'summary';
export declare const Accordion: (elements: {
    title: ChildDom;
    dom?: ChildDom[];
}[], styler?: (v: {
    title: ChildDom;
    dom?: ChildDom[];
}, kind: kind) => Record<string, any>) => HTMLDetailsElement[];
export declare const Nav: (menu: ChildDom[], prop?: Prop<HTMLElement>) => HTMLElement;
export declare const Loading: <T extends Element>(s: StateView<Boolean>, label?: StateView<string> | string | (() => string), prop?: Prop<T>) => Prop<T>;
export declare const Tooltip: <T extends HTMLElement>(txt: (() => string) | string, prop?: Prop<T>) => Prop<T>;
export declare const LoadingTooltip: <T extends Element>(tips: (() => string) | string, s: StateView<Boolean>, label?: StateView<string> | string | (() => string), prop?: Prop<T>) => Prop<T>;
type AsyncPredicate = () => Promise<boolean>;
export declare const AlertDialog: (id: string, ok: ChildDom, caption: ChildDom, body: State<BindingFunc>, onBeforeOk?: AsyncPredicate, onAfterOk?: Function, props?: Prop<HTMLElement>, animeMills?: number) => HTMLDialogElement;
export declare const ConfirmDialog: (id: string, ok: any, cancel: StateView<string>, caption: ChildDom, body: State<BindingFunc>, onBeforeOk?: AsyncPredicate, onAfterOk?: Function, onBeforeCancel?: AsyncPredicate, onAfterCancel?: Function, props?: Prop<HTMLElement>, animeMills?: number) => HTMLDialogElement;
export declare const ShowDialog: (id: string, onBeforeOpen?: AsyncPredicate, onAfterOpen?: AsyncPredicate, animeMills?: number, autoClose?: number, onBeforeClose?: AsyncPredicate, onAfterClose?: AsyncPredicate) => void;
export {};
