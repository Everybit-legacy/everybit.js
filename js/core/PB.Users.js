/*

  PB.Users

  Most functions related to userRecords live here.
  Note that userRecords are entirely public; private key identities are handled elsewhere.

*/

PB.Users = {}

PB.Users.records  = {}                              // maps username to an array of DHT userRecords
PB.Users.promises = {}                              // pending userRecord requests


PB.Users.getCachedUserRecord = function(versionedUsername) {
    return PB.Users.getCachedWithCapa(versionedUsername)
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







//
// HELPERS
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
                return PB.getUserRecordNoCache(username).then(function (userRecord) {
                    userRecords.push(userRecord)
                })
            })
        }
    })
    
    return prom.then(function() { return userRecords }) // when it's all done, give back the userRecords
}

PB.Users.cache = function(userRecord) {
    //// This caches with no validation: use PB.Users.process instead
    
    var versionedUsername = PB.userRecordToVersionedUsername(userRecord)
    
    PB.Users.records[versionedUsername] = userRecord;

    delete PB.Users.promises[versionedUsername];
    
    PB.Persist.save('userRecords', PB.Users.records);
    
    return userRecord;
}

PB.Users.getCachedWithCapa = function(versionedUsername) {
    // TODO: map of just username to versionedUsername, so we can always get a user record for a user regardless of version
    versionedUsername = PB.maybeVersioned(versionedUsername)
    return PB.Users.records[versionedUsername];
}

PB.Users.depersist = function() {
    //// grab userRecords from local storage. this smashes the current userRecords in memory, so don't call it after init!
    PB.Users.records = PB.Persist.get('userRecords') || {};
}


