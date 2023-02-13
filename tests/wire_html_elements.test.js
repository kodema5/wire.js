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
        <select>
            <option>foo</option>
            <option>bar</option>
        </select>
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

            // for dynamically generated config for each element
            //
            'option': function(el, i) {
                return {
                    _id: `option_${i}`
                }
            }

        },
        // document.body, // if to assign other object
    )


    var ev = new CustomEvent('hi', {detail:'world'})
    document.body.dispatchEvent(ev)

    assert(w.this.rootMsg === 'hi world')
    assert(w.this.buttonMsg === 'hello world')


    w.this.buttonMsg = 'deleted'
    w.dewire(w.this.button)

    var ev = new CustomEvent('hi', {detail:'world'})
    w.this.root.dispatchEvent(ev)
    assert(w.this.rootMsg === 'hi world')
    assert(w.this.buttonMsg === 'deleted')

    // skip root-el
    //
    var ev = new CustomEvent('hi', {detail:'xxx'})
    w.fire(ev, {isSkipRootEl:true})
    assert(w.this.rootMsg !== 'hi xxx')

    assert(Object.keys(w.nodes).includes('option_0'))
    assert(Object.keys(w.nodes).includes('option_1'))
})

