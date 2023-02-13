import { assert, wire } from './deps.js'

class Cls {
    constructor() {
        this.events = {}
        this.children = {}
    }

    query(n) {
        let el = this.children[n]
        return el ? [el] : []
    }

    has(a) {
        return Object.values(this.children).indexOf(a)>=0
    }


    add() {
        Array.from(arguments)
        .flat()
        .forEach(n => {
            this.children[n] = new Cls()
        })
    }

    remove() {
        Array.from(arguments)
        .flat()
        .forEach(n => {
            delete this.children[n]
        })
    }


    listen(str, fn) {
        this.events[str] = this.events[str] || []
        this.events[str].push(fn)
    }

    unlisten(str, fn) {
        let arr = this.events[str]
        if (!arr) return
        arr.splice(arr.indexOf(fn), 1)
    }

    notify({type, detail} = {}) {
        if (!this.events[type]) return
        this.events[type].forEach(f => f(detail))
    }
}

Deno.test('wiring custom class', () => {
    let root = new Cls()
    root.add('foo', 'bar', 'baz')

    let w = wire(
        root,
        {
            '.': {
                _id: 'root',
                hi: function(v) {

                    // simulate a custom event
                    let ev = {
                        type: 'foo-hello',
                        detail: v
                    }
                    this.fire_(ev)
                }
            },

            'foo': {
                _id: 'foo',
                'foo-hello': function(v) {
                    this.foo.msg = 'foo ' + v
                    if (this.bar) {
                        this.bar.notify({type:'hello', detail:v})
                    }
                }

            },

            'bar': {
                _id: 'bar',
                'hello': function(v) {
                    this.bar.msg = 'bar ' + v
                }
            },

            'baz': {
                _id: 'baz',
                'hello': function(v) {
                    this.baz.msg = 'baz ' + v
                }
            },
        },
        {
            thisObj: {},
            queryFnName:'query',
            listenFnName:'listen',
            unlistenFnName:'unlisten',
            notifyFnName:'notify',
            validator: (el) => root.has(el),
        },
    )

    // has all nodes
    assert(w.this.root && w.this.foo && w.this.bar)

    // supposed an event triggered in root
    //
    w.nodes.root.notify({type:'hi', detail:'world'})
    assert(w.this.foo.msg === 'foo world')
    assert(w.this.bar.msg === 'bar world')

    // clean-up removed element
    //
    root.remove('bar')
    w.clean()
    assert(!w.this.bar)

    // to remove all dependencies
    //
    w.delete()
    w = null

})