// wire elements with events
//
export let wire = (root, cfg, arg) => new Circuit(root, cfg, arg)

export let Circuit = class {

    constructor(
        rootEl,
        eventConfig,
        {
            thisObj = {},
            queryFnName = 'querySelectorAll',
            listenFnName = 'addEventListener',
            unlistenFnName= 'removeEventListener',
            notifyFnName='dispatchEvent',
            validator = (e) => e.parentNode,
        } = {}
    ) {
        let me = this
        me.rootEl = rootEl
        me.nodes = {}
        me.wires = new WeakMap()
        me.funcs = {
            queryFnName,
            listenFnName,
            unlistenFnName,
            notifyFnName,
            validator,
        }

        // event's listeners scope
        //
        me.this = new Proxy(thisObj, {
            get(_, name) {
                if (name==='circuit_') return me
                if (name==='trigger_') return me.trigger.bind(me)

                return me.nodes[name]
                    || Reflect.get(...arguments)
            },

            deleteProperty(_, name) {
                if (!me.nodes[name]) {
                    return Reflect.deleteProperty(...arguments)
                }
                let el = me.nodes[name]
                me.dewire(el)
                delete me.nodes[name]
            },
        })

        Object.entries(eventConfig).forEach(([qry, events]) => {
            // get config by #... keys
            //
            let cfg = {}
            events = Object.fromEntries(
                Object
                .entries(events)
                .filter( ([name, val]) => {
                    let isConfig = name[0]==='_'
                    if (isConfig) {
                        let k = name.slice(1)
                        cfg[k] = val
                        return false
                    }
                    return true
                })
            )

            // ensure no conflict
            //
            let nodeId = cfg.id
            let isConflict = me.this[nodeId]
                || typeof me.this[nodeId] === 'function'
            if (isConflict) {
                throw new Error(`conflicting nodes "${nodeId}"`)
            }

            // get elements
            //
            let isRoot = qry==='.'
            let elems = isRoot
                ? [me.rootEl]
                : [...(me.rootEl[queryFnName](qry))]

            // attach events to element
            //
            elems.forEach( el => {
                me.wire(el, events, nodeId)
            })
        })
    }

    // counter for unnamed nodeId
    //
    static _id = 0

    // attach events to element
    //
    wire(el, events, nodeId) {
        let me = this

        if (!me.wires.has(el)) {
            me.wires.set(el, [])
            let id = nodeId || `node-${++Circuit._id}`
            me.nodes[id] = el
        }

        let listen = me.funcs.listenFnName
        Object
        .entries(events)
        .forEach(([type, listener]) => {
            let fn = listener.bind(me.this)
            el[listen](type, fn)

            me.wires
                .get(el)
                .push([type, fn])
        })
    }


    // remove events from an element
    //
    dewire(el) {
        let me = this
        let wm = me.wires
        if (!wm.has(el)) return false

        let unlisten = me.funcs.unlistenFnName
        wm.get(el).forEach( ([type, fn]) => {
            el[unlisten](type, fn)
        })
    }

    // delete events from all elements
    //
    delete() {
        let me = this
        Object.values(me.nodes).forEach(el => me.dewire(el))
        me.rootEl = null
        me.nodes = null
        me.wires = null
    }

    // remove orphaned elements
    //
    clean() {
        let me = this
        let validate = me.funcs.validator
        for (let [id, el] of Object.entries(me.nodes)) {
            if (el==me.rootEl || validate(el)) continue

            me.dewire(el)
            delete me.nodes[id]
        }
    }

    // get nodes which has eventName
    //
    trace(eventName) {
        let me = this
        let wm = me.wires

        return Object
            .values(me.nodes)
            .filter(el => {
                if (!wm.has(el)) return

                return wm.get(el)
                    .find( ([name,_]) => name===eventName)
            })
    }

    // triggers events of specific name
    //
    trigger(evt) {
        if (!evt || !evt.type) {
            throw new Error('invalid event')
        }

        let me = this
        let fn = me.funcs.notifyFnName

        let eventType = evt.type
        me
        .trace(eventType)
        .forEach(el => {
            if (!el[fn]) return
            el[fn].call(el, evt)
        })
    }
}
