// DATA LAYER

PB.Data = {};
// PB.Data.puffs = [];
PB.Data.bonii = {};
PB.Data.shells = [];
PB.Data.shellSort = {};
// PB.Data.shelf = [];
PB.Data.pending = {};
PB.Data.userRecords = {};                                  // these are DHT user entries, not our local identity wardrobe



///////////////// new graph stuff ////////////////////

PB.Data.addSigAsVertex = function(sig) {
    var matches = PB.Data.graph.v(sig).run()
    
    if(matches.length) return false         // returns false if nothing happens
    
    return PB.Data.graph.addVertex({_id: sig, name: sig, type: 'shell'}) || true
}

PB.Data.addShellAsVertex = function(shell) {
    var matches = PB.Data.graph.v(shell.sig).run()
    
    if(!matches.length)
        return PB.Data.graph.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' }) || true
    
    var vertex = matches[0]
    if(vertex.shell) return false           // NOTE: returns false if it does nothing
    
    return vertex.shell = shell             // NOTE: mutation & pointer setting
}

PB.Data.addShellUsernameAsVertex = function(shell) {
    //// add shell.username to graph and connect them up
    
    var username = shell.username
    var matches = PB.Data.graph.v(username).run()
    var vertex = matches[0]
    
    if(!vertex) // THINK: make usernames unique like USERNAME::<username> or something
        vertex = PB.Data.graph.addVertex({ _id: username, name: username, type: 'username' })
    else
        if(PB.Data.graph.v(shell.sig).out('author').property('name').run()[0] == username)
            return false
        
    // TODO: add easy filtering by vertex type for both 'v' and also outV etc
    PB.Data.graph.addEdge({ _out: shell.sig, _in: shell.username, _label: 'author'})
}

PB.Data.graph = Dagoba.graph()

PB.Data.addToGraph = function(shells) {
    shells.forEach(PB.Data.addShellAsVertex)
    shells.forEach(PB.Data.addShellUsernameAsVertex)
}

// TODO: alias children() as .in('parent') and parents() as .out('parent') and use those instead (halves # of edges)


// function build_graph() {
//     g = Dagoba.graph()
//
//     PB.Data.shells.forEach(function(shell) {
//         g.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' })
//     })
//
//     PB.Data.shells.forEach(function(shell) {
//         (shell.payload.parents||[]).forEach(function(parent) {
//             g.addEdge({ _out: shell.sig, _in:  parent, _label: 'parent'})
//             g.addEdge({ _in:  shell.sig, _out: parent, _label: 'child' })
//         })
//     })
//
//
//
//     PB.Data.graph = g
// }

///////////////// end graph stuff ////////////////////




/**
 * get the current known shells
 * @return {Shell[]}
 */
PB.Data.getShells = function() {
    //// Get the currently known shells
    // NOTE: always use this accessor instead of referencing PB.Data.shells directly, as what this function does will change.
    return PB.Data.shells
}

/**
 * get all public shells
 * @returns {Shell[]}
 */
PB.Data.getPublicShells = function() {
    //// Get all public shells
    var shells = PB.Data.getShells()
    return shells.filter(function(shell) {return !shell.keys})
}

/**
 * get currently known private shells for a particular user
 * @param {string} username
 * @returns {Shell[]}
 */
PB.Data.getMyEncryptedShells = function(username) {
    //// Get currently known private shells for a particular user
    var shells = PB.Data.getShells()
    return shells.filter(function(shell) {return shell.keys && shell.keys[username]})
}

/**
 * Get cached shells by sig
 * @param {string} sig
 * @returns {shell[]}
 */
PB.Data.getCachedShellBySig = function(sig) {
    return PB.Data.shellSort[sig]
    // return PB.Data.getShells().filter(function(shell) { return sig === shell.sig })[0]
}

/**
 * adds bonus
 * @param {object} puff
 * @param {string} key
 * @param {string} value
 */
PB.Data.addBonus = function(puff, key, value) {
    //// this simulates a WeakMap
    // THINK: we'll need to provide some GC here
    var id = puff.sig
    
    if(!PB.Data.bonii[id])
        PB.Data.bonii[id] = {}
    
    PB.Data.bonii[id][key] = value
}

/**
 * gets bonus
 * @param puff
 * @param key
 * @returns {object}
 */
