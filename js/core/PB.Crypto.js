/*
  PB.Crypto

  A thin wrapper around bitcoin-lib.js

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
PB.Crypto.encryptPrivateMessage = function(plaintext, yourPublicWif, myPrivateWif) {
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
PB.Crypto.decryptPrivateMessage = function(ciphertext, yourPublicWif, myPrivateWif) {
    var key = PB.Crypto.getOurSharedSecret(yourPublicWif, myPrivateWif)
    if(!key || !ciphertext) return false
    var plaintext = PB.Crypto.decryptWithAES(ciphertext, key)
    return plaintext // .replace(/\n+$/g, '')
}


PB.Crypto.random = function() { // just like Math.random, but better
    // via http://stackoverflow.com/questions/13694626/generating-random-numbers-0-to-1-with-crypto-generatevalues

    var list = PB.Crypto.getRandomValues(2, 32)

    // keep all 32 bits of the the first, top 20 of the second for 52 random bits
    var mantissa = (list[0] * Math.pow(2,20)) + (list[1] >> 12)

    // shift all 52 bits to the right of the decimal point
    var result = mantissa * Math.pow(2,-52)
    
    return result
    
    // var log2 = Math.log(max) / Math.LN2
    // var size = Math.ceil(log2) + 1 // NOTE: this is about 8 times higher than necessary
}

PB.Crypto.getRandomInteger = function(max, min) { // NOTE: min is inclusive, max is exclusive
    // TODO: error if max and min are not proper (non-NaN) numbers
    min = Math.floor(min || 0)
    max = Math.floor(max || 0x7fffffff) // 0x7fffffff == Math.pow(2, 31) - 1 // the largest bitop safe int
    var range = max - min
    var randFloat = PB.Crypto.random()
    return Math.floor(randFloat*range + min)
}

PB.Crypto.getRandomItem = function(list) {
    // TODO: error if list is not an array or string
    var index = PB.Crypto.getRandomInteger(list.length)
    return list[index]
}

/**
 * get a new AES key
 * @param  {number} length in bytes (defaults to 256 bits)
 * @return {string}
 */
PB.Crypto.getRandomKey = function(len) {
    len = len || 256/8                                      // AES key size is 256 bits
    var bytes = PB.Crypto.getRandomValues(len, 8)
    // var bytes = new Uint8Array(size)
    // crypto.getRandomValues(bytes)
    return Bitcoin.convert.bytesToBase64(bytes)
}

PB.Crypto.getRandomValues = function(number, size) {
    if(window.crypto && window.crypto.getRandomValues) {
        var bytes
        if(size == 32)
            bytes = new Uint32Array(size)
        else
            bytes = new Uint8Array(size)
    
        return window.crypto.getRandomValues(bytes)
    }

    return PB.Crypto.getRandomValuesShim(number, size)
}

PB.Crypto.getRandomValuesShim = function(number, size) {
    // via https://github.com/evanvosberg/crypto-js/issues/7
    // fallback for old browsers that don't support crypto.getRandomValues
    // a little better than plain Math.random(), worse than crypto.getRandomValues()
    var words = [];

    var r = (function (m_w) {
        var m_w = m_w;
        var m_z = 0x3ade68b1;
        var mask = 0xffffffff;

        return function () {
            m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
            m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
            var result = ((m_z << 0x10) + m_w) & mask;
            result /= 0x100000000;
            result += 0.5;
            return result * (Math.random() > .5 ? 1 : -1);
        }
    });

    for (var i = 0, rcache; i < number; i += 4) {
        var _r = r((rcache || Math.random()) * 0x100000000);

        rcache = _r() * 0x3ade67b7;

        if(size == 32) {
            words.push(Math.abs( (_r() * 0x100000000) | 0 ));
        } else {
            // in case we want bytes instead of 32-bit chunks
            var int32 = (_r() * 0x100000000) | 0;
            words.push(Math.abs(int32 & 0xFF000000) >> 24);
            words.push(Math.abs(int32 & 0x00FF0000) >> 16);
            words.push(Math.abs(int32 & 0x0000FF00) >> 8);
            words.push(Math.abs(int32 & 0x000000FF));
        }
    }

    return words;
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
        var versionedUsername = PB.userRecordToVersionedUsername(userRecord)
        acc[versionedUsername] = PB.Crypto.encryptPrivateMessage(puffkey, userRecord.defaultKey, myPrivateWif)
        return acc
    }, {})
}


// PB.Crypto.verifyBlock = function(block, publicKeyBase58) {
//     return PB.Crypto.verifyMessage(block.blockPayload, block.blockSig.replace(/\*/g, ""), publicKeyBase58);
// }

// PB.Crypto.signBlock = function(blockPayload, privateKeyWIF) {
//     return PB.Crypto.signPayload(blockPayload, privateKeyWIF);
// }
