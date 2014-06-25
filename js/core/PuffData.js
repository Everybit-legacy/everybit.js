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
 * @return {array of objects}
 */
PuffData.getShells = function() {
    //// Get the currently known shells
    // NOTE: always use this accessor instead of referencing PuffData.shells directly, as what this function does will change.
    return PuffData.shells
}

PuffData.getPublicShells = function() {
    //// Get all public shells
    var shells = PuffData.getShells()
    return shells.filter(function(shell) {return !shell.keys})
}

PuffData.getMyEncryptedShells = function(username) {
    //// Get currently known private shells for a particular user
    var shells = PuffData.getShells()
    return shells.filter(function(shell) {return shell.keys && shell.keys[username]})
}

PuffData.getCachedShellBySig = function(sig) {
    return PuffData.shellSort[sig]
    // return PuffData.getShells().filter(function(shell) { return sig === shell.sig })[0]
}

PuffData.addBonus = function(puff, key, value) {
    //// this simulates a WeakMap
    // THINK: we'll need to provide some GC here
    var id = puff.sig
    
    if(!PuffData.bonii[id])
        PuffData.bonii[id] = {}
    
    PuffData.bonii[id][key] = value
}

PuffData.getBonus = function(puff, key) {
    //// pull from our FauxWeakMap
    var id = puff.sig
    var puffBonii = PuffData.bonii[id]
    return puffBonii && puffBonii[key]
}




/*
    Some new shell handling equipment. Need to integrate this more deeply and clean and test.
*/

PuffData.addShellsThenMakeAvailable = function(shells) {
    PuffData.hereHaveSomeNewShells(shells)    
    PuffData.makeShellsAvailable(shells)
}

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

PuffData.makeShellsAvailable = function() {
    //// alert everyone: new shells have arrived!
    
    // TODO: this isn't right -- fix this upper layer too
    Puffball.receiveNewPuffs(PuffData.shells) // may have to pass delta here
    
}

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

PuffData.persistShells = function(shells) {
    if(CONFIG.noLocalStorage) return false                      // THINK: this is only for debugging and development
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    
    shells = shells || PuffData.shells
    
    Puffball.Persist.save('shells', shells)
}

PuffData.isGoodShell = function(shell) {
    //// this just checks for the existence of required fields
    if(!shell.sig) return false
    if(!shell.routes) return false
    if(!shell.username) return false
    if(typeof shell.payload != 'object') return false
    if(!shell.payload.type) return false
    return true
}

PuffData.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass them to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    
    PuffData.importLocalShells()
    PuffData.getMoreShells()
    // PuffData.importRemoteShells()
}

PuffData.importLocalShells = function() {   // callback) {
    // PuffData.shells = Puffball.Persist.get('shells') || []
    var localShells = Puffball.Persist.get('shells') || []
    
    PuffData.addShellsThenMakeAvailable(localShells)
}

/*
    This shell offset thing is going to get flaky:
    - new puffs added to the system offset the offset
    - it eventually bottoms out and only returns an empty list
    - it's nothing like our ultimate DHT/route-based solution
*/
PuffData.globalShellOffset = 0 
PuffData.globalShellBagSize = 20

PuffData.getMoreShells = function(params) {
    var params = params || {}
    params.limit = PuffData.globalShellBagSize
    params.offset = PuffData.globalShellOffset

    var prom = PuffNet.getSomeShells(params)
    
    PuffData.globalShellOffset += PuffData.globalShellBagSize // uh wat derp
    
    return prom.then(PuffData.addShellsThenMakeAvailable)
}


/*
    End shell collection intake equipment
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
 * @return {string/boolean}
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
 * @return {puff}
 */
PuffData.getMyPuffChain = function(username) {
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    
    var shells = PuffData.getShells()
    
    return shells.filter(function(puff) { return puff && puff.username == username })
    // return PuffForum.getByUser(username) // TODO: test this
}



