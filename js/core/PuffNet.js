/*
       _______  __   __  _______  _______  __    _  _______  _______ 
      |       ||  | |  ||       ||       ||  |  | ||       ||       |
      |    _  ||  | |  ||    ___||    ___||   |_| ||    ___||_     _|
      |   |_| ||  |_|  ||   |___ |   |___ |       ||   |___   |   |  
      |    ___||       ||    ___||    ___||  _    ||    ___|  |   |  
      |   |    |       ||   |    |   |    | | |   ||   |___   |   |  
      |___|    |_______||___|    |___|    |_|  |__||_______|  |___|  

    Network library for the puffball platform.

    Contains a peer.js-based p2p layer, a promise-based XHR implementation, 
    helper functions for accessing various server-based APIs, 
    and helper functions for handling puff distribution and acquisition.

*/

PuffNet = {};

PuffNet.init = function() {
    //// fire up the networks (currently just the peer connections)    
    PuffNet.P2P.init();
}

PuffNet.getPuffBySig = function(sig) {
    var url  = CONFIG.puffApi;
    var data = {type: 'getPuffBySig', sig: sig};
    
    return PuffNet.getJSON(url, data);
}

PuffNet.getAllPuffShells = function() {
    var url  = CONFIG.puffApi;
    var data = {type: 'getAllPuffShells'};
    
    if(CONFIG.noNetwork) return Puffball.falsePromise();    // THINK: this is only for debugging and development
    
    return PuffNet.getJSON(url, data);
}

PuffNet.getAllPuffs = function() {
    //// get all the puffs from this zone
    // TODO: add zone parameter (default to CONFIG.zone)
    
    // TODO: instead of getting all puffs, this should only get all puff shells
    //       and then we'll get missing puff content on demand.
    
    
    
    
    /// old style:
    
    
    if(CONFIG.noNetwork) 
        return Puffball.falsePromise();             // NOTE: this is only for debugging and development
    
    var url  = CONFIG.puffApi;
    // var data = {type: 'getPuffGeneration', gen: 0};
    var puffs = [];
    
    var rec = function(gen, resolve, reject) {
        PuffNet.getJSON(url, {type: 'getPuffGeneration', gen: gen})
               .then(function(data) {
                   if(!Array.isArray(data))         // server error of some kind -- probably beginning of puffs
                       return resolve(puffs);
                   puffs = puffs.concat(data);
                   rec(gen+1, resolve, reject);
               })
               .catch(function(err) {
                   rec(gen, resolve, reject);
                   // setTimeout(function() {rec(gen, resolve, reject)}, 100);
                   // reject(Puffball.promiseError('Network error while accumulating puffs')(err))
               });
    }
    
    var prom = new Promise(function (resolve, reject) {
        rec(0, resolve, reject);
    })
    
    return prom;
}

PuffNet.distributePuff = function(puff) {
    //// distribute a puff to the network

    if(CONFIG.noNetwork) return false;              // THINK: this is only for debugging and development

    PuffNet.sendPuffToServer(puff);                 // add it to the server's pufflist

    PuffNet.P2P.sendPuffToPeers(puff);              // broadcast it to peers
}

PuffNet.sendPuffToServer = function(puff) {
    // THINK: this is fire-and-forget, but we should do something smart if the network is offline or it otherwise fails. 
    //        on the other hand, we'll probably want to do this with sockets instead of ajax ultimately...
    //        or manage it entirely with routing, even for server-sent puffs?
    
    var data = { type: 'addPuff'
               , puff: JSON.stringify(puff) }
               
    return PuffNet.post(CONFIG.puffApi, data)
                  .catch(Puffball.promiseError('Could not send puff to server'));
}

PuffNet.getUserRecord = function(username) {
    // TODO: call PuffNet.getUserRecordFile, add the returned users to PuffData.users, pull username's user's info back out, cache it in LS, then do the thing you originally intended via the callback (but switch it to a promise asap because that concurrency model fits this use case better)

    var url   = CONFIG.userApi;
    var data  = {type: 'getUser', username: username};
    var prom = PuffNet.getJSON(url, data);

    return prom.then(
                function(userRecord) {
                    var userRecord = Puffball.processUserRecord(userRecord);
                    if(!userRecord)  Puffball.throwError('Invalid user record returned');
                    return userRecord;
                }
                , Puffball.promiseError('Unable to access user information from the DHT'));
}

