// Bridge between GUI and PuffBall modules

puffworldprops = {

    ICX: {
        newUser: {
            requestedUsername: '',
            usernameStatus: '',
            usernameMessage: '',
            checkingUsername: ''
        }
    },
    
    clusters: {
        filters: true,
        publish: true,
        view: true,
        identity: false,
        profile: false,
        preferences: false,
        about: true,
        tools: false
    },

    menu: {
        show: false,
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


    view: {

        icx: {                                          // ICX related
            screen: 'init'
        },
        
        mode: 'table',
        
        language  : 'en',

        query: {
            sort: 'DESC',                               // direction of sort
        },

        filters: {},

        score: {},
        
        slider: {},

        // TABLEVIEW
        table: {
            column: {
                refs: {
                    show: true,
                    weight:.3,
                },
                from: {
                    show: true,
                    weight: .7,
                },
                to: {
                    show: true,
                    weight: .7,
                },
                content: {
                    show: true,
                    weight: 3.5,
                },
                date: {
                    show: true,
                    weight: 1,
                    allowSort: true
                },
                tags: {
                    show: false,
                    weight: 1.5,
                },
            },
            bar: {
                tmp: 1      // to prevent bar from disappearing
            },
            sort: {
                column: 'date',
                desc: true
            },
            format: 'list',
            maxRowHeight: 99    // We want to show everything
        },
    },

    reply: {
        parents: [],
        replyTo: "", // temp var for single recipient reply
        isReply: false,
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
    profile: {
        avatarUrl: ''
    },
    tools: {
        users: {
            resultstyle: 'raw',
            puffstyle: 'raw'
        }
    }
}

puffworlddefaults = puffworldprops  // it's immutable so we don't care


//// event bindings for controlling core behavior from the display ////

Events.sub('prefs/storeKeychain/toggle', function(data, path) {
    var new_state = !PB.M.Wardrobe.getPref('storeKeychain')
    PB.M.Wardrobe.setPref('storeKeychain', new_state)

    var dir = new_state ? 'on' : 'off'
    Events.pub('ui/menu/prefs/storeKeychain/' + dir)
})

Events.sub('profile/nickname/set', function(data, path) {
    var nickname = data.nickname
    if(!nickname)
        return PB.onError('Invalid nickname')         // THINK: do this in React? use PB.validations?

    PB.M.Wardrobe.setProfileItem('nickname', nickname)

    Events.pub('ui/menu/profile/nickname/set')
});


///// event bindings that are specific to the GUI //////

Events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    update_puffworldprops(data)                             // change props in a persistent fashion

    setURLfromViewProps()                                   // set the props in the url and history
    
    updateUI()                                              // then re-render PuffWorld w/ the new props
})

Events.sub("filter/*", function(data, path) {
    // side effects: query set to default; view.table.format set to list
    data['view.query'] = Boron.shallow_copy(puffworlddefaults.view.query);
    data['view.table.format'] = 'list';
    
    // TODO put this in config as default view
    if (puffworldprops.view.mode != 'list' || 
        puffworldprops.view.mode != 'tableView') {
        data['view.mode'] = 'list';
    } 

    Events.pub('ui/query/default', data);
    PB.Data.importRemoteShells() // TODO: remove once we upgrade to websockets as our workaround for non-rtc browsers
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

// functions that convert string for displaying
var StringConversion = {};

/**
 * reduce imported username to alphanumeric
 * @param  {string} username original username
 * @param  {string} allowDot allow '.' in the username for subusers
 * @return {string}          valid username
 */
StringConversion.reduceUsernameToAlphanumeric = function(username, allowDot) {
    allowDot = allowDot || false;
    var pattern = allowDot ? /[^.A-Za-z0-9]/ : /[^A-Za-z0-9]/;
    return username.split(pattern).join('');
}

StringConversion.toLowerCamelCase = function(str) {
    str = str.split(" ");
    var first = str[0];
    var rest = str.slice(1)
                .map(function(s){
                    if (s.length < 2) return s.toUpperCase();
                    return s.slice(0, 1).toUpperCase() + s.slice(1);
                })
                .join("");
    return first+rest;
}

StringConversion.toDisplayUsername = function(username) {
    if (username.length == 0) return username;
    username = username.replace(/\s+/g, '');
    if (username.slice(0, 1) != '.')
        username = '.' + username;
    return username;
}
StringConversion.toActualUsername = function(username) {
    if (username.length == 0) return username;
    username = username.toLowerCase().replace(/\s+/g, '');
    if (username.slice(0, 1) == '.')
        username = username.slice(1);
    return username;
}

/**
 * Truncate long usernames. May be depricated
 * @param username string
 * @returns string
 */
StringConversion.humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}

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



/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // PB.Data.getShells().forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PB.M.Forum.getPuffBySig(\'' 
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
        update_puffworldprops({'view.slider.show': true, 'view.slider.wizard':true, 'view.slider.currentSlide': 3})

        state = Boron.shallow_copy(state)                                      // clone before delete
        
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
    var viewprops = Boron.shallow_copy(puffworldprops.view)    
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
    state = Boron.flatten(state)
    
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
    var pushstate = Boron.unflatten(qobj)
    setPropsFromPushstate(pushstate)
}

