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

Puff.all_puffs = []
Puff.newContentCallbacks = []


Puff.init = function(zone) {
  // initialize the network layer 
  // slurp in all available data
  // do other amazing things
  
  
  // next steps:
  // - fix puff fields
  // - import sample data through backdoor instead of Puff.addPuff
  // - get Puff.addPuff actually working w/ random sig
  // - try adding new puffs once loaded
  // - get puffs out of puffforum's storage
  // - get display working
  // - persist puffs
  // - use real keys 
  // - network access for initial load
  // - network access for updates
  
  
  
  data_JSON_sample.forEach(function(post) {
    // This is super hacky, but it gets us some cheap data. Next phase requires real users and private keys.
    post.time = Date.now()
    Puff.addPuff(post.author, post.id, 'text', post.content, post)
  })

}


// Puff.addPuff(user, privkey, 'text', content, {time: Date.now(), parents: parents})
Puff.addPuff = function(username, privatekey, contentType, content, metadata) {
  // M-A-G-I-C !!!
  
  // yuck yuck yuck this is ridiculous
  
  var puff = { username: username
             , type: contentType
             , content: content }
             
  puff.parents = metadata.parents
  puff.zones = metadata.zones
  puff.time = metadata.time
  puff.tags = metadata.tags
  puff.sig = privatekey // oh the humanity
  
  // TODO: sign it and set sig for real
  
  Puff.receiveNewContent([puff])
  
  return puff.sig
}


Puff.onNewPuffs = function(callback) {
  // callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
  Puff.newContentCallbacks.push(callback)
}

Puff.receiveNewContent = function(puffs) {
  // called by core Puff library any time puffs are added to the system
  
  puffs.forEach(function(puff) {Puff.all_puffs.push(puff)})
  
  Puff.newContentCallbacks.forEach(function(callback) {callback(puffs)})
}

// getAllPuffs() # Gets every existing puff sends off as POJO