PB.Data.getBonus = function(puff, key) {
    //// pull from our FauxWeakMap
    var id = puff.sig
    var puffBonii = PB.Data.bonii[id]
    return puffBonii && puffBonii[key]
}




/*
    Some new shell handling equipment. Need to integrate this more deeply and clean and test.
*/
/**
 * add shells then makr then available
 * @param {Shell[]}
 * @returns {*}
 */
PB.Data.addShellsThenMakeAvailable = function(shells) {
    var new_shells = PB.Data.hereHaveSomeNewShells(shells)
    var delta = new_shells.length
    if(delta) 
        PB.Data.makeShellsAvailable(new_shells)
    return delta
}

/**
 * handle incoming shells
 * @param {Shell[]}
 * @returns {*}
 */
PB.Data.hereHaveSomeNewShells = function(shells) {
    //// handle incoming shells
    
    shells = Array.isArray(shells) ? shells : [shells]
    
    shells = shells.filter(PB.Data.isGoodShell)
    
    var useful_shells = shells.filter(PB.Data.tryAddingShell) // note that we're filtering effectfully,
                                                               //   and that useful shells may be new or just new content
    if(!useful_shells.length) return []                        //   and that we remove stars, which may change things
    
    PB.Data.addToGraph(shells)
    
    PB.Data.rateSomePuffs(shells)
    
    PB.Data.persistShells()
    
    var compacted = PB.Data.garbageCompactor()                // OPT: call this earlier
    
    if(!compacted) return useful_shells
    
    return useful_shells.map(R.prop('sig'))                    // if GC eats puffs this spits them out
                        .map(PB.Data.getCachedShellBySig).filter(Boolean)
}

/**
 * to make shells available
 */
PB.Data.makeShellsAvailable = function(shells) {
    //// alert everyone: new shells have arrived!
    
    // TODO: this isn't right -- fix this upper layer too
    // PB.receiveNewPuffs(PB.Data.shells) // may have to pass delta here
    
    PB.receiveNewPuffs(shells) // may have to pass delta here
    
}


PB.Data.addStar = function(sig, username, starsig) {
    // TODO: this doesn't belong here
    var fauxshell = {sig: sig} // THINK: ye gads is this ugly
    var starStats = PB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    starStats.from[username] = starsig                                  // admittedly strange, but helpful when unstarring
    starStats.score = PB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    PB.Data.addBonus(fauxshell, 'starStats', starStats)
}

PB.Data.removeStar = function(sig, username) {
    // TODO: this doesn't belong here
    var fauxshell = {sig: sig} // THINK: ye gads is this ugly
    var starStats = PB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    delete starStats.from[username]
    
    starStats.score = PB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    PB.Data.addBonus(fauxshell, 'starStats', starStats)
}

PB.Data.scoreStars = function(usernames) {
    // TODO: this doesn't belong here
    var tluScore = 0;
    var suScore = 0;
    var scorePref = Boron.shallow_copy(puffworldprops.view.score);
    for (var k in scorePref) {
        if (scorePref[k]) {
            var s = parseFloat(scorePref[k]);
            if (isNaN(s))
                s = parseFloat(puffworlddefaults.view.score[k]);
            scorePref[k] = s;
        }
    }
    
    usernames.forEach(function(username) {
        if (username.indexOf('.') == -1) {
            tluScore += scorePref.tluValue;
        } else {
            suScore += scorePref.suValue;
        }
    })
    
    var score = tluScore + Math.min(scorePref.maxSuValue, suScore);
    score = score.toFixed(1);
    if (score == parseInt(score)) score = parseInt(score);
    return score
}


/**
 * tries to add a shell, or update the content of an existing shell
 * @param {Shell[]}
 * @returns {(false|Shell[])}
 */
