/*

    Network library for the EveryBit platform.

    Contains a peer.js-based p2p layer, a promise-based XHR implementation, 
    helper functions for accessing various server-based APIs, 
    and helper functions for handling puff distribution and acquisition.

    Copyright 2014 EveryBit. See README for license information.

 */

EB.Net = {}

/**
 * Fire up networks (currently just the peer connections)
 */
EB.Net.init = function() {
    EB.Net.P2P.init()
}

/**
 * Given a signature, return puff with that signature
 * @param  {string} sig signature of a puff
 * @return {object}     puff corresponds to the specified signature
 */
EB.Net.getPuffBySig = function(sig) {
    var url  = EB.CONFIG.puffApi
    var data = {type: 'getPuffBySig', sig: sig}
    
    return EB.Net.EBgetJSON(url, data)
}

EB.Net.getKidSigs = function(sig) {
    var url  = EB.CONFIG.puffApi
    var data = {type: 'getChildrenBySig', sig: sig}
    
    return EB.Net.EBgetJSON(url, data)
}

EB.Net.getKidSigs = Boron.memoize(EB.Net.getKidSigs) // THINK: this assumes we'll get all new things over the P2P network, which won't always be true.



EB.Net.getStarShells = function() {
    var url  = EB.CONFIG.puffApi
    var data = {type: 'getPuffs', contentType: 'star', numb: EB.CONFIG.globalBigBatchLimit}
    
    return EB.Net.EBgetJSON(url, data)
}

EB.Net.getConversationPuffs = function(convoId, batchsize, offset, fullOrShell) {
    convoId  = convoId.replace('&',',')

    var url  = EB.CONFIG.puffApi
    var data = { type: 'getPuffs', contentType: 'encryptedpuff'
               , conversationPartners: convoId
               , numb: batchsize
               , offset: offset
               }
    
    return EB.Net.EBgetJSON(url, data)
}

EB.Net.getMyPrivatePuffs = function(username, batchsize, offset, fullOrShell) {
    if(!username) return EB.emptyPromise()
    batchsize = batchsize || EB.CONFIG.globalBigBatchLimit
    
    var url  = EB.CONFIG.puffApi
    var data = { route: username, username: username, fromAndTo: 1
               , type: 'getPuffs', contentType: 'encryptedpuff'
               , fullOrShell: fullOrShell || 'full'
               , numb: batchsize
               , offset: offset
               }
    
    return EB.Net.EBgetJSON(url, data)
    
/*

    So something like:

    EB.getSomePuffs(query, limit, etc)

    helper.js:
    tryGettingMorePuffs(visibleLimit) {
        // figure out how many we've requested already (EB.currentOffset)
        // figure out how many we actually have (EB.Data.getDecryptedPuffs)
        var delta = visibleLimit - EB.Data.getDecryptedPuffs().length
        EB.currentOffset += delta
        return EB.getSomePuffs(query, EB.currentOffset)
    }


*/ 

    // TODO: chain this in to the table view
    
}


EB.Net.getProfilePuff = function(username) {
    var url  = EB.CONFIG.puffApi
    var data = { username: username
               , fullOrShell: 'full'
               , contentType: 'profile'
               , type: 'getPuffs'
               , sort: 'DESC'
               , numb: 1
               }
    
    return EB.Net.EBgetJSON(url, data)
}

EB.Net.getProfilePuff = EB.promiseMemoize(EB.Net.getProfilePuff)


/**
 * to get some shells
 * @param {string} query
 * @param {string} filters
 * @param {number} limit
 * @param {number} offset
 * @returns {Shell[]}
 */
EB.Net.getSomeShells = function(query, filters, limit, offset) {
    // TODO: switching by query 'mode' will need to be changed when the network api matches our local api (i.e. once we use browser p2p & headless clients to service requests)
    
    var mode = query.mode
    // if(mode == 'ancestors')   return EB.Net.getAncestors  ([query.focus], limit)
    // if(mode == 'descendants') return EB.Net.getDescendants([query.focus], limit)
    // if(mode == 'siblings')    return EB.Net.getSiblings   ([query.focus], limit)

    // "normal" mode (just ask for shells from lists or something)
    var url  = EB.CONFIG.puffApi

    //  if(filters.types)   data.type       = filters.types      // filter by types

    var data = {type: 'getPuffs', contentType: 'plain'}
    // var data = {type: 'getPuffs', contentType: '["image"]'}


    if(limit)  data.numb    = limit                         // defaults to 20 on the server
    if(offset) data.offset  = offset                        // defaults to 0, which is latest
    
    if(query.sort)      data.sort        = query.sort       // ASC or DESC
    if(filters.users)   data.username    = filters.users    // filter by username
    if(filters.routes)  data.route       = filters.routes   // filter by route
    if(filters.tags)    data.tags        = filters.tags     // filter by tags
    if(filters.types)   data.contentType = filters.types    // filter by types
    if(query.ancestors) data.maxParents  = query.ancestors  // defaults to all shells 
                                                            // 0 is roots, 1 is single parent, etc
    // data.flagged = false
    
    // data.focus
    // data.ancestors
    // data.descendants
    
    var filterstring = JSON.stringify(filters.types)
    var profile_request = (filterstring == '["profile"]')
    
    if(EB.CONFIG.disableReceivePublic && !profile_request)
        return EB.emptyPromise()
                 .then(function() {return []})
    
    return EB.Net.EBgetJSON(url, data)                      // always returns a valid array
                 .then(function(x) {return x || []}, function() {return []})
}


