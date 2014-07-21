// DATA LAYER

PuffData = {};
// PuffData.puffs = [];
PuffData.bonii = {};
PuffData.shells = [];
PuffData.shellSort = {};
// PuffData.shelf = [];
PuffData.pending = {};
PuffData.userRecords = {};                                  // these are DHT user entries, not our local identity wardrobe



///////////////// new graph stuff ////////////////////

PuffData.addSigAsVertex = function(sig) {
    var matches = PuffData.graph.v(sig).run()
    
    if(matches.length) return false         // returns false if nothing happens
    
    return PuffData.graph.addVertex({_id: sig, name: sig, type: 'shell'}) || true
}

PuffData.addShellAsVertex = function(shell) {
    var matches = PuffData.graph.v(shell.sig).run()
    
    if(!matches.length)
        return PuffData.graph.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' }) || true
    
    var vertex = matches[0]
    if(vertex.shell) return false           // NOTE: returns false if it does nothing
    
    return vertex.shell = shell             // NOTE: mutation & pointer setting
}

PuffData.addShellUsernameAsVertex = function(shell) {
    //// add shell.username to graph and connect them up
    
    var username = shell.username
    var matches = PuffData.graph.v(username).run()
    var vertex = matches[0]
    
    if(!vertex) // THINK: make usernames unique like USERNAME::<username> or something
        vertex = PuffData.graph.addVertex({ _id: username, name: username, type: 'username' })
    else
        if(PuffData.graph.v(shell.sig).out('author').property('name').run()[0] == username)
            return false
        
    // TODO: add easy filtering by vertex type for both 'v' and also outV etc
    PuffData.graph.addEdge({ _out: shell.sig, _in: shell.username, _label: 'author'})
}

PuffData.graph = Dagoba.graph()

PuffData.addToGraph = function(shells) {
    shells.forEach(PuffData.addShellAsVertex)
    shells.forEach(PuffData.addShellUsernameAsVertex)
}

// TODO: alias children() as .in('parent') and parents() as .out('parent') and use those instead (halves # of edges)


// function build_graph() {
//     g = Dagoba.graph()
//
//     PuffData.shells.forEach(function(shell) {
//         g.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' })
//     })
//
//     PuffData.shells.forEach(function(shell) {
//         (shell.payload.parents||[]).forEach(function(parent) {
//             g.addEdge({ _out: shell.sig, _in:  parent, _label: 'parent'})
//             g.addEdge({ _in:  shell.sig, _out: parent, _label: 'child' })
//         })
//     })
//
//
//
//     PuffData.graph = g
// }

///////////////// end graph stuff ////////////////////




/**
 * get the current known shells
 * @return {Shell[]}
 */
PuffData.getShells = function() {
    //// Get the currently known shells
    // NOTE: always use this accessor instead of referencing PuffData.shells directly, as what this function does will change.
    return PuffData.shells
}

/**
 * get all public shells
 * @returns {Shell[]}
 */
PuffData.getPublicShells = function() {
    //// Get all public shells
    var shells = PuffData.getShells()
    return shells.filter(function(shell) {return !shell.keys})
}

/**
 * get currently known private shells for a particular user
 * @param {string} username
 * @returns {Shell[]}
 */
PuffData.getMyEncryptedShells = function(username) {
    //// Get currently known private shells for a particular user
    var shells = PuffData.getShells()
    return shells.filter(function(shell) {return shell.keys && shell.keys[username]})
}

/**
 * Get cached shells by sig
 * @param {string} sig
 * @returns {shell[]}
 */
PuffData.getCachedShellBySig = function(sig) {
    return PuffData.shellSort[sig]
    // return PuffData.getShells().filter(function(shell) { return sig === shell.sig })[0]
}

/**
 * adds bonus
 * @param {object} puff
 * @param {string} key
 * @param {string} value
 */
PuffData.addBonus = function(puff, key, value) {
    //// this simulates a WeakMap
    // THINK: we'll need to provide some GC here
    var id = puff.sig
    
    if(!PuffData.bonii[id])
        PuffData.bonii[id] = {}
    
    PuffData.bonii[id][key] = value
}

/**
 * gets bonus
 * @param puff
 * @param key
 * @returns {object}
 */
