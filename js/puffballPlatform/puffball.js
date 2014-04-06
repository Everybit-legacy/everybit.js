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

Puff.puffs = []
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
  // - fancy parents/children in puffforum
  // - get puffs out of puffforum's storage
  // - get display working
  // - persist puffs
  // - use real keys 
  // - network access for initial load
  // - network access for updates
  
  // HACK: this is just for bootstrapping
  data_JSON_sample.forEach(function(post) {
    // This is super hacky, but it gets us some cheap data. Next phase requires real users and private keys.
    post.time = Date.now()
    
    // hack hack hack
    post.parents = [ Puff.puffs[~~(Math.random()*Puff.puffs.length)]
                   , Puff.puffs[~~(Math.random()*Puff.puffs.length)]
                   , Puff.puffs[~~(Math.random()*Puff.puffs.length)]
                   ].filter(function(x) { return x !== undefined })
                    .map(function(x) { return x.sig })
                    .filter(function(value, index, self) { return self.indexOf(value) === index })
                   
    Puff.createPuff(post.author, post.id, 'text', post.content, post)
  })
  
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
  
  puffs.forEach(function(puff) { Puff.puffs.push(puff) })                   // cache all the puffs
  
  Puff.newPuffCallbacks.forEach(function(callback) { callback(puffs) })     // call all callbacks back
}

// THINK: do we still need this?
// getAllPuffs() # Gets every existing puff sends off as POJO
