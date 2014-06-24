// Bridge between visualization framework and js/forum files

puffworldprops = {
    menu: {
        show: false,
        prefs: false,
        profile: false,

        user: {
            pick_one: false,
            show_add: false,
            add_one: false,
            add_new: false,
            manage: false,
            show_bc: false,
            show_key: false
        }
    },

    view: {
        // filter: {
        //     route: false,                           // a single route
        // },
        language   : 'en',
        filterroute: false, // blargh
        filteruser : false,
        style      : 'PuffRoots',
        puff       : false,                                // focused puff (not just sig)
        user       : false,                                // username // TODO: make this part of filter
        mode       : 'browse',                             // 'browse' or 'arrow'
        rows       : 4,
        cols       : 5,
        boxRatio   : 1,
        animation  : true,                            // true -> animate everything; false -> animate nothing
        cursor     : false,                              // sig of selected puff
        showinfo   : false                             // true -> always show info boxes; false -> only on hover
    },

    reply: {
        parents: [],
        show: false,
        preview: false,
        type: 'text'
    },

    raw: {
        puffs: []
    },

    prefs: { },
    profile: { },
    tools: {
        importuser: {
            username: false,
            token: false,
            auth: false
        },
        users: {
            resultstyle: 'raw',
            puffstyle: 'raw'
        }
    }
}

puffworlddefaults = puffworldprops                  // it's immutable so we don't care



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
//     for(var i = 0; i < last; i++) {                                            // walk down, but skip the last item
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
//     for(var i = 0; i < path.length; i++) {
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


///// event bindings that are specific to the GUI //////

events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    // change props in a persistent fashion
    if(data)
        if(Array.isArray(data))
            puffworldprops = React.addons.update(puffworldprops, data[0]) // this is a bit weird
        else
            events.update_puffworldprops(data)

    // set the props in the url and history
    setViewPropsInURL()

    puffworldprops.reply.preview = false;
    // then re-render PuffWorld w/ the new props
    updateUI()
})

/// move these into their own lib
events.update_puffworldprops = function(data) {
    puffworldprops = events.handle_merge_array(puffworldprops, data)
}

events.handle_merge_array = function(props, data) {
    return Object.keys(data).reduce(function(props, key) {
        return events.merge_props(props, key, data[key])
    }, props)
}

events.merge_props = function(props, path, value) {
    var segs = path.split('.')
    var last = segs.pop()
    var final = next = events.shallow_copy(props)

    segs.forEach(function(seg) {
        next[seg] = events.shallow_copy(next[seg])
        next = next[seg]
    })

    next[last] = value
    return final
}

events.shallow_copy = function(obj) {
    return Object.keys(obj || {}).reduce(function(acc, key) {acc[key] = obj[key]; return acc}, {})
}








/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // PuffData.puffs.forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffBySig(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////










///////////// display-related helper functions or something like that ///////////////////


getGridCoordBox = function(rows, cols, outerwidth, outerheight) {
    var min = function(a, b) {return Math.min(a, b)}
    var max = function(a, b) {return Math.max(a, b)}
    var gridwidth  = outerwidth  / cols
    var gridheight = outerheight / rows
    var eq = function(a, b) {return a == b}
    var grid = Array.apply(0, Array(rows))
        .map(function() {return Array.apply(0, Array(cols))
            .map(function() {return 0})}) // build 2D array

    return { get: function() {return grid}
           , set_eq: function(new_eq) {eq = new_eq}
           , add: function(width, height, miny, minx, maxy, maxx, pointer) {
                      maxy = min(maxy||rows-height, rows-height), maxx = min(maxx||cols-width, cols-width)
                      miny = min(miny||0, maxy), minx = min(minx||0, maxx)
                      if(maxx<0 || maxy<0) return Puffball.onError('Block is too big for the grid')
                  
                      top: for(var y = miny; y <= maxy; y++) {
                          bot: for(var x = minx; x <= maxx;  x++) {
                              for(var dy = 0; dy < height; dy++) {
                                  for(var dx = 0; dx < width; dx++) {
                                      if(grid[y+dy][x+dx]) continue bot }}
                              break top }}
                      if(x == maxx+1 && y == maxy+1) return Puffball.onError('No room in the grid')
                      if(x == null || y == null) return Puffball.onError('Block too big for the grid')
                      for(var dy = 0; dy < height; dy++) {
                          for(var dx = 0; dx < width; dx++) {
                              grid[y+dy][x+dx] = pointer || 1 } }
                      return {width: width*gridwidth, height: height*gridheight, x: x*gridwidth, y: y*gridheight}
                  }
           }
}

function findNeighbor(grid, pointer, dir) {
    var boxCoords = findBoxInGrid(grid, pointer)
    if(!boxCoords) return false
    
    // TODO: need to indicate if dirBox is outside of grid, versus pointer not found

    var dirBox = makeDirBox(boxCoords, dir)
    if(!dirBox) return false
    
    return firstThingInBox(grid, dirBox[0], dirBox[1])
}

