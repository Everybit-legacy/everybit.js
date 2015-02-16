/*

    User management for the EveryBit platform.

    Most functions related to userRecords live here.
    Note that userRecords are entirely public;
    private key identities are handled elsewhere.

    Copyright 2014 EveryBit. See README for license information.

 */

PB.Users = {}

PB.Users.records  = {}                              // maps versioned username to an array of DHT userRecords
PB.Users.promises = {}                              // pending userRecord requests


PB.Users.init = function(options) {
    PB.Users.depersist()                            // pop userRecords out of localStorage
}


PB.Users.process = function(userRecord) {
    //// Processes all incoming userRecords
    
    userRecord = PB.Users.build( userRecord.username, userRecord.defaultKey, userRecord.adminKey
                               , userRecord.rootKey,  userRecord.latest,     userRecord.created
                               , userRecord.updated,  userRecord.profile,    userRecord.identity
                               , userRecord.capa )
    
    if(!userRecord)
        return PB.onError('That is not an acceptable user record', userRecord)
    
    PB.Users.cache(userRecord)
    
    return userRecord
}


PB.Users.getCachedUserRecord = function(username) {
    if(PB.Users.makeVersioned(username) == username)    // username is versioned
        return PB.Users.records[username]
    
    return PB.Users.findFreshest(username)              // username isn't versioned
}


/**
 * Checks the cache, and always returns a promise
 * @param {string} username
 * @param {int} capa is the version of the username keys
 * @returns {object} Promise for a user record
 * Looks first in the cache, then grabs from the network
 */
PB.Users.getUserRecordPromise = function(username, capa) {
    //// This always checks the cache, and always returns a promise
    
    var versionedUsername = PB.Users.makeVersioned(username, capa)
    
    var userRecord = PB.Users.getCachedUserRecord(versionedUsername)
    
    if(userRecord)
        return Promise.resolve(userRecord)
    
    var userPromise = PB.Users.promises[versionedUsername]
    
    if(userPromise)
        return userPromise
    
    return PB.Users.getUserRecordNoCache(versionedUsername)
}


/**
 * Forces a request to the network, ignores cached
 * @param {string} username
 * @param {int} capa is the version of the username keys
 * @returns {object} Promise for a user record
 */
PB.Users.getUserRecordNoCache = function(username, capa) {
    //// This never checks the cache
    
    capa = capa || 0 // 0 signals PB.Net.getUserRecord to get the latest userRecord
    
    var prom = PB.Net.getUserRecord(username, capa) 
    
    prom = prom.then(
                function(userRecord) {
                    var userRecord = PB.Users.process(userRecord)
                    if(!userRecord)  PB.throwError('Invalid user record returned')
                    return userRecord
                }
                , PB.catchError('Unable to access user information from the DHT'))
    
    var versionedUsername = PB.Users.makeVersioned(username, capa)
    PB.Users.promises[versionedUsername] = prom
    
    return prom
}

PB.Users.doesUserExist = function(username) {
    return PB.Net.getUserRecord(username).then(
                function(userRecord) {
                    if(!userRecord || userRecord.FAIL) 
                        throw 'User does not exist'
                    return true
                }
                , PB.catchError('Unable to access user information from the DHT'))
}


//
// USERNAME HELPERS
//

PB.Users.userRecordToVersionedUsername = function(userRecord) {
    return PB.Users.makeVersioned(userRecord.username, userRecord.capa)
}

PB.Users.justUsername = function(versionedUsername) {
    var uc = PB.Users.breakVersionedUsername(versionedUsername)
    return uc.username
}

PB.Users.justCapa = function(versionedUsername) {
    var uc = PB.Users.breakVersionedUsername(versionedUsername)
    return uc.capa
}

