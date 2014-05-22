/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  PuffWardrobe.switchCurrent(user.username)
  PuffWardrobe.getCurrentKeys()

*/


//// USER INFO ////

/*
    
    Move this into a separate PuffIdentity module that handles identity wardrobe, profiles, and machine-based preferences.
    PuffForum uses PuffIdentity for all identity-related functionality -- this way other modules can build on PuffIdentity too.
    PuffIdentity is responsible for managing persistence of identities, keeping the core clean of such messy concerns.

    -- Maybe call it PuffWardrobe? Is this just a place for local identity management, or also a place for managing user records?
    -- We need to separate out these concerns...


  ---> register callback handlers for user record creation and modification
  ---> PuffWardrobe.init registers those with Puffball.onUserCreation and Puffball.onUserModification
  ---> canonical identity object: username, keys.public.default, keys.private.admin, latest, etc. [or just use the spec... yeah. w/ .private for private key versions...]
  ---> always use CIO for everything; distinguish identities from users for all time. (...?)
  ---> 


*/

PuffWardrobe = {}
PuffWardrobe.keychain = false       // NOTE: starts false to trigger localStorage fetch. don't use this variable directly!
PuffWardrobe.currentKeys = false    // false if not set, so watch out

PuffWardrobe.getCurrentKeys = function() {
    return PuffWardrobe.currentKeys
}

PuffWardrobe.getCurrentUsername = function() {
    return (PuffWardrobe.currentKeys || {}).username || ''
}

PuffWardrobe.getCurrentUserRecord = function() {
    var username = PuffWardrobe.getCurrentUsername()
    if(!username) 
        return Puffball.onError('No current user in wardrobe')
    
    // THINK: it's weird to hit the cache directly from here, but if we don't then we always get a promise,
    //        even if we hit the cache, and this should return a proper userRecord, not a promise, 
    //        since after all we have stored the userRecord in our wardrobe, haven't we?
    
    var userRecord = Puffball.Data.userRecords[username]
    if(!userRecord)
        return Puffball.onError('That user does not exist in our records')
    
    return userRecord
}

PuffWardrobe.getAll = function() {
    if(!PuffWardrobe.keychain)
        PuffWardrobe.keychain = Puffball.Persist.get('keychain') || {}
    
    return PuffWardrobe.keychain
}

PuffWardrobe.switchCurrent = function(username) {
    //// Change current keyset. also used for clearing the current keyset (call with '')

    if(!username)
        return PuffWardrobe.currentKeys = false
    
    var keychain = PuffWardrobe.getAll()
    var keys     = keychain[username]

    if(!keys)
        return Puffball.onError('There are no keys in the wardrobe for that identity -- try adding it first')
    
    return PuffWardrobe.currentKeys = keys
}

PuffWardrobe.storePrivateKeysDirectly = function(username, rootKey, adminKey, defaultKey) {
    //// Add keys to the wardrobe with no validation
    if(!PuffWardrobe.keychain)
        PuffWardrobe.keychain = {}
    
    PuffWardrobe.keychain[username] = {     root: rootKey
                                      ,    admin: adminKey
                                      ,  default: defaultKey
                                      , username: username
                                      }

    if(PuffWardrobe.getPref('storeKeychain'))
        Puffball.Persist.save('keychain', PuffWardrobe.keychain)
}

PuffWardrobe.storePrivateKeys = function(username, rootKey, adminKey, defaultKey) {
    //// Store private keys, but first ensure they match the userRecord
    
    var prom = Puffball.getUserRecord(username)
    
    return prom.then(function(userRecord) {
        // validate any provided private keys against the userRecord's public keys
        if(rootKey    && Puffball.Crypto.privateToPublic(rootKey) != userRecord.rootKey)
            Puffball.throwError('That private root key does not match the public root key on record')
        if(adminKey   && Puffball.Crypto.privateToPublic(adminKey) != userRecord.adminKey)
            Puffball.throwError('That private admin key does not match the public admin key on record')
        if(defaultKey && Puffball.Crypto.privateToPublic(defaultKey) != userRecord.defaultKey)
            Puffball.throwError('That private default key does not match the public default key on record')
        
        PuffWardrobe.storePrivateKeysDirectly(username, rootKey, adminKey, defaultKey)
        return userRecord
    }, Puffball.promiseError('Could not store private keys due to faulty user record'))
    
}

PuffWardrobe.removeKeys = function(username) {
    //// clear the identity's private keys from the wardrobe

    delete PuffWardrobe.keychain[username]
    
    if(PuffWardrobe.currentKeys.username == username)
        PuffWardrobe.currentKeys = false
    
    if(PuffWardrobe.getPref('storeKeychain'))
        Puffball.Persist.save('keychain', PuffWardrobe.keychain)
}



