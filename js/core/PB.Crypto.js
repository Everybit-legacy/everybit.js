/*
  PB.Crypto

  Using bitcoin.js is pretty nightmarish for our purposes. 
  It pollutes everything with extraneous strings, always forces down to addresses, 
  and has a terrible API for compressed keys. Actually, the API is terrible in general.
  It's also not currently maintained and is dog slow.

  HOWEVER. 

  Until we get some real crypto experts on board or a new js lib comes out that has good community support, 
  leave this code alone.
*/

PB.Crypto = {};

/**
 * to generate private key
 * @return {string} 
 */
PB.Crypto.generatePrivateKey = function() {
    // OPT: remove this test once Bitcoin.ECKey no longer generates invalid keys (about 1 in 1,000 right now)
    var prikey = new Bitcoin.ECKey().toWif()
    if(PB.Crypto.wifToPriKey(prikey))
        return prikey
    else
        return PB.Crypto.generatePrivateKey()  // THINK: this could generate an eternal error explosion
}

/**
 * convert public key from private key
 * @param  {string} privateKeyWIF
 * @return {string}
 */
PB.Crypto.privateToPublic = function(privateKeyWIF) {
    // TODO: This should return false if string is empty
    if(!privateKeyWIF)
        return PB.onError('That private key contained no data')
        
    try {
        return PB.Crypto.wifToPriKey(privateKeyWIF).getPub(true).toWif()
    } catch(err) {
        return PB.onError('Invalid private key: could not convert to public key', [privateKeyWIF, err])
    }
}

/**
 * sign the hash of some data with a private key and return the sig in base 58
 * @param  {object} unsignedPuff
 * @param  {string} privateKeyWIF
 * @return {(boolean|error)}
 */
PB.Crypto.signPuff = function(unsignedPuff, privateKeyWIF) {
    //// sign the hash of some data with a private key and return the sig in base 58

    var prikey = PB.Crypto.wifToPriKey(privateKeyWIF)
    var message = PB.Crypto.puffToSiglessString(unsignedPuff)
    var messageHash = PB.Crypto.createMessageHash(message)
    
    try {
        return Bitcoin.base58.encode(prikey.sign(messageHash))
    } catch(err) {
        return PB.onError('Could not properly encode signature', [prikey, messageHash, err])
    }
}

/**
 * to verify puff sig
 * @param  {object} puff
 * @param  {string} defaultKey
 * @return {boolean}
 */
PB.Crypto.verifyPuffSig = function(puff, defaultKey) {
    var puffString = PB.Crypto.puffToSiglessString(puff);
    return PB.Crypto.verifyMessage(puffString, puff.sig, defaultKey);
}

/**
 * accept a base 58 sig, a message (must be a string) and a base 58 public key. returns true if they match, false otherwise
 * @param  {string} message
 * @param  {string} sig
 * @param  {string} publicKeyWIF
 * @return {boolean}
 */
PB.Crypto.verifyMessage = function(message, sig, publicKeyWIF) {
    //// accept a base 58 sig, a message (must be a string) and a base 58 public key. returns true if they match, false otherwise
  
    try {
        var pubkey = PB.Crypto.wifToPubKey(publicKeyWIF)
        
        var sigBytes = Bitcoin.base58.decode(sig).toJSON()
        sigBytes = sigBytes.data || sigBytes
        
        var messageHash = PB.Crypto.createMessageHash(message)
        
        return pubkey.verify(messageHash, sigBytes)
    } catch(err) {
        return PB.onError('Invalid key or sig: could not verify message', [messageHash, sig, publicKeyWIF, err])
    }
}

/**
 * to create message hash
 * @param  {string} message
 * @return {string}
 */
PB.Crypto.createMessageHash = function(message) {
    return Bitcoin.Crypto.SHA256(message).toString()
}

/**
 * crypt wif to private key
 * @param  {string} privateKeyWIF
 * @return {boolean}
 */
PB.Crypto.wifToPriKey = function(privateKeyWIF) {
    if(!privateKeyWIF)
        return PB.onError('That private key wif contains no data')

    try {
        return new Bitcoin.ECKey(privateKeyWIF, true)
    } catch(err) {
        return PB.onError('Invalid private key: are you sure it is properly WIFfed?', [privateKeyWIF, err])
    }
}

/**
 * crypt wif to public try
 * @param  {string} publicKeyWIF
 * @return {boolean}
 */
