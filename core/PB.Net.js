/*

    Network library for the EveryBit platform.

    Contains a peer.js-based p2p layer, a promise-based XHR implementation, 
    helper functions for accessing various server-based APIs, 
    and helper functions for handling puff distribution and acquisition.

    Copyright 2014 EveryBit. See README for license information.

 */

PB.Net = {};

/**
 * fire up networks (currently just the peer connections)
 */
PB.Net.init = function() {
    if(PB.CONFIG.noNetwork) return false                   // THINK: this is only for debugging and development
    
    PB.Net.P2P.init();
}

/**
 * given a signature, return puff with that signature
 * @param  {string} sig signature of a puff
 * @return {object}     puff corresponds to the specified signature
 */
PB.Net.getPuffBySig = function(sig) {
    var url  = PB.CONFIG.puffApi;
    var data = {type: 'getPuffBySig', sig: sig};
    
    return PB.Net.getJSON(url, data);
}

PB.Net.getKidSigs = function(sig) {
    var url  = PB.CONFIG.puffApi;
    var data = {type: 'getChildrenBySig', sig: sig};
    
    return PB.Net.getJSON(url, data);
}

PB.Net.getKidSigs = Boron.memoize(PB.Net.getKidSigs) // THINK: this assumes we'll get all new things over the P2P network, which won't always be true. // TODO: rework this later



PB.Net.getStarShells = function() {
    var url  = PB.CONFIG.puffApi;
    var data = {type: 'getPuffs', contentType: 'star', numb: PB.CONFIG.globalBigBatchLimit};
    
    return PB.Net.getJSON(url, data);
}

PB.Net.getConversationPuffs = function(convoId, batchsize, offset, fullOrShell) {
    convoId  = convoId.replace('&',',')

    var url  = PB.CONFIG.puffApi
    var data = { type: 'getPuffs', contentType: 'encryptedpuff'
               , conversationPartners: convoId
               , numb: batchsize
               , offset: offset
               }
    
    return PB.Net.getJSON(url, data)
}

PB.Net.getMyPrivatePuffs = function(username, batchsize, offset, fullOrShell) {
    if(!username) return PB.emptyPromise()
    batchsize = batchsize || PB.CONFIG.globalBigBatchLimit
    
    var url  = PB.CONFIG.puffApi
    var data = { route: username, username: username, fromAndTo: 1
               , type: 'getPuffs', contentType: 'encryptedpuff'
               , fullOrShell: fullOrShell || 'full'
               , numb: batchsize
               , offset: offset
               }
    
    return PB.Net.getJSON(url, data)
    
/*

    So something like:

    PB.getSomePuffs(query, limit, etc)

    helper.js:
    tryGettingMorePuffs(visibleLimit) {
        // figure out how many we've requested already (ICX.currentOffset)
        // figure out how many we actually have (PB.Data.getDecryptedPuffs)
        var delta = visibleLimit - PB.Data.getDecryptedPuffs().length
        ICX.currentOffset += delta
        return PB.getSomePuffs(query, ICX.currentOffset)
    }


*/ 

    // TODO: put a timeout in xhr
    // TODO: chain this in to the table view
    
    // https://i.cx/api/puffs/api.php?conversationPartners=mattasher,icx.adamrafeek&contentType=encryptedpuff&fullOrShell=shell&type=getPuffs&numb=10
}


PB.Net.getProfilePuff = function(username) {
    var url  = PB.CONFIG.puffApi
    var data = { username: username
               , fullOrShell: 'full'
               , contentType: 'profile'
               , type: 'getPuffs'
               , sort: 'DESC'
               , numb: 1
               }
    
    return PB.Net.getJSON(url, data)
}

PB.Net.getProfilePuff = PB.promiseMemoize(PB.Net.getProfilePuff)

/**
 * to get some shells
 * @param {string} query
 * @param {string} filters
 * @param {number} limit
 * @param {number} offset
 * @returns {Shell[]}
 */
