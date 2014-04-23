// Bridge between visualization framework (plumb? angular? d3?) and js/forum files

///////// PuffForum Interface ////////////

// Register our update function
var eatPuffs = function(puffs) {
    // call the display logic
  
    if(!Array.isArray(puffs) || !puffs.length) {
        return false;
    }

    if(typeof globalForceUpdateFun == 'undefined') return false
    
    // TODO: just call some kind of 'look for puff' function instead
    if(typeof globalStupidFirstTimeFlag == 'undefined') {
        globalStupidFirstTimeFlag = true
        var hash = window.location.hash
        if(hash) {
            var puff = PuffForum.getPuffById(hash.slice(1))
            if(puff) {
                showPuff(puff)
            }
        }
    }
    
    globalForceUpdateFun() // OPT: debounce this
}

PuffForum.onNewPuffs(eatPuffs); // assign our callback

PuffForum.init(); // initialize the forum module (and by extension the puffball network)

////////// End PuffForum Interface ////////////




///// event stuff. move this into either PuffForum or Puff itself.

events = {}
events.subs = {}

events.pub = function(path, data) {
    //// pub to * at each level and then to path itself
    var pathlist = events.scrub_path(path)
    var realpath = pathlist.join('/')
    
    events.tryPub('*', data, realpath)                                           // global catchall
    
    pathlist.reduce(function(acc, seg) {                                        // channel catchalls
        var newacc = acc + seg + '/'
        events.tryPub(newacc + '*', data, realpath)
        return newacc
    }, '')
    
    events.tryPub(realpath, data, realpath)                                      // actual channel
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

events.tryPub = function(path, data, realpath) {
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


puffworlddiv = document.getElementById('puffworld')
puffworldprops = {all: { replyTo: []
                       , replyOn: false
                       ,  menuOn: false
                       ,   style: 'PuffRoots'
                       ,    puff: false
                       }}


events.sub('ui/*', function(data, path) {
    // batch process recent log items on requestAnimationFrame
    // ... yeah ok maybe later
        
    // feed each item into a state twiddling function (could use React's .update for now)
    if(Array.isArray(data)) 
        puffworldprops = events.handle_merge_array(puffworldprops, data)
    else
        puffworldprops = React.addons.update(puffworldprops, data)
    
    // then re-render PuffWorld w/ the new props
    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
})

events.sub('ui/menu/close', function() {
    puffworldprops = React.addons.update(puffworldprops, {all: {$merge: {keysOn: false}}})
    
    // then re-render PuffWorld w/ the new props
    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
})

events.handle_merge_array = function(props, data) {
    while(data.length > 1) {
        var path = data.shift()
        var value = data.shift()
        var merger = events.convert_to_update_format(path, value)
        props = React.addons.update(props, merger)
    }
    return props
}

events.convert_to_update_format = function(path, value) {
    var segs = path.split('.')
    return segs.reverse().reduce(function(acc, seg) {
        var next = {}
        next[seg] = acc ? acc : value
        return acc ? next : {$merge: next}
    }, false)
}


/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // Puff.Data.puffs.forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffById(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////