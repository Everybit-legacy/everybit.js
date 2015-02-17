/* 
     _  _  ____  ____  ____   __    ___  ____  ____ 
    ( \/ )(  __)/ ___)/ ___) / _\  / __)(  __)/ ___)
    / \/ \ ) _) \___ \\___ \/    \( (_ \ ) _) \___ \
    \_)(_/(____)(____/(____/\_/\_/ \___/(____)(____/  
  
  When included this module adds two passive enhancements:
  - all puffs receive a payload.time field containing the current time in milliseconds
  - any puff containing an array of signatures in the payload.parents field will have have those parents lifted in to the graph

*/

EB.M.Messages = {}

EB.M.Messages.init = function() {
    EB.addRelationshipHandler(EB.M.Messages.addFamilialEdges)              // manages parent-child relationships
    EB.addPayloadModifierHandler(EB.M.Messages.addTimestamp)               // add timestamp to all new puffs
}


EB.M.Messages.addTimestamp = function(payload) {
    payload = payload || {}
    payload.time = payload.time || Date.now()
    return payload
}


EB.M.Messages.addFamilialEdges = function(shells) {
    shells.forEach(EB.M.Messages.addFamilialEdgesForShell)
}

EB.M.Messages.addFamilialEdgesForShell = function(child) {
    var addParentEdges = EB.M.Messages.addFamilialEdgesForParent(child);
    (child.payload.parents||[]).forEach(addParentEdges);
}

EB.M.Messages.addFamilialEdgesForParent = function(child) {
    var existingParents = EB.Data.graph.v(child.sig).out('parent').property('shell').run().map(EB.prop('sig'))
    
    return function(parentSig) {
        if(~existingParents.indexOf(parentSig)) return false                       // done?
        EB.Data.addSigAsVertex(parentSig)                                          // idempotent
        EB.Data.graph.addEdge({_label: 'parent', _in: parentSig, _out: child.sig}) // not idempotent
        EB.Data.graph.addEdge({_label: 'child', _out: parentSig,  _in: child.sig})
    }
}

















EB.M.Messages.flagPuff = function (sig) {
    // TODO: move this out of the Message module and rewrite it

    var payload = {};
    var routes = [];
    var type = 'flagPuff';
    var content = sig;
    var puff; // variable for leaking the signed puff out of the secure zone
    
    payload.time = Date.now();

    EB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {    

        if(!currentUsername) {
            alert("You must first set your username before you can flag content");
            return false;
        }
        /*if(!currentUsername == EB.getPuffBySig(sig).username) {
            alert("You must set your identity to the author of the puff you want to flag");
        }*/
        if(!privateAdminKey) {
            alert("You must first set your private admin key before you can flag content");
            return false;
        }
    
        puff = EB.Puff.build(currentUsername, privateAdminKey, routes, type, content, payload);
    })

    var data = { type: 'flagPuff'
               , puff: puff
               };

    var prom = EB.Net.EBpost(EB.CONFIG.puffApi, data);
    
    prom = prom.then(function(result){
        // var storedShells = EB.Persist.get('shells');
        // var filteredShells = storedShells.filter(function(s){return s.sig != content && s.content != content});
        var flaggedSig = EB.Persist.get('flagged') || [];
        flaggedSig.push(content);

        // EB.Persist.save('shells', filteredShells);
        EB.Persist.save('flagged', flaggedSig);
        // reload?
        // document.location.reload();
        Events.pub('ui/flag', {});
        return result;
    })
    return prom;
}

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

// DETRITUS TO BE DEALT WITH
    
   
// /**
//  * Filter puffs according to criteria
//  * @param  {string} query
//  * @param  {string} filters
//  * @param  {number} limit
//  * @return {array} An array of puffs
//  */
// EB.M.Forum.getPuffList = function(query, filters, limit) {
//     //// returns a list of puffs
//
//     // THINK: the graph can help us here, but only if we're more clever about forming relationships and using those in our filters.
//
//     limit = limit || Infinity
//     var offset = +query.offset||0
//
//     // var shells = EB.M.Forum.getShells(query, filters)
//     var shells = EB.Data.getAllMyShells()
//
//     var filtered_shells = shells.filter(EB.M.Forum.filterByFilters(Boron.extend({}, query, filters)))
//                                 .sort(EB.M.Forum.sortByPayload) // TODO: sort by query
//
//     var sliced_shells = filtered_shells.slice(offset, offset+limit)
//
//     var puffs = sliced_shells.map(EB.Data.getPuffFromShell)
//                              .filter(Boolean)
//
//     var have = sliced_shells.length
//     // var have = puffs.length
//     if(have >= limit)
//         return puffs  // as long as we have enough filtered shells the puffs will eventually fill in empty spots
//
//     EB.Data.fillSomeSlotsPlease(limit, have, query, filters)
//
//     return puffs;
// }
//

