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

Puff = {}

Puff.newPuffCallbacks = []


Puff.init = function(zone) {
  // initialize the network layer 
  // slurp in available data
  // do other amazing things
  
  
  // next steps:
  // -- fix puff fields
  // -- import sample data "correctly"
  // -- get Puff.addPuff actually working w/ random sig
  // -- try adding new puffs once loaded
  // -- working parents/children in puffforum
  // ~- linked parents/children in puffforum
  // -- persist puffs
  // - fancy forum's db
  // - get display working
  // - use real keys 
  // - server-based usernames
  // - network access for initial load
  // - network access for updates
  
  Puff.receiveNewPuffs(Puff.Data.getPuffs())
  
  Puff.Data.make_fake_puffs()
}


Puff.createPuff = function(username, privatekey, type, content, meta) {
  //// M-A-G-I-C !!!
  
  // THINK: by the time we arrive here u/pk should already be in our cache, so this never requires a network hit... right?
  if(!Puff.checkUserKey(username, privatekey)) 
    return false
  
  var payload = { username: username                    // these first four are universal
                ,  content: content                
                ,    zones: meta.zones
                ,     type: type
                ,     time: meta.time                   // these are for forum puffs
                ,     tags: meta.tags                   // so they don't belong here
                ,  parents: meta.parents                // they should go elsewhere
                }

  var puff = {payload: payload, sig: Puff.signPayload(payload, privatekey)}
  
  Puff.addPuff(puff) // THINK: move this somewhere else...
  
  return puff
}

Puff.generatePrivateKey = function() {
  //// from http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
  
  var randArr = new Uint8Array(32) //create a typed array of 32 bytes (256 bits)
  window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers
  
  var privateKeyBytes = []  //some Bitcoin and Crypto methods don't like Uint8Array for input. They expect regular JS arrays.
  for (var i = 0; i < randArr.length; ++i)
    privateKeyBytes[i] = randArr[i]
  
  return privateKeyBytes
  // var privateKeyWIF = new Bitcoin.Address(privateKeyBytes) 
  // privateKeyWIF.version = 0x80 //0x80 = 128, https://en.bitcoin.it/wiki/List_of_address_prefixes
  // return privateKeyWIF.toString()  
}

Puff.privateToPublic = function(privateKeyBytes) {
  //// from http://procbits.com/2013/08/27/generating-a-bitcoin-address-with-javascript
  
  //privateKeyBytes is the private key array from the top
  var eckey = new Bitcoin.ECKey(privateKeyBytes) 
  eckey.compressed = true
  var publicKeyHex = Crypto.util.bytesToHex(eckey.getPub())
  return publicKeyHex
}

