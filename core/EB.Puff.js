/*

    Puffs are the lifeblood of EveryBit. This file contains relatively pure functions for working with them.

    Copyright 2015 EveryBit. See README for license information.

*/

EB.Puff = {}


//// Building puffs

EB.Puff.createPrivate = function(content, type) {
    var payload = {}
    
    var type   = type || 'file'
    var routes = ['local']

    var userRecord = EB.getCurrentUserRecord()
    var userRecordsForWhomToEncrypt = [userRecord]
    var previous, puff
    
    puff = EB.Puff.simpleBuild(type, content, payload, routes, userRecordsForWhomToEncrypt)
    
    return puff
}


EB.Puff.simpleBuild = function(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// build a puff for the 'current user', as determined by the key manager (by default EB.M.Wardrobe)
    var puff 

    payload = EB.runHandlers('payloadModifier', payload)

    EB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // THINK: should we confirm that our local capa matches the DHT's latest capa for the current user here? it turns the output into a promise...
        var previous = false // TODO: get the sig of this user's latest puff
        var versionedUsername = EB.getCurrentVersionedUsername()
        
        puff = EB.Puff.build(versionedUsername, privateDefaultKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
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
EB.Puff.build = function(versionedUsername, privateKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    var puff = EB.Puff.packageStructure(versionedUsername, routes, type, content, payload, previous)

    puff.sig = EB.Crypto.signPuff(puff, privateKey)
    
    if(userRecordsForWhomToEncrypt) {
        puff = EB.Puff.encrypt(puff, privateKey, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    }
    
    return puff
}


EB.Puff.packageStructure = function(versionedUsername, routes, type, content, payload, previous) {
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


/**
 * Build user registration puff
 * @param  {string}  username of existing user
 * @param  {string}  private admin key for existing user
 * @param  {string}  desired new user name
 * @param  {string}  public root key for the new user
 * @param  {string}  public admin key for the new user
 * @param  {string}  public default key for the new user
 * @return {object}  puff to register the user
 */
EB.Puff.buildUserRegistration = function(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey) {

    // the DHT update puff payload
    var payload = { requestedUsername: newUsername
                  ,        defaultKey: defaultKey
                  ,          adminKey: adminKey
                  ,           rootKey: rootKey
                  ,              time: Date.now()
                  }

    // build the DHT update puff
    var routing = [] // THINK: DHT?
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.
    var puff = EB.Puff.build(signingUsername, privateAdminKey, routing, type, content, payload)

    return puff
}





//// Encryption and decryption


EB.Puff.isPrivate = function(shell) {
    return shell.payload.type == 'encryptedpuff'
}


EB.Puff.encrypt = function(letter, myPrivateWif, userRecords, privateEnvelopeAlias) {
    //// stick a letter in an envelope. userRecords must be fully instantiated.
    var puffkey = EB.Crypto.getRandomKey()                                        // get a new random key
    
    var letterCipher = EB.Crypto.encryptWithAES(JSON.stringify(letter), puffkey)  // encrypt the letter
    var versionedUsername = letter.username
    
    if(privateEnvelopeAlias) {
        myPrivateWif = privateEnvelopeAlias.privateDefaultKey
        versionedUsername = EB.Users.makeVersioned(privateEnvelopeAlias.username, privateEnvelopeAlias.capa)
    }
    
    var envelope = EB.Puff.packageStructure(versionedUsername, letter.routes      // envelope is also a puff
                           , 'encryptedpuff', letterCipher, {}, letter.previous)  // it includes the letter
    
    envelope.keys = EB.Crypto.createKeyPairs(puffkey, myPrivateWif, userRecords)  // add decryption keys
    envelope.sig = EB.Crypto.signPuff(envelope, myPrivateWif)                     // sign the envelope
    
    return envelope
}

EB.Puff.promiseLetter = function(envelope) {                            // the envelope is a puff
    if(EB.Data.isBadEnvelope(envelope.sig)) 
        return Promise.reject('Bad envelope')                           // flagged as invalid envelope

    var maybeLetter = EB.Data.getDecryptedLetterBySig(envelope.sig)     // have we already opened it?
    
    if(maybeLetter)
        return Promise.resolve(maybeLetter)                             // resolve to existing letter
    
    var prom = EB.Puff.promiseDecryptedLetter(envelope)                 // do the decryption
    
    return prom.catch(function(err) { return false })
               .then(function(letter) {
                   if(!letter) {
                       EB.Data.addBadEnvelope(envelope.sig)             // decryption failed: flag envelope
                       return EB.throwError('Invalid envelope')         // then bail out
                   }

                   return letter
               })
    
}

EB.Puff.promiseDecryptedLetter = function(envelope) {
    //// pull a letter out of the envelope -- returns a promise!

    if(!envelope || !envelope.keys) 
        return EB.emptyPromise('Envelope does not contain an encrypted letter')
    
    var senderVersionedUsername = envelope.username
    var userProm = EB.Users.getUserRecordPromise(senderVersionedUsername)
    
    var puffprom = userProm
    .catch(EB.catchError('User record acquisition failed'))
    .then(function(senderVersionedUserRecord) {
        var prom // used for leaking secure promise

        EB.useSecureInfo(function(identities, currentUsername) {
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
                    
                    var versionUsername = EB.Users.makeVersioned(alias.username, alias.capa)
                    if(versionUsername == keykey) {
                        matchingUsername = versionUsername
                        break top
                    }
                }
            }

            if(!matchingUsername)
                return EB.throwError('No key found for current user')

            var recipientPrivateKey = alias.privateDefaultKey
            var senderPublicKey = senderVersionedUserRecord.defaultKey
            
            prom = EB.Puff.promiseToDecryptForReals(envelope, senderPublicKey, matchingUsername, recipientPrivateKey)
        })

        return prom
    })
    
    return puffprom
}

EB.Puff.promiseToDecryptForReals = function(envelope, senderPublicKey, recipientUsername, recipientPrivateKey) {
    return new Promise(function(resolve, reject) {
        return EB.cryptoworker
             ? EB.workersend( 'decryptPuffForReals'
                            , [ envelope
                              , senderPublicKey
                              , recipientUsername
                              , recipientPrivateKey ]
                            , resolve, reject )
             : resolve( EB.decryptPuffForReals( envelope
                                              , senderPublicKey
                                              , recipientUsername
                                              , recipientPrivateKey ) )
    })
}


//// Shells and puffs


EB.Puff.isFull = function(shell) {
    // A puff has payload.content -- a shell does not
    return ((shell||{}).payload||{}).content !== undefined
}

EB.Puff.isEmpty = function(shell) {
    return !EB.Puff.isFull(shell)
}

EB.Puff.compactPuff = function(puff) {
    // THINK: instead of rebuilding the puff, use a JSON.stringify reducer that strips out the content
    var new_shell = Boron.extend(puff)
    var new_payload = {}
    for(var prop in puff.payload)
        if(prop != 'content')
            new_payload[prop] = puff.payload[prop] 

    new_shell.payload = new_payload
    return new_shell
}

