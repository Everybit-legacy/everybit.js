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
    
    puff.js
    
    /data
      data.js
      puffValidator.js
    
    /network
      network.js
      socket.js
      rtc.js
      localStorage.js
*/

Puffball = {};

Puffball.newPuffCallbacks = [];


Puffball.init = function(zone) {
    // initialize the network layer 
    // slurp in available data
    // do other amazing things
    
    PuffData.depersistUserRecords()
    
    PuffData.getLocalShells(Puffball.receiveNewPuffs)
    PuffData.getNewShells() // THINK: this should take a set of zones
    
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
    
    PuffNet.init()
}

Puffball.buildPuff = function(username, privatekey, routes, type, content, payload, previous) {
    //// Returns a new puff object. Does not hit the network, and hence does no real verification whatsoever.

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

    puff.sig = Puffball.Crypto.signPuff(puff, privatekey)

    return puff
}

Puffball.buildUserRecord = function(username, defaultKey, adminKey, rootKey, latest, updated) {
    //// Returns a canonical user object: use this everywhere user objects are needed (DHT, identities, etc).
    
    latest = latest || ""
    updated = updated || ""
    
    // THINK: should we check for valid keys? valid timestamp for updated? what if you want a partially invalid user like anon?

    if(!Puffball.validateUsername(username))
        return false; // already logged the error
    
    // these keys are PUBLIC. only public keys here. no other types of keys. 
    
    return {   username: username
           ,    rootKey: rootKey
           ,   adminKey: adminKey
           , defaultKey: defaultKey
           ,     latest: latest
           ,    updated: updated
           }
}

Puffball.validateUsername = function(username) {
    if(!username) 
        return Puffball.onError('Username is required', username)

    if(username.length > 256) 
        return Puffball.onError('Usernames must be shorter than 256 characters', username)

    if(username != username.toLowerCase()) 
        return Puffball.onError('Usernames must be lowercase', username)
    
    if(!/^[0-9a-z.]+$/.test(username))
        return Puffball.onError('Usernames must be alphanumeric', username)
    
    return true;
}

Puffball.processUserRecord = function(userRecord) {
    //// Use this on all incoming user records
    
    userRecord = Puffball.buildUserRecord(userRecord.username, userRecord.defaultKey, userRecord.adminKey, userRecord.rootKey, userRecord.latest, userRecord.updated);
    
    if(!userRecord)
        return Puffball.onError('That is not an acceptable user record', userRecord);
    
    PuffData.cacheUserRecord(userRecord);
    
    return userRecord;
}

/**
 *
 * @param username
 * @returns Promise for a user record
 * Looks first in the cache, then grabs from the network
 */
Puffball.getUserRecord = function(username) {
    //// This always checks the cache
    
    var userRecord = PuffData.getCachedUserRecord(username);
    
    if(userRecord)
        return Promise.resolve(userRecord);
    
    return Puffball.getUserRecordNoCache(username);
}

/**
 *
 * @param username
 * @returns Promise for a user record
 * Forces a request to the network, ignores cached
 */
Puffball.getUserRecordNoCache = function(username) {
    //// This never checks the cache
    
    return PuffNet.getUserRecord(username);
}


Puffball.getPuffFromShell = function(shell) {
    if(!shell || !shell.payload)
        return false
    
    if(shell.payload.content !== undefined)
        return shell
    
    var puff = PuffData.puffs.filter(function(puff) { return puff.sig === shell.sig })[0]
    if(puff)
        return puff
    
    if(PuffData.pending[shell.sig])
        return false
    
    PuffData.pending[shell.sig] = true
    
    PuffNet.getPuffBySig(shell.sig)
           .then(Puffball.receiveNewPuffs)
           
    return false // so we can filter empty shells out easily, while still loading them on demand
}

 
Puffball.addPuffToSystem = function(puff) {
    //// add a puff to our local cache and fire the callback for new content
  
    Puffball.receiveNewPuffs([puff]);

    PuffNet.distributePuff(puff);
    
    return puff;
}


