/*
       _______  __   __  _______  _______  _______  _______  ___      ___     
      |       ||  | |  ||       ||       ||  _    ||   _   ||   |    |   |    
      |    _  ||  | |  ||    ___||    ___|| |_|   ||  |_|  ||   |    |   |    
      |   |_| ||  |_|  ||   |___ |   |___ |       ||       ||   |    |   |    
      |    ___||       ||    ___||    ___||  _   | |       ||   |___ |   |___ 
      |   |    |       ||   |    |   |    | |_|   ||   _   ||       ||       |
      |___|    |_______||___|    |___|    |_______||__| |__||_______||_______|                                                
 
  
    The core library for the puffball platform. 
    
    Currently a single flat file containing a mixture of parts; one day this will be the composite of modules at many levels.
    
    
    Future file system idea:
    
    PB.js
    
    /data
      Data.js
      PuffValidator.js
    
    /net
      Net.js
      Socket.js
      RTC.js
      LocalStorage.js

    /crypto
      Crypto.js


*/

PB = {};

PB.Modules = {}
PB.M = PB.Modules

PB.newPuffCallbacks = [];

/**
 * initialize the network layer;  
 * slurp in available data;  
 * do other amazing things
 * @param  {array} zone array of zones
 */
PB.init = function(zone) {
    PB.Data.depersistUserRecords()
    
    PB.Data.importShells()
    
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
    
    PB.Net.init()
}


/**
 * build a new puff object based on the parameters;  
 * does not hit the network, hence does no real verification whatsoever
 * @param  {string} username                    user who sign the puff
 * @param  {string} privatekey                  private default key for the user
 * @param  {string} routes                      routes of the puff
 * @param  {string} type                        type of the puff
 * @param  {string} content                     content of the puff
 * @param  {object} payload                     other payload information for the puff
 * @param  {string} previous                    most recently published content by the user
 * @param  {object} userRecordsForWhomToEncrypt
 * @param  {object} envelopeUserKeys
 * @return {object}                             the new puff object
 */
PB.buildPuff = function(username, privatekey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, envelopeUserKeys) {
    var puff = PB.packagePuffStructure(username, routes, type, content, payload, previous)

    // TODOUR: add capa

    puff.sig = PB.Crypto.signPuff(puff, privatekey)
    if(userRecordsForWhomToEncrypt) {
        puff = PB.encryptPuff(puff, privatekey, userRecordsForWhomToEncrypt, envelopeUserKeys)
    }
    
    return puff
}

/**
 * pack all the parameters into an object with puff structure (without signature)
 * @param  {string} username 
 * @param  {string[]} routes
 * @param  {string} type     
 * @param  {string} content  
 * @param  {object} payload  
 * @param  {string} previous 
 * @return {object}          object which has similar structure as a puff (without signature)
 */
PB.packagePuffStructure = function(username, routes, type, content, payload, previous) {
    payload = payload || {}                             // TODO: check all of these values more carefully
    payload.content = content
    payload.type = type

    routes = routes || []
    previous = previous || false                        // false for DHT requests and beginning of blockchain, else valid sig

    var puff = { username: username
               ,   routes: routes
               , previous: previous
               ,  version: '0.0.4'                      // version accounts for crypto type and puff shape
               ,  payload: payload                      // early versions will be aggressively deprecated and unsupported
               }
    
    return puff
}

/**
 * returns a canonical user object: use this everywhere user objects are needed (DHT, identities, etc)
 * @param  {string} username   
 * @param  {string} defaultKey public default key
 * @param  {string} adminKey   public admin key
 * @param  {string} rootKey    public root key
 * @param  {string} latest     signature of the most recent puff published by the user
 * @param  {string} updated    date of the most recent update to the username
 * @return {object}            a canonical user object
 */
