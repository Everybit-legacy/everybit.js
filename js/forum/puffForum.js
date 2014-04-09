/* 
                   _____  _____  _____                           
    ______  __ ___/ ____\/ ____\/ ____\___________ __ __  _____  
    \____ \|  |  \   __\\   __\\   __\/  _ \_  __ \  |  \/     \ 
    |  |_> >  |  /|  |   |  |   |  | (  <_> )  | \/  |  /  Y Y  \
    |   __/|____/ |__|   |__|   |__|  \____/|__|  |____/|__|_|  /
    |__|                                                      \/ 
  
  
  A Puffball module for managing forum-style puffs. Wraps the core Puffball API in a fluffy layer of syntactic spun sugar.

  Usage example:
  PuffForum.onNewPuffs( function(puffs) { console.log(puffs) } )
  PuffForum.init()

*/

PuffForum = {}

PuffForum.graph = {}
PuffForum.newPuffCallbacks = []
PuffForum.userinfo = {}

PuffForum.init = function() {
  //// set up everything. 
  // THINK: maybe you can only call this once?
  // THINK: maybe take a zone arg, but default to config
  
  Puff.onNewPuffs(PuffForum.receiveNewPuffs)
  
  Puff.init(CONFIG.zone)
  // establishes the P2P network, pulls in all interesting puffs, caches user information, etc
}

PuffForum.getPuffById = function(id) {
  //// get a particular puff
  
  // TODO: check the graph instead of this
  
  return Puff.Data.puffs.filter(function(puff) { return id === puff.sig })[0]
}


PuffForum.getParents = function(puff) {
  //// get children from a puff
  
  // THINK: do we really need this? the puff will have links to its parents...
  
  if(typeof puff === 'string')
    puff = PuffForum.getPuffById(puff)
  
  return puff.payload.parents.map(PuffForum.getPuffById)
}

PuffForum.getChildren = function(puff) {
  //// get children from a puff
  
  // THINK: do we really need this? the puff will have links to its children...
  
  if(typeof puff === 'string')
    puff = PuffForum.getPuffById(puff)
  
  return Puff.Data.puffs.filter(function(kidpuff) { return ~kidpuff.payload.parents.indexOf(puff.sig) })
}


PuffForum.getRootPuffs = function(limit) {
  //// returns the most recent parentless puffs, sorted by time

  // limit defaults to 0, which returns all root puffs
  
  // we should probably index these rather than doing a full graph traversal
  
  // TODO: add limit
  
  return Puff.Data.puffs.filter(function(puff) { return !puff.payload.parents.length })
} 


PuffForum.addPost = function(content, parents) {
  //// Given a string of content, create a puff and push it into the system
  
  // scrub parents -- if they're puffs extract ids, then ensure parents is an array
  if(!Array.isArray(parents))
    parents = [parents]
    
  if(parents.map(PuffForum.getPuffById).filter(function(x) { return x != null }).length != parents.length)
    return "Error Error Error: those are not good parents"
 
  // if there's no user, add an anonymous one
  // THINK: where should the username/privatekey live? we'll put it here for now, but some other layer should take responsibility.
  if(!PuffForum.userinfo.username || !PuffForum.userinfo.privateKey)
    return PuffForum.addAnonUser(function(username) {PuffForum.addPost(content, parents)})

  var sig = Puff.createPuff(PuffForum.userinfo.username, PuffForum.userinfo.privateKey, 'text', content, {time: Date.now(), parents: parents})
 
  // THINK: actually we can't return this because we might go async
  // return sig;
}


PuffForum.addAnonUser = function(callback) {
  //// statefully state a new user and register it and store it and oh dear
  
  // gen privkey
  var privateKey = Puff.generatePrivateKey()
  
  // gen pubkey
  var publicKey = ""
  
  PuffForum.userinfo.privateKey = privateKey
  PuffForum.userinfo.publicKey  = publicKey
  
  $.ajax({
    type: 'POST',
    url: 'api.php',
    data: {
      type: 'addUser',
      publicKey: PuffForum.userinfo.publicKey
    },
    success:function(result){
      PuffForum.userinfo.username = result.username
      callback(result.username)
    },
    error: function() {
      console.log('Error Error Error: the anonymous user could not be added')
    },
    dataType: 'json'
  });
}

PuffForum.onNewPuffs = function(callback) {
  //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
  PuffForum.newPuffCallbacks.push(callback)
}

PuffForum.receiveNewPuffs = function(puffs) {
  //// called by core Puff library any time puffs are added to the system
  
  PuffForum.addToGraph(puffs)
  PuffForum.newPuffCallbacks.forEach(function(callback) {callback(puffs)})
}

PuffForum.addToGraph = function(puffs) {
  //// add a set of puffs to our internal graph
  
  puffs.forEach(function(puff) {
    
    // if puff.username isn't in the graph, add it
    // add parent references to puff
    // add child references to puff
    // add puff to graph
    // add parent & child & user edges to graph
  })
}

