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
      blockchain.js
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
    
    Puffball.Data.depersistUserRecords()
    
    Puffball.Data.getLocalPuffs(Puffball.receiveNewPuffs)
    Puffball.Data.getNewPuffs() // THINK: this should take a zone
    
    Puffball.Blockchain.BLOCKS = Puffball.Persist.get('blocks') 
    if(!Puffball.Blockchain.BLOCKS)
        Puffball.Blockchain.BLOCKS = {}
    
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
               , routes: routes
               , previous: previous
               , version: '0.0.3'                       // version accounts for crypto type and puff shape
               , payload: payload                       // early versions will be aggressively deprecated and unsupported
               }

    puff.sig = Puffball.Crypto.signData(puff, privatekey)

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
        return Puffball.onError('Usernames must be shorter than N characters', username)

    if(username != username.toLowerCase()) 
        return Puffball.onError('Usernames must be lowercase', username)
    
    if(!/^[0-9a-z.]+$/.test(username)) // FIXME: this isn't quite right...
        return Puffball.onError('Usernames must be alphanumeric', username)
    
    return true;
}

Puffball.processUserRecord = function(userRecord) {
    //// Use this on all incoming user records
    
    userRecord = Puffball.buildUserRecord(userRecord.username, userRecord.defaultKey, userRecord.adminKey, userRecord.rootKey, userRecord.latest, userRecord.updated);
    
    if(!userRecord)
        return Puffball.onError('That is not an acceptable user record', userRecord);
    
    Puffball.Data.cacheUserRecord(userRecord);
    
    return userRecord;
}

Puffball.getUserRecord = function(username) {
    //// This always checks the cache
    
    var userRecord = Puffball.Data.getCachedUserRecord[username];
    
    if(userRecord)
        return Promise.resolve(userRecord);
    
    return Puffball.getUserRecordNoCache(username);
}

Puffball.getUserRecordNoCache = function(username) {
    //// This never checks the cache
    
    return PuffNet.getUserRecord(username);
}



 
Puffball.addPuffToSystem = function(puff) {
    //// add a puff to our local cache and fire the callback for new content
  
    Puffball.receiveNewPuffs([puff]);

    PuffNet.distributePuff(puff);
    
    // Puffball.Blockchain.createBlock(puff.username, puff, privatekey);
    
    return puff;
}


Puffball.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    puffs = Array.isArray(puffs) ? puffs : [puffs];                                 // make puffs an array
  
    puffs.forEach(function(puff) { Puffball.Data.eat(puff) });                      // cache all the puffs
  
    Puffball.newPuffCallbacks.forEach(function(callback) { callback(puffs) });      // call all callbacks back
    
    return puffs
}


Puffball.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    Puffball.newPuffCallbacks.push(callback);
}




// DATA LAYER

Puffball.Data = {};
Puffball.Data.puffs = [];
Puffball.Data.userRecords = {}                          // these are DHT user entries, not our local identity wardrobe

Puffball.Data.eat = function(puff) {
    if(!!~Puffball.Data.puffs
                   .map(function(p) {return p.sig})     // OPT: check the sig index instead
                   .indexOf(puff.sig)) 
                      return false 
    Puffball.Data.puffs.push(puff);  
    Puffball.Data.persist(Puffball.Data.puffs);
}

Puffball.Data.persist = function(puffs) {
    if(CONFIG.noLocalStorage) return false              // THINK: this is only for debugging and development
    Puffball.Persist.save('puffs', puffs)               // OPT: throttle this when we're chowing down on lots of puffs
}

Puffball.Data.getLocalPuffs = function(callback) {
    // we're doing this asynchronously in order to not interrupt the loading process
    // should probably wrap this a bit better (use a promise, or setImmediate)
    return setTimeout(function() {callback(Puffball.Persist.get('puffs') || [])}, 0)
}

Puffball.Data.getNewPuffs = function() {
    var prom = PuffNet.getAllPuffs();                  // OPT: only ask for puffs we're missing
    return prom.then(Puffball.receiveNewPuffs)
                .catch(Puffball.promiseError('Could not load the puffs'))
}

