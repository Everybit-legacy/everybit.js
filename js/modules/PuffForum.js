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
  
    Puffball.onNewPuffs(PuffForum.receiveNewPuffs);
  
    Puffball.init(CONFIG.zone);
    // establishes the P2P network, pulls in all interesting puffs, caches user information, etc
}

PuffForum.getPuffById = function(id) {
    //// get a particular puff
  
    // TODO: check the graph instead of this
    
    var shell = PuffData.shells.filter(function(shell) { return id === shell.sig })[0]
    
    return Puffball.getPuffFromShell(shell)
}

// helper for sorting by payload.time
PuffForum.sortByPayload = function(a,b) {
    return b.payload.time - a.payload.time;
}


PuffForum.getParents = function(puff) {
    //// get parents from a puff
  
    // THINK: do we really need this? the puff will have links to its parents...
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }
  
    return puff.payload.parents.map(PuffForum.getPuffById)
                               .filter(Boolean)
                               .sort(PuffForum.sortByPayload)
                                                          
}

PuffForum.getChildren = function(puff) {
    //// get children from a puff
  
    // THINK: do we really need this? the puff will have links to its children...

    // Find out how many, but only return the latest CONFIG.maxChildrenToShow
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }

    return PuffData.shells.filter(function(kidpuff) { return ~kidpuff.payload.parents.indexOf(puff.sig) })
                               .sort(PuffForum.sortByPayload)
                               .map(Puffball.getPuffFromShell)
                               .filter(Boolean)
}

PuffForum.getSiblings = function(puff) {
    //// get siblings from a puff
  
    if(typeof puff === 'string')
        puff = PuffForum.getPuffById(puff);

    var originalSig = puff.sig;

    var parent_sigs = PuffForum.getParents(puff).map(function(puff) { return puff.sig });

    return PuffData.shells.filter(
        function(puff) { 
            return puff.sig != originalSig 
                && puff.payload.parents.reduce(
                    function(acc, parent_sig) {
                        return acc || ~parent_sigs.indexOf(parent_sig) }, false) })
                            .sort(PuffForum.sortByPayload)
                                .map(Puffball.getPuffFromShell)
                                    .filter(Boolean)
}


PuffForum.getRootPuffs = function(limit) {
    //// returns the most recent parentless puffs, sorted by time

    // limit defaults to 0, which returns all root puffs
  
    // we should probably index these rather than doing a full graph traversal
  
    // TODO: add limit

    return PuffData.shells.filter(function(shell) { return shell ? !shell.payload.parents.length : 0 })
                               .sort(PuffForum.sortByPayload)
                               .map(Puffball.getPuffFromShell)
                               .filter(Boolean)
} 


PuffForum.addPost = function(type, content, parents, metadata) {
    //// Given a string of content, create a puff and push it into the system
    
    // ensure parents is an array
    if(!parents) parents = []
    if(!Array.isArray(parents)) parents = [parents]
    
    // ensure parents contains only puff ids
    if(parents.map(PuffForum.getPuffById).filter(function(x) { return x != null }).length != parents.length)
        return Puffball.falsePromise('Those are not good parents')
    
    var takeUserMakePuff = PuffForum.partiallyApplyPuffMaker(type, content, parents, metadata)
    
    // get a user promise
    var userprom = PuffWardrobe.getUpToDateUserAtAnyCost();
    
    var prom = userprom.catch(Puffball.promiseError('Failed to add post: could not access or create a valid user'))
                       .then(takeUserMakePuff)
                       .catch(Puffball.promiseError('Posting failed'))
    return prom;
    
    // NOTE: any puff that has 'time' and 'parents' fields fulfills the forum interface
    // TODO: make an official interface fulfillment thing
}


PuffForum.partiallyApplyPuffMaker = function(type, content, parents, metadata) {
    //// Make a puff... except the parts that require a user
    
    // THINK: if you use the same metadata object for multiple puffs your cached version of the older puffs will get messed up
    
    var payload = metadata || {}                            // metadata becomes the basis of payload
    payload.parents = parents                               // ids of the parent puffs
    payload.time = metadata.time || Date.now()              // time is always a unix timestamp
    payload.tags = metadata.tags || []                      // an array of tags // TODO: make these work

    var type  = type || 'text'
    var routes = CONFIG.zone ? [CONFIG.zone] : []
    
    return function(userRecord) {
        // userRecord is always an up-to-date record from the DHT, so we can use its 'latest' value here 
        var previous   = userRecord.latest
        var username   = userRecord.username

        var privateKeys = PuffWardrobe.getCurrentKeys()
        if(!privateKeys || !privateKeys.default)
            return Puffball.onError('No valid private key found for signing the content')

        var puff = Puffball.buildPuff(username, privateKeys.default, routes, type, content, payload, previous)

        return Puffball.addPuffToSystem(puff) // THINK: this fails silently if the sig exists already
    }
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
    if(!name) return Puffball.onError('Invalid content type name')
    if(!type.toHtml) return Puffball.onError('Invalid content type: object is missing toHtml method')
    
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
        var safe_content = XBBCODE.process({ text: content })   // not ideal, but it does seem to strip out raw html
        return '<p>' + safe_content.html + '</p>'               // THINK: is this really safe?
    }
})

PuffForum.addContentType('bbcode', {
    toHtml: function(content) {
        var bbcodeParse = XBBCODE.process({ text: content });
        var parsedText  = bbcodeParse.html.replace(/\n/g, '<br />'); 
        return parsedText;
    }
})

PuffForum.addContentType('image', {
    toHtml: function(content) {
        return '<img src=' + content + ' />';
    }
})