PB.Net.getSomeShells = function(query, filters, limit, offset) {
    // TODO: switching by query 'mode' is kind of a hack. we're doing it for now until the network api matches our local api (i.e. once we use browser p2p &headless clients to service requests)
    
    var mode = query.mode
    if(mode == 'ancestors')   return PB.Net.getAncestors  ([query.focus], limit)
    if(mode == 'descendants') return PB.Net.getDescendants([query.focus], limit)
    // if(mode == 'siblings')    return PB.Net.getSiblings   ([query.focus], limit)

    // "normal" mode (just ask for shells from lists or something)
    var url  = PB.CONFIG.puffApi;

    //  if(filters.types)   data.type       = filters.types      // filter by types

    var data = {type: 'getPuffs', contentType: 'plain'};
    // var data = {type: 'getPuffs', contentType: '["image"]'};


    if(limit)  data.numb    = limit                         // defaults to 20 on the server
    if(offset) data.offset  = offset                        // defaults to 0, which is latest
    
    if(query.sort)      data.sort        = query.sort       // ASC or DESC
    if(filters.users)   data.username    = filters.users    // filter by username
    if(filters.routes)  data.route       = filters.routes   // filter by route
    if(filters.tags)    data.tags        = filters.tags     // filter by tags
    if(filters.types)   data.contentType = filters.types    // filter by types
    if(query.ancestors) data.maxParents  = query.ancestors  // defaults to all shells; 
                                                            // 0 is roots, 1 is single parent, etc
    // data.flagged = false
    
    // data.focus
    // data.ancestors
    // data.descendants
    
    var filterstring = JSON.stringify(filters.types)
    var profile_request = (filterstring == '["profile"]')
    
    if(PB.CONFIG.noNetwork && !profile_request)                // THINK: this is only for debugging and development
        return PB.emptyPromise()
                 .then(function() {return []});
    
    return PB.Net.getJSON(url, data)                        // always returns a valid array
                  .then(function(x) {return x || []}, function() {return []})
}

PB.Net.getAncestors = function(start, limit) {
    getEm(start, [], limit)
    return PB.emptyPromise()
    
    function getEm(todo, done, remaining) {
        if(!todo.length) return false                       // all done
        if(!remaining) return false                         // all done
    
        var sig = todo[0]
    
        if(~done.indexOf(sig)) {
            return getEm(todo.slice(1), done, remaining)    // we've already done this one
        }
        
        // TODO: set a callback in PB.Net instead of calling PB.Data directly
        var puff = PB.Data.getPuffBySig(sig)                // effectful
    
        if(puff) 
            return getEm(todo.slice(1).concat(puff.payload.parents), done.concat(sig), remaining)

        // no puff? that's ok. attach a then clause to its pending promise. // TODO: this is a major hack
        remaining-- // because we're adding a new puff, or at least new content
        var prom = PB.Data.pendingPuffPromises[sig]
        prom.then(function(puffs) {
            getEm(todo.slice(1).concat(((puffs[0]||{}).payload||{}).parents), done.concat(sig), remaining)
        })
    }
    
    //
    // if(!todo.length)
    //     return Promise.resolve(results)             // all done
    // if(results.length >= limit)
    //     return Promise.resolve(results)             // all done
    //
    // var sig = todo[0]
    // var shell = PB.Data.getCachedShellBySig(sig)   // TODO: set a callback in PB.Net instead of calling this directly
    //          || results.filter(function(result) {return result.sig == sig})[0]
    //
    // // if we already have a puff for sig, then we just need to put its parents on the todo stack
    // if(shell) {
    //     todo.shift() // take off the shell we just worked on
    //     return PB.Net.getAncestors(todo.concat(shell.payload.parents), limit, results)
    // }
    //
    // // otherwise, get a promise for the shell, then add it to results
    // var prom = PB.Net.getPuffBySig(sig)
    // return prom.then(function(puffs) {
    //     return PB.Net.getAncestors(todo, limit, results.concat(puffs))
    // })
}