Puffball.Data.verifyPuff = function(puff) {
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    // TODO: use this to verify incoming puffs
    // TODO: if prom doesn't match, try again with getUserRecordNoCache
    
    var prom = Puffball.getUserRecord(puff.username);
    
    return prom.then(function(user) {
        return Puffball.Crypto.verifyPuffSig(puff, user.defaultKey);
    });
}

Puffball.Data.getCachedUserRecord = function(username) {
    return Puffball.Data.userRecords[username];
}

Puffball.Data.cacheUserRecord = function(userRecord) {
    //// This caches with no validation -- don't use it directly, use Puffball.processUserRecord instead
    
    Puffball.Data.userRecords[userRecord.username] = userRecord;
    
    Puffball.Persist.save('userRecords', Puffball.Data.userRecords); // OPT: this could get expensive
    
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

Puffball.Data.depersistUserRecords = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    Puffball.Data.userRecords = Puffball.Persist.get('userRecords') || {};
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

Puffball.Crypto.privateToPublic = function(privateKeyWIF) {
    try {
        return Puffball.Crypto.wifToPriKey(privateKeyWIF).getPub(true).toWif()
    } catch(err) {
        return Puffball.onError('Invalid private key: could not convert to public key', privateKeyWIF)
    }
}

Puffball.Crypto.signData = function(unsignedPuff, privateKeyWIF) {
    //// sign the hash of some data with a private key and return the sig in base 58

    var prikey = Puffball.Crypto.wifToPriKey(privateKeyWIF)
    var message = Puffball.Crypto.puffToSiglessString(unsignedPuff)

    try {
        return Bitcoin.base58.encode(prikey.sign(message))
    } catch(err) {
        return Puffball.onError('Could not properly encode signature', [prikey, message])
    }
}

Puffball.Crypto.verifyPuffSig = function(puff, defaultKey) {
    var puffString = Puffball.Crypto.puffToSiglessString(puff);
    return Puffball.Crypto.verifyMessage(puffString, puff.sig, defaultKey);
}

Puffball.Crypto.verifyMessage = function(message, sig, publicKeyWIF) {
    //// accept a base 58 sig, a message (can be an object) and a base 58 public key. returns true if they match, false otherwise
  
    try {
        var pubkey = Puffball.Crypto.wifToPubKey(publicKeyWIF)
        var sigBytes = Bitcoin.base58.decode(sig).toJSON()
        sigBytes = sigBytes.data || sigBytes
        return pubkey.verify(message, sigBytes)
    } catch(err) {
        return Puffball.onError('Invalid key or sig: could not verify message', [message, sig, publicKeyWIF])
    }
}

Puffball.Crypto.wifToPriKey = function(privateKeyWIF) {
    try {
        return new Bitcoin.ECKey(privateKeyWIF, true)
    } catch(err) {
        return Puffball.onError('Invalid private key: are you sure it is properly WIFfed?', privateKeyWIF)
    }
}

Puffball.Crypto.wifToPubKey = function(publicKeyWIF) {
    try {
        var pubkeyBytes = Bitcoin.base58check.decode(publicKeyWIF).payload.toJSON()
        pubkeyBytes = pubkeyBytes.data || pubkeyBytes
        return new Bitcoin.ECPubKey(pubkeyBytes, true)
    } catch(err) {
        return Puffball.onError('Invalid public key: are you sure it is properly WIFfed?', publicKeyWIF)
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

  Puffball.Blockchain

  Each block is JSON Object.
  Fixed size: 10k bytes
  Fixed attributes:
    blockSig: (Size: 100 bytes)
    blockPayload:
      prevSig: (Size: 100 bytes)
      puff:
      padding:

  The blocks are stored in Puffball.Blockchain.BLOCKS.
  BLOCKS is an object with properties that correspond
  to usernames and points to this users blockchain.
      Each users blockchain is an array, where the
  actual blocks relevant for this user are stored.
  
  Example:
    Puffball.Blockchain.BLOCKS['username'] 
    retrieves the blockchain of 'username' as an array

*/

Puffball.Blockchain = {};

Puffball.Blockchain.BLOCKSIZE = 10000;
Puffball.Blockchain.SIGSIZE = 100;

Puffball.Blockchain.createBlock = function(username, puff, privateKeyWIF) {
    //// Creates a new block, by adding the payload (puff and the signature of the previous block), adding necessary padding and signing it 

    // is everything ok?
    if(!username) return Puffball.onError('Could not create the block due to invalid username');
    
    var userBlockchain = Puffball.Blockchain.BLOCKS[username];

    if(!userBlockchain) {
        Puffball.Blockchain.createGenesisBlock(username);
        userBlockchain = Puffball.Blockchain.BLOCKS[username];
    }
    
    if(!userBlockchain) return Puffball.onError('Failed to create new block due to blockchain wonkiness');
    
    var prevSig = userBlockchain[userBlockchain.length - 1].blockSig

    // get a blank new block we can fill
    var newBlock = Puffball.Blockchain.getNewBlankBlock();

    var paddingSize = Puffball.Blockchain.BLOCKSIZE 
                    - 2*Puffball.Blockchain.SIGSIZE 
                    - JSON.stringify(newBlock).length 
                    - JSON.stringify(puff).length 
                    + 2;

    // Why +2? Because we need to take the quotation marks of the
    // attributes into account. Turns out we need to add 2 in the end.

    // add the content
    newBlock.blockPayload.prevSig = Puffball.Blockchain.paddSig(prevSig);
    newBlock.blockPayload.puff = puff
    newBlock.blockPayload.padding = Puffball.Blockchain.generatePadding(paddingSize);

    // sign the content
    newBlock.blockSig = Puffball.Blockchain.paddSig(Puffball.Crypto.signBlock(newBlock.blockPayload, privateKeyWIF));

    Puffball.Blockchain.BLOCKS[username].push(newBlock);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);

    return newBlock.blockSig;
}

Puffball.Blockchain.readBlock = function(username, sig) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    return userBlockchain[userBlockchain.indexOf(sig)]
}

Puffball.Blockchain.updateBlock = function(username, sig, puff, privateKeyWIF) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    var newBlock = createBlock(userBlockchain[sig].blockPayload.prevSig, puff, privateKeyWIF);
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    userBlockchain.push(newBlock);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);
    return newBlock.blockSig;
}