PB.Data.tryAddingShell = function(shell) {
    //// try adding a shell, or updating the content of an existing shell
    //// this is the central shell ingestation station, where metapuffs meet their doom
    
    // NOTE: don't call this without filtering using isGoodShell
        
    // metapuff wonkery

    if(shell.payload.type == 'star') {
        // update shell bonii
        var sig = shell.payload.content
        
        PB.Data.addStar(sig, shell.username, shell.sig)
        
        return false // because we didn't actually add a new shell  // THINK: but we did change one...
    }
    
    // TODO: fix this private pathway
    if(shell.payload.type == 'encryptedpuff') {
        var username = PB.M.PuffWardrobe.getCurrentUsername() // FIXME: don't call PW from down here!

        if(!shell.keys[username]) return false
        
        PB.Data.addPrivateShells([shell]) // TODO: this calls updateUI and other weird stuff >.<
        
        return false // we added a shell, but not the normal way... 
    }
    
    var existing = PB.Data.getCachedShellBySig(shell.sig)
    
    if(existing) {
        if(existing.payload.content) return false
        if(shell.payload.content === undefined) return false
        existing.payload.content = shell.payload.content        // add the missing content
        return true // true because we changed it
    }

    // only add the shell if it is supported content type
    if (!PuffForum.contentTypes[shell.payload.type]) {
        events.pub('track/unsupported-content-type', {type: shell.payload.type, sig: shell.sig});
        return false;        
    }
    
    PB.Data.shells.push(shell)
    PB.Data.shellSort[shell.sig] = shell

    return true // true because we added it
}

/**
 * to persist shells
 * @param {Shell[]}
 * @returns {(boolean|*)}
 */
PB.Data.persistShells = function(shells) {
    if(CONFIG.noLocalStorage) return false                      // THINK: this is only for debugging and development
    
    // THINK: when we receive shells directly we should compact them too
    if(!shells) 
        shells = function() {return PB.Data.getShellsForLocalStorage()} // thunked for perf
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    // THINK: we need knowledge of our user records here... how do we get that? 
    // PB.Data.interesting_usernames?
    
    // shells = shells.filter(function(shell) { return !shell.payload.content || (shell.payload.content.length < 1000) })
    
    PB.Persist.save('shells', shells)
}

/**
 * determine if it is a good shell, checks for the existence of required fields
 * @param {Shell[]}
 * @returns {boolean}
 */
PB.Data.isGoodShell = function(shell) {
    //// this just checks for the existence of required fields
    if(!shell.sig) return false
    if(!shell.routes) return false
    if(!shell.username) return false
    if(typeof shell.payload != 'object') return false
    if(!shell.payload.type) return false
    return true
}

/**
 * to import shells from local and remote sources
 */
PB.Data.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass them to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    
    PB.Data.importLocalShells()
    // PB.Data.getMoreShells()
    PB.Data.importRemoteShells()
    PB.Data.importAllStars()
}

/**
 * to import local shells
 */
PB.Data.importLocalShells = function() {   // callback) {
    // PB.Data.shells = PB.Persist.get('shells') || []
    var localShells = PB.Persist.get('shells') || []
    
    PB.Data.addShellsThenMakeAvailable(localShells)
}


PB.Data.importAllStars = function() {
    var prom = PB.Net.getStarShells()
    prom.then(PB.Data.addShellsThenMakeAvailable)
}

PB.Data.currentDecryptedShells = []
PB.Data.getCurrentDecryptedShells = function() {
    return PB.Data.currentDecryptedShells
}

PB.Data.importPrivateShells = function(username) {
    PB.Data.clearExistingPrivateShells() // OPT: destroying and re-requesting this is unnecessary
    
    // FIXME: race condition while toggling identities
    
    var promFromMe = PB.Net.getPrivatePuffsFromMe(username) 
    promFromMe.then(PB.Data.addPrivateShells)

    var promForMe = PB.Net.getPrivatePuffsForMe(username) 
    promForMe.then(PB.Data.addPrivateShells)
}

PB.Data.clearExistingPrivateShells = function() {
    PB.Data.currentDecryptedShells.forEach(function(shell) {
        PB.Data.purgeShellFromGraph(shell.sig) // TODO: this is not quite right
    })
    
    PB.Data.currentDecryptedShells = [] 
}

PB.Data.addPrivateShells = function(privateShells) {
    var decryptedShells = privateShells.map(PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption)
                            .filter(Boolean)
    // FIXME: oh dear this is horrible oh dear oh dear get rid of PuffForum call
    
    if (decryptedShells.length != privateShells.length) {
        events.pub('track/decrypt/some-decrypt-fails', 
                    {decryptedShells: decryptedShells.map(function(p){return p.sig}), 
                     privateShells: privateShells.map(function(p){return p.sig})})
    }
    
    decryptedShells = decryptedShells
        .filter(function(puff) { 
            return !PB.Data.currentDecryptedShells.filter(                           // don't repeat yourself
                       function(otherpuff) { return otherpuff.sig == puff.sig}).length})
    
    PB.Data.currentDecryptedShells = PB.Data.currentDecryptedShells.concat(decryptedShells)
    
    PB.Data.addToGraph(decryptedShells)
    PuffForum.addFamilialEdges(decryptedShells) // FIXME: ugh seriously do not use PuffForum here!
    
    updateUI() // FIXME: this is definitely not the right place for this
}




