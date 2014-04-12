Puff.Swarm = (function() {
  function Swarm() {
    this.peers = {};
  }

  Swarm.prototype.add = function(peer) {
    if(!this.peers[peer])
      this.peers[peer] = Puff.actualP2P.peer.connect(peer);
    return this.peers[peer];
  };

  Swarm.prototype.send = function(data) {
    return _.each(this.peers, function(peer, id) {
      console.log("Sending data", peer, id, data);
      return peer.send(data);
    });
  };

  Swarm.prototype.remove = function(peer) {
    return delete this.peers[peer];
  };

  return Swarm;

})();

Puff.P2P = (function() {
  function P2P() {
    console.log("Init P2P");
    this.peer = new Peer({
      host: '162.219.162.56',
      port: 9000,
      path: '/',
      debug: 3
    });
    this.swarm = new Puff.Swarm();
    this.peer.on('open', this.open);
    this.peer.on('connection', this.connection);
  }

  P2P.prototype.reloadPeers = function() {
    console.log("Reloading peers");
    return this.peer.listAllPeers(Puff.P2P.handlePeers);
  };

  P2P.prototype.open = function(id) {
    console.log("Opened peer connection");
    return this.listAllPeers(Puff.P2P.handlePeers);
  };

  P2P.handlePeers = function(peers) {
    console.log("Got peers", peers);
    if (peers.length > 0) {
      return _.each(peers, function(peer) {
        console.log("Adding peer to swarm", peer);
        return Puff.actualP2P.swarm.add(peer);
      });
    }
  };

  P2P.prototype.connection = function(connection) {
    console.log("Connection", connection);
    Puff.actualP2P.reloadPeers();
    
    return connection.on('data', function(data) {
      Puff.receiveNewPuffs(data);
      return console.log("Got data", data);
    });
  };

  return P2P;

})();

//p2p = new Puff.P2P();

