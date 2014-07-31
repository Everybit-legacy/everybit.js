// Bridge between visualization framework and js/forum files

puffworldprops = {
    clusters: {
        filters: true,
        publish: true,
        view: true,
        identity: false,
        preferences: false,
        about: true,
        tools: false
    },

    menu: {
        show: true,
        prefs: false,
        profile: false,
        import: false,                                  // import username
        section: false,                                 // the section user is currently working on
        popout: false,

        user: {
            // pick_one: false,
            manage: false,
            show_bc: false,
            show_key: false
        }
    },

    header: {
        show: true,
        publish: {
            show: false
        },
        identity: {
            show: false
        },
        score: {
            show: false
        }
    },

    slider: {
        show: false,
        wizard: false,
        currentSlide: 1,
        totalSlides: 7,
        username: '',
        importInfo: {},
        totalWizardSlides: 4
    },


    view: {
        mode: 'list',
        
        filters: {
            tags: ['jellyfish'],
            users : [],
            routes: []
        },

        // TODO: move these options into view.layout
        arrows    : false,                              // true -> show relationship arrows between puffs
        rows      : 4,
        // cols      : 5,                                  // NOTE: not currently used... ?
        boxRatio  : 1,
        bigrows   : 2,
        bigcols   : 2,
        
        language  : 'en',
        animation : true,                               // true -> animate everything; false -> animate nothing
        showinfo  : false,                              // true -> always show info boxes; false -> only on hover

        query: {
            sort: 'DESC',                               // direction of sort
            roots : false,                              // THINK: move this to filterToggles or filterNums or something?
            ancestors: false,                           // number of ancestor levels to show (false for none)
            descendants: false,                         // number of descendant levels to show (false for none)
            focus: false,                               // a puff sig to focus on
            offset: 0,
        },

        score: {
            suValue: 0.1,
            tluValue: 1,
            maxSuValue: 1
        },
        
        // THINK: consider taking this out of view (or filtering it out of the url, at least)
        flash     : false,                              // flash the cursor
        cursor    : false,                              // sig of selected puff
    },

    reply: {
        parents: [],
        // show: false,
        lastType: false, // type of the last published puff
        expand: false,
        content: '',
        state: {},
        privacy: false,
        type: false
    },

    raw: {
        puffs: []
    },

    prefs: {
        reporting: true
    },
    profile: { },
    tools: {
        users: {
            resultstyle: 'raw',
            puffstyle: 'raw'
        }
    }
}

puffworlddefaults = puffworldprops                          // it's immutable so we don't care


//// event bindings for controlling core behavior from the display ////

events.sub('prefs/storeKeychain/toggle', function(data, path) {
    var new_state = !PuffWardrobe.getPref('storeKeychain')
    PuffWardrobe.setPref('storeKeychain', new_state)

    var dir = new_state ? 'on' : 'off'
    events.pub('ui/menu/prefs/storeKeychain/' + dir)
})

events.sub('profile/nickname/set', function(data, path) {
    var nickname = data.nickname
    if(!nickname)
        return Puffball.onError('Invalid nickname')         // THINK: do this in React? use Puffball.validations?

    PuffWardrobe.setProfileItem('nickname', nickname)

    events.pub('ui/menu/profile/nickname/set')
});


///// event bindings that are specific to the GUI //////

events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    update_puffworldprops(data)                             // change props in a persistent fashion

    setURLfromViewProps()                                   // set the props in the url and history
    
    updateUI()                                              // then re-render PuffWorld w/ the new props
})

events.sub("filter/*", function(data, path) {
    data['view.query'] = PB.shallow_copy(puffworlddefaults.view.query);
    data['view.mode'] = 'list';
    events.pub('ui/query/default', data);
})

// TODO: move these somewhere nicer

