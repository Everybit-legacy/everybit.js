/*

    User management for the EveryBit platform.

    Most functions related to userRecords live here.
    Note that userRecords are entirely public;
    private key identities are handled elsewhere.

    Copyright 2014 EveryBit. See README for license information.

 */

PB.Users = {}

PB.Users.records  = {}                              // maps username to an array of DHT userRecords
PB.Users.promises = {}                              // pending userRecord requests

PB.Users.init = function(options) {
    PB.Users.depersist()                            // pop userRecords out of localStorage
}



PB.Users.process = function(userRecord) {
    //// Processes all incoming userRecords
    
    userRecord = PB.Users.build( userRecord.username, userRecord.defaultKey, userRecord.adminKey
                               , userRecord.rootKey,  userRecord.latest,     userRecord.updated
                               , userRecord.profile,  userRecord.capa )
    
    if(!userRecord)
        return PB.onError('That is not an acceptable user record', userRecord)
    
    PB.Users.cache(userRecord)
    
    return userRecord
}



PB.Users.getCachedUserRecord = function(versionedUsername) {
    //// TODO: start here!
    return PB.Users.getCachedWithCapa(versionedUsername)
}




/**
 * checks the cache, and always returns a promise
 * @param {string} username
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
    if(!username)
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


PB.Users.build = function(username, defaultKey, adminKey, rootKey, latest, updated, profile, capa) {
    //// returns a canonical user object: use this everywhere user objects are needed (DHT, identities, etc)

    latest  = latest  || ""                         // signature of the most recent puff published by the user
    updated = updated || ""                         // date of the most recent update to the username
    profile = profile || ""                         // profile puff signature
    capa    = capa    || 1                          // version of the username
    
    // THINK: should we check for valid keys? valid timestamp for updated? what if you want a partially invalid user like anon?
    
    // THINK: split username and capa if it's a versionedUsername?

    if(!PB.validateUsername(username))
        return false                                // error is logged inside PB.validateUsername
    
    return {   username: username                   // unversioned username
           ,       capa: capa
           ,    rootKey: rootKey                    // public root key
           ,   adminKey: adminKey                   // public admin key
           , defaultKey: defaultKey                 // public default key
           ,     latest: latest
           ,    updated: updated
           ,    profile: profile
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
    
    PB.Users.records[versionedUsername] = userRecord;

    delete PB.Users.promises[versionedUsername];
    
    PB.Persist.save('userRecords', PB.Users.records);
    
    return userRecord;
}

PB.Users.getCachedWithCapa = function(versionedUsername) {
    // TODO: map of just username to versionedUsername, so we can always get a user record for a user regardless of version
    versionedUsername = PB.Users.makeVersioned(versionedUsername)
    return PB.Users.records[versionedUsername];
}

PB.Users.depersist = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PB.Users.records = PB.Persist.get('userRecords') || {};
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
PB.Users.generateRandomUsername = function() {
    // TODO: consolidate this with the new username generation functions
    var generatedName = ''
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    for(var i=0; i<10; i++) {
        generatedName += PB.Crypto.getRandomItem(alphabet)
        // var randFloat = PB.Crypto.random()
        // generatedName = generatedName + alphabet[Math.floor(randFloat * (alphabet.length))]
    }
    return generatedName
}


PB.Users.addNewAnonUser = function(attachToUsername) {
    //// create a new anonymous alias. if attachToUsername is provided it becomes an alias for that identity.
    //// if attachToUsername is false the alias becomes primary for its own identity.
    //// FIXME: this function isn't currently used, and doesn't currently work.

    // generate private keys
    var privateRootKey    = PB.Crypto.generatePrivateKey()
    var privateAdminKey   = PB.Crypto.generatePrivateKey()
    var privateDefaultKey = PB.Crypto.generatePrivateKey()
    
    // generate public keys
    var rootKey    = PB.Crypto.privateToPublic(privateRootKey)
    var adminKey   = PB.Crypto.privateToPublic(privateAdminKey)
    var defaultKey = PB.Crypto.privateToPublic(privateDefaultKey)

    // build new username
    var anonUsername = PB.Users.generateRandomUsername()
    var newUsername  = 'anon.' + anonUsername

    // send it off
    var anonAdminKey = ((PB.CONFIG.users||{}).anon||{}).adminKey
    if(!anonAdminKey)
        return PB.onError('No anonymous user admin key registered')
    var prom = PB.registerSubuserForUser('anon', anonAdminKey, newUsername, rootKey, adminKey, defaultKey)

    return prom
        .then(function(userRecord) {
            // store directly because we know they're valid, and so we don't get tangled up in more promises
            
            // FIXME: add to identity if attachToUsername
            
            // FIXME: otherwise add new identity
            // PB.addIdentity(newUsername, privateRootKey, privateAdminKey, privateDefaultKey)
            
            
            return userRecord
        },
        PB.catchError('Anonymous user ' + anonUsername + ' could not be added'))
}


