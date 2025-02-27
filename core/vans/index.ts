import {assign, cases, get, helper, van, vanX} from './util'
import dom from "./dom";
import {ContextBuildFunc, Units} from "./types";
import  {binder} from "./context";
import Router from "./router";
import Component from "./component";
import loader from "./loader";


const units:Units = new Proxy(assign(
    {
        dom,
        cases,
        loader,
        routing:Router,
        factory:Component,
        //place holder
        context: undefined as ContextBuildFunc,
    }, helper,van,vanX
), {
    get: (_, name, __) => {
        switch (name) {
            case 'context':
                return binding
          /*  case 'tags':
                return van.tags
            case 'add':
                return van.add
            case 'derive':
                return van.derive
            case 'state':
                return van.state
            case 'hydrate':
                return van.hydrate
            case 'calc':
                return vanX.calc
            case 'reactive':
                return vanX.reactive
            case 'noreactive':
                return vanX.noreactive
            case 'stateFields':
                return vanX.stateFields
            case 'raw':
                return vanX.raw
            case 'list':
                return vanX.list
            case 'replace':
                return vanX.replace
            case 'compact':
                return vanX.compact*/
            default:
                return get(_, name, __)
        }
    }
})
const binding = binder(units)
export default units