PB.Users.makeVersioned = function(username, capa) {
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

PB.Users.breakVersionedUsername = function(versionedUsername) {
    var list = (versionedUsername||'').split(':')

    return { username: list[0]
           , capa:     list[1] || 1 // NOTE: default capa
           }
}


//
// GENERAL HELPERS
//


PB.Users.build = function(username, defaultKey, adminKey, rootKey, latest, created, updated, profile, identity, capa) {
    //// returns a canonical user object: use this everywhere user objects are needed (DHT, identities, etc)

    latest   = latest   || ""                       // signature of the most recent puff published by the user
    updated  = updated  || ""                       // date of the most recent update to the username
    profile  = profile  || ""                       // profile puff signature
    identity = identity || ""                       // identity puff signature
    capa     = capa     || 1                        // version of the username
    
    // THINK: should we check for valid keys? valid timestamp for updated? what if you want a partially invalid user like anon?
    
    // THINK: split username and capa if it's a versionedUsername?

    if(!PB.validateUsername(username))
        return false                                // error is logged inside PB.validateUsername
    
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


PB.Users.usernamesToUserRecordsPromise = function(usernames) {
    //// returns a promise of userRecords. thanks to capa we usually don't need the latest and can use cached versions.
    if(!usernames || !usernames.length)
        return Promise.resolve([])
    
    if(!Array.isArray(usernames))
        usernames = [usernames]
        
    var userRecords = usernames.map(PB.Users.getCachedUserRecord).filter(Boolean)
    
    if (userRecords.length == usernames.length)
        return Promise.resolve(userRecords) // got 'em all!
    
    var prom = Promise.resolve() // a promise we use to string everything along

    var userRecordUsernames = userRecords.map(function (userRecord) {
        return userRecord.username
    })
    
    usernames.forEach(function (username) {
        if (!~userRecordUsernames.indexOf(username)) { // we need this one
            prom = prom.then(function() {
                return PB.Users.getUserRecordNoCache(username).then(function (userRecord) {
                    userRecords.push(userRecord)
                })
            })
        }
    })
    
    return prom.then(function() { return userRecords }) // when it's all done, give back the userRecords
}

PB.Users.cache = function(userRecord) {
    //// This caches with no validation: use PB.Users.process instead
    
    var versionedUsername = PB.Users.userRecordToVersionedUsername(userRecord)
    
    PB.Users.records[versionedUsername] = userRecord
    
    delete PB.Users.promises[versionedUsername]
    
    PB.Persist.save('userRecords', PB.Users.records)
    
    return userRecord
}

PB.Users.depersist = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PB.Users.records = PB.Persist.get('userRecords') || {}
}


PB.Users.findFreshest = function(username) {
    username = PB.Users.justUsername(username)
    
    var keys = Object.keys(PB.Users.records)
    var capa = 0
    
    keys.filter(function(versionedUsername) {
        return PB.Users.justUsername(versionedUsername) == username
    }).forEach( function(versionedUsername) {
        var this_capa = +PB.Users.justCapa(versionedUsername)
        if(this_capa > capa)
            capa = this_capa
    })
    
    var versionedUsername = PB.Users.makeVersioned(username, capa)
    return PB.Users.records[versionedUsername]
}


PB.Users.getIdentityPuff = function(userRecord, privateKey) {
    //// userRecord is the user's canonical user record
    //// privateKey is the user's private default key
    
    if(!userRecord || !userRecord.defaultKey || !userRecord.username)
        return PB.emptyPromise('Invalid user record')
    
    if(!userRecord.identity)
        return PB.emptyPromise('User record has no identity')
    
    puffprom = PB.Net.getPuffBySig(userRecord.identity)

    return puffprom.then(function(puffs) {
        var envelope = puffs[0]
        if(!envelope || !envelope.sig)
            return PB.throwError('Invalid identity puff')
        
        var senderPublicKey = userRecord.defaultKey
        var recipientUsername = PB.Users.makeVersioned(userRecord.username, userRecord.capa)
        var recipientPrivateKey = privateKey

        return PB.Data.decryptPuffAlmostForReals(envelope, senderPublicKey, recipientUsername, recipientPrivateKey)
    })        
}




//
// CLEANUP REQUIRED
//


/**
 * Get the current user's DHT record, or create a new anon user, or die trying
 * @return {string}
 */
PB.Users.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var username = PB.getCurrentUsername()

    if(username)
        return PB.Users.getUserRecordNoCache(username, 0) // 0 tells PB.Net.getUserRecord to fetch the latest
    
    var prom = PB.Users.addNewAnonUser()
    
    return prom.then(function(userRecord) {
        PB.switchIdentityTo(userRecord.username)
        console.log("Setting current user to " + userRecord.username)
        return userRecord
    })
}