Puffball.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    puffs = Array.isArray(puffs) ? puffs : [puffs];                                 // make puffs an array
    
    puffs = puffs.filter(function(puff) {
        return puff.payload && puff.payload.content !== undefined})                 // no partial puffs
  
    puffs.forEach(function(puff) { PuffData.eat(puff) });                      // cache all the puffs
  
    Puffball.newPuffCallbacks.forEach(function(callback) { callback(puffs) });      // call all callbacks back
    
    return puffs;
}


Puffball.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    Puffball.newPuffCallbacks.push(callback);
}




// DATA LAYER

PuffData = {};
PuffData.puffs = [];
PuffData.shells = [];
PuffData.pending = {};
PuffData.userRecords = {};                         // these are DHT user entries, not our local identity wardrobe

PuffData.eat = function(puff) {
    if(!!~PuffData.puffs
                       .map(function(p) {return p.sig})     // OPT: check the sig index instead
                       .indexOf(puff.sig)) 
      return false;
    PuffData.puffs.push(puff);  
}

PuffData.persistShells = function(shells) {
    if(CONFIG.noLocalStorage) return false              // THINK: this is only for debugging and development
    Puffball.Persist.save('shells', shells)
}

PuffData.getLocalShells = function(callback) {
    PuffData.shells = Puffball.Persist.get('shells') || [];
    
    setImmediate(function() {callback(PuffData.shells)});
    // we're doing this asynchronously in order to not interrupt the loading process
    // should probably wrap this a bit better (use a promise, or setImmediate)
    // return setTimeout(function() {callback(Puffball.Persist.get('puffs') || [])}, 888)
}

PuffData.getNewShells = function() {
    /// TODO: this should call PuffNet.getNewShells and then integrate that with our shells from local storage
    ///       and then we'll get the missing content on demand
    
    var prom = PuffNet.getAllPuffShells();
    
    prom.then(function(shells) {
        if(JSON.stringify(PuffData.shells) == JSON.stringify(shells)) 
            return false;
        PuffData.shells = shells;
        Puffball.Persist.save('shells', shells);
        shells.forEach(function(shell) {
            if(shell.payload && shell.payload.content) {
                Puffball.receiveNewPuffs(shell); 
            }
        }) 
    })
}

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

PuffData.getCachedUserRecord = function(username) {
    return PuffData.userRecords[username];
}

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

PuffData.depersistUserRecords = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PuffData.userRecords = Puffball.Persist.get('userRecords') || {};
}

PuffData.getMyPuffChain = function(username) {
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    return PuffData.puffs.filter(function(puff) { return puff && puff.username == username })    
}




/*
  Puffball.Crypto

  Using bitcoin.js is pretty nightmarish for our purposes. 
  It pollutes everything with extraneous strings, always forces down to addresses, 
  and has a terrible API for compressed keys. Actually, the API is terrible in general.
  It's also not currently maintained and is dog slow.

  HOWEVER. 

  Until we get some real crypto experts on board or a new js lib comes out that has good community support, 
  leave this code alone.
*/

Puffball.Crypto = {};

Puffball.Crypto.generatePrivateKey = function() {
    return new Bitcoin.ECKey().toWif()
}

// TODO: This should return false if string is empty
Puffball.Crypto.privateToPublic = function(privateKeyWIF) {
    try {
        return Puffball.Crypto.wifToPriKey(privateKeyWIF).getPub(true).toWif()
    } catch(err) {
        return Puffball.onError('Invalid private key: could not convert to public key', [privateKeyWIF, err])
    }
}

Puffball.Crypto.signPuff = function(unsignedPuff, privateKeyWIF) {
    //// sign the hash of some data with a private key and return the sig in base 58

    var prikey = Puffball.Crypto.wifToPriKey(privateKeyWIF)
    var message = Puffball.Crypto.puffToSiglessString(unsignedPuff)
    var messageHash = Puffball.Crypto.createMessageHash(message)
    
    try {
        return Bitcoin.base58.encode(prikey.sign(messageHash))
    } catch(err) {
        return Puffball.onError('Could not properly encode signature', [prikey, messageHash, err])
    }
}

Puffball.Crypto.verifyPuffSig = function(puff, defaultKey) {
    var puffString = Puffball.Crypto.puffToSiglessString(puff);
    return Puffball.Crypto.verifyMessage(puffString, puff.sig, defaultKey);
}