function setPropsFromPushstate(pushstate) {
    var props = Object.keys(pushstate).reduce(function(acc, key) {acc['view.' + key] = pushstate[key]; return acc}, {})

    /* setting the filter to NONE when no filter is specified in the url but there is other property set
        to deal with filter issue on reload
    */
    var filterProps = Object.keys(props).filter(function(k){return k.indexOf('view.filters') == 0});
    if (Object.keys(pushstate).filter(Boolean).length > 0 && filterProps.length == 0) {
        props['view.filters'] = {};
    }

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

    var puff = PB.M.Forum.getPuffBySig(sig)                          // get it?

    if(puff)
        return showPuffDirectly(puff)                               // got it.

    var prom = PB.Data.pending[sig]                                 // say what?
    if(!prom)
        return PB.onError('Bad sig in pushstate')

    prom.then(function(puffs) {                                     // okay got it.
        showPuffDirectly(puffs[0])
    })
}

function showPuffDirectly(puff) {
    //// show a puff with no checks or balances
    Events.pub('ui/show/tree', { 'view.mode' : 'focus'
                               , 'view.filters' : {}
                               , 'view.query' : puffworlddefaults.view.query
                               , 'view.query.focus' : puff.sig
                               // , 'menu'      : puffworlddefaults.menu
                               })
}


function renderPuffWorld() {
    var puffworlddiv = document.getElementById('puffworld')         // OPT: cache this for speed

    // THINK: is this the right place for this? these probably belong in update_puffworldprops...
    // puffworldprops has to contain some important things like prefs
    var data = { prefs: PB.M.Wardrobe.getAllPrefs()
               , profile: PB.M.Wardrobe.getAllProfileItems()
               }

    update_puffworldprops(Boron.flatten(data))



    React.renderComponent(ICXWorld(puffworldprops), puffworlddiv)
}

update_puffworldprops = function(data) {
    puffworldprops = Boron.persistent_merge(puffworldprops, data)
}



///////// PB.M.Forum Interface ////////////

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



// START MANUAL FORUM MODULE INIT
// ONLY RECEIVE PRIVATE PUFFS FOR/FROM THE CURRENT USER

CONFIG.noNetwork = true
CONFIG.icxmode   = true

PB.M.Forum.onNewPuffs(eatPuffs);                     // register our update function

// PB.M.Forum.init();                                // initialize the forum module (and by extension the puffball network)
PB.onNewPuffs(PB.M.Forum.receiveNewPuffs);
PB.addRelationship(PB.M.Forum.addFamilialEdges);

// END MANUAL FORUM MODULE INIT


PB.M.Wardrobe.setPref('storeKeychain', true);        // TODO: make this based on config, and changeable

handleImportRedirect();                             // check if import

setPropsFromURL();                                  // handle pushstate hash


//// PRIVATE PUFF GATHERER

var getMyPrivateShells = function() {
    var username = PB.M.Wardrobe.getCurrentUsername()
    if(username)
        PB.Data.importPrivateShells(username)
}

setInterval(getMyPrivateShells, 60*1000)

//// END PRIVATE PUFF GATHERER

//// BUILD CRYPTO WORKER

PB.cryptoworker = new Worker("js/cryptoworker.js")

PB.workerqueue = []
PB.workerautoid = 0

PB.workerreceive = function(msg) {
    var id = msg.data.id
    if(!id) return false // TODO: add onError here

    var fun = PB.workerqueue[id]
    if(!fun) return false // TODO: add onError here

    fun(msg.data.evaluated)

    delete PB.workerqueue[id]
}

