/*
    Puffs are the lifeblood of EveryBit. This file contains relatively pure functions for working with them.
*/

PB.Puff = {}

PB.Puff.createPrivate = function(content, type) {
    var payload = {}
    
    var type   = type || 'file'
    var routes = ['local']

    var userRecord = PB.getCurrentUserRecord()
    var userRecordsForWhomToEncrypt = [userRecord]
    var previous, puff
    
    puff = PB.Puff.simpleBuild(type, content, payload, routes, userRecordsForWhomToEncrypt)
    
    return puff
}


PB.Puff.simpleBuild = function(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// build a puff for the 'current user', as determined by the key manager (by default PB.M.Wardrobe)
    var puff 

    payload = PB.runHandlers('payloadModifier', payload)

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // THINK: should we confirm that our local capa matches the DHT's latest capa for the current user here? it turns the output into a promise...
        var previous = false // TODO: get the sig of this user's latest puff
        var versionedUsername = PB.getCurrentVersionedUsername()
        
        puff = PB.Puff.build(versionedUsername, privateDefaultKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    })
    
    return puff
}


/**
 * build a new puff object based on the parameters  
 * does not hit the network, hence does no real verification whatsoever
 * @param  {string} username                    user who sign the puff
 * @param  {string} privateKey                  private default key for the user
 * @param  {string} routes                      routes of the puff
 * @param  {string} type                        type of the puff
 * @param  {string} content                     content of the puff
 * @param  {object} payload                     other payload information for the puff
 * @param  {string} previous                    most recently published content by the user
 * @param  {object} userRecordsForWhomToEncrypt
 * @param  {object} privateEnvelopeAlias
 * @return {object}                             the new puff object
 */
PB.Puff.build = function(versionedUsername, privateKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    var puff = PB.Puff.packageStructure(versionedUsername, routes, type, content, payload, previous)

    puff.sig = PB.Crypto.signPuff(puff, privateKey)
    
    if(userRecordsForWhomToEncrypt) {
        puff = PB.Puff.encrypt(puff, privateKey, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    }
    
    return puff
}


PB.Puff.packageStructure = function(versionedUsername, routes, type, content, payload, previous) {
    //// pack all the parameters into an object with puff structure (without signature)
    
    payload = payload || {}                     // TODO: check all of these values more carefully
    payload.content = content
    payload.type = type

    routes = routes || []
    previous = previous || false                // false for DHT requests and beginning of blockchain, else valid sig

    var puff = { username: versionedUsername
               ,   routes: routes
               , previous: previous
               ,  version: '0.1.0'              // version accounts for crypto type and puff shape
               ,  payload: payload              // early versions will be aggressively deprecated and unsupported
               }
    
    return puff
}


PB.Puff.isPrivate = function(shell) {
    return shell.payload.type == 'encryptedpuff'
}


PB.Puff.encrypt = function(letter, myPrivateWif, userRecords, privateEnvelopeAlias) {
    //// stick a letter in an envelope. userRecords must be fully instantiated.
    var puffkey = PB.Crypto.getRandomKey()                                        // get a new random key
    
    var letterCipher = PB.Crypto.encryptWithAES(JSON.stringify(letter), puffkey)  // encrypt the letter
    var versionedUsername = letter.username
    
    if(privateEnvelopeAlias) {
        myPrivateWif = privateEnvelopeAlias.default
        versionedUsername = PB.Users.makeVersioned(privateEnvelopeAlias.username, privateEnvelopeAlias.capa)
    }
    
    var envelope = PB.Puff.packageStructure(versionedUsername, letter.routes      // envelope is also a puff
                           , 'encryptedpuff', letterCipher, {}, letter.previous)  // it includes the letter
    
    envelope.keys = PB.Crypto.createKeyPairs(puffkey, myPrivateWif, userRecords)  // add decryption keys
    envelope.sig = PB.Crypto.signPuff(envelope, myPrivateWif)                     // sign the envelope
    
    return envelope
}

PB.Puff.promiseLetter = function(envelope) {                            // the envelope is a puff
    if(PB.Data.isBadEnvelope(envelope.sig)) 
        return Promise.reject('Bad envelope')                           // flagged as invalid envelope

    var maybeLetter = PB.Data.getDecryptedLetterBySig(envelope.sig)     // have we already opened it?
    
    if(maybeLetter)
        return Promise.resolve(maybeLetter)                             // resolve to existing letter
    
    var prom = PB.Puff.promiseDecryptedLetter(envelope)                 // do the decryption
    
    return prom.catch(function(err) { return false })
               .then(function(letter) {
                   if(!letter) {
                       PB.Data.addBadEnvelope(envelope.sig)             // decryption failed: flag envelope
                       return PB.throwError('Invalid envelope')         // then bail out
                   }

                   return letter
               })
    
}

PB.Puff.promiseDecryptedLetter = function(envelope) {
    //// pull a letter out of the envelope -- returns a promise!

    if(!envelope || !envelope.keys) 
        return PB.emptyPromise('Envelope does not contain an encrypted letter')
    
    var senderVersionedUsername = envelope.username
    var userProm = PB.Users.getUserRecordPromise(senderVersionedUsername)
    
    var puffprom = userProm
    .catch(PB.catchError('User record acquisition failed'))
    .then(function(senderVersionedUserRecord) {
        var prom // used for leaking secure promise

        PB.useSecureInfo(function(identities, currentUsername) {
            // NOTE: leaks a promise which resolves to unencrypted puff
        
            var identity = identities[currentUsername]
            var aliases  = identity.aliases
            var matchingUsername = ''
                
            top: for(var keykey in envelope.keys) {             // match our aliases against all recipients
                for (var i = 0; i < aliases.length; i++) {
                    var alias = aliases[i]
                    
                    if(alias.username == keykey) {              // only for old, unversioned usernames
                        matchingUsername = alias.username
                        break top
                    }
                    
                    var versionUsername = PB.Users.makeVersioned(alias.username, alias.capa)
                    if(versionUsername == keykey) {
                        matchingUsername = versionUsername
                        break top
                    }
                }
            }

            if(!matchingUsername)
                return PB.throwError('No key found for current user')

            var recipientPrivateKey = alias.privateDefaultKey
            var senderPublicKey = senderVersionedUserRecord.defaultKey
            
            prom = PB.Puff.promiseToDecryptForReals(envelope, senderPublicKey, matchingUsername, recipientPrivateKey)
        })

        return prom
    })
    
    return puffprom
}

PB.Puff.promiseToDecryptForReals = function(envelope, senderPublicKey, recipientUsername, recipientPrivateKey) {
    return new Promise(function(resolve, reject) {
        return PB.cryptoworker
             ? PB.workersend( 'decryptPuffForReals'
                            , [ envelope
                              , senderPublicKey
                              , recipientUsername
                              , recipientPrivateKey ]
                            , resolve, reject )
             : resolve( PB.decryptPuffForReals( envelope
                                              , senderPublicKey
                                              , recipientUsername
                                              , recipientPrivateKey ) )
    })
}