PB.buildUserRecord = function(username, defaultKey, adminKey, rootKey, latest, updated, profile) {
    latest = latest || ""
    updated = updated || ""
    profile = profile || ""
    
    // TODOUR: add capa
    
    // THINK: should we check for valid keys? valid timestamp for updated? what if you want a partially invalid user like anon?

    if(!PB.validateUsername(username))
        return false; // already logged the error
    
    // these keys are PUBLIC. only public keys here. no other types of keys. 
    
    return {   username: username
           ,    rootKey: rootKey
           ,   adminKey: adminKey
           , defaultKey: defaultKey
           ,     latest: latest
           ,    updated: updated
           ,    profile: profile
           }
}

/**
 * check if a username is valid
 *     a username must be shorter than 256 characters, all lowercase and contains only alphanumeric and . sign
 * @param  {string} username the string to be check
 * @return {boolean}          return true if  the parameter string is a valid username, otherwise throw error
 */
PB.validateUsername = function(username) {
    if(!username) 
        return PB.onError('Username is required', username)

    if(username.length > 256) 
        return PB.onError('Usernames must be shorter than 256 characters', username)

    if(username != username.toLowerCase()) 
        return PB.onError('Usernames must be lowercase', username)
    
    if(!/^[0-9a-z.]+$/.test(username))
        return PB.onError('Usernames must be alphanumeric', username)
    
    // TODOUR: add capa
    
    return true;
}

/**
 * to process user records
 * @param  {string} userRecord
 * @return {object}
 */
PB.processUserRecord = function(userRecord) {
    //// Use this on all incoming user records
    
    // TODOUR: add capa
    userRecord = PB.buildUserRecord(userRecord.username, userRecord.defaultKey, userRecord.adminKey, userRecord.rootKey, userRecord.latest, userRecord.updated, userRecord.profile);
    
    if(!userRecord)
        return PB.onError('That is not an acceptable user record', userRecord);
    
    PB.Data.cacheUserRecord(userRecord);
    
    return userRecord;
}

/**
 * checks the cache, and always returns a promise
 * @param {string} username
 * @returns {object} Promise for a user record
 * Looks first in the cache, then grabs from the network
 */
PB.getUserRecord = function(username) {
    //// This always checks the cache, and always returns a promise
    
    // TODOUR: add capa
    
    var userRecord = PB.Data.getCachedUserRecord(username);
    
    if(userRecord)
        return Promise.resolve(userRecord);
    
    var userPromise = PB.Data.userPromises[username];
    
    if(userPromise)
        return userPromise;
    
    return PB.getUserRecordNoCache(username);
}

/**
 * Forces a request to the network, ignores cached
 * @param {string} username
 * @returns {object} Promise for a user record
 */
PB.getUserRecordNoCache = function(username) {
    //// This never checks the cache
    
    // TODOUR: add capa
    
    var prom = PB.Net.getUserRecord(username);
    
    PB.Data.userPromises[username] = prom
    
    return prom;
}

/**
 * returns a puff from a shell
 * @param  {(string|object)} shell a string which is a signature of a puff; or an object contains partial information of a puff
 * @return {object} returns a puff based on the shell; returns false if the shell is empty
 */
PB.getPuffFromShell = function(shell_or_sig) {
    if(!shell_or_sig)
        return false // false so we can filter empty shells out easily, while still loading them on demand
    
    if(shell_or_sig.payload && shell_or_sig.payload.content !== undefined)
        return shell_or_sig // it's actually a full blown puff
    
    var sig = shell_or_sig.sig || shell_or_sig
    
    return PB.Data.getPuffBySig(sig) // returns a puff, or asks the network and returns false
}

/**
 * handle a newly created puff: add to our local cache and fire new content callbacks
 * @param {object} puff
 */
PB.addPuffToSystem = function(puff) {
    
    if(PB.Data.getCachedShellBySig(puff.sig)) return false
    
    PB.Data.addShellsThenMakeAvailable(puff);

    PB.Net.distributePuff(puff);
    
    return puff;
}

/**
 * it is called by core Puff library any time puffs are added to the system
 * @param  {Puff[]} puffs
 * @return {Puff[]}
 */