// the slot locker contains information on queries made to fill slots. 
// in particular it holds the offset, which will be -1 when [] is returned.
// it keeps queries from re-requesting the same shells over and over, 
// and provides some concurrency / flow control by allowing a query
// to set it to -1 when it is running and then replace it when done.
PB.Data.slotLocker = {}

// TODO: we're calling this from the 'refresh' button now, which is totally weird and requires some thinking.


PB.Data.importRemoteShells = function() {
    //// only called during initial application bootup. handles both cold loads and hot loads.
    
    var offset = 0
    var giveup = CONFIG.initLoadGiveup
    var limit  = CONFIG.initLoadBatchSize
    var new_shells = []
    var keep_going = true
    
    var key = '[{"sort":"DESC"},{"tags":[],"types":[],"users":[],"routes":[]}]' // default query // TODO: this is fragile
    PB.Data.slotLocker[key] = -1
    
    function getMeSomeShells(puffs) {
        if(puffs) {
            var delta = PB.Data.addShellsThenMakeAvailable(puffs)
            // new_shells = new_shells.concat(my_new_shells)
            // var delta = my_new_shells.length
            
            if(delta != limit) // some shells were already in our cache
                keep_going = false
        }
        
        if(offset > giveup)
            keep_going = false

        if(!keep_going) {
            PB.Data.slotLocker[key] = 1
            // PB.Data.stupidHorribleGlobalThing = true
            // PB.Data.makeShellsAvailable(new_shells)
            return false
        }
        
        var prom = PB.Net.getSomeShells({}, {}, limit, offset)
        prom.then(getMeSomeShells)

        offset += limit
    }
    
    getMeSomeShells()
}


/**
 * to fill some slots
 * @param {number} need
 * @param {number} have
 * @param {string} query
 * @param {string} filters
 * @returns {boolean}
 */
PB.Data.fillSomeSlotsPlease = function(need, have, query, filters) {
    //// we have empty slots on screen. fill them with puffs.
    
    if(have >= need) return false
    
    // -- redraw screen on new puffs being ingested (w/o looping)
    // -- cycle all new puffs through graph stuff
    // -- call fillSomeSlotsPlease every time we have slots to fill
    // -- get focused puff immediately
    
    // - perform GC on in-memory puffs (can remove content also)
    // - use GC funs for persisting shells
    // - store size of each shell/puff for GC
    // - manage empty vertices better (different type?)

    var args = [query, filters]
    // var args = [query, filters, need]
    // if(!query.mode) args.push(have) // hack for alternate query modes

    var key = JSON.stringify(args)
    var my_offset = PB.Data.slotLocker[key] || 0
    
    if(my_offset < 0)
        return false // slot is locked, go elsewhere
    
    PB.Data.slotLocker[key] = -1 // prevent concurrent versions of the same request
    
    //////

    // var limit = need - have + 3 // 3 for luck
    
    var limit = need // so... if we only do this once, and we have half the puffs already, we might only grab that half again. this is true even if we send an offset of 'have' to the server, because what we have might map to that slice (or to anything else -- our offsets are totally different than the servers). so we have to grab enough to cover the difference, which means grabbing the same shells multiple times... (but only empty shells, fortunately. but still.)
    
    // var received_shells = 0
    
    var prom = PB.Net.getSomeShells(query, filters, limit, query.offset)
    // prom.then(function(shells) {received_shells = shells.length; return shells})
    prom.then(PB.Data.addShellsThenMakeAvailable)
        .then(function(delta) { 
            PB.Data.slotLocker[key] = delta ? 1 : -1}) 
            // if the request is fruitful, unlock it (but be careful of offsets here).
            // also, this locks when we received data but chose not to keep it (either dups or GC),
            // so we could have an issue with locked queries that would be fruitful w/ different offset / limits...
    
    
    // TODO: the slotLocker really should keep track of what 'slices' of the server you've seen, so we know not to re-request those over and over. this is... complicated. 
    //       so send query.offset+have to getSomeShells, and store that same offset as part of the slotLocker.
    //       then you can track how much of some type of stuff is on the server... except that doesn't work for the P2P network.
    
    return true
    
    //////




    // OLD STUFF SAVE FOR REFERENCE

    // var batchSize = CONFIG.fillSlotsBatchSize
    var giveup = CONFIG.fillSlotsGiveup
    var new_shells = []
    
    giveup = giveup + my_offset
    
    function getMeSomeShells(puffs) {
        if(puffs) {
            var my_new_shells = PB.Data.hereHaveSomeNewShells(puffs)
            new_shells = new_shells.concat(my_new_shells)
            var delta = my_new_shells.length
            // THINK: but do they pass the filter?
            // TODO: can we make available here now that we're locking?
            have += delta || 0
        }
        
        if(have >= need || my_offset > giveup || (query.mode && (my_offset - giveup < 0))) {
            PB.Data.makeShellsAvailable(new_shells)
            PB.Data.slotLocker[key] = my_offset-limit
            return false
        }
        
        var limit = need - have 
        // if(!query.mode) limit += 50 // grab a few extras to help work through bare patches // TODO: blargh fix this
        
        var prom = PB.Net.getSomeShells(query, filters, limit, my_offset)
        prom.then(getMeSomeShells)

        my_offset += limit
    }
    
    getMeSomeShells()
}


