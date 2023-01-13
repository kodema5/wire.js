
// wires elements inside rootEl
//
export let wire = (
    rootEl, // elements
    config, // config: {
            //      query-selector: {
            //          '#id': '..', // thisObjs[#id] = elems
            //          'event-name': function listener() {
            //              this ==- thisObj
            //          }
            //      },
            //      '.': { } // query-selector for rootEl
            // }

    // other config
    {
        thisObj = {},
        queryFnName = 'querySelectorAll',
        listenFnName = 'addEventListener',
        unlistenFnName= 'removeEventListener',
    } = {}
) => {
    let wires = thisObj['#wires'] = thisObj['#wires']
        || new Wires({
            unlistenFnName
        })

    Object.entries(config).forEach(([qry, events]) => {
        let isRoot = qry==='.'
        let elems = isRoot
            ? [rootEl]
            : [...rootEl[queryFnName](qry)]

        let id = events['#id']
        if (id && !thisObj[id]) {
            thisObj[id] = elems.length===1
                ? elems[0]
                : elems
        }

        elems.forEach( el => {

            wires.delete(el)

            Object
            .entries(events)
            .filter(([type, _]) => type[0] !== '#')
            .forEach(([type, listener]) => {
                let fn = listener.bind(thisObj)
                wires.set(el, type, fn)
                el[listenFnName](type, fn)
            })


        })
    })

    return thisObj
}


// for tracking element and its listeners to avoid duplicates
//
let Wires = class {
    constructor({
        unlistenFnName = 'removeEventListener'
    }={}) {
        this.map = new WeakMap()
        this.unlistenFnName = unlistenFnName
    }

    set(el, type, listener) {
        let wm = this.map
        if (!wm.has(el)) {
            wm.set(el, [])
        }

        wm
        .get(el)
        .push([type, listener])
    }

    delete(el) {
        return !Array
            .from(arguments)
            .flat()
            .map( e => this.#delete(e))
            .includes(false)
    }

    #delete(el) {
        let wm = this.map
        if (!wm.has(el)) return false

        let fnName = this.unlistenFnName

        wm
        .get(el)
        .forEach(([t, l]) => { el[fnName](t, l) })

        wm.delete(el)
        return true
    }
}