PB.workersend = function(funstr, args, resolve, reject) {
    PB.workerautoid += 1
    PB.workerqueue[PB.workerautoid] = resolve
    if(!Array.isArray(args))
        args = [args]
    PB.cryptoworker.postMessage({fun: funstr, args: args, id: PB.workerautoid})
}

// PB.cryptoworker.addEventListener("message", console.log.bind(console))
PB.cryptoworker.addEventListener("message", PB.workerreceive)


// KEEP THIS HERE FOR NOW

// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
//
// var function makeWorker(url) {
//     var worker = new Worker(url)
//     var queue = []
//     var id = 0
//
//     obj = { worker: worker
//           , queue: []
//           , id: 0
//           , send: worker.postMessage.bind(worker)
//     }
//
//     var receive = function(msg) {
//         var id = msg._id
//         if(!id) return false // TODO: add onError here
//
//         var fun = queue[_id]
//         if(!fun) return false // TODO: add onError here
//
//         fun(msg.data)
//
//         delete queue[id]
//     }
//
//     worker.addEventListener("message", receive)
//
//     var send = function(msg, fun) {
//         msg._id = ++id
//         queue[id] = funfix(fun)
//         worker.postMessage(msg)
//     }
//
//     return obj
// }
//
// var cryptoworker = {
//     worker: new Worker("js/cryptoworker.js")
//     queue: []
//     id: 0
// }
//
// cryptoworker.addEventListener("message", console.log.bind(console))
// 
// Object.keys(PB.Crypto).forEach(function(key) {
//     PB.Crypto[key] = function() {
//         cryptoworker.postMessage({fun: key, args: [].slice.call(arguments)})
//         return Promise
//         // build response list, match by id
//         // change all requests to async requests
//     }
// })
// 
// cryptoworker.postMessage({fun: 'puffToSiglessString', args: [{asdF:123}]})
//
// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
// var partial = function(fun) {
//     var args = [].slice.call(arguments, 1)
//     return function() {
//         return fun.apply(fun, args.concat([].slice.call(arguments)))
//     }
// }



//// END BUILD CRYPTO WORKER




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
            lastUsername = PB.parseJSON(lastUsername);
            PB.M.Wardrobe.switchCurrent(lastUsername);

        }
        window.addEventListener('popstate', function(event) {
            if(event.state)
                return setPropsFromPushstate(event.state);
            puffworldprops = puffworlddefaults;
            updateUI();
        });
    }, 0);
});


// Hide slideshow from people with more than one identity
// Make sure not problem if empty
if(Object.keys(PB.M.Wardrobe.getAll()).length < 1)
    Events.pub( 'ui/slider/close',{ 'view.slider.show': true});
    // console.log("hide silder cuz several users")

// TODO: pull out of global, more fineness
ACTIVITY = [];
Events.sub('ui/*', function(data) {
    if(ACTIVITY.length) {
        var last = ACTIVITY[ACTIVITY.length - 1]
        if(JSON.stringify(last) == JSON.stringify(data))
            return false
    }

    ACTIVITY.push(data);


    // XHR this bad boy!
    if(puffworldprops.prefs.reporting)
        PB.Net.xhr('https://i.cx/api/events.php', {method: 'POST'}, data)
});


// publishing a profile puff in ICX after registering a new user
// Move this
function handleUpdateProfile(puff) {
    var currentKeys = PB.M.Wardrobe.getCurrentKeys()
    var oldProfile = PB.M.Wardrobe.getCurrentUserRecord().profile
    var type = 'updateUserRecord'
    var content = "setProfile"
    var payload = {}
    payload.profile = puff.sig

    var update_puff = PB.buildPuff(currentKeys.username, currentKeys.admin, [], type, content, payload)

    var update_prom = PB.Net.updateUserRecord(update_puff)
    update_prom.then(function(userRecord){
        console.log('Profile updated!')
    }).catch(function(err){
        console.log('error', err)
    })
}

function publishProfilePuff() {
    console.log(puffworldprops.ICX.newUser)
    console.log(PB.M.Wardrobe.getCurrentKeys())

    // build puff
    var content = puffworldprops.profile.avatarUrl
    var type = 'profile'
    // var self = this

    // publish public profile
    var post_prom = PB.M.Forum.addPost( type, content, [], {})
    post_prom.then(function(puff){
        // self.cleanUpSubmit()
        // self.refs.meta.handleCleanFields()
        handleUpdateProfile(puff)
    }).catch(PB.promiseError('Posting failed'))
}