/*
    End shell collection intake equipment
*/

/**
 * to get puff by its sig
 * @param {string} sig
 * @returns {(object|false)}
 */
PB.Data.getPuffBySig = function(sig) {
    var shell = PB.Data.getCachedShellBySig(sig)
    
    if(shell && shell.payload && typeof shell.payload.content != 'undefined')
        return shell
    
    if(PB.Data.pending[sig])
        return false
        
    // locally cached shells that are missing content on the network prevent slotfills from resolving,
    // so we clear it from our cache if we can't find it.
    var badShellClearCache = function(shells) {
        if(!shells.length) {
            var fauxshell = {sig: sig}
            if(!PB.Data.getBonus(fauxshell, 'envelope')) {
                PB.Data.removeShellFromCache(sig) // no updateUI call
                return PB.throwError("Content can not be found for shell '" + sig + "'")
                // THINK: unlock PB.Data.pending[sig]? probably not, but it might re-appear later...
            }
        }
        return shells
    }
    
    PB.Data.pending[sig] = PB.Net.getPuffBySig(sig)      // TODO: drop this down in to PB.Net instead
    PB.Data.pending[sig].then(badShellClearCache)
                         .then(PB.Data.addShellsThenMakeAvailable)
                         .then(function() {                                                    // delay GC to prevent
                             setTimeout(function() { delete PB.Data.pending[sig] }, 10000) }) // runaway network requests
    
    return false
}

PB.Data.removeShellFromCache = function(sig) {
    // remove from PB.Data.shells
    var shell = PB.Data.getCachedShellBySig(sig)
    PB.Data.shells.splice( PB.Data.shells.indexOf(shell), 1 )
    
    // remove from PB.Data.shellSort
    delete PB.Data.shellSort[sig]
    
    // remove shell's bonii
    delete PB.Data.bonii[sig]
    
    PB.Data.purgeShellFromGraph(sig)
    
    PB.Data.removeCachedPuffScore(shell)
    
    // updateUI() // THINK: this is not the right place for this, but we need to let the system know what's up...
}

PB.Data.purgeShellFromGraph = function(sig) {
    // change graph vertex to 'pseudo-shell' type (or 'purged' type?)
    //   and remove the content of the 'shell' property
    // TODO: this is icky make it better
    var vertex = PB.Data.graph.v(sig).run()[0]
    vertex.type = 'purged'
    vertex.shell = undefined
}


/**
 * to verify a puff
 * @param  {object} puff
 * @return {(string|boolean)}
 */
PB.Data.isGoodPuff = function(puff) {
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    // TODO: use this to verify incoming puffs
    // TODO: if prom doesn't match, try again with getUserRecordNoCache
    
    var prom = PB.getUserRecord(puff.username);
    
    return prom.then(function(user) {
        return PB.Crypto.verifyPuffSig(puff, user.defaultKey);
    });
}

