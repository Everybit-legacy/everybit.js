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
    
    Puffball.addRelationship(PuffForum.addFamilialEdges);
  
    Puffball.init(CONFIG.zone); // establishes the P2P network, pulls in interesting puffs, caches user information, etc
}

/**
 * get shells, filtered by a query and queried by filters
 * @param {string} query
 * @param {string} filters
 * @returns {Shell[]}
 */
PuffForum.getShells = function(query, filters) {
    /// get shells, filtered by a query and queried by filters
    //  NOTE: we include query and filters here so this layer can grow more sophisticated over time
    //  TODO: actually make this more sophisticated (probably via Dagoba)
    
    var shells = PuffForum.getAllMyShells()
    
    return PuffForum.filterShells(shells, query, filters)   
}

/**
 * filter shells from provided query and filters
 * @param {Array} shells
 * @param {string} query
 * @param {string} filters
 * @returns {Shell[]}
 */
PuffForum.filterShells = function(shells, query, filters) {
    return shells.filter(PuffForum.filterByFilters(PB.extend({}, query, filters)))
}

/**
 * to get all my shells
 * @returns {Shell[]}
 */
PuffForum.getAllMyShells = function() {
    var publicShells = PuffData.getPublicShells()
    var encryptedShells = PuffForum.getEncryptedShells()
    return publicShells.concat(encryptedShells)
}

/**
 * to get encrypted shells
 * @returns {Shell[]}
 */
PuffForum.getEncryptedShells = function() {
    // TODO: check 'all or one' wardrobe toggle, if true get for all wardrobe users
    var myUsername = PuffWardrobe.getCurrentUsername()
    var encryptedShells = PuffData.getMyEncryptedShells(myUsername)
                                  .map(PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption)
                                  .filter(Boolean)
    
    return encryptedShells    
}

/**
 * filter puffs by prop filters
 * @param  {string} filters
 * @return {boolean}
 */
PuffForum.filterByFilters = function(filters) {
    /// filter puffs by prop filters
    
    if(!filters) return function() {return true}
    
    //// get a filtering function
    return function(shell) {
        if(filters.routes && filters.routes.length > 0) {
            var routeMatch = false;
            for (var i=0; i<filters.routes.length; i++) {
                if (shell.routes.indexOf(filters.routes[i]) > -1) routeMatch = true;
            }
            if(!routeMatch) return false;
        }

        if(filters.tags && filters.tags.length > 0) {
            if(!shell.payload.tags || !shell.payload.tags.length) {
                return false;
            }
            var tagMatch = false;
            for (var i=0; i<filters.tags.length; i++) {
                if (shell.payload.tags.indexOf(filters.tags[i]) > -1) tagMatch = true;
            }
            if(!tagMatch) return false;
        }


        
        if(filters.users && filters.users.length > 0)
            if(!~filters.users.indexOf(shell.username)) return false


        if(filters.roots)
            if((shell.payload.parents||[]).length) return false

        if(filters.ancestors && filters.focus) {
            var focus = PuffForum.getPuffBySig(filters.focus) // TODO: this is wrong
            if(focus.payload && !~focus.payload.parents.indexOf(shell.sig)) return false
        }

        if(filters.descendants && filters.focus)
            if(!~shell.payload.parents.indexOf(filters.focus)) return false

        return true
    }
}




PuffForum.secretStash = {}
PuffForum.horridStash = {}

/**
 * get stashed shells by sig
 * @param {string} username
 * @param {string} sig
 * @returns {Shell[]}
 */
PuffForum.getStashedShellBySig = function(username, sig) {
    if(!PuffForum.secretStash[username])
        PuffForum.secretStash[username] = {}
    
    if(PuffForum.secretStash[username][sig])
        return PuffForum.secretStash[username][sig]
}

/**
 * determine if it is bad envelope
 * @param {string} sig
 * @returns {Object}
 */
PuffForum.badEnvelope = function(sig) {
    return PuffForum.horridStash[sig]
}

/**
 * extract letter from envelope by virtue of decryption
 * @param {Object} envelope
 * @returns {Boolean|Shell[]}
 */
PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption = function(envelope) {      // the envelope is a puff
    var myUsername = PuffWardrobe.getCurrentUsername()
    var myKeys = PuffWardrobe.getCurrentKeys()
    var maybeShell = PuffForum.getStashedShellBySig(myUsername, envelope.sig)       // also preps stash for additions
    
    if(maybeShell) return maybeShell
        
    if(PuffForum.badEnvelope(envelope.sig)) return false
    
    function doit(envelope, yourUserRecord) {
        var letter = Puffball.decryptPuff(envelope, yourUserRecord.defaultKey, myUsername, myKeys.default)
        if(!letter) {
            PuffForum.horridStash[envelope.sig] = true
            return false
        }
        PuffForum.secretStash[myUsername][envelope.sig] = letter                    // letter is a puff too
        PuffForum.secretStash[myUsername][letter.sig] = letter                      // stash it both ways
        PuffData.addBonus(letter, 'envelope', envelope)                             // mark it for later
        return letter
    }
    
    var yourUsername   = envelope.username
    var yourUserRecord = PuffData.getCachedUserRecord(yourUsername)
    
    if(yourUserRecord) 
        return doit(envelope, yourUserRecord)
    
    var yourUserRecordPromise = Puffball.getUserRecord(yourUsername)
    yourUserRecordPromise.then(function(yourUserRecord) {
        doit(envelope, yourUserRecord)                                              // puts it in the cache for next time
        updateUI()                                                                  // redraw everything once DHT responds
    })
}