PuffWardrobe.addNewAnonUser = function() {
    //// create a new anonymous identity and add it to the local identity list
    //// it seems strange to have this in PuffWardrobe, but we have to keep the generated private keys here.

    // generate private keys
    var privateRootKey    = Puffball.Crypto.generatePrivateKey();
    var privateAdminKey   = Puffball.Crypto.generatePrivateKey();
    var privateDefaultKey = Puffball.Crypto.generatePrivateKey();
    
    // generate public keys
    var rootKey    = Puffball.Crypto.privateToPublic(privateRootKey);
    var adminKey   = Puffball.Crypto.privateToPublic(privateAdminKey);
    var defaultKey = Puffball.Crypto.privateToPublic(privateDefaultKey);

    // build new username
    var anonUsername = PuffWardrobe.generateRandomUsername();
    var newUsername  = 'anon.' + anonUsername;

    // send it off
    var prom = PuffNet.registerSubuser('anon', CONFIG.anon.privateKeyAdmin, newUsername, rootKey, adminKey, defaultKey);

    return prom.then(function(userRecord) {
                   // store directly because we know they're valid, and so we don't get tangled up in more promises
                   PuffWardrobe.storePrivateKeysDirectly(newUsername, privateRootKey, privateAdminKey, privateDefaultKey);
                   return userRecord;
               },
               Puffball.promiseError('Anonymous user ' + anonUsername + ' could not be added'));
}

PuffWardrobe.generateRandomUsername = function() {
    var generatedName = '';
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0; i<10; i++) {
        generatedName = generatedName + alphabet[Math.floor(Math.random() * (alphabet.length))];
    }
    return generatedName;
}

PuffWardrobe.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var username = PuffWardrobe.getCurrentUsername()

    if(username)
        return Puffball.getUserRecordNoCache(username)
    
    var prom = PuffWardrobe.addNewAnonUser()
    
    return prom.then(function(userRecord) {
        PuffWardrobe.switchCurrent(userRecord.username)
        return userRecord
    })
}




////// PREFS ///////

/*
    These are related to this individual machine, as opposed to the identities stored therein.
    Identity-related preferences are... encrypted in the profile? That seems ugly, but maybe. 
    How are these machine-based prefs shared between machines? A special prefs puff?
*/


PuffWardrobe.prefsarray = false  // put this somewhere else

PuffWardrobe.getPref = function(key) {
    var prefs = PuffWardrobe.getAllPrefs()
    return prefs[key]
}

PuffWardrobe.getAllPrefs = function() {
    if(!PuffWardrobe.prefsarray)
        PuffWardrobe.prefsarray = Puffball.Persist.get('prefs') || {}
    
    return PuffWardrobe.prefsarray
}

PuffWardrobe.setPref = function(key, value) {
    var prefs = PuffWardrobe.getAllPrefs()
    var newprefs = events.merge_props(prefs, key, value); // allows dot-paths

    PuffWardrobe.prefsarray = newprefs

    var filename = 'prefs'
    Puffball.Persist.save(filename, newprefs)
    
    return newprefs
}

PuffWardrobe.removePrefs = function() {
    var filename = 'prefs'
    Puffball.Persist.remove(filename)
}



////// PROFILE ///////

/*
    These exist on a per-identity basis, and are stored on the machine 
    as part of the identity's presence in the user's identity wardrobe.
*/

PuffWardrobe.profilearray = {}  // THINK: put this somewhere else

PuffWardrobe.getProfileItem = function(key) {
    var username = PuffWardrobe.currentKeys.username
    return PuffWardrobe.getUserProfileItem(username, key)
}

PuffWardrobe.setProfileItem = function(key, value) {
    var username = PuffWardrobe.currentKeys.username
    return PuffWardrobe.setUserProfileItems(username, key, value)
}

PuffWardrobe.getAllProfileItems = function() {
    var username = PuffWardrobe.currentKeys.username
    return PuffWardrobe.getAllUserProfileItems(username)
}

PuffWardrobe.getUserProfileItem = function(username, key) {
    var profile = PuffWardrobe.getAllUserProfileItems(username)
    return profile[key]
}

PuffWardrobe.getAllUserProfileItems = function(username) {
    if(!username) return {} // erm derp derp
    
    var parray = PuffWardrobe.profilearray
    if(parray[username]) return parray[username]  // is this always right?
    
    var profilefile = 'profile::' + username
    parray[username] = Puffball.Persist.get(profilefile) || {}
    
    return parray[username]
}

PuffWardrobe.setUserProfileItems = function(username, key, value) {
    if(!username) return false
    
    var profile = PuffWardrobe.getAllUserProfileItems(username)
    var newprofile = events.merge_props(profile, key, value); // allows dot-paths

    PuffWardrobe.profilearray[username] = newprofile

    var profilefile = 'profile::' + username;
    Puffball.Persist.save(profilefile, newprofile)
    
    return newprofile
}

PuffWardrobe.removeUserProfile = function(username) {
    if(!username) return false
    
    PuffWardrobe.profilearray.delete(username)
    
    var profilefile = 'profile::' + username;
    Puffball.Persist.remove(profilefile)
}