function findBoxInGrid(grid, target, eq) {
    /// find something in a grid box and return coords
    /// NOTE: this assumes rectilinear shapes
    eq = eq || function(a, b) {return a === b}
    eq = function(a, b) {return a.sig === b.sig} // TODO: encapsulate eq in gridBox // OPT: don't look inside
    
    top: for(var y = 0, ly = grid.length; y < ly; y++)
        for(var x = 0, lx = grid[y].length; x < lx; x++)
            if(eq(grid[y][x], target)) break top                     // find top and left coords
    
    if(y == grid.length && x == grid[0].length) return false        // target not in box
    
    for(var dy = 0, ly = grid.length-y; dy < ly; dy++)
        if(!eq(grid[y+dy][x], target)) break                         // find bottom coord
    
    for(var dx = 0, lx = grid[y].length-x; dx < lx; dx++)
        if(!eq(grid[y][x+dx], target)) break                         // find right coord
    
    return [[x, y], [x+dx-1, y+dy-1]]                              // minus one because deltas always overshoot
}

function firstThingInBox(grid, topleft, botright) { // lteq because our boxes are inclusive; boundaries built in.
    for(var y = Math.max(topleft[1], 0), ly = Math.min(botright[1], grid.length-1); y <= ly; y++)
        for(var x = Math.max(topleft[0], 0), lx = Math.min(botright[0], grid[0].length-1); x <= lx; x++)
            if(grid[y][x]) return grid[y][x]
}

function arrowToDir(char) {
    if(char == 37) return 'left'
    if(char == 38) return 'up'
    if(char == 39) return 'right'
    if(char == 40) return 'down'
}

function makeDirBox(boxCoords, dir) {
    var top   = boxCoords[0][1]
    var left  = boxCoords[0][0]
    var bot   = boxCoords[1][1]
    var right = boxCoords[1][0]
    
    if(dir == 'up')    return [[left, top-1],  [right, top-1]]
    if(dir == 'down')  return [[left, bot+1],  [right, bot+1]]
    if(dir == 'left')  return [[left-1, top],  [left-1, bot]]
    if(dir == 'right') return [[right+1, top], [right+1, bot]]
}


function moveToNeighbour(currentId, dir, mode) {
    var current = document.getElementById(currentId);
    var x = parseFloat(current.style.left);
    var y = parseFloat(current.style.top);
    var offset = mode == "browse" ? 7 : 31;
    
    switch (dir) {
        case 37: // left
            x -= offset;
            y += 1;
        break;
        
        case 38: // up
            y -= offset;
            x += 1;
        break;
        
        case 39: // right
            x += parseFloat(current.style.width) + offset + 1;
            y += 1;
        break;
        
        case 40: // down
            y += parseFloat(current.style.height) + offset;
            x += 1;
        break;
        
        default:
        break;
    }
    
    var neighbour = document.elementFromPoint(x, y);
    while (neighbour && 
           (' '+ neighbour.className + ' ').indexOf(' block ') == -1) {
        neighbour = neighbour.parentNode;
    }
    
    if(!neighbour)
        neighbour = document.querySelector('.block');
    
    return neighbour;
}


function draggableize(el) {
    // modified from http://jsfiddle.net/tovic/Xcb8d/light/
    var x_pos = 0,  y_pos = 0,  // Stores x & y coordinates of the mouse pointer
        x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

    // Will be called when user starts dragging an element
    function drag_init(e) {
        // Store the object of the element which needs to be moved
        x_pos = e.pageX;
        y_pos = e.pageY;
        x_elem = x_pos - el.offsetLeft;
        y_elem = y_pos - el.offsetTop;
        document.addEventListener('mousemove', move_el);
        return false
    }

    // Will be called when user dragging an element
    function move_el(e) {
        x_pos = e.pageX;
        y_pos = e.pageY;
        el.style.left = (x_pos - x_elem) + 'px';
        el.style.top  = (y_pos - y_elem) + 'px';
    }

    // Bind the functions...
    el.addEventListener('mousedown', drag_init);
    el.addEventListener('mouseup', function() {
        document.removeEventListener('mousemove', move_el);
    });
}



function showPuff(sig) {
    //// show a puff and do other stuff
    
    if(!sig)
        return false
    
    var puff = PuffForum.getPuffBySig(sig)                           // get it?
    
    if(puff)
        return showPuffDirectly(puff)                               // got it.

    var prom = PuffData.pending[sig]                                // say what?
    if(!prom) 
        return Puffball.onError('Bad sig in pushstate')

    prom.then(function(puffs) {                                     // okay got it.
        showPuffDirectly(puffs[0])
    })

}

