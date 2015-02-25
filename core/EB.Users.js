/*

    User management for the EveryBit platform.

    Most functions related to userRecords live here.
    Note that userRecords are entirely public;
    private key identities are handled elsewhere.

    Copyright 2014-2015 EveryBit. See README for license information.

 */

EB.Users = {}

EB.Users.records  = {}                              // maps versioned username to an array of DHT userRecords
EB.Users.promises = {}                              // pending userRecord requests


EB.Users.init = function(options) {
    EB.Users.depersist()                            // pop userRecords out of localStorage
}


EB.Users.process = function(userRecord) {
    //// Processes all incoming userRecords
    
    userRecord = EB.Users.build( userRecord.username, userRecord.defaultKey, userRecord.adminKey
                               , userRecord.rootKey,  userRecord.latest,     userRecord.created
                               , userRecord.updated,  userRecord.profile,    userRecord.identity
                               , userRecord.capa )
    
    if(!userRecord)
        return EB.onError('That is not an acceptable user record', userRecord)
    
    EB.Users.cache(userRecord)
    
    return userRecord
}


EB.Users.getCachedUserRecord = function(username) {
    if(EB.Users.makeVersioned(username) == username)    // username is versioned
        return EB.Users.records[username]
    
    return EB.Users.findFreshest(username)              // username isn't versioned
}


/**
 * Checks the cache, and always returns a promise
 * @param {string} username
 * @param {int} capa is the version of the username keys
 * @returns {object} Promise for a user record
 * Looks first in the cache, then grabs from the network
 */
EB.Users.getUserRecordPromise = function(username, capa) {
    //// This always checks the cache, and always returns a promise
    
    var versionedUsername = EB.Users.makeVersioned(username, capa)
    
    var userRecord = EB.Users.getCachedUserRecord(versionedUsername)
    
    if(userRecord)
        return Promise.resolve(userRecord)
    
    var userPromise = EB.Users.promises[versionedUsername]
    
    if(userPromise)
        return userPromise
    
    return EB.Users.getUserRecordNoCache(versionedUsername)
}


/**
 * Forces a request to the network, ignores cached
 * @param {string} username
 * @param {int} capa is the version of the username keys
 * @returns {object} Promise for a user record
 */
EB.Users.getUserRecordNoCache = function(username, capa) {
    //// This never checks the cache
    
    capa = capa || 0 // 0 signals EB.Net.getUserRecord to get the latest userRecord
    
    var prom = EB.Net.getUserRecord(username, capa) 
    
    prom = prom.then(
                function(userRecord) {
                    var userRecord = EB.Users.process(userRecord)
                    if(!userRecord)  EB.throwError('Invalid user record returned')
                    return userRecord
                }
                , EB.catchError('Unable to access user information from the DHT'))
    
    var versionedUsername = EB.Users.makeVersioned(username, capa)
    EB.Users.promises[versionedUsername] = prom
    
    return prom
}

EB.Users.doesUserExist = function(username) {
    return EB.Net.getUserRecord(username).then(
                function(userRecord) {
                    if(!userRecord || userRecord.FAIL) 
                        throw 'User does not exist'
                    return true
                }
                , EB.catchError('Unable to access user information from the DHT'))
}


//
// USERNAME HELPERS
//

EB.Users.userRecordToVersionedUsername = function(userRecord) {
    return EB.Users.makeVersioned(userRecord.username, userRecord.capa)
}

EB.Users.justUsername = function(versionedUsername) {
    var uc = EB.Users.breakVersionedUsername(versionedUsername)
    return uc.username
}

EB.Users.justCapa = function(versionedUsername) {
    var uc = EB.Users.breakVersionedUsername(versionedUsername)
    return uc.capa
}

EB.Users.makeVersioned = function(username, capa) {
    if(!username || !username.indexOf)
        return ''
    
    if(capa)
        return actuallyVersionThisUsernameOkay(username, capa)
    
    if(username.indexOf(':') > 0)
        return username
    
    return actuallyVersionThisUsernameOkay(username)
    
    function actuallyVersionThisUsernameOkay(username, capa) {
        capa = capa || 1 // NOTE: default capa
        return username + ':' + capa
    }
}

EB.Users.breakVersionedUsername = function(versionedUsername) {
    var list = (versionedUsername||'').split(':')

    return { username: list[0]
           , capa:     list[1] || 1 // NOTE: default capa
           }
}


//
// GENERAL HELPERS
//


