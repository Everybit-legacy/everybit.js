// Bridge between GUI and PuffBall modules

puffworldprops = {

    ICX: {
        newUser: {
            requestedUsername: '',
            usernameStatus: '',
            usernameMessage: '',
            checkingUsername: '',
            profilePuff: ''
        },
        invite: {
            questionStatus: false,
            questionMessage: '',
            answerStatus: false,
            answerMessage: ''
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
        import: false,                              // import username
        section: false,                             // the section user is currently working on
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

        icx: {                                      // ICX related
            screen: 'init',
            toUser: "",
            activeReplies: []
        },
        
        mode: 'list',
        
        language  : 'en',

        query: {
            sort: 'DESC'                            // direction of sort
        },

        filters: {},

        score: {},
        
        slider: {},



        // TABLEVIEW
        table: {
            loaded: 0,
            noMorePuffs: false,
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
                type: {
                    show: false,
                    weight: 1,
                    allowSort: false
                },
                filename: {
                    show: false,
                    weight: 1,
                    allowSort: false
                },
                language: {
                    show: false,
                    weight: 1,
                    allowSort: false
                },
            },
            bar: {
                tmp: 1                              // to prevent bar from disappearing
            },
            sort: {
                column: 'date',
                desc: true
            },
            format: 'list',
            maxRowHeight: 99                        // We want to show everything
        },
    },

    reply: {
        // show: false,
        lastType: false,                            // type of the last published puff
        expand: false,
        content: '',
        state: {},
        privacy: false,
        type: false,
        replyType: 'message',
        caption: ''
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

puffworlddefaults = puffworldprops                  // it's immutable so we don't care


//// event bindings for controlling core behavior from the display ////

Events.sub('prefs/ephemeralKeychain/toggle', function(data, path) {
    var new_state = CONFIG.ephemeralKeychain
    modConfig('ephemeralKeychain', new_state)
    
    var dir = new_state ? 'on' : 'off'
    Events.pub('ui/menu/prefs/ephemeralKeychain/' + dir)
})


///// event bindings that are specific to the GUI //////

Events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    update_puffworldprops(data)                     // change props in a persistent fashion

    setURLfromViewProps()                           // set the props in the url and history
    
    updateUI()                                      // then re-render PuffWorld w/ the new props
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
    var puffworlddiv = document.getElementById('puffworld') // OPT: cache this for speed

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

var updateLatestConvo = function(report) {
    report.private_promise.then(function(private_report) {
        var sigs = private_report.goodsigs
        sigs.map(PB.Data.getDecryptedLetterBySig).forEach(function(puff) {
            updateCurrentConvos(puff)
        })
    })
}


////



// START MANUAL FORUM MODULE INIT
// ONLY RECEIVE PRIVATE PUFFS FOR/FROM THE CURRENT USER

CONFIG.noNetwork = true
CONFIG.icxmode   = true

PB.addNewPuffHandler(eatPuffs)                      // register our update function
PB.addNewPuffReportHandler(updateLatestConvo)       // conversational update function

// PB.M.Forum.init();                               // initialize the forum module (and by extension the puffball network)
PB.addNewPuffHandler(PB.M.Forum.receiveNewPuffs)    // manually connect the Forum module to avoid initializing the P2P network
PB.addRelationshipHandler(PB.M.Forum.addFamilialEdges)


// END MANUAL FORUM MODULE INIT

PB.M.Wardrobe.init()                                // rehydrate identities and resume last used

// handleImportRedirect();                          // check if import

PB.Data.depersistUserRecords()                      // get cached userRecords

setPropsFromURL();                                  // handle pushstate hash

popMods();                                          // deflate any machine prefs

// private puff management for ICX:

setInterval(PB.Data.updatePrivateShells, 60*1000)

PB.addPreSwitchIdentityHandler(PB.Data.removeAllPrivateShells) 

PB.addPostSwitchIdentityHandler(function(username) {    
    PB.Data.getMorePrivatePuffs(username, 0, CONFIG.initLoadBatchSize)
    // Events.pub('ui/switchIdentityTo')
})


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

//// END BUILD CRYPTO WORKER




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


// Hide slideshow from people with at least one identity
// Make sure not problem if empty
var identityUsernames = PB.getAllIdentityUsernames()
if(identityUsernames.length < 1)
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


//tells us if the user has any delicious puffs
userHasShells(PB.getCurrentUsername(), function(numShells) {
    Events.pub('ui/event',{
        'ICX.hasShells': numShells
    })
})