/**
 * get a particular puff by its sig
 * @param  {String} sig
 * @return {Object}
 */
PuffForum.getPuffBySig = function(sig) {
    //// get a particular puff
    var myUsername = PuffWardrobe.getCurrentUsername()
  
    var shell = PuffData.getCachedShellBySig(sig)                              // check in lower cache
    
    if(!shell)
        shell = PuffForum.getStashedShellBySig(myUsername, sig)                // check the forum's secret stash
    
    return Puffball.getPuffFromShell(shell || sig)
}

/**
 * helper for sorting by payload.time
 * @param  {Object} a
 * @param  {object} b
 * @return {number}
 */
PuffForum.sortByPayload = function(a,b) {
    //// helper for sorting by payload.time
    if(puffworldprops.view.query.sort == 'DESC')
        return b.payload.time - a.payload.time;
    else
        return a.payload.time - b.payload.time;
}

/**
 * filter if it is not props
 * @param  {Object} props
 * @return {boolean}
 */		
PuffForum.getPropsFilter = function(props) {
    if(!props) return function() {return true}
    
    // props = props.view ? props.view : props
    props = props.filter ? props.filter : props
    // puffs = puffs.filter(function(shell) { return route ? ~shell.routes.indexOf(route) : true })
    
    //// get a filtering function
    return function(shell) {
        if(props.routes && props.routes.length > 0) {
            var routeMatch = false;
            for (var i=0; i<props.routes.length; i++) {
                if (shell.routes.indexOf(props.routes[i]) > -1) routeMatch = true;
            }
            if (!routeMatch) return false;
        }
        if(props.usernames && props.usernames.length > 0)
            if (!~props.usernames.indexOf(shell.username)) return false
        return true
    }
}

/**
 * get the current puff's parents
 * @param  {Object} puff
 * @param  {Object} props
 * @return {Puff[]}
 */
PuffForum.getParentCount = function(puff, props) {
    if(!puff) return 0
    
    var sig = puff.sig || puff
    
    return PuffData.graph.v(sig).out('parent').run().length
}

/**
 * get a count of the current puff's children
 * @param  {Object} puff
 * @return {Puff[]}
 */
PuffForum.getChildCount = function(puff) {
    if(!puff) return 0
    
    var sig = puff.sig || puff
    
    return PuffData.graph.v(sig).out('child').run().length
}


// TODO: add a simple way to get shells by user, route, roots only, etc.


/**
 * returns a list of puffs
 * @param  {string} query
 * @param  {string} filters
 * @param  {number} limit
 * @param  {object} props
 * @return {array}
 */
PuffForum.getPuffList = function(query, filters, limit) {
    //// returns a list of puffs

    // THINK: the graph can help us here, but only if we're more clever about forming relationships and using those in our filters.

    limit = limit || Infinity
    var offset = +query.offset||0

    var shells = PuffForum.getShells(query, filters)
    
    var filtered_shells = shells.filter(PuffForum.filterByFilters(PB.extend({}, query, filters)))
                                .filter(function(s){return s.payload.type != 'star'}) // ?move this to somewhere else?
                                // .filter(function(s){return s.payload.type != 'star'})
                                .sort(PuffForum.sortByPayload) // TODO: sort by query

    var sliced_shells = filtered_shells.slice(offset, offset+limit)
    
    var puffs = sliced_shells.map(Puffball.getPuffFromShell)
                             .filter(Boolean)

    var have = sliced_shells.length
    // var have = puffs.length
    if(have >= limit)
        return puffs  // as long as we have enough filtered shells the puffs will eventually fill in empty spots

    PuffData.fillSomeSlotsPlease(limit+offset, have, query, filters)
    
    return puffs;
} 


/**
 * takes a string of content, create a puff and push it into the system
 * @param {string} type
 * @param {string} content
 * @param {Puff[]} parents
 * @param {Object} metadata
 * @param {string[]} userRecordsForWhomToEncrypt
 * @param {string[]} envelopeUserKeys
 * @returns {*}
 */
