
// assign properties (value, set/get) to object
//
export let assign = (obj, props, {
    isOverride = true
} = {}) => {

    Object
    .getOwnPropertyNames(props)
    .forEach(name => {
        if (obj.hasOwnProperty(name) && !isOverride) {
            return
        }

        let pd = Object.getOwnPropertyDescriptor(props, name)

        // this is a static property/method
        //
        if (pd.hasOwnProperty('value')) {
            obj[name] = pd.value
            return
        }

        // if setter/getter
        //
        if ('get' in pd || 'set' in pd) {
            Object.defineProperty(
                obj,
                name,
                {
                    get: pd.get,
                    set: pd.set,
                }
            )
            return
        }
    })

    return obj
}