/**
 * to get cached user record
 * @param  {string} username
 * @return {object}
 */
PB.Data.getCachedUserRecord = function(username) {
    return PB.Data.userRecords[username];
}

/**
 * to cache user record
 * @param  {object} userRecord
 * @return {object}
 */
PB.Data.cacheUserRecord = function(userRecord) {
    //// This caches with no validation -- don't use it directly, use PB.processUserRecord instead
    
    PB.Data.userRecords[userRecord.username] = userRecord;
    
    PB.Persist.save('userRecords', PB.Data.userRecords); // OPT: this could get expensive
    
    return userRecord;
    
    // TODO: index by username
    // TODO: if duplicate check update times for latest
    // TODO: figure out how to handle malicious DHT records (sign new record? oh................... oh. oh. oh dear.)
    // .............. ok but you could show the chain of commits starting with the root puffball creation key.........
    // .......so to verify a DHT entry you need to check the key change chain going back to the initial entry signed  
    // ....with puffball's public admin key, and then work your way through each signed key change commit,
    // ..but to be verifiable you have to send that on every DHT request which is awful.......
    // oh boy. 
    // TODO: persist to LS (maybe only sometimes? onunload? probabilistic?)
}

/**
 * to depersist user records
 */
PB.Data.depersistUserRecords = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PB.Data.userRecords = PB.Persist.get('userRecords') || {};
}

/**
 * to get my puff chain
 * @param  {string} username 
 * @return {object}
 */
PB.Data.getMyPuffChain = function(username) {
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    
    var shells = PB.Data.getShells()
    
    return shells.filter(function(puff) { return puff && puff.username == username }) // TODO: use the graph
    // return PuffForum.getByUser(username) // TODO: test this 
}



///////////////////////////////////////////
//                                       //
//       Garbage Collector Thing         //
//                                       //
///////////////////////////////////////////



PB.Data.runningSizeTally = 0
PB.Data.scoreSort = {}

PB.Data.heuristics = []
PB.Data.addHeuristics = function(fun) {
    PB.Data.heuristics.push(fun)
}

PB.Data.addHeuristics(function(shell) {
    return parseFloat( (PB.Data.getBonus(shell, 'starStats') || {}).score || 0 ) * 100
})

// TODO: add heuristics for: my puffs (which go elsewhere, ultimately), replies to my puffs, my puff's parents, 
//       friend's puffs (whatever that means), puff freshness, last seen, etc


PB.Data.rateMyPuff = function(puff) {
    var scores = PB.Data.heuristics.map(function(h) {return h(puff)})          // apply heuristics
    var total  = scores.reduce(function(acc, score) {return acc+(score||0)}, 0) // get total // TODO: improve algo
    return total
}

PB.Data.rateSomePuffs = function(puffs) {
    puffs.forEach(function(puff) {                                              // rate each puff
        var score = PB.Data.rateMyPuff(puff)
        PB.Data.doStuffWithScore(puff, score)
        PB.Data.doStuffWithPuff (puff)
    })
    // THINK: some heuristics rely on scores of related puffs... possible feedback loop? topological ordering?
    //        a toposort is easy-ish w/ graph db...
}

// TODO: when you switch identities, rescore the puffs


PB.Data.doStuffWithScore = function(puff, score) {
    PB.Data.removeCachedPuffScore(puff)                                        // NOTE: has to come before bonii
    PB.Data.addBonus(puff, 'rating', score)                                    // add rating to bonii
    PB.Data.cachePuffScore(puff, score)    
    // OPT: cache sorted version
    // maybe bins[score.floor].push(puff) or something...
}

PB.Data.doStuffWithPuff = function(puff) {
    var puffsize = JSON.stringify(puff).length
    PB.Data.addBonus(puff, 'size', puffsize)
    PB.Data.runningSizeTally += puffsize || 0                                  // block NaNs
}

PB.Data.cachePuffScore = function(puff, score) {
    var key = PB.Data.convertScoreToKey(score)
    PB.Data.scoreSort[key] = PB.Data.scoreSort[key] || []
    PB.Data.scoreSort[key].push(puff)
}

