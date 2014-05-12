
// NETWORK LAYER

Puffnet = {};
Puffnet.peers = {}

Puffnet.init = function() {
    //// fire up the networks (currently just the peer connections)
    
    Puffnet.Peer = new Peer({  host: '162.219.162.56'
                                 ,  port: 9000
                                 ,  path: '/'
                                 , debug: 1
                                 });
    
    Puffnet.Peer.on('open', Puffnet.openPeerConnection);
    Puffnet.Peer.on('connection', Puffnet.connection);
}


Puffnet.reloadPeers = function() {
    return Puffnet.Peer.listAllPeers(Puffnet.handlePeers);
};

Puffnet.openPeerConnection = function(id) {
    return Puffnet.Peer.listAllPeers(Puffnet.handlePeers);
};

Puffnet.connection = function(connection) {
    Puffnet.reloadPeers(); // OPT: do we really need this? 

    return connection.on('data', function(data) {
        Puffball.receiveNewPuffs(data);
    });
};

Puffnet.handlePeers = function(peers) {
    peers.forEach(function(peer) {
        if(Puffnet.peers[peer]) 
            return false;
        Puffnet.peers[peer] = Puffnet.Peer.connect(peer);
    });
};

Puffnet.sendPuffToPeers = function(puff) {
    for(var peer in Puffnet.peers) {
        Puffnet.peers[peer].send(puff)
    }
}

Puffnet.xhr = function(url, options, data) {
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

Puffnet.getJSON = function(url) {
    var options = { headers: { 'Accept': 'application/json' }
                  ,  method: 'GET'
                  ,    type: 'json'
                  }

    return Puffnet.xhr(url, options)
}

Puffnet.post = function(url, data) {
    var options = { headers: { 'Content-type': 'application/x-www-form-urlencoded' 
//                             , 'Content-length': params.length
//                             ,   'Connection': 'close'  
                             }
                  ,  method: 'POST'
                  }

    return Puffnet.xhr(url, options, data)
}


Puffnet.getAllPuffs = function() {
    //// get all the puffs from this zone
    // TODO: add zone parameter (default to CONFIG.zone)
    
    if(CONFIG.noNetwork) return false // NOTE: this is only for debugging and development

    var url = CONFIG.puffApi + '?type=getAllPuffs';
    return Puffnet.getJSON(url);
}

Puffnet.distributePuff = function(puff) {
    //// distribute a puff to the network
  
    if(CONFIG.noNetwork) return false // THINK: this is only for debugging and development
  
    // add it to the server's pufflist
    // THINK: this is fire-and-forget, but we should do something smart if the network is offline or it otherwise fails 
    $.ajax({
        type: "POST",
        url: CONFIG.puffApi,
        data: {
            type: "addPuff",
            puff: JSON.stringify(puff)
        },
        success:function(result){
            Puffball.onError(JSON.stringify(result));      // TODO: make this smarter
        },
        error: function() {
            Puffball.onError('Could not distribute puff', puff);
        }
    });
  
    // broadcast it to peers
    Puffnet.sendPuffToPeers(puff)
}

Puffnet.getUser = function(username, callback) {
    // TODO: call Puffnet.getUserFile, add the returned users to Puffball.Data.users, pull username's user's info back out, cache it in LS, then do the thing you originally intended via the callback (but switch it to a promise asap because that concurrency model fits this use case better)

    var my_callback = function(user) {
        Puffball.Data.addUser(user);
        callback(user);
    }

    var errback = function() {   // TODO: make use of this
        Puffball.onError('Unable to access user information from the DHT');
    }

    $.getJSON(CONFIG.userApi, {type: 'getUser', username: username}, my_callback);
}

Puffnet.getUserFile = function(username, callback) {
    var my_callback = function(users) {
        Puffball.Data.users = Puffball.Data.users.concat(users);
        callback(username);
    }
  
    $.getJSON(CONFIG.userApi, {type: 'getUserFile', username: username}, my_callback);
}

Puffnet.addAnonUser = function(keys, callback) {
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

Puffnet.sendUserRecordPuffToServer = function(puff, callback) {
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


