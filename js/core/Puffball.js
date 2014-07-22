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

/**
 * initialize the network layer;  
 * slurp in available data;  
 * do other amazing things
 * @param  {array} zone array of zones
 */
Puffball.init = function(zone) {
    PuffData.depersistUserRecords()
    
    PuffData.importShells()
    
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
    
    PuffNet.init()
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
Puffball.buildPuff = function(username, privatekey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, envelopeUserKeys) {
    var puff = Puffball.packagePuffStructure(username, routes, type, content, payload, previous)

    puff.sig = Puffball.Crypto.signPuff(puff, privatekey)

    if(userRecordsForWhomToEncrypt) {
        puff = Puffball.encryptPuff(puff, privatekey, userRecordsForWhomToEncrypt, envelopeUserKeys)
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
Puffball.packagePuffStructure = function(username, routes, type, content, payload, previous) {
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
Puffball.buildUserRecord = function(username, defaultKey, adminKey, rootKey, latest, updated) {
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

/**
 * check if a username is valid
 *     a username must be shorter than 256 characters, all lowercase and contains only alphanumeric and . sign
 * @param  {string} username the string to be check
 * @return {boolean}          return true if  the parameter string is a valid username, otherwise throw error
 */
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

/**
 * to process user records
 * @param  {string} userRecord
 * @return {object}
 */
Puffball.processUserRecord = function(userRecord) {
    //// Use this on all incoming user records
    
    userRecord = Puffball.buildUserRecord(userRecord.username, userRecord.defaultKey, userRecord.adminKey, userRecord.rootKey, userRecord.latest, userRecord.updated);
    
    if(!userRecord)
        return Puffball.onError('That is not an acceptable user record', userRecord);
    
    PuffData.cacheUserRecord(userRecord);
    
    return userRecord;
}

/**
 * checks the cache, and always returns a promise
 * @param {string} username
 * @returns {object} Promise for a user record
 * Looks first in the cache, then grabs from the network
 */
Puffball.getUserRecord = function(username) {
    //// This always checks the cache, and always returns a promise
    
    var userRecord = PuffData.getCachedUserRecord(username);
    
    if(userRecord)
        return Promise.resolve(userRecord);
    
    return Puffball.getUserRecordNoCache(username);
}

/**
 * Forces a request to the network, ignores cached
 * @param {string} username
 * @returns {object} Promise for a user record
 */
Puffball.getUserRecordNoCache = function(username) {
    //// This never checks the cache
    
    return PuffNet.getUserRecord(username);
}

/**
 * returns a puff from a shell
 * @param  {(string|object)} shell a string which is a signature of a puff; or an object contains partial information of a puff
 * @return {object} returns a puff based on the shell; returns false if the shell is empty
 */
Puffball.getPuffFromShell = function(shell_or_sig) {
    if(!shell_or_sig)
        return false // false so we can filter empty shells out easily, while still loading them on demand
    
    if(shell_or_sig.payload && shell_or_sig.payload.content !== undefined)
        return shell_or_sig // it's actually a full blown puff
    
    var sig = shell_or_sig.sig || shell_or_sig
    
    return PuffData.getPuffBySig(sig) // returns a puff, or asks the network and returns false
}

/**
 * handle a newly created puff: add to our local cache and fire new content callbacks
 * @param {object} puff
 */
Puffball.addPuffToSystem = function(puff) {
    
    if(PuffData.getCachedShellBySig(puff.sig)) return false
    
    PuffData.addShellsThenMakeAvailable(puff);

    PuffNet.distributePuff(puff);
    
    return puff;
}

/**
 * it is called by core Puff library any time puffs are added to the system
 * @param  {Puff[]} puffs
 * @return {Puff[]}
 */
Puffball.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
    
    // TODO: this is only called from PuffData.makeShellsAvailable -- pull this down there or rethink it all
    
    puffs = Array.isArray(puffs) ? puffs : [puffs];                                 // make puffs an array
    
    puffs = puffs.filter(function(puff) {
        return puff.payload && puff.payload.content !== undefined})                 // no partial puffs
    
    Puffball.newPuffCallbacks.forEach(function(callback) { callback(puffs) });      // call all callbacks back
    
    return puffs;
}

/**
 * add new callback which is called when a new puff added to the system
 * @param  {Function} callback takes an array of puff as its argument, and is called each time puffs are added to the system
 */
Puffball.onNewPuffs = function(callback) {
    //// use this to add a new hook into the receiveNewPuffs cycle
    Puffball.newPuffCallbacks.push(callback);
}

/**
 * return an encrypted version of the puff. this has to be done before signing. userRecords must be fully instantiated.
 * @param  {object} puff
 * @param  {string} myPrivateWif
 * @param  {string} userRecords
 * @return {object}
 */
Puffball.encryptPuff = function(letter, myPrivateWif, userRecords, envelopeUserKeys) {
    //// stick a letter in an envelope. userRecords must be fully instantiated.
    var puffkey = Puffball.Crypto.getRandomKey()                                        // get a new random key
    
    var letterCipher = Puffball.Crypto.encryptWithAES(JSON.stringify(letter), puffkey)  // encrypt the letter
    var username = letter.username
    
    if(envelopeUserKeys) {
        myPrivateWif = envelopeUserKeys.default
        username = envelopeUserKeys.username
    }
    
    var envelope = Puffball.packagePuffStructure(username, letter.routes                // envelope is also a puff
                           , 'encryptedpuff', letterCipher, {}, letter.previous)        // it includes the letter
    
    envelope.keys = Puffball.Crypto.createKeyPairs(puffkey, myPrivateWif, userRecords)  // add decryption keys
    envelope.sig = Puffball.Crypto.signPuff(envelope, myPrivateWif)                     // sign the envelope
    
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
Puffball.decryptPuff = function(envelope, yourPublicWif, myUsername, myPrivateWif) {
    //// pull a letter out of the envelope
    if(!envelope.keys) return false
    var keyForMe = envelope.keys[myUsername]
    var puffkey  = Puffball.Crypto.decodePrivateMessage(keyForMe, yourPublicWif, myPrivateWif)
    var letterCipher = envelope.payload.content
    var letterString = Puffball.Crypto.decryptWithAES(letterCipher, puffkey)
    letterString = decodeURIComponent(escape(letterString)); // encoding
    return Puffball.parseJSON(letterString)
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

/**
 * to generate private key
 * @return {string} 
 */
Puffball.Crypto.generatePrivateKey = function() {
    // OPT: remove this test once Bitcoin.ECKey no longer generates invalid keys (about 1 in 1,000 right now)
    var prikey = new Bitcoin.ECKey().toWif()
    if(Puffball.Crypto.wifToPriKey(prikey))
        return prikey
    else
        return Puffball.Crypto.generatePrivateKey()  // THINK: this could generate an eternal error explosion
}

/**
 * convert public key from private key
 * @param  {string} privateKeyWIF
 * @return {string}
 */
Puffball.Crypto.privateToPublic = function(privateKeyWIF) {
    // TODO: This should return false if string is empty
    if(!privateKeyWIF)
        return Puffball.onError('That private key contained no data')
        
    try {
        return Puffball.Crypto.wifToPriKey(privateKeyWIF).getPub(true).toWif()
    } catch(err) {
        return Puffball.onError('Invalid private key: could not convert to public key', [privateKeyWIF, err])
    }
}

/**
 * sign the hash of some data with a private key and return the sig in base 58
 * @param  {object} unsignedPuff
 * @param  {string} privateKeyWIF
 * @return {(boolean|error)}
 */
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

/**
 * to verify puff sig
 * @param  {object} puff
 * @param  {string} defaultKey
 * @return {boolean}
 */
Puffball.Crypto.verifyPuffSig = function(puff, defaultKey) {
    var puffString = Puffball.Crypto.puffToSiglessString(puff);
    return Puffball.Crypto.verifyMessage(puffString, puff.sig, defaultKey);
}

/**
 * accept a base 58 sig, a message (must be a string) and a base 58 public key. returns true if they match, false otherwise
 * @param  {string} message
 * @param  {string} sig
 * @param  {string} publicKeyWIF
 * @return {boolean}
 */
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

/**
 * to create message hash
 * @param  {string} message
 * @return {string}
 */
Puffball.Crypto.createMessageHash = function(message) {
    return Bitcoin.Crypto.SHA256(message).toString()
}

/**
 * crypt wif to private key
 * @param  {string} privateKeyWIF
 * @return {boolean}
 */
Puffball.Crypto.wifToPriKey = function(privateKeyWIF) {
    if(!privateKeyWIF)
        return Puffball.onError('That private key wif contains no data')

    try {
        return new Bitcoin.ECKey(privateKeyWIF, true)
    } catch(err) {
        return Puffball.onError('Invalid private key: are you sure it is properly WIFfed?', [privateKeyWIF, err])
    }
}

/**
 * crypt wif to public try
 * @param  {string} publicKeyWIF
 * @return {boolean}
 */
Puffball.Crypto.wifToPubKey = function(publicKeyWIF) {
    if(!publicKeyWIF)
        return Puffball.onError('That public key wif contains no data')

    try {
        var pubkeyBytes = Bitcoin.base58check.decode(publicKeyWIF).payload.toJSON()
        pubkeyBytes = pubkeyBytes.data || pubkeyBytes
        return new Bitcoin.ECPubKey(pubkeyBytes, true)
    } catch(err) {
        return Puffball.onError('Invalid public key: are you sure it is properly WIFfed?', [publicKeyWIF, err])
    }
}

/**
 * crypt puff to string without sig
 * @param  {object} puff
 * @return {string}
 */
Puffball.Crypto.puffToSiglessString = function(puff) {
    return JSON.stringify(puff, function(key, value) {if(key == 'sig') return undefined; return value})
}


/**
 * to encrypt with AES
 * @param  {string} message
 * @param  {string} key
 * @return {string}
 */
Puffball.Crypto.encryptWithAES = function(message, key) {
    var enc = Bitcoin.Crypto.AES.encrypt(message, key)
    return Bitcoin.Crypto.format.OpenSSL.stringify(enc)
}

/**
 * to decrypt with AES
 * @param  {string} message
 * @param  {string} key
 * @return {string}
 */
Puffball.Crypto.decryptWithAES = function(enc, key) {
    if(!key || !enc) return false
    var message = Bitcoin.Crypto.format.OpenSSL.parse(enc)
    var words = Bitcoin.Crypto.AES.decrypt(message, key)
    var bytes = Bitcoin.convert.wordsToBytes(words.words) 
    // var uglyRegex = /[\u0002\u0004\u0007\u000e]+$/g // TODO: fix this so AES padding doesn't ever leak out 
    var uglyRegex = /[\u0000-\u0010]+$/g // TODO: fix this so AES padding doesn't ever leak out 
    return bytes.map(function(x) {return String.fromCharCode(x)}).join('').replace(uglyRegex, '')
}

/**
 * to get the shared secret of two users
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
Puffball.Crypto.getOurSharedSecret = function(yourPublicWif, myPrivateWif) {
    // TODO: check our ECDH maths
    var pubkey = Puffball.Crypto.wifToPubKey(yourPublicWif)
    var prikey = Puffball.Crypto.wifToPriKey(myPrivateWif)
    if(!pubkey || !prikey) return false  
    var secret = pubkey.multiply(prikey).toWif()
    var key = Bitcoin.Crypto.SHA256(secret).toString()
    
    return key
}

/**
 * to encode private message
 * @param  {string} plaintext
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
Puffball.Crypto.encodePrivateMessage = function(plaintext, yourPublicWif, myPrivateWif) {
    var key = Puffball.Crypto.getOurSharedSecret(yourPublicWif, myPrivateWif)
    if(!key) return false
    var ciphertext = Puffball.Crypto.encryptWithAES(plaintext, key)
    return ciphertext
}

/**
 * to decode private message
 * @param  {string} plaintext
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
Puffball.Crypto.decodePrivateMessage = function(ciphertext, yourPublicWif, myPrivateWif) {
    var key = Puffball.Crypto.getOurSharedSecret(yourPublicWif, myPrivateWif)
    if(!key || !ciphertext) return false
    var plaintext = Puffball.Crypto.decryptWithAES(ciphertext, key)
    return plaintext // .replace(/\n+$/g, '')
}

/**
 * to get a random key
 * @param  {number} size
 * @return {string}
 */
Puffball.Crypto.getRandomKey = function(size) {
    size = size || 256/8 // AES key size is 256 bits
    var bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Bitcoin.convert.bytesToBase64(bytes)
}

/**
 * to create key pairs
 * @param  {string} puffkey
 * @param  {string} myPrivateWif
 * @param  {object} userRecords
 * @return {object}
 */
Puffball.Crypto.createKeyPairs = function(puffkey, myPrivateWif, userRecords) {
    return userRecords.reduce(function(acc, userRecord) {
        acc[userRecord.username] = Puffball.Crypto.encodePrivateMessage(puffkey, userRecord.defaultKey, myPrivateWif)
        return acc
    }, {})
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

/**
 * to save key/value
 * @param  {string} key
 * @param  {string} value
 */
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

/**
 * to get the parsed JSON info from the given key
 * @param  {string} key
 * @return {(false|string)}
 */
Puffball.Persist.get = function(key) {
    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return Puffball.parseJSON(str);
}

/**
 * to remove the item according to the given key
 * @param  {string} key
 */
Puffball.Persist.remove = function(key) {
    var realkey = 'PUFF::' + key;
    localStorage.removeItem(realkey);
}


/// ERROR ERROR
/**
 * on error funtion
 * @param  {string} msg 
 * @param  {object} obj 
 * @return {false}
 */
Puffball.onError = function(msg, obj) {
    toSend = {msg: msg, obj: obj};

    if(puffworldprops.prefs.reporting)
        PuffNet.xhr('http://162.219.162.56/c/events.php', {method: 'POST'}, toSend)

        // console.log(msg, obj)
    return false
}

/**
 * promise error function
 * @param  {string} mes
 * @return {boolean}
 */
Puffball.promiseError = function(msg) {
    return function(err) {
        Puffball.onError(msg, err)
        throw err
    }
}

/**
 * throw error function
 * @param  {string} msg    
 * @param  {string} errmsg 
 * @return {boolean}
 */
Puffball.throwError = function(msg, errmsg) {
    var err = Error(errmsg || msg)
    Puffball.onError(msg, err)
    throw err
}

/**
 * check if the string is a valid JSON string
 * @param  {string} str 
 * @return {boolean}
 */
Puffball.parseJSON = function(str) {
    try {
        return JSON.parse(str)
    } catch(err) {
        return Puffball.onError('Invalid JSON string', err)
    }
}

/**
 * check if false promise
 * @param  {string} msg     
 * @return {boolean}     
 */
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
}()

~function() {
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
    
    if(typeof window != 'undefined') {
        window.onceImmediate = once.bind(this, setImmediate)
        window.onceRAF = once.bind(this, requestAnimationFrame)
    }
}()

~function() {
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
    
    if(typeof window != 'undefined') {
        window.queueImmediate = queuer.bind(this, setImmediate)
        window.queueRAF = queuer.bind(this, requestAnimationFrame)
    }
}()