EB.Users.build = function(username, defaultKey, adminKey, rootKey, latest, created, updated, profile, identity, capa) {
    //// returns a canonical user object: use this everywhere user objects are needed (DHT, identities, etc)

    latest   = latest   || ""                       // signature of the most recent puff published by the user
    updated  = updated  || ""                       // date of the most recent update to the username
    profile  = profile  || ""                       // profile puff signature
    identity = identity || ""                       // identity puff signature
    capa     = capa     || 1                        // version of the username
    
    // THINK: should we check for valid keys? valid timestamp for updated? what if you want a partially invalid user like anon?
    
    // THINK: split username and capa if it's a versionedUsername?

    if(!EB.Spec.validateUsername(username))
        return false                                // error is logged inside EB.Spec.validateUsername
    
    return {   username: username                   // unversioned username
           ,       capa: capa
           ,    rootKey: rootKey                    // public root key
           ,   adminKey: adminKey                   // public admin key
           , defaultKey: defaultKey                 // public default key
           ,    created: created                    // Date the record was created
           ,     latest: latest
           ,    updated: updated
           ,    profile: profile
           ,   identity: identity
           }
}


EB.Users.usernamesToUserRecordsPromise = function(usernames) {
    //// returns a promise of userRecords. thanks to capa we usually don't need the latest and can use cached versions.
    if(!usernames || !usernames.length)
        return Promise.resolve([])
    
    if(!Array.isArray(usernames))
        usernames = [usernames]
        
    var userRecords = usernames.map(EB.Users.getCachedUserRecord).filter(Boolean)
    
    if (userRecords.length == usernames.length)
        return Promise.resolve(userRecords) // got 'em all!
    
    var prom = Promise.resolve() // a promise we use to string everything along

    var userRecordUsernames = userRecords.map(function (userRecord) {
        return userRecord.username
    })
    
    usernames.forEach(function (username) {
        if (!~userRecordUsernames.indexOf(username)) { // we need this one
            prom = prom.then(function() {
                return EB.Users.getUserRecordNoCache(username).then(function (userRecord) {
                    userRecords.push(userRecord)
                })
            })
        }
    })
    
    return prom.then(function() { return userRecords }) // when it's all done, give back the userRecords
}

EB.Users.cache = function(userRecord) {
    //// This caches with no validation: use EB.Users.process instead
    
    var versionedUsername = EB.Users.userRecordToVersionedUsername(userRecord)
    
    EB.Users.records[versionedUsername] = userRecord
    
    delete EB.Users.promises[versionedUsername]
    
    EB.Persist.save('userRecords', EB.Users.records)
    
    return userRecord
}

EB.Users.depersist = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    EB.Users.records = EB.Persist.get('userRecords') || {}
}


EB.Users.findFreshest = function(username) {
    username = EB.Users.justUsername(username)
    
    var keys = Object.keys(EB.Users.records)
    var capa = 0
    
    keys.filter(function(versionedUsername) {
        return EB.Users.justUsername(versionedUsername) == username
    }).forEach( function(versionedUsername) {
        var this_capa = +EB.Users.justCapa(versionedUsername)
        if(this_capa > capa)
            capa = this_capa
    })
    
    var versionedUsername = EB.Users.makeVersioned(username, capa)
    return EB.Users.records[versionedUsername]
}


EB.Users.getIdentityPuff = function(userRecord, privateKey) {
    //// userRecord is the user's canonical user record
    //// privateKey is the user's private default key
    
    if(!userRecord || !userRecord.defaultKey || !userRecord.username)
        return EB.emptyPromise('Invalid user record')
    
    if(!userRecord.identity)
        return EB.emptyPromise('User record has no identity')
    
    puffprom = EB.Net.getPuffBySig(userRecord.identity)

    return puffprom.then(function(puffs) {
        var envelope = puffs[0]
        if(!envelope || !envelope.sig)
            return EB.throwError('Invalid identity puff')
        
        var senderPublicKey = userRecord.defaultKey
        var recipientUsername = EB.Users.makeVersioned(userRecord.username, userRecord.capa)
        var recipientPrivateKey = privateKey

        return EB.Puff.promiseToDecryptForReals(envelope, senderPublicKey, recipientUsername, recipientPrivateKey)
    })        
}


/**
 * register a subuser
 * @param  {string} signingUsername username of existed user
 * @param  {string} privateAdminKey private admin key for existed user
 * @param  {string} newUsername     desired new subuser name
 * @param  {string} rootKey         public root key for the new subuser
 * @param  {string} adminKey        public admin key for the new subuser
 * @param  {string} defaultKey      public default key for the new subuser
 * @return {object}                user record for the newly created subuser
 */