// /**
//  * Filter puffs by prop filters
//  * @param  {string} filters
//  * @return {boolean}
//  */
// EB.M.Forum.filterByFilters = function(filters) {
//
//     if(!filters) return function() {return true}
//
//     //// get a filtering function
//     return function(shell) {
//
//         // ROUTES
//         if (filters.routes && filters.routes.length > 0) {
//             var routeMatch = false;
//             for (var i = 0; i < filters.routes.length; i++) {
//                 if (shell.routes.indexOf(filters.routes[i]) > -1) routeMatch = true;
//             }
//             if (!routeMatch) return false;
//         }
//
//         // TAGS
//         if (filters.tags && filters.tags.length > 0) {
//             if (!shell.payload.tags || !shell.payload.tags.length) {
//                 return false;
//             }
//             var tagMatch = false;
//             for (var i = 0; i < filters.tags.length; i++) {
//                 if (shell.payload.tags.indexOf(filters.tags[i]) > -1) tagMatch = true;
//             }
//             if (!tagMatch) return false;
//         }
//
//         // TYPES
//         if (filters.types && filters.types.length > 0) {
//             if (!~filters.types.indexOf(shell.payload.type)) {
//                 // console.log(shell.type)
//                 return false
//             }
//         }
//
//         // USERS
//         if(filters.users && filters.users.length > 0)
//             if(!~filters.users.indexOf(EB.Users.justUsername(shell.username))) return false
//
//
//         if(filters.roots)
//             if((shell.payload.parents||[]).length) return false
//
//         if(filters.ancestors && filters.focus) {
//             var focus = EB.getPuffBySig(filters.focus) // TODO: find better way to do this
//             if(focus.payload && !~focus.payload.parents.indexOf(shell.sig)) return false
//         }
//
//         if(filters.descendants && filters.focus)
//             if(!~shell.payload.parents.indexOf(filters.focus)) return false
//
//         // TODO: deprecate this, as it's handled above:
//         if (filters.type && filters.type.length)
//             if (!~filters.type.indexOf(shell.payload.type)) return false
//
//         return true
//     }
// }


// /**
//  * Helper for sorting by payload.time
//  * @param  {Object} a
//  * @param  {object} b
//  * @return {number} based on desired sorting order
//  */
// EB.M.Forum.sortByPayload = function(a,b) {
//     //// helper for sorting by payload.time
//     if(puffworldprops.view.query.sort == 'DESC')
//         return b.payload.time - a.payload.time;
//     else
//         return a.payload.time - b.payload.time;
// }



// /**
//  * Get the current puff's parents
//  * @param  {Object} puff
//  * @param  {Object} props
//  * @return {number} The number of parents
//  */
// EB.M.Forum.getParentCount = function(puff, props) {
//     if(!puff) return 0
//
//     var sig = puff.sig || puff
//
//     return EB.Data.graph.v(sig).out('parent').run().length
// }


// /**
//  * Get a count of the current puff's children
//  * @param  {Object} puff
//  * @return {number} The number of children
//  */
// EB.M.Forum.getChildCount = function(puff) {
//     if(!puff) return 0
//
//     var sig = puff.sig || puff
//
//     return EB.Data.graph.v(sig).out('child').run().length
// }