PB.Net.getDescendants = function(start, limit) {
    getEm(start, [], limit)
    return PB.emptyPromise()
    
    function getEm(todo, done, remaining) {
        if(!todo.length) return false               // all done
        if(!remaining) return false                 // all done
        
        var sig = todo[0]
        
        if(~done.indexOf(sig)) {
            return getEm(todo.slice(1), done, remaining) // we've already done this one
        }
        
        // TODO: set a callback in PB.Net instead of calling PB.Data directly
        var haveShell = PB.Data.getCachedShellBySig(sig) 
        
        if(!haveShell) { // we don't have the shell yet, so go get it
            // TODO: callback PB.Data erg merb lerb herp derp
            PB.Data.getPuffBySig(sig)               // effectful
            remaining--
        }
        
        var kidsigprom = PB.Net.getKidSigs(sig)     // get all its children
        return kidsigprom.then(function(kidsigs) {
            getEm(todo.slice(1).concat(kidsigs), done.concat(sig), remaining)
        })
    }
}

PB.Net.getSiblings = function() {
    // this case is ugly, so we're leaving it until the client api can answer questions for us
    return PB.emptyPromise() 
}

/**
 * add puff to the server and broadcast to peers
 * @param  {object} puff the puff to be added to the server
 */
PB.Net.distributePuff = function(puff) {
    //// distribute a puff to the network

    if(PB.CONFIG.noNetwork && !PB.CONFIG.icxmode) return false; // THINK: this is only for debugging and development

    PB.Net.sendPuffToServer(puff);                        // add it to the server's pufflist

    PB.Net.P2P.sendPuffToPeers(puff);                     // broadcast it to peers
}

/**
 * add a puff to the server's pufflist
 * @param  {object} puff
 * @return {object}
 */
PB.Net.sendPuffToServer = function(puff) {
    // THINK: this is fire-and-forget, but we should do something smart if the network is offline or it otherwise fails. 
    //        on the other hand, we'll probably want to do this with sockets instead of ajax ultimately...
    //        or manage it entirely with routing, even for server-sent puffs?
    
    var data = { type: 'addPuff'
               , puff: JSON.stringify(puff) }
               
    return PB.Net.post(PB.CONFIG.puffApi, data)
                 .then(function(response) { 
                     if(response.slice(0,6) == '{"FAIL')
                         PB.throwError(response)
                  }) 
                 .catch(PB.catchError('Could not send puff to server'));
}

/**
 * fetch a particular userRecord
 * @param  {string}  username 
 * @param  {string}  capa 
 * @return {promise} on fulfilled passes the user record as object, otherwise re-throw error
 */
PB.Net.getUserRecord = function(username, capa) {
    var url   = PB.CONFIG.userApi
    
    var versionedUsername = PB.Users.makeVersioned(username, capa)
    username = PB.Users.justUsername(versionedUsername)
    
    if(capa !== 0) // 0 signals that we need to fetch the latest userRecord
        capa = PB.Users.justCapa(versionedUsername)
    
    var data  = { type: 'getUser'
                , username: username
                }

    if(capa)
        data.capa = capa

    return PB.Net.getJSON(url, data)
}


/**
 * modify a user record
 * @param  {puff}   puff a signed puff containing information of modified user record
 * @return {object} promise for new userRecord or error when the update fails
 */
PB.Net.updateUserRecord = function(puff) {
    var data = { type: 'updateUsingPuff'
               , puff: puff
               }

    var prom = PB.Net.post(PB.CONFIG.userApi, data)
    
    return prom.catch(PB.catchError('Sending user record modification puff failed miserably'))
               .then(JSON.parse) // THINK: this throws on invalid JSON
               .then(function(userRecord) {
                   if(!userRecord.username) 
                       PB.throwError('The DHT did not approve of your request', userRecord.FAIL)
                       
                   return PB.Users.process(userRecord)
                       || PB.throwError('Invalid user record', JSON.stringify(userRecord))
               })
}



/**
 * PB.Net promise-based XHR layer
 * 
 * We use promises as our default concurrency construct, 
 * because ultimately this platform is composed of a 
 * huge set of interdependent async calls which mostly 
 * each resolve to a single immutable entity 
 * -- aka the promise sweet spot.
 * 
 * @param  {string} url     requested url
 * @param  {object} options 
 * @param  {object} data    
 * @return {object}
 */