PB.Data.removeCachedPuffScore = function(puff) {
    var score = PB.Data.getBonus(puff, 'score')
    var key = PB.Data.convertScoreToKey(score)
    var bin = PB.Data.scoreSort[key]
    if(!bin) return false
    if(!bin.length) return false
    
    for(var i = bin.length - 1; i >= 0; i--) {
        if(bin[i].sig == puff.sig) {
            bin.splice(i, 1)
            var puffsize = PB.Data.getBonus(puff, 'size')
            PB.Data.runningSizeTally -= puffsize || 0                          // block NaNs
            return false
        }
    }
}

PB.Data.getCachedPuffs = function(limit, bottom) {
    var seen = 0
    var result = []
    var keys = Object.keys(PB.Data.scoreSort).map(parseFloat).sort()
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var puffs = PB.Data.scoreSort[key] // OPT: short-circuit on !bottom
        
        puffs.reduce(function(seen, puff) {
            if(seen > limit == !!bottom) result.push(puff)
            return seen+1
        }, 0)
    }
    
    return result
}

PB.Data.convertScoreToKey = function(score) {
    return Math.floor(score / 10) || 0 // TODO: make this smarter
}


PB.Data.getTopPuffs = function(limit) {
    return PB.Data.getCachedPuffs(limit)
}

PB.Data.getNotTopPuffs = function(limit) {
    // grab the puffs below the limit threshold (w/ 300 puffs and limit=100 this returns the 200 worst puffs)
    return PB.Data.getCachedPuffs(limit, 'bottom')
}

// PB.Data.getTopPuffs = function(options) {
//     var numberLimit =  options.number || 0
//     var sizeLimit   =    options.size || 0
//     var compact     = options.compact || false  // whether to allow compaction of returned puffs
//     var reverse     = options.reverse || false  // return bottom puffs instead of top puffs
// }

PB.Data.garbageCompactor = function() {
    // are we over the limits?
    var limit     = CONFIG.inMemoryShellLimit
    var memlimit  = CONFIG.inMemoryMemoryLimit
    var sizelimit = CONFIG.shellContentThreshold
    var didStuff  = false

    if(PB.Data.shells.length > limit) {
        didStuff = true
        PB.Data.shells.slice(limit).map(R.prop('sig')).forEach(PB.Data.removeShellFromCache)
    }
    
    if(PB.Data.runningSizeTally > memlimit) {
        didStuff = true
        for (var i = PB.Data.shells.length - 1; i >= 0; i--) {
            var shell = PB.Data.shells[i]
            var content_size = (shell.payload.content||"").toString().length // THINK: non-flat content borks this
            if (content_size > sizelimit) {
                delete shell.payload.content // TODO: this is rather dire
                total -= content_size + 13 // NOTE: magic number == '"content":"",'.length
                if(total <= memlimit) break
            }
        }
    }
    
    return didStuff
}

PB.Data.getShellsForLocalStorage = function() {
    var limit     = CONFIG.localStorageShellLimit
    var memlimit  = CONFIG.localStorageMemoryLimit
    var sizelimit = CONFIG.shellContentThreshold
    
    var shells = PB.Data.getTopPuffs(limit)
    var total = shells.reduce(function(size, shell) {
        return size + (PB.Data.getBonus(shell, 'size') || 0)
    }, 0)
    
    if (total <= memlimit) return shells
    
    // compact the puffs
    for (var i = shells.length - 1; i >= 0; i--) {
        var shell = shells[i]
        var content_size = (shell.payload.content||"").toString().length // THINK: non-flat content borks this
        if (content_size > sizelimit) {
            var new_shell = PB.Data.compactPuff(shell)
            shells[i] = new_shell
            total -= content_size + 13 // NOTE: magic number == '"content":"",'.length
            if(total <= memlimit) break
        }
    }
    
    if (total <= memlimit) return shells
    
    // remove shells until under memlimit
    for (var i = shells.length - 1; i >= 0; i--) {
        var content_size = JSON.stringify(shell).length
        total -= content_size
        if(total <= memlimit) break
    }
    
    shells = shells.slice(0, Math.max(i, 1)) // prevent -1 
    
    return shells
}

PB.Data.compactPuff = function(puff) {
    // THINK: instead of rebuilding the puff, use a JSON.stringify reducer that strips out the content
    var new_shell = Boron.extend(puff)
    var new_payload = {}
    for(var prop in puff.payload)
        if(prop != 'content')
            new_payload[prop] = puff.payload[prop] 

    new_shell.payload = new_payload
    return new_shell
}