/**
 * add puff to the server and broadcast to peers
 * @param  {object} puff the puff to be added to the server
 */
EB.Net.distributePuff = function(puff) {
    //// distribute a puff to the network

    if(EB.CONFIG.disableSendToServer) return false          // so you can work locally

    if(EB.CONFIG.netblockSuffix) {                          // block distribution of local puffs
        var usernames = [puff.username]
        if(puff.keys)
            usernames = usernames.concat(Object.keys(puff.keys))

        usernames = usernames.map(EB.Users.justUsername)
        var suffixes = usernames.map(function(username) {
            var chunks = username.split('.')
            return chunks[chunks.length-1]
        })
        
        if(suffixes.indexOf(EB.CONFIG.netblockSuffix) > -1)
            return false
    }

    EB.Net.sendPuffToServer(puff)                           // add it to the server's pufflist

    EB.Net.P2P.sendPuffToPeers(puff)                        // broadcast it to peers
}

/**
 * add a puff to the server's pufflist
 * @param  {object} puff
 * @return {object}
 */
EB.Net.sendPuffToServer = function(puff) {
    // THINK: this is fire-and-forget, but we should do something smart if the network is offline or it otherwise fails. 
    //        on the other hand, we'll probably want to do this with sockets instead of ajax ultimately...
    //        or manage it entirely with routing, even for server-sent puffs?
    
    var data = { type: 'addPuff'
               , puff: JSON.stringify(puff) }
               
    return EB.Net.EBpost(EB.CONFIG.puffApi, data)
                 .catch(EB.catchError('Could not send puff to server'))
}

/**
 * fetch a particular userRecord
 * @param  {string}  username 
 * @param  {string}  capa 
 * @return {promise} on fulfilled passes the user record as object, otherwise re-throw error
 */
EB.Net.getUserRecord = function(username, capa) {
    var url   = EB.CONFIG.userApi
    
    var versionedUsername = EB.Users.makeVersioned(username, capa)
    username = EB.Users.justUsername(versionedUsername)
    
    if(capa !== 0) // 0 signals that we need to fetch the latest userRecord
        capa = EB.Users.justCapa(versionedUsername)
    
    var data  = { type: 'getUser'
                , username: username
                }

    if(capa)
        data.capa = capa

    return EB.Net.EBgetJSON(url, data)
}


/**
 * modify a user record
 * @param  {puff}   puff a signed puff containing information of modified user record
 * @return {object} promise for new userRecord or error when the update fails
 */
EB.Net.updateUserRecord = function(puff) {
    var data = { type: 'updateUsingPuff'
               , puff: puff
               }

    var prom = EB.Net.EBpost(EB.CONFIG.userApi, data)
    
    return prom.catch(EB.catchError('Sending user record modification puff failed'))
               .then(JSON.parse) // THINK: this throws on invalid JSON
               .then(function(userRecord) {
                   return EB.Users.process(userRecord)
                       || EB.throwError('Invalid user record', JSON.stringify(userRecord))
               })
}