PuffForum.addPost = function(type, content, parents, metadata, userRecordsForWhomToEncrypt, envelopeUserKeys) {
    //// Given a string of content, create a puff and push it into the system
    
    // ensure parents is an array
    if(!parents) parents = []
    if(!Array.isArray(parents)) parents = [parents]
    
    // ensure parents contains only puff ids
    if(parents.map(PuffForum.getPuffBySig).filter(function(x) { return x != null }).length != parents.length)
        return Puffball.emptyPromise('Those are not good parents')
    
    // ensure parents are unique
    parents = parents.filter(function(item, index, array) {return array.indexOf(item) == index}) 

    // find the routes using parents
    var routes = parents.map(function(id) {
        return PuffForum.getPuffBySig(id).username;
    });
    if (metadata.routes) {
        routes = metadata.routes;
        delete metadata['routes'];
    }
    
    // ensure all routes are unique
    routes = routes.filter(function(item, index, array){return array.indexOf(item) == index});
    
    var takeUserMakePuff = PuffForum.partiallyApplyPuffMaker(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, envelopeUserKeys)
    
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
 * @param {string} type
 * @param {string} content
 * @param {Puff[]} parents
 * @param {object} metadata
 * @param {string[]} routes
 * @param {string[]} userRecordsForWhomToEncrypt
 * @param {string[]} envelopeUserKeys
 * @returns {Function}
 */
PuffForum.partiallyApplyPuffMaker = function(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, envelopeUserKeys) {
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

        var puff = Puffball.buildPuff(username, privateKeys.default, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, envelopeUserKeys)

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
 * @param  {Puff[]} puffs
 */
PuffForum.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    PuffForum.newPuffCallbacks.forEach(function(callback) {callback(puffs)})
}


PuffForum.addFamilialEdges = function(shells) {
    shells.forEach(PuffForum.addFamilialEdgesForShell)
}

PuffForum.addFamilialEdgesForShell = function(child) {
    var addParentEdges = PuffForum.addFamilialEdgesForParent(child);
    (child.payload.parents||[]).forEach(addParentEdges);
}

PuffForum.addFamilialEdgesForParent = function(child) {
    var existingParents = PuffData.graph.v(child.sig).out('parent').property('shell').run().map(R.prop('sig'))
    
    return function(parentSig) {
        if(~existingParents.indexOf(parentSig)) return false                        // done?
        PuffData.addSigAsVertex(parentSig)                                          // idempotent
        PuffData.graph.addEdge({_label: 'parent', _in: parentSig, _out: child.sig}) // not idempotent
        PuffData.graph.addEdge({_label: 'child', _out: parentSig,  _in: child.sig})
    }
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


// THINK: this might get big, need some GC here
PuffForum.puffContentStash = {}

/**
 * to the the processed puff content
 * @param  {puff} puff
 * @return {string}
 */
PuffForum.getProcessedPuffContent = function(puff) {
    // THINK: we've already ensured these are proper puffs, so we don't have to check for payload... right?
    if(PuffForum.puffContentStash[puff.sig])
        return PuffForum.puffContentStash[puff.sig]
    
    var content = PuffForum.processContent(puff.payload.type, puff.payload.content, puff)
    PuffForum.puffContentStash[puff.sig] = content
    
    return content
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

PuffForum.addContentType('LaTex', {
    toHtml: function(content) {
        var safe_content = XBBCODE.process({ text: content }) 
        return '<p>' + safe_content.html + '</p>'
    }
}) */

/**
 * Encrypted puffs 
 * @param  {string} Content type name
 * @param  {object} Content type methods
 * @return {string}
 */
// PuffForum.addContentType('encryptedpuff', {
//     toHtml: function(content, envelope) {                                                 // the envelope is a puff
//         var letter = PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption(envelope);   // the letter is also a puff
//         if(!letter) return 'This is encrypted';                                           // can't read the letter
//         return PuffForum.getProcessedPuffContent(letter);                                 // show the letter
//     }
// })


// flag a puff
PuffForum.flagPuff = function (sig) {
    var privateKeys = PuffWardrobe.getCurrentKeys();

    if(!privateKeys.username) {
        alert("You must first set your username before you can flag content");
    }
    /*if(!privateKeys.username == PuffForum.getPuffBySig(sig).username) {
        alert("You must set your identity to the author of the puff you want to flag");
    }*/
    if(!privateKeys.admin) {
        alert("You must first set your private admin key before you can flag content");
    }

    // Stuff to register. These are public keys
    var payload = {};
    var routes = [];
    var type = 'flagPuff';
    var content = sig;

    payload.time = Date.now();

    var puff = Puffball.buildPuff(privateKeys.username, privateKeys.admin, routes, type, content, payload);

    var data = { type: 'flagPuff'
               , puff: puff
               };

    var prom = PuffNet.post(CONFIG.puffApi, data);
    prom = prom.then(function(result){
        // var storedShells = Puffball.Persist.get('shells');
        // var filteredShells = storedShells.filter(function(s){return s.sig != content && s.content != content});
        var flaggedSig = Puffball.Persist.get('flagged') || [];
        flaggedSig.push(content);

        // Puffball.Persist.save('shells', filteredShells);
        Puffball.Persist.save('flagged', flaggedSig);
        // reload?
        // document.location.reload();
        events.pub('ui/flag', {})
        return result;
    })
    return prom;
}