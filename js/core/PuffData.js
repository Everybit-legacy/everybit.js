// DATA LAYER

PuffData = {};
PuffData.puffs = [];
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
    var id = puff.sig
    var puffBonii = PuffData.bonii[id]
    return puffBonii && puffBonii[key]
}


/**
 * to push the puff
 * @param  {puff object} puff
 * @return {boolean}
 */
PuffData.eatPuff = function(puff) {
    if(!!~PuffData.puffs
                  .map(function(p) {return p.sig})     // OPT: check the sig index instead
                  .indexOf(puff.sig)) 
      return false;
    PuffData.puffs.push(puff);  
}

/**
 * to persist shells
 * @param  {object} shells
 * @return {boolean}
 */
PuffData.persistShells = function(shells) {
    if(CONFIG.noLocalStorage) return false;                 // THINK: this is only for debugging and development
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    
    
    
    Puffball.Persist.save('shells', shells);
}

/**
 * to add new shell
 * @param {object} shell
 */
PuffData.addNewShell = function(shell) {
    
    if(!PuffData.verifyShell(shell))
        return false;
    
    if(PuffData.getCachedShellBySig(shell.sig)) return false;
    
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    
    
    // if(shell.payload.type == 'encryptedpuff') {
    //     // THINK: later we'll need to GC shells on the shelf that aren't in my wardrobe
    //     PuffData.shelf.push(shell);                                 // if a shell is private, put it on the shelf
    //     PuffData.persistShells(PuffData.shells.concat([shell]));    // but go ahead and persist it anyway
    //     return false
    // }
    
    PuffData.shells.push(shell);                                    // otherwise, push it, sort it, persist it
    PuffData.shellSort[shell.sig] = shell;
    PuffData.persistShells(PuffData.shells);
}

PuffData.verifyShell = function(shell) {
    //// this just checks for the existence of required fields
    if(!shell.sig) return false
    if(!shell.routes) return false
    if(!shell.username) return false
    if(typeof shell.payload != 'object') return false
    if(!shell.payload.type) return false
    // if(!shell.payload.content) return false
    return true
}


PuffData.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass it to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    
    PuffData.importLocalShells()
    PuffData.importRemoteShells()
}

/**
 * to fetch local shells
 * @param  {Function} callback
 */
PuffData.importLocalShells = function() {   // callback) {
    // PuffData.shells = Puffball.Persist.get('shells') || [];
    var localShells = Puffball.Persist.get('shells') || [];
    
    Puffball.receiveNewShells(localShells)
    
    // localShells.forEach(PuffData.addNewShell);
    // setImmediate(function() {callback(PuffData.shells)})
    // we're doing this asynchronously in order to not interrupt the loading process
    // should probably wrap this a bit better (use a promise, or setImmediate)
    // return setTimeout(function() {callback(Puffball.Persist.get('puffs') || [])}, 888)
}

/**
 * to fetch new shells
 * @return {boolean}
 */
PuffData.importRemoteShells = function() {
    var initial_limit = 22;
    var prom = PuffNet.getSomeShells(initial_limit);
    
    return prom.then(function(shells) {
        Puffball.receiveNewShells(shells)
        // if(JSON.stringify(PuffData.shells) == JSON.stringify(shells))
        //     return false;
        // PuffData.shells = shells;
        // shells.forEach(PuffData.addNewShell)
        // // Puffball.Persist.save('shells', shells);
        // shells.forEach(function(shell) {
        //     if(shell.payload && shell.payload.content) {
        //         Puffball.receiveNewPuffs(shell);
        //     }
        // })
    })
}

/**
 * to verify a puff
 * @param  {object} puff
 * @return {string/boolean}
 */
PuffData.verifyPuff = function(puff) {
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
    return PuffData.puffs.filter(function(puff) { return puff && puff.username == username })
    // return PuffForum.getByUser(username) // TODO: test this
}



