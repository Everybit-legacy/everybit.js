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

Puff = {};

Puff.newPuffCallbacks = [];


Puff.init = function(zone) {
    // initialize the network layer 
    // slurp in available data
    // do other amazing things
  
  
    // next steps:
    // -- fix puff fields
    // -- get Puff.addPuff actually working w/ random sig
    // -- working parents/children in puffforum
    // ~- linked parents/children in puffforum
    // -- persist puffs
    // - fancy forum's db
    // - get display working
    // - use real keys 
    // - network access for initial load
    // - network access for updates
  
    Puff.Data.getLocalPuffs(Puff.receiveNewPuffs)

    Puff.Network.getAllPuffs(Puff.receiveNewPuffs); // OPT: only ask for puffs we're missing

    Puff.Blockchain.BLOCKS = Puff.Persist.get('blocks') 
    if(!Puff.Blockchain.BLOCKS)
        Puff.Blockchain.BLOCKS = {}
        
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
    
    Puff.actualP2P = new Puff.P2P()
    // Puff.Data.make_fake_puffs()
}


Puff.createPuff = function(username, privatekey, zones, type, content, payload) {
    //// M-A-G-I-C !!!
  
    if(!Puff.checkUserKey(username, privatekey))        // THINK: by the time we arrive here u/pk should already be cached,
        return false                                    //        so this never requires a network hit... right? 

    payload = payload || {}                             // TODO: check all of these values more carefully
    payload.content = content
    payload.type = type
    
    zones = zones || []
    
    var previous = 123123123                            // TODO: check the DHT for this user's previous puff's sig

    var puff = { payload: payload
               , zones: zones
               , previous: previous
               , username: username
               , version: '0.0.2'                       // version accounts for crypto type and puff shape
               };                                       // early versions will be aggressively deprecated and unsupported

    puff.sig = Puff.Crypto.signPayload(puff, privatekey)

    Puff.addPuff(puff, privatekey)                      // THINK: move this somewhere else...

    return puff
}


Puff.checkUserKey = function(username, privatekey) {
    return true; // oh dear. This is checked elsewhere, but should be here too!
}

 
Puff.addPuff = function(puff, privatekey) {
    //// add a puff to our local cache and fire the callback for new content
  
    Puff.receiveNewPuffs([puff]);

    Puff.Network.distributePuff(puff);
    
    Puff.Blockchain.createBlock(puff.username, puff, privatekey);
}


Puff.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    puffs = Array.isArray(puffs) ? puffs : [puffs];                            // make puffs an array
  
    puffs.forEach(function(puff) { Puff.Data.eat(puff) });                     // cache all the puffs
  
    Puff.newPuffCallbacks.forEach(function(callback) { callback(puffs) });     // call all callbacks back
}


Puff.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    Puff.newPuffCallbacks.push(callback);
}



// DATA LAYER

Puff.Data = {};
Puff.Data.puffs = [];
Puff.Data.users = [];                                   // these are DHT user entries, not our local identity wardrobe

Puff.Data.eat = function(puff) {
    if(!!~Puff.Data.puffs
                   .map(function(p) {return p.sig})     // OPT: check the sig index instead
                   .indexOf(puff.sig)) 
                      return false 
    Puff.Data.puffs.push(puff);  
    Puff.Data.persist(Puff.Data.puffs);
}

Puff.Data.persist = function(puffs) {
    if(CONFIG.noLocalStorage) return false              // THINK: this is only for debugging and development
    Puff.Persist.save('puffs', puffs)                   // OPT: throttle this when we're chowing down on lots of puffs
}

Puff.Data.getLocalPuffs = function(callback) {
    // we're doing this asynchronously in order to not interrupt the loading process
    // should probably wrap this a bit better (use a promise, or setImmediate)
    return setTimeout(function() {callback(Puff.Persist.get('puffs') || [])}, 0)
}

Puff.Data.addUser = function(user) {
    Puff.Data.users.push(user);
    // TODO: index by username
    // TODO: persist to LS (maybe only sometimes? onunload? probabilistic?)
}


// NETWORK LAYER

Puff.Network = {};

Puff.Network.getAllPuffs = function(callback) {
    //// get all the puffs from this zone
    
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
    

    // TODO: add zone parameter (default to CONFIG.zone)
    // THINK: use promises instead of callbacks? 
    $.getJSON(CONFIG.puffApi + "?type=getAllPuffs", callback);  
}

Puff.Network.distributePuff = function(puff) {
    //// distribute a puff to the network
  
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
  
    // add it to the server's pufflist
    // THINK: this is fire-and-forget, but we should do something smart if the network is offline or it otherwise fails 
    $.ajax({
        type: "POST",
        url: CONFIG.puffApi,
        data: {
            type: "addPuff",
            puff: JSON.stringify(puff)
        },
        success:function(result){
            Puff.onError(JSON.stringify(result));      // TODO: make this smarter
        },
        error: function() {
            Puff.onError('Could not distribute puff', puff);
        }
    });
  
    // broadcast it to peers
    // TODO: send it out via WS and RTC
  
    Puff.actualP2P.swarm.send(puff);
}

