// wire elements with events
//
export let wire = (root, cfg, arg) => new Circuit(root, cfg, arg)

export let Circuit = class {

    constructor(
        rootEl,
        eventConfigs,
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
                if (name==='top_') return me
                if (name==='fire_') return me.fire.bind(me)

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

        // initialize event-configs
        //
        Object.entries(eventConfigs).forEach(([qry, eventConfig]) => {

            if (typeof eventConfig === 'function') {
                let eventConfigFn = eventConfig

                me.#getElems(qry).forEach( (el, i, arr) => {
                    let a = eventConfigFn.call(me.this, el, i, arr)
                    let { cfg, nodeId } = me.#getCfg(a)

                    me.wire(el, cfg, nodeId)
                })
            } else {
                let { cfg, nodeId } = me.#getCfg(eventConfig)

                me.#getElems(qry).forEach( (el, i, arr) => {
                    me.wire(el, cfg, nodeId)
                })

            }
        })
    }

    #getElems(qry) {
        let me = this
        let queryFnName = me.funcs.queryFnName
        let isRoot = qry==='.'
        return isRoot
            ? [me.rootEl]
            : [...(me.rootEl[queryFnName](qry))]
    }

    #getCfg(eventConfig) {
        let me = this
        let meta = {}
        let cfg = Object.fromEntries(
            Object
            .entries(eventConfig)
            .filter( ([name, val]) => {
                let isConfig = name[0]==='_'
                if (isConfig) {
                    let k = name.slice(1)
                    meta[k] = val
                    return false
                }
                return true
            })
        )

        let nodeId = meta.id
        let isConflict = me.this[nodeId]
            || typeof me.this[nodeId] === 'function'
        if (isConflict) {
            throw new Error(`conflicting nodes "${nodeId}"`)
        }

        return {
            cfg,
            nodeId,
        }
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
    nodesThatListenTo(eventName,{
        isSkipRootEl=false,
    } = {}) {

        let me = this
        let wm = me.wires

        return Object
            .values(me.nodes)
            .filter(el => {
                if (
                    !wm.has(el)
                    || isSkipRootEl && el===me.rootEl
                ) return

                return wm.get(el)
                    .find( ([name,_]) => name===eventName)
            })
    }

    // triggers events of specific name
    //
    fire(evt, {
        isSkipRootEl=false,
    } = {}) {
        if (!evt || !evt.type) {
            throw new Error('invalid event')
        }

        let me = this
        let fn = me.funcs.notifyFnName

        let eventType = evt.type
        me
        .nodesThatListenTo(eventType, { isSkipRootEl })
        .forEach(el => {
            if (!el[fn]) return
            el[fn].call(el, evt)
        })
    }
}