PB.Net.xhr = function(url, options, data) {
    //// very simple promise-based XHR implementation
    
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(options.method || 'GET', url);
        
        Object.keys(options.headers || {}).forEach(function (key) {
            req.setRequestHeader(key, options.headers[key]);
        });
        
        var formdata = new FormData()
        Object.keys(data || {}).forEach(function (key) {
            var datum = typeof data[key] == 'object' ? JSON.stringify(data[key]) : data[key];
            formdata.append(key, datum);
        });
        
        if(options && options.type)
            req.responseType = options.type;
                
        req.onload = function() {
            if(req.status != 200) // silly safari
                return reject(PB.makeError(req.statusText));
            
            if(req.responseType == 'json' && req.response === null) // NOTE: traps JSONified 'null' responses also: use empty string or [] to indicate an empty result
                return reject(PB.makeError("Invalid JSON in response"));
            
            resolve( (req.responseType != options.type) // manually convert json for old browsers
                  && options.type == 'json' ? PB.parseJSON(req.response) : req.response);
        };

        req.onerror = function(event) {
            reject(PB.makeError("Network Error", event));
        };
        
        //// TODO: add xhr.ontimeout

        req.send(formdata);
    });
}

/**
 * request an url, get result in JSON
 * @param  {string} url    
 * @param  {object} params 
 * @return {object}
 */
PB.Net.getJSON = function(url, params) {
    var options = { headers: { 'Accept': 'application/json' }
                  ,  method: 'GET'
                  ,    type: 'json'
                  }

    var params = params || {}
    var enc = function(param) {return !param && param!==0 ? '' : encodeURIComponent(param)}
    var qstring = Object.keys(params).reduce(function(acc, key) {return acc + enc(key) +'='+ enc(params[key]) +'&'}, '?')

    return PB.Net.xhr(url + qstring, options) 
}

/**
 * send a post request
 * @param  {string} url  requested url
 * @param  {object} data 
 * @return {object}
 */
PB.Net.post = function(url, data) {
    var options = { headers: {   
//         'Content-type': 'application/x-www-form-urlencoded' 
//                           , 'Content-length': params.length
//                           ,     'Connection': 'close'  
                             }
                  ,  method: 'POST'
                  }

    return PB.Net.xhr(url, options, data)
}




/*

    PB.Net Peer-to-Peer layer

    We're currently using peer.js to negotiate the WebRTC connection. There's a lot of work left to be done here.

*/


PB.Net.P2P = {};
PB.Net.P2P.peers = {};

/**
 * initialize the peer-to-peer layer
 */
PB.Net.P2P.init = function() {
    PB.Net.P2P.Peer = new Peer({   host: '162.219.162.56'
                                 ,  port: 9000
                                 ,  path: '/'
                                 , debug: 1
                                 });
    
    PB.Net.P2P.Peer.on('open', PB.Net.P2P.openPeerConnection);
    PB.Net.P2P.Peer.on('connection', PB.Net.P2P.connection);
}

/**
 * to reload peers
 * @return {object} 
 */
PB.Net.P2P.reloadPeers = function() {
    return PB.Net.P2P.Peer.listAllPeers(PB.Net.P2P.handlePeers);
};

/**
 * open peer connection
 * @param  {string} id 
 * @return {object[]}
 */
PB.Net.P2P.openPeerConnection = function(id) {
    // OPT: do we really need this? 
    // THINK: why not just call PB.Net.P2P.reloadPeers?
    return PB.Net.P2P.Peer.listAllPeers(PB.Net.P2P.handlePeers);
};

/**
 * connection
 * @param connection
 * @returns {*}
 */
PB.Net.P2P.connection = function(connection) {
    PB.Net.P2P.reloadPeers(); // OPT: do we really need this? 

    return connection.on('data', function(data) {
        PB.Data.addShellsThenMakeAvailable(data); // TODO: pass a callback in to PB.Net instead of calling this directly
    });
};

/**
 * to handle peers
 * @param  {object} peers 
 * @return {boolean}   
 */
PB.Net.P2P.handlePeers = function(peers) {
    peers.forEach(function(peer) {
        if(PB.Net.P2P.peers[peer]) 
            return false;
        PB.Net.P2P.peers[peer] = PB.Net.P2P.Peer.connect(peer);
    });
};

/**
 * to send puff to peers
 * @param  {object} puff
 */
PB.Net.P2P.sendPuffToPeers = function(puff) {
    for(var peer in PB.Net.P2P.peers) {
        PB.Net.P2P.peers[peer].send(puff)
    }
}