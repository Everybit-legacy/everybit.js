/*
    boron: some utilities for immutability
*/


Boron = {}

Boron.persistent_merge = function(props, data) {
    /// merges a 'flattened' data array into props in a persistent fashion
    /// the new object reuses old data where possible, so requires ~log N additional space
    
    /// given props {fun: {yay:123, ok:123}, cat:{dog:123}}    
    ///   and  data {'fun.yay':0, 'cat.ant.bear':0}}          
    ///     returns {fun: {yay:0, ok:123}, cat:{ant:{bear:0}}}
    
    data = data || []
    
    if(Array.isArray(data) || Array.isArray(data)) {
        // THINK: what do we do with arrays?
        if(Array.isArray(data) !== Array.isArray(props)) {
            // THINK: how to deal with array / object mismatch?
        }
    }
    
    // THINK: what about when data is {cat:{'ant.bear':0}} ?
    
    return Object.keys(data).reduce(function(props, key) {              // OPT: combine these instead of doing them separately
        return Boron.set_deep_value(props, key, data[key])
    }, props)
}

Boron.set_deep_value = function(props, path, value) {
    /// set a value from a flattened path
    
    /// given props {fun: {yay:123, ok:123}, cat:{dog:123}}
    ///   and  path 'fun.ok' 
    ///   and value 456
    ///     returns {fun: {yay:123, ok:456}, cat:{dog:123}}
    
    // var segs = path.split('.')
    // THINK: this is vaguely awful, but without lookbehind it's hard to say "only split on dots that aren't slashed"
    // var segs = path.split('').reverse().join('')
    //                .split(/\.(?!\\)/).reverse()
    //                .map(function(chunk) {return chunk.split('').reverse().join('')})
    //                .map(function(chunk) {return chunk.replace(/[\\]$/, '')})
    
    // THINK: this is vaguely awfuller, but works and is fairly fast and readable. 
    var magic = "___MAGIC___"
    var magic_regex = new RegExp(magic, 'g');
    var path = path.replace(/\\\./g, magic)
    var segs = path.split('.').map(function(chunk) {return chunk.replace(magic_regex, '.')})
    
    var last = segs.pop()
    var next
    var final = next = Boron.shallow_copy(props)

    segs.forEach(function(seg) {
        next[seg] = Boron.shallow_copy(next[seg])
        next = next[seg]
    })

    next[last] = value
    return final
}

Boron.shallow_copy = function(obj) {
    if(Array.isArray(obj)) return obj.slice()
    return Object.keys(obj || {}).reduce(function(acc, key) {acc[key] = obj[key]; return acc}, {})
}

Boron.shallow_diff = function(oldObj, newObj) {                         // results come from newObj
    return Object.keys(oldObj).reduce(function(acc, key) {
        if(JSON.stringify(oldObj[key]) != JSON.stringify(newObj[key]))
            acc[key] = newObj[key]                                      // this pointer copies deep data
        return acc
    }, oldObj.constructor())
}

Boron.deep_diff = function(oldObj, newObj) {                            // results come from newObj
    return Object.keys(newObj).reduce(function(acc, key) {
        var oldtype = typeof oldObj[key]
        var newtype = typeof newObj[key]
        
        if(oldtype != newtype) {
            acc[key] = newObj[key]                                      // this pointer copies deep data
            return acc
        }
        
        if(oldtype == 'object') {
            var diff = Boron.deep_diff(oldObj[key], newObj[key])
            if(Object.keys(diff).length)
                acc[key] = diff
            return acc
        }
        
        if(oldObj[key] !== newObj[key])
            acc[key] = newObj[key]
        return acc
    }, newObj.constructor())
}

Boron.flatten = function(obj, prefix) {
    /// convert {fun: {yay: 123}} into {'fun.yay': 123}
    
    if(!Boron.proper_object(obj)) return {}
    
    var newobj = {}
    prefix = prefix ? prefix + '.' : ''
    
    for(var key in obj) {
        if(!Boron.proper_object(obj[key])) {
            newobj[prefix+key] = obj[key]
        } else {
            newobj = Boron.extend(newobj, Boron.flatten(obj[key], prefix+key)) // OPT: lotsa GC here
        }
    }
    
    return newobj
}

Boron.unflatten = function(obj) {
    /// convert {'fun.yay': 123} into {fun: {yay: 123}}
    
    return Boron.persistent_merge({}, obj) // OPT: GC
    // return Object.keys(obj||{}).reduce(function(acc, key) {return Boron.set_deep_value(acc, key, obj[key])}, {}) // OPT: GC
}

Boron.proper_object = function(obj) { return typeof obj == 'object' && !Array.isArray(obj) && !!obj} 

Boron.extend = function() {
    /// given ({fun:123, yay:123}, {yay:456, ok:789}) as args, returns a new object {fun:123, yay:456, ok:789}
    
    var newobj = {}
    Array.prototype.slice.call(arguments).forEach(function(arg) {
        for(var prop in arg) {
            newobj[prop] = arg[prop] } })
    return newobj
}


Boron.memoize = function(f) {
    var table = {}
    return function() {
        var args = Array.prototype.slice.call(arguments)
        var key = args.toString()
        return table[key] ? table[key] : (table[key] = f.apply(null, args))
    } 
}
