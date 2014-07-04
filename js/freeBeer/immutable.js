
//
//  Immutability and friends
//

PB = {} // TODO: make this a proper library and give it a real name

PB.update_puffworldprops = function(data) {
    puffworldprops = PB.persistent_merge(puffworldprops, data)
}

PB.persistent_merge = function(props, data) {
    /// merges a 'flattened' data array into props in a persistent fashion
    /// the new object reuses old data where possible, so requires ~log N additional space
    
    /// given props {fun: {yay:123, ok:123}, cat:{dog:123}}    
    ///   and  data {'fun.yay':0, 'cat.ant.bear':0}}          
    ///     returns {fun: {yay:0, ok:123}, cat:{ant:{bear:0}}}
    
    if(Array.isArray(data) || Array.isArray(data)) {
        // THINK: what do we do with arrays?
        if(Array.isArray(data) !== Array.isArray(props)) {
            // THINK: how to deal with array / object mismatch?
        }
    }
    
    // THINK: what about when data is {cat:{'ant.bear':0}} ?
    
    return Object.keys(data).reduce(function(props, key) {              // OPT: combine these instead of doing them separately
        return PB.set_deep_value(props, key, data[key])
    }, props)
}

PB.set_deep_value = function(props, path, value) {
    /// set a value from a flattened path
    
    /// given props {fun: {yay:123, ok:123}, cat:{dog:123}}
    ///   and  path 'fun.ok' 
    ///   and value 456
    ///     returns {fun: {yay:123, ok:456}, cat:{dog:123}}
    
    var segs = path.split('.')
    var last = segs.pop()
    var final = next = PB.shallow_copy(props)

    segs.forEach(function(seg) {
        next[seg] = PB.shallow_copy(next[seg])
        next = next[seg]
    })

    next[last] = value
    return final
}

PB.shallow_copy = function(obj) {
    if(Array.isArray(obj)) return obj.slice()
    return Object.keys(obj || {}).reduce(function(acc, key) {acc[key] = obj[key]; return acc}, {})
}

PB.flatten = function(obj, prefix) {
    /// convert {fun: {yay: 123}} into {'fun.yay': 123}
    
    if(!PB.proper_object(obj)) return {}
    
    var newobj = {}
    prefix = prefix ? prefix + '.' : ''
    
    for(var key in obj) {
        if(!PB.proper_object(obj[key])) {
            newobj[prefix+key] = obj[key]
        } else {
            newobj = PB.extend(newobj, PB.flatten(obj[key], prefix+key)) // OPT: lotsa GC here
        }
    }
    
    return newobj
}

PB.unflatten = function(obj) {
    /// convert {'fun.yay': 123} into {fun: {yay: 123}}
    
    return PB.persistent_merge({}, obj) // OPT: GC
    // return Object.keys(obj||{}).reduce(function(acc, key) {return PB.set_deep_value(acc, key, obj[key])}, {}) // OPT: GC
}

PB.proper_object = function(obj) { return typeof obj == 'object' && !Array.isArray(obj) } 

PB.extend = function() {
    /// given ({fun:123, yay:123}, {yay:456, ok:789}) as args, returns a new object {fun:123, yay:456, ok:789}
    
    var newobj = {}
    Array.prototype.slice.call(arguments).forEach(function(arg) {
        for(var prop in arg) {
            newobj[prop] = arg[prop] } })
    return newobj
}