PB.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
    
    // TODO: this is only called from PB.Data.makeShellsAvailable -- pull this down there or rethink it all
    
    puffs = Array.isArray(puffs) ? puffs : [puffs];                                 // make puffs an array

    // THINK: why didn't we allow shells through here, and should we in the future?
    //        if we don't, find a different way in getAncestors and getDescendants to add edges to shells
    // puffs = puffs.filter(function(puff) {
    //     return puff.payload && puff.payload.content !== undefined})                 // no partial puffs
    
    PB.newPuffCallbacks.forEach(function(callback) { callback(puffs) });      // call all callbacks back
    
    return puffs;
}

/**
 * add new callback which is called when a new puff added to the system
 * @param  {Function} callback takes an array of puff as its argument, and is called each time puffs are added to the system
 */
PB.onNewPuffs = function(callback) {
    //// use this to add a new hook into the receiveNewPuffs cycle
    PB.newPuffCallbacks.push(callback);
}

PB.addRelationship = function(callback) {
    //// use this to add a new hook into the receiveNewPuffs cycle
    PB.newPuffCallbacks.push(callback);
}

/**
 * return an encrypted version of the puff. this has to be done before signing. userRecords must be fully instantiated.
 * @param  {object} puff
 * @param  {string} myPrivateWif
 * @param  {string} userRecords
 * @return {object}
 */
PB.encryptPuff = function(letter, myPrivateWif, userRecords, envelopeUserKeys) {
    //// stick a letter in an envelope. userRecords must be fully instantiated.
    var puffkey = PB.Crypto.getRandomKey()                                        // get a new random key
    
    var letterCipher = PB.Crypto.encryptWithAES(JSON.stringify(letter), puffkey)  // encrypt the letter
    var username = letter.username
    
    // TODOUR: add capa to envelopeUserKeys... somehow
    
    if(envelopeUserKeys) {
        myPrivateWif = envelopeUserKeys.default
        username = envelopeUserKeys.username
    }
    
    var envelope = PB.packagePuffStructure(username, letter.routes                // envelope is also a puff
                           , 'encryptedpuff', letterCipher, {}, letter.previous)  // it includes the letter
    
    envelope.keys = PB.Crypto.createKeyPairs(puffkey, myPrivateWif, userRecords)  // add decryption keys
    envelope.sig = PB.Crypto.signPuff(envelope, myPrivateWif)                     // sign the envelope
    
    return envelope
}

/**
 * to decrypt a puff
 * @param  {object} puff
 * @param  {string} yourPublicWif
 * @param  {string} myUsername
 * @param  {string} myPrivateWif
 * @return {object}
 */
PB.decryptPuff = function(envelope, yourPublicWif, myUsername, myPrivateWif) {
    //// pull a letter out of the envelope -- returns a promise!

    return new Promise(function(resolve, reject) {
        PB.workersend('decryptPuffForReals', [envelope, yourPublicWif, myUsername, myPrivateWif], resolve, reject)
    })
}

PB.decryptPuffForReals = function(envelope, yourPublicWif, myUsername, myPrivateWif) {
    if(!envelope.keys) return false
    var keyForMe = envelope.keys[myUsername]
    var puffkey  = PB.Crypto.decodePrivateMessage(keyForMe, yourPublicWif, myPrivateWif)
    var letterCipher = envelope.payload.content
    var letterString = PB.Crypto.decryptWithAES(letterCipher, puffkey)
    letterString = PB.tryDecodeOyVey(escape(letterString)); // encoding
    return PB.parseJSON(letterString)
}

// PB.decryptPuff -> PB.decryptPuffForReals if there's no PB.cryptoworker
// returns a promise that resolves to the decrypted whatsit. 
// update forum function and filesystem call site
// maybe make worker promise wrapper layer