Puff.Network.getUser = function(username, callback) {
    // FIXME: call Puff.Network.getUserFile, add the returned users to Puff.Data.users, pull username's user's info back out, cache it in LS, then do the thing you originally intended via the callback (but switch it to a promise asap because that concurrency model fits this use case better)

    var my_callback = function(user) {
        Puff.Data.addUser(user);
        callback(user);
    }

    var errback = function() {   // TODO: make use of this
        Puff.onError('Unable to access user information from the DHT');
    }

    $.getJSON(CONFIG.userApi, {type: 'getUser', username: username}, my_callback);
}

Puff.Network.getUserFile = function(username, callback) {
    var my_callback = function(users) {
        Puff.Data.users = Puff.Data.users.concat(users);
        callback(username);
    }
  
    $.getJSON(CONFIG.userApi, {type: 'getUserFile', username: username}, my_callback);
}

Puff.Network.addAnonUser = function(publicKey, callback) {
    $.ajax({
        type: 'POST',
        url: CONFIG.userApi,
        data: {
            type: 'addUser',
            publicKey: publicKey
        },
        success:function(result) {
            if(result.username) {
                if(typeof callback == 'function')
                callback(result.username)
                Puff.Blockchain.createGenesisBlock(result.username)
            } else {
                Puff.onError('Error Error Error: issue with adding anonymous user', result)
            }
        },
        error: function(err) {
            Puff.onError('Error Error Error: the anonymous user could not be added', err)
        },
        dataType: 'json'
    });
}





/*
  Puff.Crypto

  Using bitcoin.js is pretty nightmarish for our purposes. 
  It pollutes everything with extraneous strings, always forces down to addresses, 
  and has a terrible API for compressed keys. Actually, the API is terrible in general.
  It's also not currently maintained and is dog slow.

  HOWEVER. 

  Until we get some real crypto experts on board or a new js lib comes out that has good community support, 
  leave this code alone.
*/

Puff.Crypto = {};

Puff.Crypto.generatePrivateKey = function() {
    //// generates a new private key and returns the base58 WIF string version
    //// from http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
    
    var randArr = new Uint8Array(32); //create a typed array of 32 bytes (256 bits)
    window.crypto.getRandomValues(randArr); //populate array with cryptographically secure random numbers
  
    var privateKeyBytes = [];  //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
    for (var i = 0; i < randArr.length; ++i)
        privateKeyBytes[i] = randArr[i];

    // return privateKeyBytes

    // NOTE: the 'Address' below isn't a bitcoin address -- it's still the private key, but in Wallet Import Format
    privateKeyBytes.push(0x01); // for compressed format
    var privateKeyWIF = new Bitcoin.Address(privateKeyBytes);
    privateKeyWIF.version = 0x80; //0x80 = 128, https://en.bitcoin.it/wiki/List_of_address_prefixes
    return privateKeyWIF.toString(); // base58 string version of privatekey
}

Puff.Crypto.privateToPublic = function(privateKeyWIF) {
    //// from http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
  
    try {
        // privateKeyWIF is returned by Puff.Crypto.generatePrivateKey
        var eckey = new Bitcoin.ECKey(privateKeyWIF);
        eckey.compressed = true;
        var publicKeyBase58 = Bitcoin.Base58.encode(eckey.getPub()); 
        return publicKeyBase58;
    } catch(err) {
        return Puff.onError('Invalid private key: could not convert to public key')
    }
}

Puff.Crypto.verifyPuff = function(puff, publicKeyBase58) {
    return Puff.Crypto.verifyMessage(puff.sig, puff.payload, publicKeyBase58);
}

Puff.Crypto.verifyBlock = function(block, publicKeyBase58) {
    return Puff.Crypto.verifyMessage(block.blockSig.replace(/\*/g, ""), block.blockPayload, publicKeyBase58);
}

Puff.Crypto.verifyMessage = function(sig, message, publicKeyBase58) {
    //// accept a base 58 sig, a message (can be an object) and a base 58 public key. returns true if they match, false otherwise
  
    var address = new Bitcoin.Address(Bitcoin.Util.sha256ripe160(Bitcoin.Base58.decode(publicKeyBase58))).toString();
    var sigBase64 = Crypto.util.bytesToBase64(Bitcoin.Base58.decode(sig));
    return verify_message(sigBase64, message) === address  // TODO: this is complete lunacy
}

Puff.Crypto.signBlock = function(blockPayload, privateKeyWIF) {
    return Puff.Crypto.signPayload(blockPayload, privateKeyWIF);
}

Puff.Crypto.signPayload = function(payload, privateKeyWIF) {
    //// sign the hash of a payload with a private key and return the sig in base 58

    var eckey = new Bitcoin.ECKey(privateKeyWIF);
    eckey.compressed = true;
    var sig = sign_message(eckey, payload, true); // 'true' is for compressed keys
    var sigBase58 = Bitcoin.Base58.encode(Crypto.util.base64ToBytes(sig));
    return sigBase58; // base64 sigs don't work as DOM ids
}


