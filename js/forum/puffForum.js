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
PuffForum.newContentCallbacks = []

PuffForum.init = function() {
  // set up everything. 
  // THINK: maybe you can only call this once?
  // THINK: maybe take a zone arg and just default to CONFIG
  
  Puff.onNewPuffs(PuffForum.receiveNewContent)
  
  Puff.init(CONFIG.zone)
  // establishes the P2P network, pulls in all interesting puffs, caches user information, etc
}

PuffForum.getPuffById = function(id) {
  // get a particular puff
  
  // check the graph...
  
  return {
    "author":"greyhawk",
    "id":"3kk3k3k3",
    "content":"Exactly. Which is a good thing.",
    "contentType":"bcc30999b194564f",
    "tags":"",
    "parents":"[8bce02938015e9f845]",
    "zones":"[bitcointalk]"
  }
}

PuffForum.getChildren = function(puff) {
  // get children from a puff
  
  // THINK: do we really need this? the puff will have links to its children...
  
  return [{
     "author":"freewil",
     "id":"143f94ec6f96da570ed0",
     "content":"This is a great step forward for Bitcoin, but yes I agree the barrier to membership for Bitcoin businesses seems to be a bit high.",
     "contentType":"text",
     "tags":"",
     "parents":"[8f69722abb89ec45]",
     "zones":"[bitcointalk]"
  },
  {
     "author":"adamas",
     "id":"299535726f5b6fcfd2",
     "content":"",
     "contentType":"moderation",
     "tags":"[+1]",
     "parents":"[9ffdfa031c5b1e2f6c]",
     "zones":""
  },
  {
     "author":"Technomage",
     "id":"2a31a8adb852b8d058",
     "content":"This is not your standard industry. Bitcoin economy has perhaps half a dozen companies currently that can possibly afford the higher industry membership fees. Half a dozen, give or take. Mostly it's filled with startup companies that likely can't afford even the Silver membership.\r\n\r\nI don't really see a problem other than the fact that they have priced it in a way that they will actually get less money than they would if they would price it in another way. I'm fairly certain of this. The individual pricing is very good though, I have no issue with that.",
     "contentType":"text",
     "tags":"",
     "parents":"[a0a61c5c97dbf78578]",
     "zones":"[bitcointalk]"
  }]
}

PuffForum.getRootPuffs = function(limit) {
  // returns the most recent parentless puffs, sorted by time

  // limit defaults to 0, which returns all root puffs
  
  // we should probably index these rather than doing a full graph traversal
} 


PuffForum.addPost = function(content, parents) {
  // Given a string of content, create a puff and push it into the system

  // if there's no user, add an anonymous one
 
  // scrub parents -- if they're puffs extract ids, then ensure parents is an array
 
  // var sig = Puff.addPuff(user, privkey, 'text', content, {time: Date.now(), parents: parents})
 
  // return sig;
}

PuffForum.onNewPuffs = function(callback) {
  // callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
  PuffForum.newContentCallbacks.push(callback)
}

PuffForum.receiveNewContent = function(puffs) {
  // called by core Puff library any time puffs are added to the system
  
  PuffForum.addToGraph(puffs)
  PuffForum.newContentCallbacks.forEach(function(callback) {callback(puffs)})
}

PuffForum.addToGraph = function(puffs) {
  // add a set of puffs to our internal graph
  
  puffs.forEach(function(puff) {
    // if puff.username isn't in the graph, add it
    // add parent references to puff
    // add child references to puff
    // add puff to graph
    // add parent & child & user edges to graph
  })
}