Puffball.Crypto.verifyMessage = function(message, sig, publicKeyWIF) {
    //// accept a base 58 sig, a message (must be a string) and a base 58 public key. returns true if they match, false otherwise
  
    try {
        var pubkey = Puffball.Crypto.wifToPubKey(publicKeyWIF)
        
        var sigBytes = Bitcoin.base58.decode(sig).toJSON()
        sigBytes = sigBytes.data || sigBytes
        
        var messageHash = Puffball.Crypto.createMessageHash(message)
        
        return pubkey.verify(messageHash, sigBytes)
    } catch(err) {
        return Puffball.onError('Invalid key or sig: could not verify message', [messageHash, sig, publicKeyWIF, err])
    }
}

Puffball.Crypto.createMessageHash = function(message) {
    return Bitcoin.Crypto.SHA256(message).toString()
}

Puffball.Crypto.wifToPriKey = function(privateKeyWIF) {
    try {
        return new Bitcoin.ECKey(privateKeyWIF, true)
    } catch(err) {
        return Puffball.onError('Invalid private key: are you sure it is properly WIFfed?', [privateKeyWIF, err])
    }
}

Puffball.Crypto.wifToPubKey = function(publicKeyWIF) {
    try {
        var pubkeyBytes = Bitcoin.base58check.decode(publicKeyWIF).payload.toJSON()
        pubkeyBytes = pubkeyBytes.data || pubkeyBytes
        return new Bitcoin.ECPubKey(pubkeyBytes, true)
    } catch(err) {
        return Puffball.onError('Invalid public key: are you sure it is properly WIFfed?', [publicKeyWIF, err])
    }
}

Puffball.Crypto.puffToSiglessString = function(puff) {
    return JSON.stringify(puff, function(key, value) {if(key == 'sig') return undefined; return value})
}



// Puffball.Crypto.verifyBlock = function(block, publicKeyBase58) {
//     return Puffball.Crypto.verifyMessage(block.blockPayload, block.blockSig.replace(/\*/g, ""), publicKeyBase58);
// }

// Puffball.Crypto.signBlock = function(blockPayload, privateKeyWIF) {
//     return Puffball.Crypto.signPayload(blockPayload, privateKeyWIF);
// }


/*
    Persistence layer

    It's like a network on your hard drive... which probably implies this should live in PuffNet.
*/

Puffball.Persist = {};
Puffball.Persist.todo = {}
Puffball.Persist.todoflag = false

Puffball.Persist.save = function(key, value) {
    Puffball.Persist.todo[key] = value
    if(!Puffball.Persist.todoflag) {
        setImmediate(function() {
            for(var key in Puffball.Persist.todo) {
                // prepend PUFF:: so we're good neighbors
                var realkey = 'PUFF::' + key;
                var str = JSON.stringify(Puffball.Persist.todo[key]);                
                localStorage.setItem(realkey, str);
            }
            Puffball.Persist.todo = {};
            Puffball.Persist.todoflag = false;
        });
    }
    Puffball.Persist.todoflag = true
}

Puffball.Persist.get = function(key) {
    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return Puffball.parseJSON(str);
}

Puffball.Persist.remove = function(key) {
    var realkey = 'PUFF::' + key;
    localStorage.removeItem(realkey);
}


/// ERROR ERROR

Puffball.onError = function(msg, obj) {
    console.log(msg, obj)
    return false
}


Puffball.promiseError = function(msg) {
    return function(err) {
        Puffball.onError(msg, err)
        throw err
    }
}

Puffball.throwError = function(msg, errmsg) {
    var err = Error(errmsg || msg)
    Puffball.onError(msg, err)
    throw err
}


Puffball.parseJSON = function(str) {
    try {
        return JSON.parse(str)
    } catch(err) {
        return Puffball.onError('Invalid JSON string', err)
    }
}

Puffball.falsePromise = function(msg) {
    if(msg) Puffball.onError(msg)
    return Promise.reject(msg)
}



// HELPERS

~function() {
    //// postpone until next tick
    // inspired by http://dbaron.org/log/20100309-faster-timeouts
    var later = []
    var messageName = 12345
    var gimme_a_tick = true

    function setImmediate(fn) {
        later.push(fn)
        
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
}();
