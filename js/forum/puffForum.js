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

PuffForum = {};

PuffForum.graph = {};
PuffForum.newPuffCallbacks = [];
PuffForum.contentTypes = {}

PuffForum.init = function() {
    //// set up everything. 
    // THINK: maybe you can only call this once?
    // THINK: maybe take a zone arg, but default to config
  
    Puff.onNewPuffs(PuffForum.receiveNewPuffs);
  
    Puff.init(CONFIG.zone);
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
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }
  
    return puff.payload.parents.map(PuffForum.getPuffById)
}

PuffForum.getChildren = function(puff) {
    //// get children from a puff
  
    // THINK: do we really need this? the puff will have links to its children...

    // Find out how many, but only return the latest CONFIG.maxChildrenToShow
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }

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
    if(!parents)
    parents = []
    if(!Array.isArray(parents))
    parents = [parents]
    
    if(parents.map(PuffForum.getPuffById).filter(function(x) { return x != null }).length != parents.length)
    return "Error Error Error: those are not good parents"
 
    // if there's no user, add an anonymous one
    // THINK: where should the username/privatekey live? we'll put it here for now, but some other layer should take responsibility.
    // THINK: posting this as its own callback is probably not ideal
    var user = PuffForum.getCurrentUser()
    if(!user.username || !user.privateKey)
    return PuffForum.addAnonUser(function(username) {PuffForum.addPost(content, parents)})

    var sig = Puff.createPuff(user.username, user.privateKey, 'text', content, {time: Date.now(), parents: parents})
 
    // THINK: actually we can't return this because we might go async
    // return sig;
}

PuffForum.getDefaultPuff = function() {
    var defaultPuff = CONFIG.defaultPuff
                    ? PuffForum.getPuffById(CONFIG.defaultPuff)
                    : Puff.Data.puffs[0]
 
    // TODO: use 'locate puff' once it's available, and change this to 'show default puff'
    
    return defaultPuff
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


PuffForum.addContentType = function(name, type) {
    if(!name) return Puff.onError('Invalid content type name')
    if(!type.toHtml) return Puff.onError('Invalid content type: object is missing toHtml method')
    
    // TODO: add more thorough name/type checks
    PuffForum.contentTypes[name] = type
}

PuffForum.processContent = function(type, content) {
    var typeObj = PuffForum.contentTypes[type]
    if(!typeObj)
        typeObj = PuffForum.contentTypes['text']

    return typeObj.toHtml(content)
}

PuffForum.getProcessedPuffContent = function(puff) {
    // THINK: we've already ensured these are proper puffs, so we don't have to check for payload... right?
    return PuffForum.processContent(puff.payload.type, puff.payload.content)
}

// DEFAULT CONTENT TYPES

PuffForum.addContentType('text', {
    toHtml: function(content) {
        return '<p>' + content + '</p>'
    }
})

PuffForum.addContentType('bbcode', {
    toHtml: function(content) {
        var bbcodeParse = XBBCODE.process({ text: content });
        var parsedText  = bbcodeParse.html.replace(/\n/g, '<br />'); 
        return parsedText;
    }
})

//// USER INFO

PuffForum.currentUser = {};
PuffForum.users = {}; // all the users available on this system

PuffForum.removeUser = function(username) {
    //// clear the user from our system
    delete PuffForum.users[username]
    
    if(PuffForum.currentUser.username == username)
        PuffForum.currentUser = {}
}

PuffForum.getCurrentUser = function() {
    return PuffForum.currentUser
}

PuffForum.addAnonUser = function(callback) {
    //// create a new anonymous user and add it to the local user list
  
    // gen privkey
    var privateKey = Puff.Crypto.generatePrivateKey();
  
    // gen pubkey
    var publicKey = Puff.Crypto.privateToPublic(privateKey);
    
    var my_callback = function(username) {
        PuffForum.addUserReally(username, privateKey, publicKey);
        if(typeof callback == 'function') {
            callback(username)
        }
    }
  
    Puff.Network.addAnonUser(publicKey, my_callback);
}

PuffForum.addUserMaybe = function(username, privkey, callback, errback) {
    var pubkey = Puff.Crypto.privateToPublic(privkey);
    if(!pubkey) return Puff.onError('That private key could not generate a public key');

    var my_callback = function(result) {
        if(!result) return Puff.onError('No result returned');
        
        // THINK: return a promise instead
        if(result.publicKey === pubkey) {
            var userinfo = PuffForum.addUserReally(username, privkey, pubkey);
            if(typeof callback === 'function')
                callback(userinfo)
        } else {
            if(typeof errback === 'function')
                errback(username, privkey)
            else
                return Puff.onError('That private key does not match the record for that username')
        }
    }
    
    Puff.Network.getUser(username, my_callback)
}

PuffForum.addUserReally = function(username, privkey, pubkey) {
    var userinfo = {   username: username
                   ,  publicKey: pubkey
                   , privateKey: privkey
                   }
    
    PuffForum.users[username] = userinfo
    
    // persist to localStorage?    
    
    return userinfo
}

PuffForum.setCurrentUser = function(username) {
    var user = PuffForum.users[username]
    
    if(!user || !user.username)
        return Puff.onError('No record of that username exists locally -- try adding it first')
    
    PuffForum.currentUser = user
}