PuffNet.getUserRecordFile = function(username) {
    var url   = CONFIG.userApi;
    var data  = {type: 'getUserFile', username: username};
    var prom = PuffNet.getJSON(url, data);
    
    return prom.then(
                function(userRecords) {
                    return userRecords.map(Puffball.processUserRecord)
                                      .filter(Boolean);
                }
                , Puffball.promiseError('Unable to access user file from the DHT'));
}

PuffNet.registerSubuser = function(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey) {
    var payload = {};
    
    payload.rootKey = rootKey;
    payload.adminKey = adminKey;
    payload.defaultKey = defaultKey;

    payload.time = Date.now();
    payload.requestedUsername = newUsername;

    var routing = []; // THINK: DHT?
    var type = 'updateUserRecord';
    var content = 'requestUsername';

    var puff = Puffball.buildPuff(signingUsername, privateAdminKey, routing, type, content, payload);
    // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

    return PuffNet.updateUserRecord(puff)
}

PuffNet.updateUserRecord = function(puff) {
    var data = { type: 'updateUsingPuff'
               , puff: puff
               };

    var prom = PuffNet.post(CONFIG.userApi, data);
    
    return prom.catch(Puffball.promiseError('Sending user record modification puff failed miserably'))
               .then(JSON.parse)
               .then(function(userRecord) {
                   if(!userRecord.username) 
                       Puffball.throwError('The DHT did not approve of your request', userRecord.FAIL);
                       
                   return Puffball.processUserRecord(userRecord)
                       || Puffball.throwError('Invalid user record', JSON.stringify(userRecord));
               })
}



/*

    PuffNet promise-based XHR layer

    We use promises as our default concurrency construct, because ultimately this platform is composed of a huge set of interdependent async calls which mostly each resolve to a single immutable entity -- aka the promise sweet spot.
    
*/



PuffNet.xhr = function(url, options, data) {
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
          if (req.status == 200) // silly safari
            resolve((req.responseType != options.type) && options.type == 'json' ? JSON.parse(req.response) : req.response);
          else 
            reject(Error(req.statusText));
        };

        req.onerror = function() {
          reject(Error("Network Error"));
        };

        req.send(formdata);
    });
}

PuffNet.getJSON = function(url, params) {
    var options = { headers: { 'Accept': 'application/json' }
                  ,  method: 'GET'
                  ,    type: 'json'
                  }

    var params = params || {}
    var enc = encodeURIComponent
    var qstring = Object.keys(params).reduce(function(acc, key) {return acc + enc(key) +'='+ enc(params[key]) +'&'}, '?')

    return PuffNet.xhr(url + qstring, options) 
}

PuffNet.post = function(url, data) {
    var options = { headers: {   
        // 'Content-type': 'application/x-www-form-urlencoded' 
//                           , 'Content-length': params.length
//                           ,     'Connection': 'close'  
                             }
                  ,  method: 'POST'
                  }

    return PuffNet.xhr(url, options, data)
}




/*

    PuffNet Peer-to-Peer layer

    We're currently using peer.js to negotiate the WebRTC connection. There's a lot of work left to be done here.

*/


PuffNet.P2P = {};
PuffNet.P2P.peers = {};

PuffNet.P2P.init = function() {
    PuffNet.P2P.Peer = new Peer({   host: '162.219.162.56'
                                 ,  port: 9000
                                 ,  path: '/'
                                 , debug: 1
                                 });
    
    PuffNet.P2P.Peer.on('open', PuffNet.P2P.openPeerConnection);
    PuffNet.P2P.Peer.on('connection', PuffNet.P2P.connection);
}

PuffNet.P2P.reloadPeers = function() {
    return PuffNet.P2P.Peer.listAllPeers(PuffNet.P2P.handlePeers);
};

PuffNet.P2P.openPeerConnection = function(id) {
    // OPT: do we really need this? 
    // THINK: why not just call PuffNet.P2P.reloadPeers?
    return PuffNet.P2P.Peer.listAllPeers(PuffNet.P2P.handlePeers);
};

PuffNet.P2P.connection = function(connection) {
    PuffNet.P2P.reloadPeers(); // OPT: do we really need this? 

    return connection.on('data', function(data) {
        Puffball.receiveNewPuffs(data);
    });
};

PuffNet.P2P.handlePeers = function(peers) {
    peers.forEach(function(peer) {
        if(PuffNet.P2P.peers[peer]) 
            return false;
        PuffNet.P2P.peers[peer] = PuffNet.P2P.Peer.connect(peer);
    });
};

PuffNet.P2P.sendPuffToPeers = function(puff) {
    for(var peer in PuffNet.P2P.peers) {
        PuffNet.P2P.peers[peer].send(puff)
    }
}
