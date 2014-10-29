/* 
                   _____  _____  _____                           
    ______  __ ___/ ____\/ ____\/ ____\___________ __ __  _____  
    \____ \|  |  \   __\\   __\\   __\/  _ \_  __ \  |  \/     \ 
    |  |_> >  |  /|  |   |  |   |  | (  <_> )  | \/  |  /  Y Y  \
    |   __/|____/ |__|   |__|   |__|  \____/|__|  |____/|__|_|  /
    |__|                                                      \/ 
  
  
  A Puffball module for managing forum-style puffs. Wraps the core Puffball API in a fluffy layer of syntactic spun sugar.

  Usage example:
  PB.M.Forum.onNewPuffs( function(puffs) { console.log(puffs) } )
  PB.M.Forum.init()

*/

PB.M.Forum = {};

PB.M.Forum.graph = {};
PB.M.Forum.newPuffCallbacks = [];
PB.M.Forum.contentTypes = {}


/**
 * set up everything
 */
PB.M.Forum.init = function() {
    //// set up everything. 
    // THINK: maybe you can only call this once?
    // THINK: maybe take a zone arg, but default to config
  
    PB.onNewPuffs(PB.M.Forum.receiveNewPuffs);
    
    PB.addRelationship(PB.M.Forum.addFamilialEdges);
  
    PB.init(CONFIG.zone); // establishes the P2P network, pulls in interesting puffs, caches user information, etc
}


/**
 * filter puffs by prop filters
 * @param  {string} filters
 * @return {boolean}
 */
PB.M.Forum.filterByFilters = function(filters) {
    /// filter puffs by prop filters
    
    if(!filters) return function() {return true}
    
    //// get a filtering function
    return function(shell) {

        // ROUTES
        if (filters.routes && filters.routes.length > 0) {
            var routeMatch = false;
            for (var i = 0; i < filters.routes.length; i++) {
                if (shell.routes.indexOf(filters.routes[i]) > -1) routeMatch = true;
            }
            if (!routeMatch) return false;
        }

        // TAGS
        if (filters.tags && filters.tags.length > 0) {
            if (!shell.payload.tags || !shell.payload.tags.length) {
                return false;
            }
            var tagMatch = false;
            for (var i = 0; i < filters.tags.length; i++) {
                if (shell.payload.tags.indexOf(filters.tags[i]) > -1) tagMatch = true;
            }
            if (!tagMatch) return false;
        }

        // TYPES
        if (filters.types && filters.types.length > 0) {
            if (!~filters.types.indexOf(shell.payload.type)) {
                // console.log(shell.type)
                return false
            }
        }

        // USERS
        if(filters.users && filters.users.length > 0)
            if(!~filters.users.indexOf(PB.justUsername(shell.username))) return false


        if(filters.roots)
            if((shell.payload.parents||[]).length) return false

        if(filters.ancestors && filters.focus) {
            var focus = PB.getPuffBySig(filters.focus) // TODO: this is wrong
            if(focus.payload && !~focus.payload.parents.indexOf(shell.sig)) return false
        }

        if(filters.descendants && filters.focus)
            if(!~shell.payload.parents.indexOf(filters.focus)) return false

        // TODO: deprecate this, as it's handled above:
        if (filters.type && filters.type.length)
            if (!~filters.type.indexOf(shell.payload.type)) return false

        return true
    }
}



/**
 * Helper for sorting by payload.time
 * @param  {Object} a
 * @param  {object} b
 * @return {number}
 */
PB.M.Forum.sortByPayload = function(a,b) {
    //// helper for sorting by payload.time
    if(puffworldprops.view.query.sort == 'DESC')
        return b.payload.time - a.payload.time;
    else
        return a.payload.time - b.payload.time;
}

/**
 * Filter it out if it's not in props
 * @param  {Object} props
 * @return {boolean}
 */		