PuffData.getBonus = function(puff, key) {
    //// pull from our FauxWeakMap
    var id = puff.sig
    var puffBonii = PuffData.bonii[id]
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
PuffData.addShellsThenMakeAvailable = function(shells) {
    var new_shells = PuffData.hereHaveSomeNewShells(shells)
    var delta = new_shells.length
    if(delta) 
        PuffData.makeShellsAvailable(new_shells)
    return delta
}

/**
 * handle incoming shells
 * @param {Shell[]}
 * @returns {*}
 */
PuffData.hereHaveSomeNewShells = function(shells) {
    //// handle incoming shells
    
    shells = Array.isArray(shells) ? shells : [shells]
    
    shells = shells.filter(PuffData.isGoodShell)
    
    var useful_shells = shells.filter(PuffData.tryAddingShell) // note that we're filtering effectfully,
                                                               // and that useful shells may be new or just new content
    if(!useful_shells.length) return []
    
    PuffData.addToGraph(shells)
    
    PuffData.persistShells()
    // PuffData.makeShellsAvailable()
    
    return useful_shells
}

/**
 * to make shells available
 */
PuffData.makeShellsAvailable = function(shells) {
    //// alert everyone: new shells have arrived!
    
    // TODO: this isn't right -- fix this upper layer too
    // Puffball.receiveNewPuffs(PuffData.shells) // may have to pass delta here
    
    Puffball.receiveNewPuffs(shells) // may have to pass delta here
    
}

/**
 * tries to add a shell, or update the content of an existing shell
 * @param {Shell[]}
 * @returns {(false|Shell[])}
 */
PuffData.tryAddingShell = function(shell) {
    //// try adding a shell, or updating the content of an existing shell
    
    // NOTE: don't call this without filtering using isGoodShell
    
    var existing = PuffData.getCachedShellBySig(shell.sig)
    
    if(existing) {
        if(existing.payload.content) return false
        if(shell.payload.content === undefined) return false
        existing.payload.content = shell.payload.content        // add the missing content
        return true // true because we changed it
    }
    
    PuffData.shells.push(shell)
    PuffData.shellSort[shell.sig] = shell

    return true // true because we added it
}

/**
 * to persist shells
 * @param {Shell[]}
 * @returns {(boolean|*)}
 */
PuffData.persistShells = function(shells) {
    if(CONFIG.noLocalStorage) return false                      // THINK: this is only for debugging and development
    
    shells = shells || PuffData.shells
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    // THINK: we need knowledge of our user records here... how do we get that? 
    // PuffData.interesting_usernames?
    
    shells = shells.filter(function(shell) { return !shell.payload.content || (shell.payload.content.length < 1000) })
    
    Puffball.Persist.save('shells', shells)
}

/**
 * determine if it is a good shell, checks for the existence of required fields
 * @param {Shell[]}
 * @returns {boolean}
 */
PuffData.isGoodShell = function(shell) {
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
PuffData.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass them to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    
    PuffData.importLocalShells()
    // PuffData.getMoreShells()
    // PuffData.importRemoteShells()
}

/**
 * to import local shells
 */
PuffData.importLocalShells = function() {   // callback) {
    // PuffData.shells = Puffball.Persist.get('shells') || []
    var localShells = Puffball.Persist.get('shells') || []
    
    PuffData.addShellsThenMakeAvailable(localShells)
}

PuffData.slotLock = false 

/**
 * to fill some slots
 * @param {number} need
 * @param {number} have
 * @param {string} query
 * @param {string} filters
 * @returns {boolean}
 */
PuffData.fillSomeSlotsPlease = function(need, have, query, filters) {
    //// we have empty slots on screen. fill them with puffs.
    
    if(have >= need) return false
    
    // -- redraw screen on new puffs being ingested (w/o looping)
    // -- cycle all new puffs through graph stuff
    // - call fillSomeSlotsPlease every time we have slots to fill
    
    // - perform GC on in-memory puffs (can remove content also)
    // - use GC funs for persisting shells
    // - store size of each shell/puff for GC
    // - manage empty vertices better (different type?)
    // - get focused puff immediately
    
    if(PuffData.slotLock) return false
    PuffData.slotLock = true
    
    var offset = 0
    var giveup = 2000
    var new_shells = []
    
    function getMeSomeShells(puffs) {
        if(puffs) {
            var my_new_shells = PuffData.hereHaveSomeNewShells(puffs)
            new_shells = new_shells.concat(my_new_shells)
            var delta = my_new_shells.length
            have += delta || 0
        }
        
        if(have >= need || offset > giveup) {
            // PuffData.slotLock = false
            // THINK: prevent this function from being called repeatedly with the same query (memoize?)
            //        while still allowing multiple different calls to occur simultaneously
            PuffData.makeShellsAvailable(new_shells)
            return false
        }
        
        var limit = need - have + 50 // grab a few extras to help work through bare patches
        
        var prom = PuffNet.getSomeShells(query, filters, limit, offset)
        prom.then(getMeSomeShells)

        offset += limit
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
PuffData.getPuffBySig = function(sig) {
    var shell = PuffData.getCachedShellBySig(sig)
    
    if(shell && shell.payload && typeof shell.payload.content != 'undefined')
        return shell
    
    if(PuffData.pending[sig])
        return false
    
    PuffData.pending[sig] = PuffNet.getPuffBySig(sig)
    PuffData.pending[sig].then(PuffData.addShellsThenMakeAvailable)
                         .then(function() { setTimeout(function() { delete PuffData.pending[sig] }, 10000) }) // delay GC
    
    return false
}



/**
 * to verify a puff
 * @param  {object} puff
 * @return {(string|boolean)}
 */
PuffData.isGoodPuff = function(puff) {
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    // TODO: use this to verify incoming puffs
    // TODO: if prom doesn't match, try again with getUserRecordNoCache
    
    var prom = Puffball.getUserRecord(puff.username);
    
    return prom.then(function(user) {
        return Puffball.Crypto.verifyPuffSig(puff, user.defaultKey);
    });
}

/**
 * to get cached user record
 * @param  {string} username
 * @return {object}
 */
PuffData.getCachedUserRecord = function(username) {
    return PuffData.userRecords[username];
}

/**
 * to cache user record
 * @param  {object} userRecord
 * @return {object}
 */
PuffData.cacheUserRecord = function(userRecord) {
    //// This caches with no validation -- don't use it directly, use Puffball.processUserRecord instead
    
    PuffData.userRecords[userRecord.username] = userRecord;
    
    Puffball.Persist.save('userRecords', PuffData.userRecords); // OPT: this could get expensive
    
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
PuffData.depersistUserRecords = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PuffData.userRecords = Puffball.Persist.get('userRecords') || {};
}

/**
 * to get my puff chain
 * @param  {string} username 
 * @return {object}
 */
PuffData.getMyPuffChain = function(username) {
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    
    var shells = PuffData.getShells()
    
    return shells.filter(function(puff) { return puff && puff.username == username }) // TODO: use the graph
    // return PuffForum.getByUser(username) // TODO: test this 
}