// // Adding default metafields to included in a puff
// EB.M.Forum.metaFields = []
// EB.M.Forum.context = {};
// EB.M.Forum.addMetaFields = function(fieldInfo, context, excludeContext) {
//     // NOTE: this isn't used outside of publishEmbed.js, but it might provide a good basis for generic/required metadata
//
//     if (!fieldInfo.name) return console.log('Invalid meta field name.');
//
//     // supported type: text, textarea, pulldown, array
//     if (!fieldInfo.type) return console.log('Invalid meta field type.');
//
//     if (!fieldInfo.validator || typeof fieldInfo.validator != 'function') {
//         fieldInfo.validator = false;
//     }
//
//     context = context || Object.keys(EB.Data.contentTypes);
//     if (typeof context == 'string') {
//         context = [context];
//     } else if (!Array.isArray(context)) {
//         return EB.onError('Invalid context.')
//     }
//
//     excludeContext = excludeContext || [];
//     if (typeof excludeContext == 'string') {
//         excludeContext = [excludeContext];
//     }else if (!Array.isArray(excludeContext)) {
//         return EB.onError('Invalid context.')
//     }
//
//     EB.M.Forum.metaFields.push(fieldInfo);
//     for (var i=0; i<context.length; i++) {
//         if (excludeContext.indexOf(context[i]) != -1)
//             continue;
//         var contextFields = EB.M.Forum.context[context[i]] || [];
//         contextFields.push(fieldInfo.name);
//         EB.M.Forum.context[context[i]] = contextFields;
//     }
// }
//
// EB.M.Forum.addMetaFields(
//     {name: 'reply privacy',
//      type: 'pulldown',
//      enum: ['', 'public', 'private', 'anonymous', 'invisible'],
//      defaultValue: ''});
//
// EB.M.Forum.addMetaFields(
//     {name: 'content license',
//      type: 'pulldown',
//      enum: ['', 'CreativeCommonsAttribution', 'GNUPublicLicense', 'Publicdomain', 'Rights-managed', 'Royalty-free'],
//      defaultValue: ''});
//
// EB.M.Forum.addMetaFields(
//     {name: 'tags',
//      type: 'array',
//      validator: function(v){return /^[a-z0-9]+$/i.test(v)}
//      },
//     false, 'profile');
//
// EB.M.Forum.addMetaFields(
//     {name: 'language',
//      type: 'text',
//      defaultValue: function(){return puffworldprops.view.language}});
//
// EB.M.Forum.addMetaFields(
//     {name: 'name',
//      type: 'text'},
//     'profile');


// /**
//  * Takes a string of content, create a puff and push it into the system
//  * @param {string} type
//  * @param {string} content
//  * @param {array} parents
//  * @param {Object} metadata
//  * @param {string[]} userRecordsForWhomToEncrypt
//  * @param {string[]} privateEnvelopeAlias
//  * @returns {promise}
//  */
// EB.M.Forum.addPost = function(type, content, parents, metadata, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
//     //// Given a string of content, create a puff and push it into the system
//
//     // ensure parents is an array
//     if(!parents) parents = []
//     if(!Array.isArray(parents)) parents = [parents]
//
//     // ensure parents contains only puff ids
//     if(parents.map(EB.getPuffBySig).filter(function(x) { return x != null }).length != parents.length)
//         return EB.emptyPromise('Those are not good parents')
//
//     // ensure parents are unique
//     parents = EB.uniquify(parents)
//
//     // find the routes using parents
//     var routes = parents.map(function(id) {
//         return EB.getPuffBySig(id).username
//     });
//     if (metadata.routes) {
//         routes = metadata.routes // THINK: this should probably merge with above instead of replacing it...
//         delete metadata['routes']
//     }
//
//     // ensure all routes are unique
//     routes = EB.uniquify(routes)
//
//     var takeUserMakePuff = EB.M.Forum.partiallyApplyPuffMaker(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
//
//     // get a user promise
//     var userprom = EB.Users.getUpToDateUserAtAnyCost()
//
//     var prom = userprom.catch(EB.catchError('Failed to add post: could not access or create a valid user'))
//                        .then(takeUserMakePuff)
//                        .catch(EB.catchError('Posting failed'))
//
//     return prom
//
//     // NOTE: any puff that has 'time' and 'parents' fields fulfills the forum interface
//     // TODO: make an official interface fulfillment thing
// }
//
//
// /**
//  * Make a puff... except the parts that require a user
//  * @param {string} type
//  * @param {string} content
//  * @param {array} parents
//  * @param {object} metadata
//  * @param {array} routes
//  * @param {array} userRecordsForWhomToEncrypt
//  * @param {array} privateEnvelopeAlias
//  * @returns {Function}
//  */
// EB.M.Forum.partiallyApplyPuffMaker = function(type, content, parents, metadata, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
//     //// Make a puff... except the parts that require a user
//
//     // THINK: if you use the same metadata object for multiple puffs your cached version of the older puffs will get messed up
//
//     var payload = metadata || {}                            // metadata becomes the basis of payload
//     payload.parents = payload.parents || parents            // ids of the parent puffs
//     payload.time = metadata.time || Date.now()              // time is always a unix timestamp
//     payload.tags = metadata.tags || []                      // an array of tags // TODO: make these work
//
//     var type  = type || 'text'
//     var routes = routes ? routes : [];
//     routes = routes.concat(EB.CONFIG.zone);
//
//     return function(userRecord) {
//         // userRecord is always an up-to-date record from the DHT, so we can use its 'latest' value here
//
//         var previous = userRecord.latest
//         var puff = EB.Puff.simpleBuild(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
//
//         return EB.Data.addPuffToSystem(puff) // THINK: this fails silently if the sig exists already
//     }
// }