/**
 * Generate a random username
 * @return {string}
 */
PB.Users.generateRandomUsername = function(len) {

    // Set a default value for length
    if(!len || len != Math.round(len))
        len=10

    var generatedName = ''
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    for(var i=0; i<10; i++) {
        generatedName += PB.Crypto.getRandomItem(alphabet)
    }
    return generatedName
}

/**
 *
 * Register a new anonymous user
 * @param {string} passphrase optional if included then used
 * @param {string} attachToUsername
 * @returns {Promise} a promise that resolves to the user record or fails
 */
PB.Users.addNewAnonUser = function(passphrase, attachToUsername) {
    //// create a new anonymous alias. if attachToUsername is provided it becomes an alias for that identity.
    //// if attachToUsername is false the alias becomes primary for its own identity.
    // TODO: make attachToUsername work
    // THINK: Don't want to switch to this user, but what about alias issue and saving bonus info?
    // TODO: Split this into two functions, one that registers an anon user based on given info
    // another that registers anon user AND switches current to that user. Or flag in function to switch to that user.

    var newUsername = 'anon.' + PB.Users.generateRandomUsername(12)

    if(typeof passphrase !== undefined && passphrase) {
        var prependedPassphrase = newUsername + passphrase
        var privateKey = PB.Crypto.passphraseToPrivateKeyWif(prependedPassphrase)
    } else {
        var privateKey = PB.Crypto.generatePrivateKey()
    }

    // Set private keys
    var privateRootKey =    privateKey
    var privateAdminKey =   privateKey
    var privateDefaultKey = privateKey

    // Generate public keys
    var rootKey    = PB.Crypto.privateToPublic(privateKey)
    var adminKey   = PB.Crypto.privateToPublic(privateKey)
    var defaultKey = PB.Crypto.privateToPublic(privateKey)

    // build our DHT update puff
    var payload = {
        requestedUsername: newUsername,
        defaultKey: defaultKey,
        adminKey: adminKey,
        rootKey: rootKey,
        time: Date.now()
    }

    var routing = [] // THINK: DHT?
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    var puff = PB.buildPuff('anon', PB.CONFIG.anonPrivateAdminKey, routing, type, content, payload)

    return PB.Net.updateUserRecord(puff)

}

PB.Users.createAnonUserAndMakeCurrent = function() {
    var newUsername = 'anon.' + PB.Users.generateRandomUsername(12)
    var passphrase = PB.Crypto.generatePrivateKey().slice(-12)
    var prependedPassphrase = newUsername + passphrase
    var privateKey = PB.Crypto.passphraseToPrivateKeyWif(prependedPassphrase)
    var publicKey = PB.Crypto.privateToPublic(privateKey)

    // Build puff to register this user
    var payload = {
        requestedUsername: newUsername,
        defaultKey: publicKey,
        adminKey: publicKey,
        rootKey: publicKey,
        time: Date.now()
    }

    var routing = [] // THINK: DHT?
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    var puff = PB.buildPuff('anon', PB.CONFIG.anonPrivateAdminKey, routing, type, content, payload)

    var prom = PB.Net.updateUserRecord(puff)

    // Works?
    return prom.then(function(userRecord) {
        // Switch to this user
        PB.addAlias(userRecord.username, userRecord.username, 1, privateKey, privateKey, privateKey, {passphrase: passphrase})

        PB.switchIdentityTo(userRecord.username)

        return userRecord
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
PB.Users.registerSubuserForUser = function(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey) {

    // build our DHT update puff
    var payload = { requestedUsername: newUsername
                  ,        defaultKey: defaultKey
                  ,          adminKey: adminKey
                  ,           rootKey: rootKey
                  ,              time: Date.now()
                  }

    var routing = [] // THINK: DHT?
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    var puff = PB.buildPuff(signingUsername, privateAdminKey, routing, type, content, payload)
    // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

    return PB.Net.updateUserRecord(puff)
}