/*

  Puff.Blockchain

  Each block is JSON Object.
  Fixed size: 10k bytes
  Fixed attributes:
    blockSig: (Size: 100 bytes)
    blockPayload:
      prevSig: (Size: 100 bytes)
      puff:
      padding:

  The blocks are stored in Puff.Blockchain.BLOCKS.
  BLOCKS is an object with properties that correspond
  to usernames and points to this users blockchain.
      Each users blockchain is an array, where the
  actual blocks relevant for this user are stored.
  
  Example:
    Puff.Blockchain.BLOCKS['username'] 
    retrieves the blockchain of 'username' as an array

*/

Puff.Blockchain = {};

Puff.Blockchain.BLOCKSIZE = 10000;
Puff.Blockchain.SIGSIZE = 100;

Puff.Blockchain.createBlock = function(username, puff, privateKeyWIF) {
    //// Creates a new block, by adding the payload (puff and the signature of the previous block), adding necessary padding and signing it 

    // is everything ok?
    if(!username) return Puff.onError('Could not create the block due to invalid username');
    
    var userBlockchain = Puff.Blockchain.BLOCKS[username];

    if(!userBlockchain) {
        Puff.Blockchain.createGenesisBlock(username);
        userBlockchain = Puff.Blockchain.BLOCKS[username];
    }
    
    if(!userBlockchain) return Puff.onError('Failed to create new block due to blockchain wonkiness');
    
    var prevSig = userBlockchain[userBlockchain.length - 1].blockSig

    // get a blank new block we can fill
    var newBlock = Puff.Blockchain.getNewBlankBlock();

    var paddingSize = Puff.Blockchain.BLOCKSIZE 
                    - 2*Puff.Blockchain.SIGSIZE 
                    - JSON.stringify(newBlock).length 
                    - JSON.stringify(puff).length 
                    + 2;

    // Why +2? Because we need to take the quotation marks of the
    // attributes into account. Turns out we need to add 2 in the end.

    // add the content
    newBlock.blockPayload.prevSig = Puff.Blockchain.paddSig(prevSig);
    newBlock.blockPayload.puff = puff
    newBlock.blockPayload.padding = Puff.Blockchain.generatePadding(paddingSize);

    // sign the content
    newBlock.blockSig = Puff.Blockchain.paddSig(Puff.Crypto.signBlock(newBlock.blockPayload, privateKeyWIF));

    Puff.Blockchain.BLOCKS[username].push(newBlock);
    Puff.Persist.save('blocks', Puff.Blockchain.BLOCKS);

    return newBlock.blockSig;
}

Puff.Blockchain.readBlock = function(username, sig) {
    var userBlockchain = Puff.Blockchain.BLOCKS.username;
    return userBlockchain[userBlockchain.indexOf(sig)]
}

Puff.Blockchain.updateBlock = function(username, sig, puff, privateKeyWIF) {
    var userBlockchain = Puff.Blockchain.BLOCKS.username;
    var newBlock = createBlock(userBlockchain[sig].blockPayload.prevSig, puff, privateKeyWIF);
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    userBlockchain.push(newBlock);
    Puff.Persist.save('blocks', Puff.Blockchain.BLOCKS);
    return newBlock.blockSig;
}

Puff.Blockchain.deleteBlock = function(username, sig) {
    var userBlockchain = Puff.Blockchain.BLOCKS.username;
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    Puff.Persist.save('blocks', Puff.Blockchain.BLOCKS);
}

Puff.Blockchain.getNewBlankBlock = function(){
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
Puff.Blockchain.generatePadding = function(size) {
    //// Generates padding content to ensure block size, for now just zeros

    var out = "0";
    while(out.length < size) {
        out = out + "0";
    }
    return out;
}

Puff.Blockchain.paddSig = function(sig) {
    //// Padds a signature to a length of 100 characters

    while(sig.length < Puff.Blockchain.SIGSIZE) {
        sig = sig + "*"
    }
    return sig
}

Puff.Blockchain.createGenesisBlock = function(username) {
    Puff.Blockchain.BLOCKS[username] = [];

    var newBlock = Puff.Blockchain.getNewBlankBlock();
    newBlock.blockSig = Puff.Blockchain.paddSig(username + "_1");

    Puff.Blockchain.BLOCKS[username].push(newBlock);
    return newBlock.blockSig;
}

Puff.Blockchain.exportChain = function(username){
    // Returns the username's blockchain as serialized JSON
    return Puff.Blockchain.BLOCKS[username];
}



/*
    Persistence layer

    It's like a network on your hard drive. Which probably implies this should like in Puff.Network instead of on its own.
*/

Puff.Persist = {};

Puff.Persist.save = function(key, value) {
    // prepend PUFF:: so we're good neighbors
    var realkey = 'PUFF::' + key;
    var str = JSON.stringify(value);  // wrap this in a try/catch
    localStorage.setItem(realkey, str);
}

Puff.Persist.get = function(key) {
    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return JSON.parse(str); // wrap this in a try/catch
}

Puff.Persist.remove = function(key) {
    var realkey = 'PUFF::' + key;
    localStorage.removeItem(realkey);
}


/// ERROR ERROR

Puff.onError = function(msg) {
    console.log(msg)
    return false
}