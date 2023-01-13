import { assert } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { wire } from '../mod.js'


class Cls {
    constructor() {
        this.events = {}
        this.children = {}
    }

    query(n) {
        let el = this.children[n]
        return el ? [el] : []
    }

    add() {
        Array.from(arguments)
        .flat()
        .forEach(n => {
            this.children[n] = new Cls()
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

    notify(str, val) {
        if (!this.events[str]) return
        this.events[str].forEach(f => f(val))
    }
}





Deno.test('wire custom class', () => {

    let root = new Cls()
    root.add('foo', 'bar')

    let w = wire(
        root,
        {
            '.': {
                '#id': 'root',
                hi: function(v) {
                    this.foo.notify('hello', v)
                }
            },

            'foo': {
                '#id': 'foo',
                hello: function(v) {
                    this.foo.msg = 'hello ' + v
                    this.bar.notify('hello', v)
                }

            },

            'bar': {
                '#id': 'bar',
                hello: function(v) {
                    this.bar.msg = 'hello ' + v
                }
            }
        },
        {
            queryFnName:'query',
            listenFnName:'listen',
            unlistenFnName:'unlisten',
        }

    )

    w.root.notify('hi', 'world')
    assert(w.foo.msg === 'hello world')
    assert(w.bar.msg === 'hello world')


    w.bar.msg = 'deleted'
    w['#wires'].delete(w.bar)

    w.root.notify('hi', 'world')
    assert(w.foo.msg === 'hello world')
    assert(w.bar.msg === 'deleted')
})

