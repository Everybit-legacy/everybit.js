/*
    events: a pub/sub system with wildcard paths
*/


Events = {}
Events.subs = {}

Events.pub = function(path, data) {
    return setImmediate(function() {Events.start_pub(path, data)})              // do it next tick
}

Events.sub = function(path, handler) {
    path = Events.scrub_path(path).join('/')
    if(!Events.subs[path]) Events.subs[path] = []
    Events.subs[path].push(handler)
}

Events.unsub = function(path, handler) {
    path = Events.scrub_path(path).join('/')

    var subs = Events.subs[path]
    if(!subs) return false

    var index = subs.indexOf(handler)
    if(index == -1) return false

    subs.splice(index, 1)
}

Events.start_pub = function(path, data) {
    //// pub to * at each level and then to path itself
    var pathlist = Events.scrub_path(path)
    var realpath = pathlist.join('/')

    Events.try_pub('*', data, realpath)                                         // global catchall

    pathlist.reduce(function(acc, seg) {                                        // channel catchalls
        var newacc = acc + seg + '/'
        Events.try_pub(newacc + '*', data, realpath)
        return newacc
    }, '')

    Events.try_pub(realpath, data, realpath)                                    // actual channel
}

Events.try_pub = function(path, data, realpath) {
    var handlers = Events.subs[path]
    if(!handlers || !handlers.length) return false
    handlers.forEach(function(handler) {handler(data, realpath)})
    // THINK: use setImmediate here?
}


Events.scrub_path = function(path) {
    return path.replace(/^[^\w*-]+/, '')                                        // trim leading slashes etc
        .replace(/[^\w*-]+$/, '')                                               // trim trailing gunk
        .split('/')                                                             // break out the path segments
        .map(function(item) {return item.replace(/[^\w*-]/g, '')})              // scrub each segment
}


// maybe later
// eventlog = []
// Events.sub('*', function(data, path) {
//     eventlog.push([path, data])
// })