Puffball.Blockchain.deleteBlock = function(username, sig) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);
}

Puffball.Blockchain.getNewBlankBlock = function(){
    //// template of a blank block

    return {
        blockSig: "",
        blockPayload: {
            prevSig: "",
            puff: "",
            padding: ""
        }
    }

}

// TODO: Make random
Puffball.Blockchain.generatePadding = function(size) {
    //// Generates padding content to ensure block size, for now just zeros

    var out = "0";
    while(out.length < size) {
        out = out + "0";
    }
    return out;
}

Puffball.Blockchain.paddSig = function(sig) {
    //// Padds a signature to a length of 100 characters

    while(sig.length < Puffball.Blockchain.SIGSIZE) {
        sig = sig + "*"
    }
    return sig
}

Puffball.Blockchain.createGenesisBlock = function(username) {
    Puffball.Blockchain.BLOCKS[username] = [];

    var newBlock = Puffball.Blockchain.getNewBlankBlock();
    newBlock.blockSig = Puffball.Blockchain.paddSig(username + "_1");

    Puffball.Blockchain.BLOCKS[username].push(newBlock);
    return newBlock.blockSig;
}

Puffball.Blockchain.exportChain = function(username){
    // Returns the username's blockchain as serialized JSON
    return Puffball.Blockchain.BLOCKS[username];
}



/*
    Persistence layer

    It's like a network on your hard drive... which probably implies this should live in PuffNet.
*/

Puffball.Persist = {};

Puffball.Persist.save = function(key, value) {
    // prepend PUFF:: so we're good neighbors
    var realkey = 'PUFF::' + key;
    var str = JSON.stringify(value);
    localStorage.setItem(realkey, str);
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