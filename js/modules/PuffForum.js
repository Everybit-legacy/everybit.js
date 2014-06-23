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

/**
 * set up everything
 */
PuffForum.init = function() {
    //// set up everything. 
    // THINK: maybe you can only call this once?
    // THINK: maybe take a zone arg, but default to config
  
    Puffball.onNewPuffs(PuffForum.receiveNewPuffs);
  
    Puffball.init(CONFIG.zone); // establishes the P2P network, pulls in all interesting puffs, caches user information, etc
}


PuffForum.secretStash = {}

PuffForum.getShells = function() {
    var myUsername = PuffWardrobe.getCurrentUsername()
    var myKeys = PuffWardrobe.getCurrentKeys()
    var shells = PuffData.getShells(myUsername)
    var privateShells = []
    var encryptedPuffs = PuffData.getEncryptedPuffsForMe(myUsername)
    
    encryptedPuffs.forEach(function(puff) {
        if(!PuffForum.secretStash[myUsername])
            PuffForum.secretStash[myUsername] = {}
        
        if(PuffForum.secretStash[myUsername][puff.sig])
            return privateShells.push(PuffForum.secretStash[myUsername][puff.sig])
        
        var yourUsername = puff.username
        var yourUserRecord = PuffData.getCachedUserRecord(yourUsername)
        if(yourUserRecord) {
            var puff = Puffball.decryptPuff(puff, yourUserRecord.defaultKey, myUsername, myKeys.default)
            PuffForum.secretStash[myUsername][puff.sig] = puff
            privateShells.push((puff))   // we already have the user record, so just push it
            return false
        }
        
        var yourUserRecordPromise = Puffball.getUserRecord(yourUsername)
        yourUserRecordPromise.then(function(yourUserRecord) {
            var puff = Puffball.decryptPuff(puff, yourUserRecord.defaultKey, myUsername, myKeys.default)
            PuffForum.secretStash[myUsername][puff.sig] = puff

            // var puff = Puffball.decryptPuff(puff, yourUserRecord.defaultKey, myUsername, myKeys.default)
            updateUI() // this is pretty hacky... but we can't bring the decrypted puff in the front door, 
                       // or it gets added to the main list of shells in decrypted form. so we just get 
                       // the user record locally and then trigger a redraw which brings the puff into 
                       // the UI without adding it to the system at large. 
                       // TODO: revisit this whole thing, and add a smarter caching/persisting/etc layer
        })
    })
    
    return PuffData.shells.concat(privateShells);
}

/**
 * get a particular puff by its id
 * @param  {String} id
 * @return {puff}
 */
PuffForum.getPuffById = function(id) {
    //// get a particular puff
  
    var shell = PuffForum.getShells().filter(function(shell) { return id === shell.sig })[0]
    
    return Puffball.getPuffFromShell(shell || id)
}

/**
 * helper for sorting by payload.time
 * @param  {puff} a
 * @param  {puff} b
 * @return {number}
 */
PuffForum.sortByPayload = function(a,b) {
    //// helper for sorting by payload.time
    return b.payload.time - a.payload.time;
}

/**
 * filter if it is not props
 * @param  {props} props
 * @return {boolean}
 */		
PuffForum.getPropsFilter = function(props) {
    if(!props) return function() {return true}
    
    props = props.view ? props.view : props
    // props = props.filter ? props.filter : props

    // puffs = puffs.filter(function(shell) { return route ? ~shell.routes.indexOf(route) : true })
    
    //// get a filtering function
    return function(shell) {
        if(props.filterroute)
            if(!~shell.routes.indexOf(props.filterroute)) return false
        if(props.filteruser)
            if (shell.username != props.filteruser) return false
        return true
    }
}

