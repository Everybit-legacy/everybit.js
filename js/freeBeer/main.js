// Bridge between visualization framework (plumb? angular? d3?) and js/forum files

///////// PuffForum Interface ////////////

// Register our update function
var eatPuffs = function(puffs) {
    // call the display logic
  
    if(!Array.isArray(puffs) || !puffs.length) {
        return false;
    }

    // TODO: just call some kind of 'look for puff' function instead
    if(typeof globalStupidFirstTimeFlag == 'undefined') {
        globalStupidFirstTimeFlag = true
        var hash = window.location.hash
        if(hash) {
            var puff = PuffForum.getPuffById(hash.slice(1))
            if(puff) {
                showPuffDirectly(puff)
                return false
            }
        }
    }
    
    renderPuffWorld()
}

PuffForum.onNewPuffs(eatPuffs); // assign our callback

PuffForum.init(); // initialize the forum module (and by extension the puffball network)

////////// End PuffForum Interface ////////////




///// event stuff. move this into either PuffForum or Puff itself.

events = {}
events.subs = {}

events.pub = function(path, data) {
    return setImmediate(function() {events.start_pub(path, data)})              // do it next tick
}

events.sub = function(path, handler) {
    path = events.scrub_path(path).join('/')
    if(!events.subs[path]) events.subs[path] = []
    events.subs[path].push(handler)
}

events.unsub = function(path, handler) {
    path = events.scrub_path(path).join('/')

    var subs = events.subs[path]
    if(!subs) return false

    var index = subs.indexOf(handler)
    if(index == -1) return false

    subs.splice(index, 1)
}

events.start_pub = function(path, data) {
    //// pub to * at each level and then to path itself
    var pathlist = events.scrub_path(path)
    var realpath = pathlist.join('/')
    
    events.try_pub('*', data, realpath)                                         // global catchall
    
    pathlist.reduce(function(acc, seg) {                                        // channel catchalls
        var newacc = acc + seg + '/'
        events.try_pub(newacc + '*', data, realpath)
        return newacc
    }, '')
    
    events.try_pub(realpath, data, realpath)                                    // actual channel
}

events.try_pub = function(path, data, realpath) {
    var handlers = events.subs[path]
    if(!handlers || !handlers.length) return false
    handlers.forEach(function(handler) {handler(data, realpath)})
    // THINK: use setImmediate here?
}

// event.sub = function(path, handler) {
//     //// add the handler to the tree
//     path = event.scrub_path(path)
//     var tree = event.tree
//     var last = path.length - 1
//     for (var i = 0; i < last; i++) {                                            // walk down, but skip the last item
//         if(!tree[path[i]]) 
//             tree[path[i]] = {kids: {}, handlers: []}                            // build the tree as needed
//         tree = tree[path[i]].kids                                               // step down one level
//     }
//     
//     tree[path[last]] = tree[path[last]]
//                      ? tree[path[last]].concat(handler)                         // add handler to existing list
//                      : [handler]                                                // or create a new one
// }

// event.unsub = function(path, handler) {
//     // remove the handler from the tree
//     path = event.scrub_path(path)
//     var tree = event.tree
//     for (var i = 0; i < path.length; i++) {
//         tree = tree[path[i]]
//         if(!tree) return false
//     }
//     
// }


events.scrub_path = function(path) {
    return path.replace(/^[^\w*-]+/, '')                                        // trim leading slashes etc
               .replace(/[^\w*-]+$/, '')                                        // trim trailing gunk
               .split('/')                                                      // break out the path segments
               .map(function(item) {return item.replace(/[^\w*-]/g, '')})       // scrub each segment
}


eventlog = []
events.sub('*', function(data, path) {
    eventlog.push([path, data])
})




//// event bindings for controlling core behavior from the display

events.sub('prefs/storeKeychain/toggle', function(data, path) {
    var new_state = !PuffWardrobe.getPref('storeKeychain')
    PuffWardrobe.setPref('storeKeychain', new_state)
    
    var dir = new_state ? 'on' : 'off'
    events.pub('ui/menu/prefs/storeKeychain/' + dir)
})

events.sub('profile/nickname/set', function(data, path) {
    var nickname = data.nickname
    if(!nickname) 
        return Puffball.onError('Invalid nickname')  // THINK: do this in React? use Puffball.validations?
    
    PuffWardrobe.setProfileItem('nickname', nickname)
    
    events.pub('ui/menu/profile/nickname/set')
})








/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // Puffball.Data.puffs.forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffById(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////






~function() {
    //// postpone until next tick
    // inspired by http://dbaron.org/log/20100309-faster-timeouts
    var later = []
    var messageName = 12345
    var gimme_a_tick = true

    function setImmediate(fn) {
        later.push(fn)
        
        if(gimme_a_tick) {
            gimme_a_tick = false
            window.postMessage(messageName, "*")
        }
        
        return false
    }

    function handleMessage(event) {
        if(event.data != messageName) return false

        event.stopPropagation()
        gimme_a_tick = true

        var now = later
        later = []

        for(var i=0, l=now.length; i < l; i++)
        now[i]()
    }
  
    if(typeof window != 'undefined') {
        window.addEventListener('message', handleMessage, true)
        window.setImmediate = setImmediate
    }
}();







///////////// display-related helper functions or something like that ///////////////////


getGridCoordBox = function(rows, cols, outerwidth, outerheight) {
    var min = function(a, b) {return Math.min(a, b)}
    var max = function(a, b) {return Math.max(a, b)}
    var gridwidth  = outerwidth  / cols
    var gridheight = outerheight / rows
    var grid = Array.apply(0, Array(rows))
                    .map(function() {return Array.apply(0, Array(cols))
                                                 .map(function() {return 0})}) // build 2D array
    
    return function(width, height, miny, minx, maxy, maxx) {
        maxy = min(maxy||rows-height, rows-height), maxx = min(maxx||cols-width, cols-width)
        miny = min(miny||0, maxy), minx = min(minx||0, maxx)
        top: for (var y = miny; y <= maxy; y++) {
        bot: for (var x = minx; x <= maxx;  x++) {
                for (var dy = 0; dy < height; dy++) {
                    for (var dx = 0; dx < width; dx++) {
                        if(grid[y+dy][x+dx]) continue bot }} 
                            break top }}
        if(maxx<0 || maxy<0) return Puffball.onError('Block too big for the grid')
        if(x == maxx+1 && y == maxy+1) return Puffball.onError('No room in the grid')
        if(x == null || y == null) return Puffball.onError('Block too big for the grid')
        for (var dy = 0; dy < height; dy++) {
            for (var dx = 0; dx < width; dx++) {
                grid[y+dy][x+dx] = 1 } }
        return {width: width*gridwidth, height: height*gridheight, x: x*gridwidth, y: y*gridheight}
    } 
}

applySizes = function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
    return function(className) {
        return function(puff) {
            return extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx), 
                                         {puff: puff, className: className}) } } }


extend = function() {
    var newobj = {}
    Array.prototype.slice.call(arguments).forEach(function(arg) {
        for (var prop in arg) {
            newobj[prop] = arg[prop] } }) 
    return newobj 
}


humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}

