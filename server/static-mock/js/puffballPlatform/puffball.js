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


Puff.signPayload = function(payload, privatekey) {
  //// sign the hash of a payload with a private key and return the sig

  // TODO: this is a very silly hash function. replace it with something more reasonable.
  var sillyHash = function(s) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
  }

  // TODO: sign the hash instead of just returning it
  return "" + sillyHash(JSON.stringify(payload))
  
  /*
  
      x = new Bitcoin.ECKey('bananas')
        Bitcoin.ECKey.r {priv: BigInteger, compressed: false, setCompressed: function, getPub: function, getPubPoint: function…}
      sig = sign_message(x, 'foo123 ok hi')
        "HClTjwQouFwuzK5YGqxj/WfYF8jjlEeGa2woU9Kpvf4TuG58B9So4PYiT+ReBduTeHPtc8YzeLIoK2idAi3DPxQ="
      verify_message(sig, 'foo123 ok hi')
        "1LDShdXPqw85q5FmkuXdBmZm3bMfw423uw"
      x.getBitcoinAddress().toString()
        "1LDShdXPqw85q5FmkuXdBmZm3bMfw423uw"
  
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