Puff.signPayload = function(payload, privatekey) {
  //// sign the hash of a payload with a private key and return the sig

  // TODO: this is a very silly hash function. replace it with something more reasonable.
  var sillyHash = function(s) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
  }

  // TODO: sign the hash instead of just returning it
  return "" + sillyHash(JSON.stringify(payload))
  
  /*
  
  - generate privkey, store in local as 256bit int in hex (or as a base58 WIF)
  - generate compressed pubkey, store in local as 33 bytes of hex (or base58)
  - send pubkey to server, get username
  - 
  
      x = new Bitcoin.ECKey('bananas')
        Bitcoin.ECKey.r {priv: BigInteger, compressed: false, setCompressed: function, getPub: function, getPubPoint: function…}
      sig = sign_message(x, 'foo123 ok hi')
        "HClTjwQouFwuzK5YGqxj/WfYF8jjlEeGa2woU9Kpvf4TuG58B9So4PYiT+ReBduTeHPtc8YzeLIoK2idAi3DPxQ="
      verify_message(sig, 'foo123 ok hi')
        "1LDShdXPqw85q5FmkuXdBmZm3bMfw423uw"
      x.getBitcoinAddress().toString()
        "1LDShdXPqw85q5FmkuXdBmZm3bMfw423uw"
  
var curve = getSECCurveByName("secp256k1") //found in bitcoinjs-lib/src/jsbn/sec.js

//convert our random array or private key to a Big Integer
var privateKeyBN = BigInteger.fromByteArrayUnsigned(input) 

var curvePt = curve.getG().multiply(privateKeyBN)
var x = curvePt.getX().toBigInteger()
var y = curvePt.getY().toBigInteger()
var publicKeyBytes = integerToBytes(x,32) //integerToBytes is found in bitcoinjs-lib/src/ecdsa.js
publicKeyBytes = publicKeyBytes.concat(integerToBytes(y,32))
publicKeyBytes.unshift(0x04)
var publicKeyHex = Crypto.util.bytesToHex(publicKeyBytes)

console.log(publicKeyHex)
  
  
  
  
var randArr = new Uint8Array(32) //create a typed array of 32 bytes (256 bits)
window.crypto.getRandomValues(randArr) //populate array with cryptographically secure random numbers

[129, 9, 142, 182, 195, 40, 51, 173, 166, 150, 242, 111, 180, 170, 80, 63, 191, 176, 216, 68, 236, 149, 166, 100, 175, 180, 5, 93, 176, 247, 106, 47]
var privateKeyBytes = []
for (var i = 0; i < randArr.length; ++i)
  privateKeyBytes[i] = randArr[i]
47
privateKeyBytes
[129, 9, 142, 182, 195, 40, 51, 173, 166, 150, 242, 111, 180, 170, 80, 63, 191, 176, 216, 68, 236, 149, 166, 100, 175, 180, 5, 93, 176, 247, 106, 47]
var privateKeyHex = Crypto.util.bytesToHex(privateKeyBytes).toUpperCase()
console.log(privateKeyHex) //1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD
81098EB6C32833ADA696F26FB4AA503FBFB0D844EC95A664AFB4055DB0F76A2F VM5968:3
undefined
var privateKeyHex = Crypto.util.bytesToHex(privateKeyBytes).toUpperCase()
undefined
privateKeyHex
"81098EB6C32833ADA696F26FB4AA503FBFB0D844EC95A664AFB4055DB0F76A2F"
privateKeyHex = Crypto.util.bytesToHex(privateKeyBytes).toUpperCase()
"81098EB6C32833ADA696F26FB4AA503FBFB0D844EC95A664AFB4055DB0F76A2F"
var privateKeyWIF = new Bitcoin.Address(privateKeyBytes) 
undefined
privateKeyWIF = new Bitcoin.Address(privateKeyBytes) 
Bitcoin.Address {hash: Array[32], version: 0, toString: function, getHashBase64: function}
privateKeyWIF.version = 0x80
128
privateKeyWIF = privateKeyWIF.toString()
"5Jo7fe6hD4HfVJRgHuRRy7prRUpP1x2LmM4wXVMf3FLVXJKme4F"
  
  
var curve = getSECCurveByName("secp256k1") //found in bitcoinjs-lib/src/jsbn/sec.js

//convert our random array or private key to a Big Integer
var privateKeyBN = BigInteger.fromByteArrayUnsigned(privateKeyWIF) 

var curvePt = curve.getG().multiply(privateKeyBN)
var x = curvePt.getX().toBigInteger()
var y = curvePt.getY().toBigInteger()
var publicKeyBytes = integerToBytes(x,32) //integerToBytes is found in bitcoinjs-lib/src/ecdsa.js
publicKeyBytes = publicKeyBytes.concat(integerToBytes(y,32))
publicKeyBytes.unshift(0x04)
var publicKeyHex = Crypto.util.bytesToHex(publicKeyBytes)

console.log(publicKeyHex)
04b9961810aa99c96413840ac443e8929c95ac462e713e0d2abfe3f20a3351cc39ca75c7818341e679b610876feb320b7a294ddd0bd399aeb0e7e339e80c502833 
  */
}


Puff.checkUserKey = function(username, privatekey) {
  return true // oh dear
}

 
Puff.addPuff = function(puff) {
  //// add a puff to our local cache and fire the callback for new content
  
  Puff.receiveNewPuffs([puff])

  Puff.sendPuff(puff)
}


Puff.sendPuff = function(puff) {
  //// broadcast a puff to the network    
}


Puff.onNewPuffs = function(callback) {
  //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
  Puff.newPuffCallbacks.push(callback)
}


Puff.receiveNewPuffs = function(puffs) {
  //// called by core Puff library any time puffs are added to the system
  
  puffs = Array.isArray(puffs) ? puffs : [puffs]                            // make puffs an array
  
  puffs.forEach(function(puff) { Puff.Data.eat(puff) })                     // cache all the puffs
  
  Puff.newPuffCallbacks.forEach(function(callback) { callback(puffs) })     // call all callbacks back
}


// DATA LAYER

Puff.Data = {}
Puff.Data.puffs = []

Puff.Data.eat = function(puff) {
  Puff.Data.puffs.push(puff)  // THINK: make this a map to avoid dupes?
  Puff.Data.persist(Puff.Data.puffs)
}

Puff.Data.persist = function(puffs) {
  localStorage.setItem('puffs', JSON.stringify(puffs))
}

Puff.Data.getPuffs = function() {
  return JSON.parse(localStorage.getItem('puffs') || '[]')
}



Puff.Data.make_fake_puffs = function() {
  // HACK: this is just for bootstrapping
  data_JSON_sample.forEach(function(post) {
    // This is super hacky, but it gets us some cheap data. Next phase requires real users and private keys.
    post.time = Date.now()
    
    // hack hack hack
    var len = Puff.Data.puffs.length
    post.parents = [ Puff.Data.puffs[ ~~(Math.random()*len) ]
                   , Puff.Data.puffs[ ~~(Math.random()*len) ]
                   , Puff.Data.puffs[ ~~(Math.random()*len) ]
                   ].filter(function(x) { return x != null })
                    .map   (function(x) { return x.sig })
                    .filter(function(value, index, list) { return list.indexOf(value) === index })
                   
    Puff.createPuff(post.author, post.id, 'text', post.content, post)
  })
}