import { assert, assign } from './deps.js'

Deno.test('assign properties', () => {
    let obj = { a:100 }
    let props = {
        a:10000,
        f: function() { return this.a },
        get value() { return this.a },
        set value(x) { this.a = x },
    }

    assign(obj, props, {isOverride:false})

    assert(obj.a === 100) // property
    assert(obj.f()=== 100) // method

    obj.value = 200 // setter
    assert(obj.value === 200) // getter
})