/**
 * EB.Net promise-based XHR layer
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
EB.Net.xhr = function(url, options, data) {
    //// very simple promise-based XHR implementation
    
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest()
        req.open(options.method || 'GET', url)
        
        Object.keys(options.headers || {}).forEach(function (key) {
            req.setRequestHeader(key, options.headers[key])
        })
        
        var formdata = new FormData()
        Object.keys(data || {}).forEach(function (key) {
            var datum = typeof data[key] == 'object' ? EB.stringifyJSON(data[key]) : data[key]
            formdata.append(key, datum)
        })
        
        if(options && options.type)
            req.responseType = options.type
                
        req.onload = function() {
            if(req.status != 200) // silly safari
                return reject(EB.makeError(req.statusText))
            
            if(req.responseType == 'json' && req.response === null) // NOTE: traps JSONified 'null' responses also: use empty string or [] to indicate an empty result
                return reject(EB.makeError("Invalid JSON in response", req.response))
            
            resolve( (req.responseType != options.type) // manually convert json for old browsers
                  && options.type == 'json' ? EB.parseJSON(req.response) : req.response)
        }

        req.onerror = function(event) {
            reject(EB.makeError("Network Error", event, 'networkError'))
        }
        
        req.ontimeout = function(event) {
            reject(EB.makeError("Timeout Error", event, 'timeoutError'))
        }
        
        req.timeout = EB.CONFIG.networkTimeout

        req.send(formdata)
    })
}

/**
 * request an url, get result in JSON
 * @param  {string} url    
 * @param  {object} params 
 * @return {object}
 */
EB.Net.getJSON = function(url, params) {
    var options = { headers: { 'Accept': 'application/json' }
                  ,  method: 'GET'
                  ,    type: 'json'
                  }

    var params = params || {}
    var enc = function(param) {return !param && param!==0 ? '' : encodeURIComponent(param)}
    var qstring = Object.keys(params).reduce(function(acc, key) {return acc + enc(key) +'='+ enc(params[key]) +'&'}, '?')

    return EB.Net.xhr(url + qstring, options) 
}


/**
 * send a post request
 * @param  {string} url  requested url
 * @param  {object} data 
 * @return {object}
 */
EB.Net.post = function(url, data) {
    var options = { headers: {   
//         'Content-type': 'application/x-www-form-urlencoded' 
//                           , 'Content-length': params.length
//                           ,     'Connection': 'close'  
                             }
                  ,  method: 'POST'
                  }

    return EB.Net.xhr(url, options, data)
}



/**
 * A customized wrapper for the EveryBit server over the base XHR promise wrapper
 * @param  {string} url    
 * @param  {object} params 
 * @return {object}
 */
EB.Net.EBxhr = function(url, options, data) {
    var prom = EB.Net.xhr(url, options, data)
        
    return prom.then(function(response) {
        if(response.FAIL)
            return EB.throwDHTError(response.FAIL)

        if(typeof response == 'string' && response.slice(0,6) == '{"FAIL')
            return EB.throwDHTError((EB.parseJSON(response)||{}).FAIL)

        EB.runHandlers('networkresponse', response)
        
        return response
    })
}

EB.Net.EBpost = function(url, data) {
    //// This is the EveryBit server version of EB.Net.getJSON -- use that function if you're not accessing the EveryBit server
    // THINK: should we parametrize over the dispatch function?
    var options = { headers: {}
                  ,  method: 'POST'
                  }
                  
    return EB.Net.EBxhr(url, options, data)
}

EB.Net.EBgetJSON = function(url, params) {
    //// This is the EveryBit server version of EB.Net.getJSON -- use that function if you're not accessing the EveryBit server
    // THINK: should we parametrize over the dispatch function?
    var options = { headers: { 'Accept': 'application/json' }
                  ,  method: 'GET'
                  ,    type: 'json'
                  }

    var params = params || {}
    var enc = function(param) {return !param && param!==0 ? '' : encodeURIComponent(param)}
    var qstring = Object.keys(params).reduce(function(acc, key) {return acc + enc(key) +'='+ enc(params[key]) +'&'}, '?')

    return EB.Net.EBxhr(url + qstring, options) 
}








/*

    EB.Net Peer-to-Peer layer

    We're currently using peer.js to negotiate the WebRTC connection. There's a lot of work left to be done here.

*/


EB.Net.P2P = {}
EB.Net.P2P.peers = {}

/**
 * initialize the peer-to-peer layer
 */
EB.Net.P2P.init = function() {
    // NOTE: you have to manually enable the P2P layer via config or init options
    // e.g. EB.init({enableP2P: true})
    // or   EB.CONFIG.enableP2P = true
    if(!EB.CONFIG.enableP2P) return false
    
    EB.Net.P2P.Peer = new Peer({ host:  '162.219.162.56'
                               , port:  9000
                               , path:  '/'
                               , debug: 1
                               })
    
    EB.Net.P2P.Peer.on('open', EB.Net.P2P.openPeerConnection)
    EB.Net.P2P.Peer.on('connection', EB.Net.P2P.connection)
}

/**
 * to reload peers
 * @return {object} 
 */
EB.Net.P2P.reloadPeers = function() {
    return EB.Net.P2P.Peer.listAllPeers(EB.Net.P2P.handlePeers)
}

/**
 * open peer connection
 * @param  {string} id 
 * @return {object[]}
 */