function showPuffDirectly(puff) {
    //// show a puff with no checks or balances
    events.pub('ui/show/tree', {'view.style': 'PuffTallTree', 'view.puff': puff, 'menu': puffworlddefaults.menu, 'reply': puffworlddefaults.reply})
}

//// props and urls and pushstate oh my

function setViewPropsInURL() {
    var props = events.shallow_copy(puffworldprops.view)
    if(props.puff)
        props.puff = props.puff.sig
    else
        delete props.puff
    setURL(props)
}

function setURL(state, path) {
    var currentState = history.state || {}
    var flatCurrent = JSON.stringify(currentState)
    var flatState  = JSON.stringify(state)
    
    if(flatState == flatCurrent)                                        // are they equivalent?
        return false
    
    var url = '?' + Object.keys(state).map( function(key) {
                              return encodeURIComponent(key) + "=" + encodeURIComponent(state[key] || '') })
                          .join('&')
    
    // saving in case we need this in the future
    //
    // var cloneCurrent = JSON.parse(flatCurrent)
    // var cloneState = JSON.parse(flatState)
    // delete cloneCurrent.cursor
    // delete cloneState.cursor
    //     
    // if(JSON.stringify(cloneState) == JSON.stringify(cloneCurrent))      // equiv up to cursor?
    //     return false
    
    
    
    history.pushState(state, path || '', url)
}

function setViewPropsFromURL() {
    var pushstate = getQuerystringObject()
    setViewPropsFromPushstate(pushstate)
}

function setViewPropsFromPushstate(pushstate) {
    var sig = pushstate.puff
    
    if(sig)
        pushstate.puff = PuffForum.getPuffBySig(sig)
    
    var props = Object.keys(pushstate).reduce(function(acc, key) {acc['view.' + key] = pushstate[key]; return acc}, {})
    events.update_puffworldprops(props)
    
    if(!sig || props['view.puff']) { // we've got it
        return updateUI()
    }
    
    // we ain't got it
    var prom = PuffData.pending[sig]
    if(!prom) 
        return Puffball.onError('Bad sig in pushstate')
    
    // now we have it
    prom.then(function(puffs) {
        props['view.puff'] = puffs[0]
        events.update_puffworldprops(props)
        updateUI()                                                 
    })
}

function getQuerystringObject() {
    return window.location.search.substring(1).split('&')
                 .reduce(function(acc, chunk) {
                     var pair = chunk.split('=')
                     acc[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
                     return acc}, {})
}



extend = function() {
    var newobj = {}
    Array.prototype.slice.call(arguments).forEach(function(arg) {
        for(var prop in arg) {
            newobj[prop] = arg[prop] } }) 
    return newobj 
}


humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}



function renderPuffWorld() {
    var puffworlddiv = document.getElementById('puffworld') // OPT: cache this for speed

    // puffworldprops has to contain some important things like prefs
    // THINK: this is probably not the right place for this...
    puffworldprops.prefs = PuffWardrobe.getAllPrefs()
    puffworldprops.profile = PuffWardrobe.getAllProfileItems()

    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
}



// TODO: move this somewhere nicer
function formatForDisplay(obj, style) {
    if(style == 'formatted') {
        return JSON.stringify(obj, null, 2)
            .replace(/[{}",\[\]]/g, '')
            .replace(/^\n/, '')
            .replace(/\n$/, '');
    }

    // style is raw
    return JSON.stringify(obj).replace(/^\{\}$/, '');
}



///////// PuffForum Interface ////////////

// keep this down at the bottom -- it has to load after everything else

window.requestAnimationFrame = window.requestAnimationFrame       || window.mozRequestAnimationFrame
                            || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
                            || setTimeout

// only update once per rAF
var updateUI = onceRAF.bind(this, renderPuffWorld)

// Register our update function
var eatPuffs = function(puffs) {
    // call the display logic
  
    if(!Array.isArray(puffs) || !puffs.length) {
        return false;
    }

    updateUI();
}

PuffForum.onNewPuffs(eatPuffs); // assign our callback

PuffForum.init(); // initialize the forum module (and by extension the puffball network)

PuffWardrobe.setPref('storeKeychain', true); // TODO: make this based on config, and changeable

setViewPropsFromURL(); // handle pushstate hash

window.addEventListener('resize', function(){
    updateUI();
});

window.addEventListener('load', function() {
    /// this is cumbersome, but it gets around browser inconsistencies (some fire popstate on page load, others don't)
    //  via https://code.google.com/p/chromium/issues/detail?id=63040
    setTimeout(function() {
        window.addEventListener('popstate', function(event) {
            if(event.state)
                return setViewPropsFromPushstate(event.state); 
            
            puffworldprops = puffworlddefaults;
            updateUI();
        });
    }, 0);
});

// updateUI(); // bootstrap the GUI



////////// End PuffForum Interface ////////////