PB.tryDecodeOyVey = function(str) {
    //// decodeURIComponent throws, so we wrap it. try/catch kills the optimizer, so we isolate it.
    try {
        return decodeURIComponent(str)
    } catch(err) {
        return PB.onError('Invalid URI string', err)
    }
}




/// ERROR ERROR
/**
 * on error function
 * @param  {string} msg 
 * @param  {object} obj 
 * @return {false}
 */
PB.onError = function(msg, obj) {
    toSend = {msg: msg, obj: obj};

    if(puffworldprops.prefs.reporting)
        PB.Net.xhr(CONFIG.eventsApi, {method: 'POST'}, toSend)

    console.log(msg, obj) // adding this back in for debugging help
    return false
}

/**
 * promise error function
 * @param  {string} mes
 * @return {boolean}
 */
PB.promiseError = function(msg) {
    return function(err) {
        PB.onError(msg, err)
        throw err
    }
}

/**
 * throw error function
 * @param  {string} msg    
 * @param  {string} errmsg 
 * @return {boolean}
 */
PB.throwError = function(msg, errmsg) {
    throw PB.makeError(msg, errmsg)
}

PB.makeError = function(msg, errmsg) {
    var err = Error(errmsg || msg)
    PB.onError(msg, err)
    return err
}

/**
 * check if the string is a valid JSON string
 * @param  {string} str 
 * @return {boolean}
 */
PB.parseJSON = function(str) {
    try {
        return JSON.parse(str)
    } catch(err) {
        return PB.onError('Invalid JSON string', err)
    }
}

/**
 * check if false promise
 * @param  {string} msg     
 * @return {boolean}     
 */
PB.emptyPromise = function(msg) {
    if(msg) PB.onError(msg)
    return Promise.reject(msg)
}



// HELPERS

~function() {
    //// postpone until next tick
    // inspired by http://dbaron.org/log/20100309-faster-timeouts
    var later = []
    var messageName = 12345
    var gimme_a_tick = true

    function setImmediate(fun) {
        later.push(fun)
        
        if(gimme_a_tick) {
            gimme_a_tick = false
            window.postMessage(messageName, "*")
        }
        
        return false
    }

    function handleMessage(event) {
        if(event.data != messageName) return false

        event.stopPropagation()
        gimme_a_tick = true

        var now = later
        later = []

        for(var i=0, l=now.length; i < l; i++)
            now[i]()
    }
  
    if(typeof window != 'undefined') {
        window.addEventListener('message', handleMessage, true)
        window.setImmediate = setImmediate
    }
}()

PB.queuer = function() {
    //// do something after some other things
    var queue = []
    
    var nexttime = function(invoker) {
        invoker(function() {
            if(!queue.length) return false
            queue.shift()()
            nexttime(invoker)
        })
    }
            
    var queuer = function(invoker, fun) {
        queue.push(fun)
        if(queue.length > 1) return false // THINK: possible race condition
        nexttime(invoker) 
    }
    
    return queuer
}

PB.once = function() {
    //// do something later, but only once
    var later = []

    var step = function() {
        var now = later
        later = []
        for(var i=0, l=now.length; i < l; i++)
            now[i]()
    }
            
    var once = function(invoker, fun) {
        if(~later.indexOf(fun)) return false
        later.push(fun)
        if(later.length > 1) return false // THINK: possible race condition
        invoker(step) 
    }
    
    return once
}

~function() {
    if(typeof window != 'undefined') {
        window.queueImmediate = PB.queuer().bind(null, setImmediate)
        window.onceImmediate  = PB.once().bind(null, setImmediate)
        window.queueRAF = PB.queuer().bind(null, requestAnimationFrame)
        window.onceRAF  = PB.once().bind(null, requestAnimationFrame)
    
        var timefunbind = {}
        window.onceInAwhile = function(fun, time) {
            //// NOTE: don't use the same fun with different times
            if(timefunbind[fun]) return false
            timefunbind[fun] = setTimeout(function() {fun(); timefunbind[fun] = false}, time)
        }
    }
}()