/**
 * get the current puff's parents
 * @param  {puff} puff
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getParents = function(puff, props) {
    //// get parents from a puff
  
    // THINK: do we really need this? the puff will have links to its parents...
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }
    
    return puff.payload.parents.map(PuffForum.getPuffById)
                               .filter(Boolean)
                               .filter(PuffForum.getPropsFilter(props))
                               .sort(PuffForum.sortByPayload)
                                                          
}

/**
 * get the current puff's children
 * @param  {puff} puff
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getChildren = function(puff, props) {
    //// get children from a puff
  
    // THINK: do we really need this? the puff will have links to its children...

    // Find out how many, but only return the latest CONFIG.maxChildrenToShow
  
    if(typeof puff === 'string') {
        puff = PuffForum.getPuffById(puff);
    }

    var shells = PuffForum.getShells()

    return shells.filter(function(kidpuff) { return ~(kidpuff.payload.parents||[]).indexOf(puff.sig) })
                 .filter(PuffForum.getPropsFilter(props))
                 .map(Puffball.getPuffFromShell)
                 .filter(Boolean)
                 .sort(PuffForum.sortByPayload)
}

/**
 * get the current puff's sibling
 * @param  {puff} puff
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getSiblings = function(puff, props) {
    //// get siblings from a puff
  
    if(typeof puff === 'string')
        puff = PuffForum.getPuffById(puff);

    var originalSig = puff.sig;

    var parent_sigs = PuffForum.getParents(puff).map(function(puff) { return puff.sig });

    var shells = PuffForum.getShells()

    return shells.filter(
        function(puff) { 
            return puff.sig != originalSig 
                && (puff.payload.parents||[]).reduce(
                    function(acc, parent_sig) {
                        return acc || ~parent_sigs.indexOf(parent_sig) }, false) })
                            .map(Puffball.getPuffFromShell)
                                .filter(Boolean)
                                    .filter(PuffForum.getPropsFilter(props))
                                        .sort(PuffForum.sortByPayload)
}

/**
 * returns the most recent parentless puffs, sorted by time
 * @param  {number} limit
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getRootPuffs = function(limit, props) {
    //// returns the most recent parentless puffs, sorted by time

    // OPT: we should probably index these rather than doing a full graph traversal
  
    limit = limit || Infinity

    var shells = PuffForum.getShells()

    return shells.filter(function(shell) { return shell ? !shell.payload.parents.length : 0 })
                 .sort(PuffForum.sortByPayload)
                 .filter(PuffForum.getPropsFilter(props))
                 .slice(0, limit)
                 .map(Puffball.getPuffFromShell)
                 .filter(Boolean)
} 

/**
 * returns the most recent puffs, sorted by time
 * @param  {number} limit
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getLatestPuffs = function(limit, props, start) {
    //// returns the most recent puffs, sorted by time

    limit = limit || Infinity
    start = start || 0

    var shells = PuffForum.getShells()
    var filtered_shells = shells.sort(PuffForum.sortByPayload)
                                .filter(PuffForum.getPropsFilter(props));
    var puffs = filtered_shells.slice(start, start + limit)
                               .map(Puffball.getPuffFromShell)
                               .filter(Boolean);
    if (filtered_shells.length > start+limit && puffs.length < limit) {
        // still need more puffs and there are some available
        puffs = puffs.concat(PuffForum.getLatestPuffs(limit - puffs.length, props, start + limit));
    } 
    return puffs;
} 

/**
 * returns all known puffs from given user, sorted by time
 * @param  {string} username
 * @param  {number} limit
 * @param  {props} props
 * @return {array of puffs}
 */
PuffForum.getByUser = function(username, limit, props) {
    //// returns all known puffs from given user, sorted by time

    limit = limit || Infinity

    var shells = PuffForum.getShells()

    return shells.filter(function(shell) { return shell ? shell.username == username : 0 })
                 .filter(PuffForum.getPropsFilter(props))
                 .sort(PuffForum.sortByPayload)
                 .slice(0, limit)
                 .map(Puffball.getPuffFromShell)
                 .filter(Boolean)
} 

/**
 * returns all known puffs containing a particular route
 * @param  {string} route
 * @param  {number} limit
 * @return {array of puffs}
 */
PuffForum.getByRoute = function(route, limit) {
    //// returns all known puffs containing a particular route

    limit = limit || Infinity

    var shells = PuffForum.getShells()

    return shells.filter(function(shell) { return route ? ~shell.routes.indexOf(route) : true })
                 .sort(PuffForum.sortByPayload)
                 .slice(0, limit)
                 .map(Puffball.getPuffFromShell)
                 .filter(Boolean)
}


/**
 * Given a string of content, create a puff and push it into the system
 * @param {string} type
 * @param {string} content
 * @param {array of puffs} parents
 * @param {object} metadata
 * @param {array of userRecords} encrypt if present
 */
PuffForum.addPost = function(type, content, parents, metadata, userRecordsForWhomToEncrypt) {
    //// Given a string of content, create a puff and push it into the system
    
    // ensure parents is an array
    if(!parents) parents = []
    if(!Array.isArray(parents)) parents = [parents]
    
    // ensure parents contains only puff ids
    if(parents.map(PuffForum.getPuffById).filter(function(x) { return x != null }).length != parents.length)
        return Puffball.falsePromise('Those are not good parents')
    
    // ensure parents is unique
    parents = parents.filter(function(item, index, array) {return array.indexOf(item) == index}) 

    // find the routes using parents
    var routes = parents.map(function(id) {
        return PuffForum.getPuffById(id).username;
    });
    // ensure all routes is unique
    routes = routes.filter(function(item, index, array){return array.indexOf(item) == index});
    
    var takeUserMakePuff = PuffForum.partiallyApplyPuffMaker(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt)
    
    // get a user promise
    var userprom = PuffWardrobe.getUpToDateUserAtAnyCost();
    
    var prom = userprom.catch(Puffball.promiseError('Failed to add post: could not access or create a valid user'))
                       .then(takeUserMakePuff)
                       .catch(Puffball.promiseError('Posting failed'))
    return prom;
    
    // NOTE: any puff that has 'time' and 'parents' fields fulfills the forum interface
    // TODO: make an official interface fulfillment thing
}

