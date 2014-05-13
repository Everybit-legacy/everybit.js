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
  
  
    // next steps:
    // -- fix puff fields
    // -- get Puffball.addPuff actually working w/ random sig
    // -- working parents/children in puffforum
    // ~- linked parents/children in puffforum
    // -- persist puffs
    // - fancy forum's db
    // -- get display working
    // -- use real keys 
    // - network access for initial load
    // -- network access for updates
  
    Puffball.Data.getLocalPuffs(Puffball.receiveNewPuffs)
    Puffball.Data.getNewPuffs() // THINK: this should take a zone
    
    Puffball.Blockchain.BLOCKS = Puffball.Persist.get('blocks') 
    if(!Puffball.Blockchain.BLOCKS)
        Puffball.Blockchain.BLOCKS = {}
        
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development

    PuffNet.init()
}


Puffball.createPuff = function(username, privatekey, zones, type, content, payload, previous) {
    //// Returns a new puff object. Does not hit the network, and hence does no real verification whatsoever.

    payload = payload || {}                             // TODO: check all of these values more carefully
    payload.content = content
    payload.type = type

    zones = zones || []
    previous = previous || false                        // false for DHT requests and beginning of blockchain, else valid sig

    var puff = { payload: payload
               , zones: zones
               , previous: previous
               , username: username
               , version: '0.0.2'                       // version accounts for crypto type and puff shape
               };                                       // early versions will be aggressively deprecated and unsupported

    puff.sig = Puffball.Crypto.signData(puff, privatekey)

    return puff
}

Puffball.buildKeyObject = function(privateDefaultKey, privateAdminKey, privateRootKey) {
    var publicDefaultKey = Puffball.Crypto.privateToPublic(privateDefaultKey);
    var publicAdminKey   = Puffball.Crypto.privateToPublic(privateAdminKey);
    var publicRootKey    = Puffball.Crypto.privateToPublic(privateRootKey);
    
    var keys = { default: { 'private': privateDefaultKey
                          ,  'public': publicDefaultKey }
               ,   admin: { 'private': privateAdminKey
                          ,  'public': publicAdminKey }
               ,    root: { 'private': privateRootKey
                          ,  'public': publicRootKey }
               };
    
   return keys;
}


Puffball.checkUserKey = function(username, privatekey) {
    return true; // oh dear. This is checked elsewhere, but should be here too!
}

 
Puffball.addPuffToSystem = function(puff, privatekey) {
    //// add a puff to our local cache and fire the callback for new content
  
    Puffball.receiveNewPuffs([puff]);

    PuffNet.distributePuff(puff);
    
    // Puffball.Blockchain.createBlock(puff.username, puff, privatekey);
}


Puffball.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    puffs = Array.isArray(puffs) ? puffs : [puffs];                            // make puffs an array
  
    puffs.forEach(function(puff) { Puffball.Data.eat(puff) });                     // cache all the puffs
  
    Puffball.newPuffCallbacks.forEach(function(callback) { callback(puffs) });     // call all callbacks back
}


Puffball.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    Puffball.newPuffCallbacks.push(callback);
}




// DATA LAYER

Puffball.Data = {};
Puffball.Data.puffs = [];
Puffball.Data.users = [];                               // these are DHT user entries, not our local identity wardrobe

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
    var pprom = PuffNet.getAllPuffs();                  // OPT: only ask for puffs we're missing
    return pprom.then(Puffball.receiveNewPuffs)
                .catch(Puffball.promiseError('Could not load the puffs'))
}

Puffball.Data.addUser = function(user) {
    Puffball.Data.users.push(user);
    // TODO: index by username
    // TODO: persist to LS (maybe only sometimes? onunload? probabilistic?)
}

Puffball.Data.verifyPuff = function(puff, callback) {
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    
    var pprom = PuffNet.getUser(puff.username);
    
    pprom.then(function(user) {
        return Puffball.Crypto.verifyPuffSig(puff, user.defaultKey)
    });
    
    return pprom;
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
        return Puffball.onError('Invalid private key: could not convert to public key')
    }
}

Puffball.Crypto.signData = function(unsignedPuff, privateKeyWIF) {
    //// sign the hash of some data with a private key and return the sig in base 58

    var prikey = Puffball.Crypto.wifToPriKey(privateKeyWIF)
    var message = Puffball.Crypto.puffToSiglessString(unsignedPuff)

    try {
        return Bitcoin.base58.encode(prikey.sign(message))
    } catch(err) {
        return Puffball.onError('Could not properly encode signature')
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
        return Puffball.onError('Invalid key or sig: could not verify message')
    }
}

Puffball.Crypto.wifToPriKey = function(privateKeyWIF) {
    try {
        return new Bitcoin.ECKey(privateKeyWIF, true)
    } catch(err) {
        return Puffball.onError('Invalid private key: are you sure it is properly WIFfed?')
    }
}

Puffball.Crypto.wifToPubKey = function(publicKeyWIF) {
    try {
        var pubkeyBytes = Bitcoin.base58check.decode(publicKeyWIF).payload.toJSON()
        pubkeyBytes = pubkeyBytes.data || pubkeyBytes
        return new Bitcoin.ECPubKey(pubkeyBytes, true)
    } catch(err) {
        return Puffball.onError('Invalid public key: are you sure it is properly WIFfed?')
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
    var str = JSON.stringify(value);                    // wrap this in a try/catch
    localStorage.setItem(realkey, str);
}

Puffball.Persist.get = function(key) {
    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return JSON.parse(str);                             // wrap this in a try/catch
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