EB.Users.registerSubuserForUser = function(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey) {
    var puff = EB.Puff.buildUserRegistration(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey)
    return EB.Net.updateUserRecord(puff)
}



//// ANONYMOUS USERS


/**
 * Add a new user and attach it to the current identity as an alias
 * This is by the most common use case, since most anon users are created to send/receive messages
 * @param {string} Optional private default key
 * @param {string} Optional private admin key
 * @param {string} Optional private root key
 * @returns {promise} Resolves to the user record or fails
 */
EB.Users.addAnonymousUser = function(privateDefaultKey, privateAdminKey, privateRootKey) {
    var currentUsername = EB.getCurrentUsername()
    return EB.Users.addAnonymousUserToIdentity(currentUsername, privateDefaultKey, privateAdminKey, privateRootKey)
}


/**
 * Add a new user and attach to an identity as an alias
 * @param {string} The username of the identity to which to attach
 * @param {string} Optional private default key
 * @param {string} Optional private admin key
 * @param {string} Optional private root key
 * @returns {promise} Resolves to the user record or fails
 */
EB.Users.addAnonymousUserToIdentity = function(username, privateDefaultKey, privateAdminKey, privateRootKey) {
    var callback = function(userRecord, privateDefaultKey, privateAdminKey, privateRootKey) {
        EB.addAlias(username, userRecord.username, null, privateRootKey, privateAdminKey, privateDefaultKey)
        return userRecord
    }
    
    return EB.Users.addAnonymousUserToDHT(callback, privateDefaultKey, privateAdminKey, privateRootKey)
}


/**
 * Register a new anonymous user
 * @param {string} This callback takes userRecord, privateDefaultKey, privateAdminKey, and privateRootKey as args
 * @param {string} Optional private default key
 * @param {string} Optional private admin key
 * @param {string} Optional private root key
 * @returns {promise} Resolves to the user record or fails
 */
EB.Users.addAnonymousUserToDHT = function(callback, privateDefaultKey, privateAdminKey, privateRootKey) {
    // get username
    var newUsername = 'anon.' + EB.Users.generateRandomUsername(12)
    
    // generate private keys
    privateDefaultKey = privateDefaultKey || EB.Crypto.generatePrivateKey()
    privateAdminKey   = privateAdminKey   || EB.Crypto.generatePrivateKey()
    privateRootKey    = privateRootKey    || EB.Crypto.generatePrivateKey()
    
    // generate public keys
    var defaultKey = EB.Crypto.privateToPublic(privateDefaultKey)
    var adminKey   = EB.Crypto.privateToPublic(privateAdminKey)
    var rootKey    = EB.Crypto.privateToPublic(privateRootKey)
    
    var puff = EB.Puff.buildUserRegistration('anon', EB.CONFIG.anonPrivateAdminKey, newUsername, rootKey, adminKey, defaultKey)
    
    // send DHT update puff
    return EB.Net.updateUserRecord(puff).then(function(userRecord) {
        if(callback)
            return callback(userRecord, privateDefaultKey, privateAdminKey, privateRootKey)
        return userRecord
    })
}


/**
 * Generate a random username
 * @param {number} length of username
 * @return {string}
 */
EB.Users.generateRandomUsername = function(size) {
    size = +size|0||0

    var generatedName = ''
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    for(var i=0; i<size; i++) {
        generatedName += EB.Crypto.getRandomItem(alphabet)
    }
    return generatedName
}



EB.Users.createAnonUserAndMakeCurrent = function() {
    // TODO: convert this to use EB.Users.addAnonymousUserToDHT
    
    var newUsername = 'anon.' + EB.Users.generateRandomUsername(12)
    var passphrase = EB.Crypto.generatePrivateKey().slice(-12)
    var prependedPassphrase = newUsername + passphrase
    var privateKey = EB.Crypto.passphraseToPrivateKeyWif(prependedPassphrase)
    var publicKey = EB.Crypto.privateToPublic(privateKey)

    // Build puff to register this user
    var puff = EB.Puff.buildUserRegistration('anon', EB.CONFIG.anonPrivateAdminKey, newUsername, publicKey, publicKey, publicKey)

    var prom = EB.Net.updateUserRecord(puff)

    // Works?
    return prom.then(function(userRecord) {
        // Switch to this user
        EB.addAlias(userRecord.username, userRecord.username, 1, privateKey, privateKey, privateKey, {passphrase: passphrase})

        EB.switchIdentityTo(userRecord.username)

        return userRecord
    })
}