/**
 * Make a puff... except the parts that require a user
 * @param  {string} type
 * @param  {string} content
 * @param  {array of puffs} parents
 * @param  {object} metadata
 * @param  {array of strings} routes
 * @param {array of userRecords} encrypt if present
 * @return {puff}
 */
PuffForum.partiallyApplyPuffMaker = function(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt) {
    //// Make a puff... except the parts that require a user
    
    // THINK: if you use the same metadata object for multiple puffs your cached version of the older puffs will get messed up
    
    var payload = metadata || {}                            // metadata becomes the basis of payload
    payload.parents = parents                               // ids of the parent puffs
    payload.time = metadata.time || Date.now()              // time is always a unix timestamp
    payload.tags = metadata.tags || []                      // an array of tags // TODO: make these work

    var type  = type || 'text'
    var routes = routes ? routes : [];
    routes = routes.concat(CONFIG.zone);
    
    return function(userRecord) {
        // userRecord is always an up-to-date record from the DHT, so we can use its 'latest' value here 
        var previous   = userRecord.latest
        var username   = userRecord.username

        var privateKeys = PuffWardrobe.getCurrentKeys()
        if(!privateKeys || !privateKeys.default)
            return Puffball.onError('No valid private key found for signing the content')

        var puff = Puffball.buildPuff(username, privateKeys.default, routes, type, content, payload, previous, userRecordsForWhomToEncrypt)

        return Puffball.addPuffToSystem(puff) // THINK: this fails silently if the sig exists already
    }
}

/**
 * callback takes an array of puffs as its argument, and is called each time puffs are added to the system
 * @param  {function} callback
 */
PuffForum.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    PuffForum.newPuffCallbacks.push(callback)
}

/**
 * called by core Puff library any time puffs are added to the system
 * @param  {array of puffs} puffs
 */
PuffForum.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    PuffForum.addToGraph(puffs)
    PuffForum.newPuffCallbacks.forEach(function(callback) {callback(puffs)})
}

/**
 * add a set of puffs to our internal graph
 * @param  {array of puffs} puffs
 */
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

/**
 * to add content type
 * @param {string} name
 * @param {string} type
 */
PuffForum.addContentType = function(name, type) {
    if(!name) return Puffball.onError('Invalid content type name')
    if(!type.toHtml) return Puffball.onError('Invalid content type: object is missing toHtml method')
    
    // TODO: add more thorough name/type checks
    PuffForum.contentTypes[name] = type
}

/**
 * to process the content
 * @param  {string} type
 * @param  {string} content
 * @param  {puff} puff
 * @return {string}
 */
PuffForum.processContent = function(type, content, puff) {
    var typeObj = PuffForum.contentTypes[type]
    if(!typeObj)
        typeObj = PuffForum.contentTypes['text']

    return typeObj.toHtml(content, puff)
}

/**
 * to the the processed puff content
 * @param  {puff} puff
 * @return {string}
 */
PuffForum.getProcessedPuffContent = function(puff) {
    // THINK: we've already ensured these are proper puffs, so we don't have to check for payload... right?
    return PuffForum.processContent(puff.payload.type, puff.payload.content, puff) // TODO: this is redundant now
}

// DEFAULT CONTENT TYPES
/**
 * to add content type text
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('text', {
    toHtml: function(content) {
        var safe_content = XBBCODE.process({ text: content })   // not ideal, but it does seem to strip out raw html
        return '<p>' + safe_content.html + '</p>'               // THINK: is this really safe?
    }
})

/**
 * to add content type bbcode
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('bbcode', {
    toHtml: function(content) {
        var bbcodeParse = XBBCODE.process({ text: content });
        var parsedText  = bbcodeParse.html.replace(/\n/g, '<br />'); 
        return parsedText;
    }
})

/**
 * to add content type image
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('image', {
    toHtml: function(content) {
        return '<img class="imgInBox" src=' + content + ' />';
    }
})

/**
 * to add content type markdown
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('markdown', {
    toHtml: function(content) {
        var converter = new Markdown.Converter();

        return converter.makeHtml(content);
    }
})

/**
 * to add content type PGN
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('PGN', {

    toHtml: function(content) {
        return chessBoard(content);
    }
})

/**
 * to add content type LaTex
 * @param  {string} content
 * @return {string}
 */
PuffForum.addContentType('LaTex', {

    toHtml: function(content) {
       // return ltxParse(content);
        var safe_content = XBBCODE.process({ text: content })   // not ideal, but it does seem to strip out raw html
        return '<p>' + safe_content.html + '</p>'               // THINK: is this really safe?
    }
})
