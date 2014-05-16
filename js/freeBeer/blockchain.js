/*

    DEPRECATED: puffs form a blockchain natively, by always pointing to the previous block




  Puffball.Blockchain

  Each block is JSON Object.
  Fixed size: 10k bytes
  Fixed attributes:
    blockSig: (Size: 100 bytes)
    blockPayload:
      prevSig: (Size: 100 bytes)
      puff:
      padding:

  The blocks are stored in Puffball.Blockchain.BLOCKS.
  BLOCKS is an object with properties that correspond
  to usernames and points to this users blockchain.
      Each users blockchain is an array, where the
  actual blocks relevant for this user are stored.
  
  Example:
    Puffball.Blockchain.BLOCKS['username'] 
    retrieves the blockchain of 'username' as an array

*/

Puffball.Blockchain = {};

Puffball.Blockchain.BLOCKSIZE = 10000;
Puffball.Blockchain.SIGSIZE = 100;

Puffball.Blockchain.createBlock = function(username, puff, privateKeyWIF) {
    //// Creates a new block, by adding the payload (puff and the signature of the previous block), adding necessary padding and signing it 

    // is everything ok?
    if(!username) return Puffball.onError('Could not create the block due to invalid username');
    
    var userBlockchain = Puffball.Blockchain.BLOCKS[username];

    if(!userBlockchain) {
        Puffball.Blockchain.createGenesisBlock(username);
        userBlockchain = Puffball.Blockchain.BLOCKS[username];
    }
    
    if(!userBlockchain) return Puffball.onError('Failed to create new block due to blockchain wonkiness');
    
    var prevSig = userBlockchain[userBlockchain.length - 1].blockSig

    // get a blank new block we can fill
    var newBlock = Puffball.Blockchain.getNewBlankBlock();

    var paddingSize = Puffball.Blockchain.BLOCKSIZE 
                    - 2*Puffball.Blockchain.SIGSIZE 
                    - JSON.stringify(newBlock).length 
                    - JSON.stringify(puff).length 
                    + 2;

    // Why +2? Because we need to take the quotation marks of the
    // attributes into account. Turns out we need to add 2 in the end.

    // add the content
    newBlock.blockPayload.prevSig = Puffball.Blockchain.paddSig(prevSig);
    newBlock.blockPayload.puff = puff
    newBlock.blockPayload.padding = Puffball.Blockchain.generatePadding(paddingSize);

    // sign the content
    newBlock.blockSig = Puffball.Blockchain.paddSig(Puffball.Crypto.signBlock(newBlock.blockPayload, privateKeyWIF));

    Puffball.Blockchain.BLOCKS[username].push(newBlock);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);

    return newBlock.blockSig;
}

Puffball.Blockchain.readBlock = function(username, sig) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    return userBlockchain[userBlockchain.indexOf(sig)]
}

Puffball.Blockchain.updateBlock = function(username, sig, puff, privateKeyWIF) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    var newBlock = createBlock(userBlockchain[sig].blockPayload.prevSig, puff, privateKeyWIF);
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    userBlockchain.push(newBlock);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);
    return newBlock.blockSig;
}

Puffball.Blockchain.deleteBlock = function(username, sig) {
    var userBlockchain = Puffball.Blockchain.BLOCKS.username;
    userBlockchain.splice(userBlockchain.indexOf(sig), userBlockchain.length);
    Puffball.Persist.save('blocks', Puffball.Blockchain.BLOCKS);
}

Puffball.Blockchain.getNewBlankBlock = function(){
    //// template of a blank block

    return {
        blockSig: "",
        blockPayload: {
            prevSig: "",
            puff: "",
            padding: ""
        }
    }

}

// TODO: Make random
Puffball.Blockchain.generatePadding = function(size) {
    //// Generates padding content to ensure block size, for now just zeros

    var out = "0";
    while(out.length < size) {
        out = out + "0";
    }
    return out;
}

Puffball.Blockchain.paddSig = function(sig) {
    //// Padds a signature to a length of 100 characters

    while(sig.length < Puffball.Blockchain.SIGSIZE) {
        sig = sig + "*"
    }
    return sig
}

Puffball.Blockchain.createGenesisBlock = function(username) {
    Puffball.Blockchain.BLOCKS[username] = [];

    var newBlock = Puffball.Blockchain.getNewBlankBlock();
    newBlock.blockSig = Puffball.Blockchain.paddSig(username + "_1");

    Puffball.Blockchain.BLOCKS[username].push(newBlock);
    return newBlock.blockSig;
}

Puffball.Blockchain.exportChain = function(username){
    // Returns the username's blockchain as serialized JSON
    return Puffball.Blockchain.BLOCKS[username];
}


