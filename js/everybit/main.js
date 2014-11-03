// Bridge between visualization framework and js/forum files

puffworldprops = {


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
        mode: 'list',
        
        filters: {
            tags: [],
            types: [],
            users : [],
            routes: [],
            roots: false // View puffs w/no parents
        },

        // TODO: move these options into view.layout
        arrows    : true,                              // true -> show relationship arrows between puffs
        rows      : 4,
        // cols      : 5,                               // THINK: not currently used...
        boxRatio  : 1.61,
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
            offset: 0
        },

        score: {
            suValue: 0.1,
            tluValue: 1,
            maxSuValue: 1
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
        
        // THINK: consider taking this out of view (or filtering it out of the url, at least)
        flash     : false,                              // flash the cursor
        cursor    : false,                              // sig of selected puff

        // TABLEVIEW
        table: {
            relationGroup: false,
            column: {
                refs: {
                    show: true,
                    weight:.8,
                    allowSort: false
                },
                user: {
                    show: true,
                    weight: 1,
                    allowSort: false
                },
                content: {
                    show: true,
                    weight: 3.5,
                    allowSort: false
                },
                date: {
                    show: true,
                    weight: 1,
                    allowSort: true
                },
                tags: {
                    show: false,
                    weight: 1.5,
                    allowSort: false
                },
                other: {
                    show: true,
                    weight: 1.5,
                    allowSort: false
                },
                score: {
                    show: true,
                    weight: 0.5,
                    allowSort: false
                }
            },
            bar: {
                expand: false,
                showIcons: false,
                tmp: 1      // to prevent bar from disappearing
            },
            sort: {
                column: 'date',
                desc: true
            },
            lastClick: "",
            format: 'list',
            maxRowHeight: 4
        }
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
    profile: { 
        customAvatar: false
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

Events.sub('prefs/ephemeralKeychain/toggle', function(data, path) {
    var new_state = !CONFIG.ephemeralKeychain
    modConfig('ephemeralKeychain', new_state)

    var dir = new_state ? 'on' : 'off'
    Events.pub('ui/menu/prefs/ephemeralKeychain/' + dir)
})

Events.sub('profile/nickname/set', function(data, path) {
    var nickname = data.nickname
    if(!nickname)
        return PB.onError('Invalid nickname')               // THINK: do this in React? use PB.validations?

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



function renderPuffWorld() {
    var puffworlddiv = document.getElementById('puffworld')         // OPT: cache this for speed

    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
}

update_puffworldprops = function(data) {
    puffworldprops = Boron.persistent_merge(puffworldprops, data)
    
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

    // TYPES
    if(!Array.isArray(puffworldprops.view.filters.types)) {
        if(!puffworldprops.view.filters.types)
            puffworldprops.view.filters.types = []
        else
            puffworldprops.view.filters.types = [puffworldprops.view.filters.types]
    }

    // ROOTS



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
PB.M.Forum.addNewPuffHandler(eatPuffs);             // register our update function

PB.M.Forum.init();                                  // initialize the forum module (and by extension the puffball network)

PB.M.Wardrobe.init()                                // rehydrate identities and resume last used

handleImportRedirect();                             // check if import

setPropsFromURL();                                  // handle pushstate hash

popMods();                                          // deflate any machine prefs
////


window.addEventListener('resize', function() {
    updateUI();
});

window.addEventListener('load', function() {
    /// this is cumbersome, but it gets around browser inconsistencies (some fire popstate on page load, others don't)
    //  via https://code.google.com/p/chromium/issues/detail?id=63040
    setTimeout(function() {
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
Events.sub('ui/*', function(data) {
    ACTIVITY.push(data);

    // XHR this bad boy!
    if(puffworldprops.prefs.reporting)
        PB.Net.xhr('http://162.219.162.56/c/events.php', {method: 'POST'}, data)
});

// Hide slideshow from people with at least one identity
// Make sure not problem if empty
var identityUsernames = PB.getAllIdentityUsernames()
if(identityUsernames.length < 1)
    Events.pub( 'ui/slider/close',{ 'view.slider.show': true});
    // console.log("hide silder cuz several users")



TRACKINCOMEPUFF = [];
Events.sub('track/*', function(data, path) {
    TRACKINCOMEPUFF.push({path: path, data:data});
})