PB.Crypto.wifToPubKey = function(publicKeyWIF) {
    if(!publicKeyWIF)
        return PB.onError('That public key wif contains no data')

    try {
        var pubkeyBytes = Bitcoin.base58check.decode(publicKeyWIF).payload.toJSON()
        pubkeyBytes = pubkeyBytes.data || pubkeyBytes
        return new Bitcoin.ECPubKey(pubkeyBytes, true)
    } catch(err) {
        return PB.onError('Invalid public key: are you sure it is properly WIFfed?', [publicKeyWIF, err])
    }
}

/**
 * crypt puff to string without sig
 * @param  {object} puff
 * @return {string}
 */
PB.Crypto.puffToSiglessString = function(puff) {
    return JSON.stringify(puff, function(key, value) {if(key == 'sig') return undefined; return value})
}


/**
 * to encrypt with AES
 * @param  {string} message
 * @param  {string} key
 * @return {string}
 */
PB.Crypto.encryptWithAES = function(message, key) {
    var enc = Bitcoin.Crypto.AES.encrypt(message, key)
    return Bitcoin.Crypto.format.OpenSSL.stringify(enc)
}

/**
 * to decrypt with AES
 * @param  {string} message
 * @param  {string} key
 * @return {string}
 */
PB.Crypto.decryptWithAES = function(enc, key) {
    if(!key || !enc) return false
    var message = Bitcoin.Crypto.format.OpenSSL.parse(enc)
    var words = Bitcoin.Crypto.AES.decrypt(message, key)
    var bytes = Bitcoin.convert.wordsToBytes(words.words) 
    // var uglyRegex = /[\u0002\u0004\u0007\u000e]+$/g // TODO: fix this so AES padding doesn't ever leak out 
    var uglyRegex = /[\u0000-\u0010]+$/g // TODO: fix this so AES padding doesn't ever leak out 
    return bytes.map(function(x) {return String.fromCharCode(x)}).join('').replace(uglyRegex, '')
}

/**
 * to get the shared secret of two users
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
PB.Crypto.getOurSharedSecret = function(yourPublicWif, myPrivateWif) {
    // TODO: check our ECDH maths
    var pubkey = PB.Crypto.wifToPubKey(yourPublicWif)
    var prikey = PB.Crypto.wifToPriKey(myPrivateWif)
    if(!pubkey || !prikey) return false  
    var secret = pubkey.multiply(prikey).toWif()
    var key = Bitcoin.Crypto.SHA256(secret).toString()
    
    return key
}

/**
 * to encode private message
 * @param  {string} plaintext
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
PB.Crypto.encodePrivateMessage = function(plaintext, yourPublicWif, myPrivateWif) {
    var key = PB.Crypto.getOurSharedSecret(yourPublicWif, myPrivateWif)
    if(!key) return false
    var ciphertext = PB.Crypto.encryptWithAES(plaintext, key)
    return ciphertext
}

/**
 * to decode private message
 * @param  {string} plaintext
 * @param  {string} yourPublicWif
 * @param  {string} myPrivateWif
 * @return {string}
 */
PB.Crypto.decodePrivateMessage = function(ciphertext, yourPublicWif, myPrivateWif) {
    var key = PB.Crypto.getOurSharedSecret(yourPublicWif, myPrivateWif)
    if(!key || !ciphertext) return false
    var plaintext = PB.Crypto.decryptWithAES(ciphertext, key)
    return plaintext // .replace(/\n+$/g, '')
}

/**
 * to get a random key
 * @param  {number} size
 * @return {string}
 */
PB.Crypto.getRandomKey = function(size) {
    size = size || 256/8 // AES key size is 256 bits
    var bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Bitcoin.convert.bytesToBase64(bytes)
}

/**
 * to create key pairs
 * @param  {string} puffkey
 * @param  {string} myPrivateWif
 * @param  {object} userRecords
 * @return {object}
 */
PB.Crypto.createKeyPairs = function(puffkey, myPrivateWif, userRecords) {
    return userRecords.reduce(function(acc, userRecord) {
        acc[userRecord.username] = PB.Crypto.encodePrivateMessage(puffkey, userRecord.defaultKey, myPrivateWif)
        return acc
    }, {})
}


// PB.Crypto.verifyBlock = function(block, publicKeyBase58) {
//     return PB.Crypto.verifyMessage(block.blockPayload, block.blockSig.replace(/\*/g, ""), publicKeyBase58);
// }

// PB.Crypto.signBlock = function(blockPayload, privateKeyWIF) {
//     return PB.Crypto.signPayload(blockPayload, privateKeyWIF);
// }
