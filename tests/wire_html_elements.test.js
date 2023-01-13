import { parseHTML } from "https://esm.sh/linkedom";
import { assert } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { wire } from '../mod.js'

const {
    window,
    document,
    customElements,
    HTMLElement,
    Event,
    CustomEvent
} = parseHTML(`
    <!DOCTYPE html>
    <html lang="en">
    <body>
        <h1>Hello from Deno</h1>
        <custom-element></custom-element>
        <form>
            <input name="user">
            <button id='button'>Submit</button>
        </form>
    </body>
  </html>`)


Deno.test('wire html elements', () => {

    let w = wire(
        document.body,
        {
            '.': {
                '#id': 'root',

                hi: function(ev) {
                    var me = this
                    me.rootMsg = 'hi ' + ev.detail
                    var ev = new CustomEvent('hello', {detail:ev.detail})
                    w.button.dispatchEvent(ev)
                },
            },

            'button': {
                '#id': 'button',

                hello: function(ev) {
                    var me = this
                    me.buttonMsg = 'hello ' + ev.detail
                }
            },


        },
        // document.body, // if to assign other object
    )


    var ev = new CustomEvent('hi', {detail:'world'})
    w.root.dispatchEvent(ev)
    assert(w.rootMsg === 'hi world')
    assert(w.buttonMsg === 'hello world')


    w.buttonMsg = 'deleted'
    w["#wires"].delete(w.button)

    var ev = new CustomEvent('hi', {detail:'world'})
    w.root.dispatchEvent(ev)
    assert(w.rootMsg === 'hi world')
    assert(w.buttonMsg === 'deleted')

})

