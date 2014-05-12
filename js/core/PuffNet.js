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
    
    PuffNet.P2P.Peer = new Peer({   host: '162.219.162.56'
                                 ,  port: 9000
                                 ,  path: '/'
                                 , debug: 1
                                 });
    
    PuffNet.P2P.Peer.on('open', PuffNet.P2P.openPeerConnection);
    PuffNet.P2P.Peer.on('connection', PuffNet.P2P.connection);
}


PuffNet.getAllPuffs = function() {
    //// get all the puffs from this zone
    // TODO: add zone parameter (default to CONFIG.zone)
    
    if(CONFIG.noNetwork) return false;              // NOTE: this is only for debugging and development

    var url  = CONFIG.puffApi;
    var data = {type: 'getAllPuffs'};
    return PuffNet.getJSON(url, data);
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
    
    var data = { type: 'addPuff'
               , puff: JSON.stringify(puff) }
               
    return PuffNet.post(CONFIG.puffApi, data)
                  .catch(Puffball.promiseError('Could not send puff to server'))
}

PuffNet.getUser = function(username, callback) {
    // TODO: call PuffNet.getUserFile, add the returned users to Puffball.Data.users, pull username's user's info back out, cache it in LS, then do the thing you originally intended via the callback (but switch it to a promise asap because that concurrency model fits this use case better)

    var url   = CONFIG.puffApi;
    var data  = {type: 'getUser', username: username};
    var pprom = PuffNet.getJSON(url, data);

    pprom.then(function(user) {
        Puffball.Data.addUser(user);
    });
    
    pprom.catch(Puffball.promiseError('Unable to access user information from the DHT'));
    
    return pprom;
}

PuffNet.getUserFile = function(username) {
    var url   = CONFIG.puffApi;
    var data  = {type: 'getUserFile', username: username};
    var pprom = PuffNet.getJSON(url, data);
    
    pprom.then(function(users) {
        Puffball.Data.users = Puffball.Data.users.concat(users);
    });
    
    pprom.catch(Puffball.promiseError('Unable to access user file from the DHT'));
    
    return pprom;
}

PuffNet.addAnonUser = function(keys, callback) {
    $.ajax({
        type: 'POST',
        url: CONFIG.userApi,
        data: { type: 'generateUsername'
              , rootKey: keys.root.public
              , adminKey: keys.admin.public
              , defaultKey: keys.default.public
              },
        success:function(result) {
            if(result.username) {
                if(typeof callback == 'function')
                callback(result.username)
                Puffball.Blockchain.createGenesisBlock(result.username)
            } else {
                Puffball.onError('Error Error Error: issue with adding anonymous user', result)
            }
        },
        error: function(err) {
            Puffball.onError('Error Error Error: the anonymous user could not be added', err)
        },
        dataType: 'json'
    });
}

PuffNet.sendUserRecordPuffToServer = function(puff, callback) {
    $.ajax({
        type: 'POST',
        url: CONFIG.userApi,
        data: { type: 'updateUsingPuff'
              , puff: puff
              },
        success:function(result) {
            if(typeof callback == 'function')
                callback(result)
        },
        error: function(err) {
            Puffball.onError('Error Error Error: sending user record modification puff failed miserably', err)
        },
        dataType: 'json'
    });
}


/*

    PuffNet promise-based XHR layer

    We use promises as our default concurrency construct, because ultimately this platform is composed of a huge set of interdependent async calls which mostly each resolve to a single immutable entity -- which is the promise sweet spot.
    
*/



PuffNet.xhr = function(url, options, data) {
    //// very simple promise-based XHR implementation
    
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(options.method || 'GET', url);
        
        Object.keys(options.headers || {}).forEach(function (key) {
          req.setRequestHeader(key, options.headers[key]);
        });
        
        if(data) {
            var formdata = new FormData()
            Object.keys(options.headers || {}).forEach(function (key) {
              formdata.append(key, data[key]);
            });
        }
        
        if(options && options.type)
            req.responseType = options.type
                
        req.onload = function() {
          if (req.status == 200)
            resolve(req.response);
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
    var options = { headers: {   'Content-type': 'application/x-www-form-urlencoded' 
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

PuffNet.P2P.reloadPeers = function() {
    return PuffNet.P2P.Peer.listAllPeers(PuffNet.P2P.handlePeers);
};

PuffNet.P2P.openPeerConnection = function(id) {
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
