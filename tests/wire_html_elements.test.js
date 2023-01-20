import { assert, wire, parseHTML } from './deps.js'

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
                _id: 'root',

                hi: function(ev) {
                    var me = this
                    me.rootMsg = 'hi ' + ev.detail
                    var ev = new CustomEvent('hello', {detail:ev.detail})
                    me.button.dispatchEvent(ev)
                },
            },

            'button': {
                _id: 'button',

                hello: function(ev) {
                    var me = this
                    me.buttonMsg = 'hello ' + ev.detail
                }
            },


        },
        // document.body, // if to assign other object
    )


    var ev = new CustomEvent('hi', {detail:'world'})
    document.body.dispatchEvent(ev)
    let ctx = w.this
    assert(ctx.rootMsg === 'hi world')
    assert(ctx.buttonMsg === 'hello world')


    ctx.buttonMsg = 'deleted'
    w.dewire(ctx.button)

    var ev = new CustomEvent('hi', {detail:'world'})
    ctx.root.dispatchEvent(ev)
    assert(ctx.rootMsg === 'hi world')
    assert(ctx.buttonMsg === 'deleted')
})