PB.M.Forum.getPropsFilter = function(props) {
    // CURRENTLY UNUSED
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
 * Get the current puff's parents
 * @param  {Object} puff
 * @param  {Object} props
 * @return {Puff[]}
 */
PB.M.Forum.getParentCount = function(puff, props) {
    if(!puff) return 0
    
    var sig = puff.sig || puff
    
    return PB.Data.graph.v(sig).out('parent').run().length
}

/**
 * get a count of the current puff's children
 * @param  {Object} puff
 * @return {Puff[]}
 */
PB.M.Forum.getChildCount = function(puff) {
    if(!puff) return 0
    
    var sig = puff.sig || puff
    
    return PB.Data.graph.v(sig).out('child').run().length
}


/**
 * returns a list of puffs
 * @param  {string} query
 * @param  {string} filters
 * @param  {number} limit
 * @param  {object} props
 * @return {array}
 */
PB.M.Forum.getPuffList = function(query, filters, limit) {
    //// returns a list of puffs

    // THINK: the graph can help us here, but only if we're more clever about forming relationships and using those in our filters.

    limit = limit || Infinity
    var offset = +query.offset||0

    // var shells = PB.M.Forum.getShells(query, filters)
    var shells = PB.Data.getAllMyShells()
    
    var filtered_shells = shells.filter(PB.M.Forum.filterByFilters(Boron.extend({}, query, filters)))
                                .sort(PB.M.Forum.sortByPayload) // TODO: sort by query

    var sliced_shells = filtered_shells.slice(offset, offset+limit)
    
    var puffs = sliced_shells.map(PB.getPuffFromShell)
                             .filter(Boolean)

    var have = sliced_shells.length
    // var have = puffs.length
    if(have >= limit)
        return puffs  // as long as we have enough filtered shells the puffs will eventually fill in empty spots

    PB.Data.fillSomeSlotsPlease(limit, have, query, filters)
    
    return puffs;
} 



/**
 * takes a string of content, create a puff and push it into the system
 * @param {string} type
 * @param {string} content
 * @param {Puff[]} parents
 * @param {Object} metadata
 * @param {string[]} userRecordsForWhomToEncrypt
 * @param {string[]} privateEnvelopeAlias
 * @returns {*}
 */
PB.M.Forum.addPost = function(type, content, parents, metadata, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// Given a string of content, create a puff and push it into the system
    
    // ensure parents is an array
    if(!parents) parents = []
    if(!Array.isArray(parents)) parents = [parents]
    
    // ensure parents contains only puff ids
    if(parents.map(PB.getPuffBySig).filter(function(x) { return x != null }).length != parents.length)
        return PB.emptyPromise('Those are not good parents')
    
    // ensure parents are unique
    parents = parents.filter(function(item, index, array) {return array.indexOf(item) == index}) 

    // find the routes using parents
    var routes = parents.map(function(id) {
        return PB.getPuffBySig(id).username;
    });
    if (metadata.routes) {
        routes = metadata.routes; // THINK: this should probably merge with above instead of replacing it...
        delete metadata['routes'];
    }
    
    // ensure all routes are unique
    routes = routes.filter(function(item, index, array){return array.indexOf(item) == index});
    
    var takeUserMakePuff = PB.M.Forum.partiallyApplyPuffMaker(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    
    // get a user promise
    var userprom = PB.getUpToDateUserAtAnyCost();
    
    var prom = userprom.catch(PB.promiseError('Failed to add post: could not access or create a valid user'))
                       .then(takeUserMakePuff)
                       .catch(PB.promiseError('Posting failed'))

    prom.then(function(puff) {
        if(puff.keys) { // TODO: this is hacky
            PB.Data.removeShellFromCache(puff.sig)
            PB.Data.addShellsThenMakeAvailable([puff])
            // PB.Data.addPrivateShells([puff])
            // updateUI()

            // username = PB.getCurrentUsername()
            // PB.Data.importPrivateShells(username)
        }
        
        return puff
    })
    
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
 * @param {string[]} privateEnvelopeAlias
 * @returns {Function}
 */
PB.M.Forum.partiallyApplyPuffMaker = function(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// Make a puff... except the parts that require a user
    
    // THINK: if you use the same metadata object for multiple puffs your cached version of the older puffs will get messed up
    
    var payload = metadata || {}                            // metadata becomes the basis of payload
    payload.parents = payload.parents || parents            // ids of the parent puffs
    payload.time = metadata.time || Date.now()              // time is always a unix timestamp
    payload.tags = metadata.tags || []                      // an array of tags // TODO: make these work

    var type  = type || 'text'
    var routes = routes ? routes : [];
    routes = routes.concat(CONFIG.zone);
    
    return function(userRecord) {
        // userRecord is always an up-to-date record from the DHT, so we can use its 'latest' value here 

        var previous = userRecord.latest
        var puff = PB.simpleBuildPuff(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias)

        return PB.addPuffToSystem(puff) // THINK: this fails silently if the sig exists already
    }
}

/**
 * callback takes an array of puffs as its argument, and is called each time puffs are added to the system
 * @param  {function} callback
 */
PB.M.Forum.onNewPuffs = function(callback) {
    //// callback takes an array of puffs as its argument, and is called each time puffs are added to the system
  
    PB.M.Forum.newPuffCallbacks.push(callback)
}

/**
 * called by core Puff library any time puffs are added to the system
 * @param  {Puff[]} puffs
 */
PB.M.Forum.receiveNewPuffs = function(puffs) {
    //// called by core Puff library any time puffs are added to the system
  
    PB.M.Forum.newPuffCallbacks.forEach(function(callback) {callback(puffs)})
}


PB.M.Forum.addFamilialEdges = function(shells) {
    shells.forEach(PB.M.Forum.addFamilialEdgesForShell)
}

PB.M.Forum.addFamilialEdgesForShell = function(child) {
    var addParentEdges = PB.M.Forum.addFamilialEdgesForParent(child);
    (child.payload.parents||[]).forEach(addParentEdges);
}

PB.M.Forum.addFamilialEdgesForParent = function(child) {
    var existingParents = PB.Data.graph.v(child.sig).out('parent').property('shell').run().map(R.prop('sig'))
    
    return function(parentSig) {
        if(~existingParents.indexOf(parentSig)) return false                       // done?
        PB.Data.addSigAsVertex(parentSig)                                          // idempotent
        PB.Data.graph.addEdge({_label: 'parent', _in: parentSig, _out: child.sig}) // not idempotent
        PB.Data.graph.addEdge({_label: 'child', _out: parentSig,  _in: child.sig})
    }
}





/**
 * to process the content
 * @param  {string} type
 * @param  {string} content
 * @param  {puff} puff
 * @return {string}
 */
PB.M.Forum.processContent = function(type, content, puff) {
    var typeObj = PB.M.Forum.contentTypes[type]
    
    if(!typeObj)
        typeObj = PB.M.Forum.contentTypes['text']

    return typeObj.toHtml(content, puff)
}


// TODO: this might get big, need some GC here
PB.M.Forum.puffContentStash = {}

/**
 * to the the processed puff content
 * @param  {puff} puff
 * @return {string}
 */
PB.M.Forum.getProcessedPuffContent = function(puff) {
    // THINK: we've already ensured these are proper puffs, so we don't have to check for payload... right?
    if(PB.M.Forum.puffContentStash[puff.sig])
        return PB.M.Forum.puffContentStash[puff.sig]
    
    var content = PB.M.Forum.processContent(puff.payload.type, puff.payload.content, puff)
    PB.M.Forum.puffContentStash[puff.sig] = content
    
    return content
}

/**
 * to add content type
 * @param {string} name
 * @param {string} type
 */
PB.M.Forum.addContentType = function(name, type) {
    if(!name) 
        return console.log('Invalid content type name');
    if (CONFIG.supportedContentTypes.indexOf(name) == -1)  // THINK: should this be a blacklist instead?
        return console.log('Unsupported content type: ' + name);
    if(!type.toHtml) 
        return console.log('Invalid content type: object is missing toHtml method', name);
    
    PB.M.Forum.contentTypes[name] = type
}


// DEFAULT CONTENT TYPES

PB.M.Forum.addContentType('text', {
    toHtml: function(content) {
        var safe_content = XBBCODE.process({ text: content })   // not ideal, but it does seem to strip out raw html
        safe_content.html = safe_content.html.replace(/\n/g, '</br>');  // Set line breaks
        return '<span>' + safe_content.html + '</span>'
    }
})

PB.M.Forum.addContentType('bbcode', {
    toHtml: function(content) {
        var bbcodeParse = XBBCODE.process({ text: content });
        var parsedText  = bbcodeParse.html.replace(/\n/g, '<br />'); 
        return parsedText;
    }
})

PB.M.Forum.addContentType('image', {
    toHtml: function(content) {
        if(puffworldprops.view.mode == "tableView")
            return '<img src=' + content + ' />';
        else
            return '<img class="imgInBox" src=' + content + ' />';
    }
})

PB.M.Forum.addContentType('markdown', {
    toHtml: function(content) {
        var converter = new Markdown.Converter();
        return '<span>'+converter.makeHtml(content)+'</span>';
    }
})

PB.M.Forum.addContentType('PGN', {
    toHtml: function(content) {
        return chessBoard(content);
    }
})

PB.M.Forum.addContentType('profile', {
    toHtml: function(content, puff) {
        if(puffworldprops.view.mode == "tableView")
            return '<img src=' + content + ' />';
        else
            return '<img class="imgInBox" src=' + content + ' />';
        /*var keysNotShow = ['content', 'type'];
        for (var key in puff.payload) {
            var value = puff.payload[key];
            if (keysNotShow.indexOf(key)==-1 && value && value.length) {
                toRet += '<div><span class="profileKey">' + key + ': </span><span class="profileValue">' + value + '</span></div>';
            }
        }*/
    }
})

PB.M.Forum.addContentType('file', {
    toHtml: function(content, puff) {
        return (
            puff.payload.filename
            )
    }

})

/*PB.M.Forum.addContentType('LaTex', {
    toHtml: function(content) {
        var safe_content = XBBCODE.process({ text: content }) 
        return '<p>' + safe_content.html + '</p>'
    }
}) */


// flag a puff
PB.M.Forum.flagPuff = function (sig) {

    var payload = {};
    var routes = [];
    var type = 'flagPuff';
    var content = sig;
    
    payload.time = Date.now();

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {    

        if(!currentUsername) {
            alert("You must first set your username before you can flag content");
            return false;
        }
        /*if(!currentUsername == PB.getPuffBySig(sig).username) {
            alert("You must set your identity to the author of the puff you want to flag");
        }*/
        if(!privateAdminKey) {
            alert("You must first set your private admin key before you can flag content");
            return false;
        }
    
        var puff = PB.buildPuff(currentUsername, privateAdminKey, routes, type, content, payload);
    })

    var data = { type: 'flagPuff'
               , puff: puff
               };

    var prom = PB.Net.post(CONFIG.puffApi, data);
    prom = prom.then(function(result){
        // var storedShells = PB.Persist.get('shells');
        // var filteredShells = storedShells.filter(function(s){return s.sig != content && s.content != content});
        var flaggedSig = PB.Persist.get('flagged') || [];
        flaggedSig.push(content);

        // PB.Persist.save('shells', filteredShells);
        PB.Persist.save('flagged', flaggedSig);
        // reload?
        // document.location.reload();
        Events.pub('ui/flag', {})
        return result;
    })
    return prom;
}


// adding default metafields to included in a puff
PB.M.Forum.metaFields = []
PB.M.Forum.context = {};
PB.M.Forum.addMetaFields = function(fieldInfo, context, excludeContext) {
    // NOTE: this isn't used outside of publishEmbed.js, but it might provide a good basis for generic/required metadata
    
    if (!fieldInfo.name) return console.log('Invalid meta field name.');

    // supported type: text, textarea, pulldown, array
    if (!fieldInfo.type) return console.log('Invalid meta field type.');

    if (!fieldInfo.validator || typeof fieldInfo.validator != 'function') {
        fieldInfo.validator = false;
    }

    context = context || Object.keys(PB.M.Forum.contentTypes);
    if (typeof context == 'string') {
        context = [context];
    } else if (!Array.isArray(context)) {
        return PB.onError('Invalid context.')
    }

    excludeContext = excludeContext || [];
    if (typeof excludeContext == 'string') {
        excludeContext = [excludeContext];
    }else if (!Array.isArray(excludeContext)) {
        return PB.onError('Invalid context.')
    }

    PB.M.Forum.metaFields.push(fieldInfo);
    for (var i=0; i<context.length; i++) {
        if (excludeContext.indexOf(context[i]) != -1)
            continue;
        var contextFields = PB.M.Forum.context[context[i]] || [];
        contextFields.push(fieldInfo.name);
        PB.M.Forum.context[context[i]] = contextFields;
    }
}

PB.M.Forum.addMetaFields(
    {name: 'reply privacy',
     type: 'pulldown',
     enum: ['', 'public', 'private', 'anonymous', 'invisible'],
     defaultValue: ''});

PB.M.Forum.addMetaFields(
    {name: 'content license',
     type: 'pulldown',
     enum: ['', 'CreativeCommonsAttribution', 'GNUPublicLicense', 'Publicdomain', 'Rights-managed', 'Royalty-free'],
     defaultValue: ''});

PB.M.Forum.addMetaFields(
    {name: 'tags',
     type: 'array',
     validator: function(v){return /^[a-z0-9]+$/i.test(v)}
     },
    false, 'profile');

PB.M.Forum.addMetaFields(
    {name: 'language',
     type: 'text',
     defaultValue: function(){return puffworldprops.view.language}});

PB.M.Forum.addMetaFields(
    {name: 'name',
     type: 'text'},
    'profile');