EB.Net.P2P.openPeerConnection = function(id) {
    // OPT: do we really need this? 
    // THINK: why not just call EB.Net.P2P.reloadPeers?
    return EB.Net.P2P.Peer.listAllPeers(EB.Net.P2P.handlePeers)
}

/**
 * connection
 * @param connection
 * @returns {*}
 */
EB.Net.P2P.connection = function(connection) {
    EB.Net.P2P.reloadPeers() // OPT: do we really need this? 

    return connection.on('data', function(data) {
        EB.Data.addShellsThenMakeAvailable(data) // TODO: pass a callback in to EB.Net instead of calling this directly
    })
}

/**
 * to handle peers
 * @param  {object} peers 
 * @return {boolean}   
 */
EB.Net.P2P.handlePeers = function(peers) {
    peers.forEach(function(peer) {
        if(EB.Net.P2P.peers[peer]) 
            return false
        EB.Net.P2P.peers[peer] = EB.Net.P2P.Peer.connect(peer)
    })
}

/**
 * to send puff to peers
 * @param  {object} puff
 */
EB.Net.P2P.sendPuffToPeers = function(puff) {
    for(var peer in EB.Net.P2P.peers) {
        EB.Net.P2P.peers[peer].send(puff)
    }
}











// EB.Net.getAncestors = function(start, limit) {
//     getEm(start, [], limit)
//     return EB.emptyPromise()
//
//     function getEm(todo, done, remaining) {
//         if(!todo.length) return false                       // all done
//         if(!remaining) return false                         // all done
//
//         var sig = todo[0]
//
//         if(~done.indexOf(sig)) {
//             return getEm(todo.slice(1), done, remaining)    // we've already done this one
//         }
//
//         // TODO: set a callback in EB.Net instead of calling EB.Data directly
//         var puff = EB.Data.getPuffBySig(sig)                // effectful
//
//         if(puff)
//             return getEm(todo.slice(1).concat(puff.payload.parents), done.concat(sig), remaining)
//
//         // no puff? that's ok. attach a then clause to its pending promise.
//         // TODO: find better method to do this
//         remaining-- // because we're adding a new puff, or at least new content
//         var prom = EB.Data.pendingPuffPromises[sig]
//         prom.then(function(puffs) {
//             getEm(todo.slice(1).concat(((puffs[0]||{}).payload||{}).parents), done.concat(sig), remaining)
//         })
//     }
//
//     //
//     // if(!todo.length)
//     //     return Promise.resolve(results)             // all done
//     // if(results.length >= limit)
//     //     return Promise.resolve(results)             // all done
//     //
//     // var sig = todo[0]
//     // var shell = EB.Data.getCachedShellBySig(sig)   // TODO: set a callback in EB.Net instead of calling this directly
//     //          || results.filter(function(result) {return result.sig == sig})[0]
//     //
//     // // if we already have a puff for sig, then we just need to put its parents on the todo stack
//     // if(shell) {
//     //     todo.shift() // take off the shell we just worked on
//     //     return EB.Net.getAncestors(todo.concat(shell.payload.parents), limit, results)
//     // }
//     //
//     // // otherwise, get a promise for the shell, then add it to results
//     // var prom = EB.Net.getPuffBySig(sig)
//     // return prom.then(function(puffs) {
//     //     return EB.Net.getAncestors(todo, limit, results.concat(puffs))
//     // })
// }

// EB.Net.getDescendants = function(start, limit) {
//     getEm(start, [], limit)
//     return EB.emptyPromise()
//
//     function getEm(todo, done, remaining) {
//         if(!todo.length) return false                       // all done
//         if(!remaining) return false                         // all done
//
//         var sig = todo[0]
//
//         if(~done.indexOf(sig)) {
//             return getEm(todo.slice(1), done, remaining)    // we've already done this one
//         }
//
//         // TODO: set a callback in EB.Net instead of calling EB.Data directly
//         var haveShell = EB.Data.getCachedShellBySig(sig)
//
//         if(!haveShell) {                                    // we don't have the shell yet, so go get it
//             // TODO: use above callback to EB.Data
//             EB.Data.getPuffBySig(sig)                       // effectful
//             remaining--
//         }
//
//         var kidsigprom = EB.Net.getKidSigs(sig)             // get all its children
//         return kidsigprom.then(function(kidsigs) {
//             getEm(todo.slice(1).concat(kidsigs), done.concat(sig), remaining)
//         })
//     }
// }

// EB.Net.getSiblings = function() {
//     // this case is ugly, so we're leaving it until the client api can answer questions for us
//     return EB.emptyPromise()
// }
