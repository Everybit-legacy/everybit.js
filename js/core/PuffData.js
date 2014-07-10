// DATA LAYER

PuffData = {};
// PuffData.puffs = [];
PuffData.bonii = {};
PuffData.shells = [];
PuffData.shellSort = {};
// PuffData.shelf = [];
PuffData.pending = {};
PuffData.userRecords = {};                                  // these are DHT user entries, not our local identity wardrobe

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
    var delta = PuffData.hereHaveSomeNewShells(shells)
    // if(delta) // FIXME: temp hack regression
        PuffData.makeShellsAvailable(shells)
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
    
    var old_length = PuffData.shells.length
    shells.forEach(PuffData.tryAddingShell)
    
    var delta = PuffData.shells.length - old_length
    if(!delta) return false
    
    PuffData.persistShells()
    // PuffData.makeShellsAvailable()
    
    return delta
}

/**
 * to make shells available
 */
PuffData.makeShellsAvailable = function() {
    //// alert everyone: new shells have arrived!
    
    // TODO: this isn't right -- fix this upper layer too
    Puffball.receiveNewPuffs(PuffData.shells) // may have to pass delta here
    
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
        if(!existing.payload.content)
            existing.payload.content = shell.payload.content    // maybe add the missing content
        return false
    }
    
    PuffData.shells.push(shell)
    PuffData.shellSort[shell.sig] = shell

    return shell
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

PuffData.slotLock = false // FIXME: temp hack regression

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
    
    return false
    
    if(PuffData.slotLock) return false
    PuffData.slotLock = true
    
    var offset = 0
    var giveup = 1000
    
    function getMeSomeShells(puffs) {
        if(puffs) {
            var delta = PuffData.hereHaveSomeNewShells(puffs)
            have += delta || 0
        }
        
        if(have >= need || offset > giveup) {
            // PuffData.slotLock = false
            PuffData.makeShellsAvailable()
            return false
        }
        
        var limit = need - have + 50 // grab a few extras to help work through bare patches
        
        var prom = PuffNet.getSomeShells(query, filters, limit, offset)
        // prom.then(getMeSomeShells)

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
    
    return shells.filter(function(puff) { return puff && puff.username == username })
    // return PuffForum.getByUser(username) // TODO: test this
}