formatForDisplay = function(obj, style) {
    if(style == 'formatted') {
        return JSON.stringify(obj, null, 2)
            .replace(/[{}",\[\]]/g, '')
            .replace(/^\n/, '')
            .replace(/\n$/, '');
    }

    // style is raw
    return JSON.stringify(obj).replace(/^\{\}$/, '');
}

/**
 * Truncate long usernames. May be depricated
 * @param username string
 * @returns string
 */
humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}

/**
 * reduce imported username to alphanumeric
 * @param  {string} username original username
 * @param  {string} allowDot allow '.' in the username for subusers
 * @return {string}          valid username
 */
reduceUsernameToAlphanumeric = function(username, allowDot) {
    allowDot = allowDot || false;
    var pattern = allowDot ? /[^.A-Za-z0-9]/ : /[^A-Za-z0-9]/;
    return username.split(pattern).join('');
}


/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // PuffData.getShells().forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffBySig(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////




/* not in use
function draggableize(el) {
    /// modified from http://jsfiddle.net/tovic/Xcb8d/light/
    
    var x_pos = 0,  y_pos = 0,                                      // mouse coordinates
        x_elem = 0, y_elem = 0;                                     // top and left element coords
                                                                    
    // called when user starts dragging an element              
    function drag_init(e) {                                     
        x_pos = e.pageX;                                            // store coords
        y_pos = e.pageY;                                            
        x_elem = x_pos - el.offsetLeft;                         
        y_elem = y_pos - el.offsetTop;                          
        document.addEventListener('mousemove', move_el);            // start moving
        return false
    }

    // called each time the mouse moves
    function move_el(e) {
        x_pos = e.pageX;
        y_pos = e.pageY;
        el.style.left = (x_pos - x_elem) + 'px';
        el.style.top  = (y_pos - y_elem) + 'px';
    }

    // bind the functions
    el.addEventListener('mousedown', drag_init);
    el.addEventListener('mouseup', function() {
        document.removeEventListener('mousemove', move_el);
    });
}
*/



//// props and urls and pushstate oh my ////

stashedKeysFromURL = {}

function getStashedKeysFromURL() {
    return stashedKeysFromURL
}

function handleImportRedirect() {
    var state = getQuerystringObject();
    var keysToStash = ['requestedUsername', 'network', 'token', 'requestedUserId']
    if (state['requestedUsername']) {
        // update_puffworldprops({'menu.show': true, 'menu.import': true, 'menu.section': 'identity'})
        update_puffworldprops({'slider.show': true, 'slider.wizard':true, 'slider.currentSlide': 3})

        state = PB.shallow_copy(state)                                      // clone before delete
        
        for(var key in state) {
            if(!~keysToStash.indexOf(key)) continue
            stashedKeysFromURL[key] = state[key]

            delete state[key]
        }
        setURLfromViewProps();
    }
    //setURLfromViewProps();
}

function setURLfromViewProps() {
    var viewprops = PB.shallow_copy(puffworldprops.view)    
    setURL(viewprops)
}

function setURL(state, path) {
    var currentState = history.state || {}
    var flatCurrent  = JSON.stringify(currentState)
    var flatState    = JSON.stringify(state)
    if(flatState == flatCurrent)                                            // are they equivalent?
        return false

    var url = convertStateToURL(state)

    history.pushState(state, path || '', url)
}

function convertStateToURL(state) {
    // state = stashKeysFromURL(state)
    state = PB.flatten(state)
    
    var url = Object.keys(state)
                    .filter(function(key) {return key && state[key] && state[key].length !== 0})
                    .map(function(key) {
                        return encodeURIComponent(key) + "=" 
                             + encodeURIComponent(state[key].join ? state[key].join('~') : state[key] || '') })
                    .join('&')

    return '?' + url
}


function setPropsFromURL() {
    var qobj  = getQuerystringObject()
    Object.keys(qobj).forEach(function(key) {qobj[key] = !~qobj[key].indexOf('~') ? qobj[key] : qobj[key].split('~')})
    var pushstate = PB.unflatten(qobj)
    setPropsFromPushstate(pushstate)
}

function setPropsFromPushstate(pushstate) {
    var props = Object.keys(pushstate).reduce(function(acc, key) {acc['view.' + key] = pushstate[key]; return acc}, {})
    
    update_puffworldprops(props)
    
    updateUI()
}

function getQuerystringObject() {
    return window.location.search.substring(1).split('&')
        .reduce(function(acc, chunk) {
            var pair = chunk.split('=')
            acc[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
            return acc}, {})
}



///// Puff display helpers /////// 



function showPuff(sig) {
    //// show a puff and do other stuff

    if(!sig)
        return false

    var puff = PuffForum.getPuffBySig(sig)                          // get it?

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
    events.pub('ui/show/tree', { 'view.mode' : 'focus'
                               , 'view.filter' : puffworlddefaults.view.filter
                               , 'view.query' : puffworlddefaults.view.query
                               , 'view.query.focus' : puff.sig
                               , 'menu'      : puffworlddefaults.menu
                               // , 'reply'     : puffworlddefaults.reply
                               })
}


function renderPuffWorld() {
    var puffworlddiv = document.getElementById('puffworld')         // OPT: cache this for speed

    // THINK: is this the right place for this? these probably belong in update_puffworldprops...
    // puffworldprops has to contain some important things like prefs
    var data = { prefs: PuffWardrobe.getAllPrefs()
               , profile: PuffWardrobe.getAllProfileItems()
               }

    update_puffworldprops(PB.flatten(data))

    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
}

update_puffworldprops = function(data) {
    puffworldprops = PB.persistent_merge(puffworldprops, data)
    
    // THINK: this is not the right place for this...
    // TODO: build a type system for javascript and use instead of this mess
    // this is a fresh copy of puffworldprops, so we're going to mutate it here before releasing it into the wild

    // ROUTES
    if(!Array.isArray(puffworldprops.view.filters.routes)) {
        if(!puffworldprops.view.filters.routes)
            puffworldprops.view.filters.routes = []
        else 
            puffworldprops.view.filters.routes = [puffworldprops.view.filters.routes]
    }

    // USERS
    if(!Array.isArray(puffworldprops.view.filters.users)) {
        if(!puffworldprops.view.filters.users)
            puffworldprops.view.filters.users = []
        else
            puffworldprops.view.filters.users = [puffworldprops.view.filters.users]
    }

    // TAGS
    if(!Array.isArray(puffworldprops.view.filters.tags)) {
        if(!puffworldprops.view.filters.tags)
            puffworldprops.view.filters.tags = []
        else
            puffworldprops.view.filters.tags = [puffworldprops.view.filters.tags]
    }
}



///////// PuffForum Interface ////////////

// NOTE: this has to load last, so keep it at the bottom

window.requestAnimationFrame = window.requestAnimationFrame       || window.mozRequestAnimationFrame
                            || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
                            || setTimeout

var updateUI = onceRAF.bind(this, renderPuffWorld)  // only update once per rAF

var eatPuffs = function(puffs) {
    // if(!Array.isArray(puffs) || !puffs.length)   // THINK: this disrupts cold load of contentless shells...
    //     return false;

    updateUI();
}


////
PuffForum.onNewPuffs(eatPuffs);                     // register our update function

PuffForum.init();                                   // initialize the forum module (and by extension the puffball network)

PuffWardrobe.setPref('storeKeychain', true);        // TODO: make this based on config, and changeable

handleImportRedirect();                             // check if import

setPropsFromURL();                                  // handle pushstate hash
////


window.addEventListener('resize', function() {
    updateUI();
});

window.addEventListener('load', function() {
    /// this is cumbersome, but it gets around browser inconsistencies (some fire popstate on page load, others don't)
    //  via https://code.google.com/p/chromium/issues/detail?id=63040
    setTimeout(function() {
        // set current identity
        var lastUsername = localStorage['PUFF::identity'];
        if (lastUsername) {
            lastUsername = JSON.parse(lastUsername);
            PuffWardrobe.switchCurrent(lastUsername);
        }
        window.addEventListener('popstate', function(event) {
            if(event.state)
                return setPropsFromPushstate(event.state);

            puffworldprops = puffworlddefaults;
            updateUI();
        });
    }, 0);
});


// TODO: pull out of global, more fineness
ACTIVITY = [];
events.sub('ui/*', function(data) {
    ACTIVITY.push(data);

    // XHR this bad boy!
    if(puffworldprops.prefs.reporting)
        PuffNet.xhr('http://162.219.162.56/c/events.php', {method: 'POST'}, data)
});

// Hide slideshow from people with more than one identity
// Make sure not problem if empty
if(Object.keys(PuffWardrobe.getAll()).length < 1)
    events.pub( 'ui/slider/close',{ 'slider.show': true});
    // console.log("hide silder cuz several users")


////////// End PuffForum Interface ////////////