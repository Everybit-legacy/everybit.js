/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  PB.M.PuffWardrobe.switchCurrent(user.username)
  PB.M.PuffWardrobe.getCurrentKeys()

*/


//// USER INFO ////

/*
    
    Move this into a separate PuffIdentity module that handles identity wardrobe, profiles, and machine-based preferences.
    PuffForum uses PuffIdentity for all identity-related functionality -- this way other modules can build on PuffIdentity too.
    PuffIdentity is responsible for managing persistence of identities, keeping the core clean of such messy concerns.

    -- Maybe call it PB.M.PuffWardrobe? Is this just a place for local identity management, or also a place for managing user records?
    -- We need to separate out these concerns...


  ---> register callback handlers for user record creation and modification
  ---> PB.M.PuffWardrobe.init registers those with PB.onUserCreation and PB.onUserModification
  ---> canonical identity object: username, keys.public.default, keys.private.admin, latest, etc. [or just use the spec... yeah. w/ .private for private key versions...]
  ---> always use CIO for everything; distinguish identities from users for all time. (...?)
  ---> 


*/

PB.M.PuffWardrobe = {}
PB.M.PuffWardrobe.keychain = false       // NOTE: starts false to trigger localStorage fetch. don't use this variable directly!
PB.M.PuffWardrobe.currentKeys = false    // false if not set, so watch out

/**
 * Get the current keys
 * @return {string}
 */
PB.M.PuffWardrobe.getCurrentKeys = function() {
    return PB.M.PuffWardrobe.currentKeys
}

/**
 * get the current username
 * @return {string}
 */
PB.M.PuffWardrobe.getCurrentUsername = function() {
    return (PB.M.PuffWardrobe.currentKeys || {}).username || ''
}

/**
 * get the current user record
 * @return {string}
 */
PB.M.PuffWardrobe.getCurrentUserRecord = function() {
    var username = PB.M.PuffWardrobe.getCurrentUsername()
    if(!username) 
        return PB.onError('No current user in wardrobe')
    
    // THINK: it's weird to hit the cache directly from here, but if we don't then we always get a promise,
    //        even if we hit the cache, and this should return a proper userRecord, not a promise, 
    //        since after all we have stored the userRecord in our wardrobe, haven't we?
    
    var userRecord = PB.Data.userRecords[username]
    if(!userRecord)
        return PB.onError('That user does not exist in our records')
    
    return userRecord
}

/**
 * get all the username and keys
 * @return {Object[]}
 */
PB.M.PuffWardrobe.getAll = function() {
    if(!PB.M.PuffWardrobe.keychain)
        PB.M.PuffWardrobe.keychain = PB.Persist.get('keychain') || {}
    
    return PB.M.PuffWardrobe.keychain
}

/**
 * Change current keyset. also used for clearing the current keyset (call with '')
 * @param  {string} username
 * @return {string[]}
 */
PB.M.PuffWardrobe.switchCurrent = function(username) {
    //// Change current keyset. also used for clearing the current keyset (call with '')

    if(!username)
        return PB.M.PuffWardrobe.currentKeys = false
    
    var keychain = PB.M.PuffWardrobe.getAll()
    var keys     = keychain[username]

    if(!keys)
        return PB.onError('There are no keys in the wardrobe for that identity -- try adding it first')

    PB.Persist.save('identity', username); // save to localStorage
    
    // TODO: this doesn't belong here, move it (probably by registering interesting users with the platform)
    PB.Data.importPrivateShells(username)
    
    return PB.M.PuffWardrobe.currentKeys = keys
}

/**
 * Store the user's root key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.PuffWardrobe.storeRootKey = function(username, rootKey) {
    PB.M.PuffWardrobe.storePrivateKeys(username, rootKey)
}

/**
 * Store the user's admin key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.PuffWardrobe.storeAdminKey = function(username, adminKey) {
    PB.M.PuffWardrobe.storePrivateKeys(username, false, adminKey)
}

/**
 * Store the user's default key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.PuffWardrobe.storeDefaultKey = function(username, defaultKey) {
    PB.M.PuffWardrobe.storePrivateKeys(username, false, false, defaultKey)
}

/**
 * Add keys to the wardrobe with no validation
 * @param  {string} username
 * @param  {string} rootKey
 * @param  {string} adminKey
 * @param  {string} defaultKey
 */
PB.M.PuffWardrobe.storePrivateKeys = function(username, rootKey, adminKey, defaultKey) {
    //// Add keys to the wardrobe with no validation
    PB.M.PuffWardrobe.keychain = PB.M.PuffWardrobe.getAll()
    
    PB.M.PuffWardrobe.keychain[username] = PB.M.PuffWardrobe.keychain[username] || {username: username}
    
    if(rootKey)
        PB.M.PuffWardrobe.keychain[username].root    = rootKey
    if(adminKey)
        PB.M.PuffWardrobe.keychain[username].admin   = adminKey
    if(defaultKey)
        PB.M.PuffWardrobe.keychain[username].default = defaultKey
    
    if(PB.M.PuffWardrobe.getPref('storeKeychain'))
        PB.Persist.save('keychain', PB.M.PuffWardrobe.keychain)
}

/**
 * Ensure keys match the userRecord
 * @param  {string}   username
 * @param  {string}   rootKey
 * @param  {string}   adminKey
 * @param  {string}   defaultKey
 * @param  {Function} callback
 * @return {string}
 */
PB.M.PuffWardrobe.validatePrivateKeys = function(username, rootKey, adminKey, defaultKey, callback) {
    //// Ensure keys match the userRecord
    
    var prom = PB.getUserRecord(username)
    
    return prom.then(function(userRecord) {
        // validate any provided private keys against the userRecord's public keys
        if(rootKey    && PB.Crypto.privateToPublic(rootKey) != userRecord.rootKey)
            PB.throwError('That private root key does not match the public root key on record')
        if(adminKey   && PB.Crypto.privateToPublic(adminKey) != userRecord.adminKey)
            PB.throwError('That private admin key does not match the public admin key on record')
        if(defaultKey && PB.Crypto.privateToPublic(defaultKey) != userRecord.defaultKey)
            PB.throwError('That private default key does not match the public default key on record')
        
        return userRecord
    }, PB.promiseError('Could not store private keys due to faulty user record'))
}


/**
 * Clear the identity's private keys from the wardrobe
 * @param  {string} username
 */
PB.M.PuffWardrobe.removeKeys = function(username) {
    //// clear the identity's private keys from the wardrobe
    PB.M.PuffWardrobe.keychain = PB.M.PuffWardrobe.getAll()

    delete PB.M.PuffWardrobe.keychain[username]
    
    if(PB.M.PuffWardrobe.currentKeys.username == username)
        PB.M.PuffWardrobe.currentKeys = false
    
    if(PB.M.PuffWardrobe.getPref('storeKeychain'))
        PB.Persist.save('keychain', PB.M.PuffWardrobe.keychain)
}

/**
 * Create a new anonymous identity and add it to the local identity list
 */
PB.M.PuffWardrobe.addNewAnonUser = function() {
    //// create a new anonymous identity and add it to the local identity list
    //// it seems strange to have this in PB.M.PuffWardrobe, but we have to keep the generated private keys here.

    // generate private keys
    var privateRootKey    = PB.Crypto.generatePrivateKey();
    var privateAdminKey   = PB.Crypto.generatePrivateKey();
    var privateDefaultKey = PB.Crypto.generatePrivateKey();
    
    // generate public keys
    var rootKey    = PB.Crypto.privateToPublic(privateRootKey);
    var adminKey   = PB.Crypto.privateToPublic(privateAdminKey);
    var defaultKey = PB.Crypto.privateToPublic(privateDefaultKey);

    // build new username
    var anonUsername = PB.M.PuffWardrobe.generateRandomUsername();
    var newUsername  = 'anon.' + anonUsername;

    // send it off
    var prom = PB.Net.registerSubuser('anon', CONFIG.users.anon.adminKey, newUsername, rootKey, adminKey, defaultKey);

    return prom.then(function(userRecord) {
                   // store directly because we know they're valid, and so we don't get tangled up in more promises
                   PB.M.PuffWardrobe.storePrivateKeys(newUsername, privateRootKey, privateAdminKey, privateDefaultKey);
                   return userRecord;
               },
               PB.promiseError('Anonymous user ' + anonUsername + ' could not be added'));
}

/**
 * Generate a random username
 * @return {string}
 */
PB.M.PuffWardrobe.generateRandomUsername = function() {
    var generatedName = '';
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0; i<10; i++) {
        generatedName = generatedName + alphabet[Math.floor(Math.random() * (alphabet.length))];
    }
    return generatedName;
}

/**
 * Get the current user's DHT record, or create a new anon user, or die trying
 * @return {string}
 */
PB.M.PuffWardrobe.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var username = PB.M.PuffWardrobe.getCurrentUsername()

    if(username)
        return PB.getUserRecordNoCache(username)
    
    var prom = PB.M.PuffWardrobe.addNewAnonUser()
    
    return prom.then(function(userRecord) {
        PB.M.PuffWardrobe.switchCurrent(userRecord.username)
        console.log("Setting current user to " + userRecord.username);
        return userRecord
    })
}




////// PREFS ///////

/*
    These are related to this individual machine, as opposed to the identities stored therein.
    Identity-related preferences are... encrypted in the profile? That seems ugly, but maybe. 
    How are these machine-based prefs shared between machines? A special prefs puff?
*/


PB.M.PuffWardrobe.prefsarray = false  // put this somewhere else

/**
 * to get the preference 
 * @param  {string} key
 * @return {Prefs(String|Boolean)}
 */
PB.M.PuffWardrobe.getPref = function(key) {
    var prefs = PB.M.PuffWardrobe.getAllPrefs()
    return prefs[key]
}

/**
 * to get all the preferences
 * @return {Prefs(string|boolean)[]}
 */
PB.M.PuffWardrobe.getAllPrefs = function() {
    if(!PB.M.PuffWardrobe.prefsarray)
        PB.M.PuffWardrobe.prefsarray = PB.Persist.get('prefs') || {}
    
    return PB.M.PuffWardrobe.prefsarray
}

/**
 * to set the preference
 * @param {string} key
 * @param {string} value
 */
PB.M.PuffWardrobe.setPref = function(key, value) {
    var prefs = PB.M.PuffWardrobe.getAllPrefs()
    var newprefs = Boron.set_deep_value(prefs, key, value); // allows dot-paths

    PB.M.PuffWardrobe.prefsarray = newprefs

    var filename = 'prefs'
    PB.Persist.save(filename, newprefs)
    
    return newprefs
}

/**
 * to remove the preferences
 */
PB.M.PuffWardrobe.removePrefs = function() {
    var filename = 'prefs'
    PB.Persist.remove(filename)
}



////// PROFILE ///////

/*
    These exist on a per-identity basis, and are stored on the machine 
    as part of the identity's presence in the user's identity wardrobe.
*/

PB.M.PuffWardrobe.profilearray = {}  // THINK: put this somewhere else

/**
 * to get the profile item
 * @param  {string} key
 * @return {object}
 */
PB.M.PuffWardrobe.getProfileItem = function(key) {
    var username = PB.M.PuffWardrobe.currentKeys.username
    return PB.M.PuffWardrobe.getUserProfileItem(username, key)
}

/**
 * to set the profile item
 * @param {string} key
 * @param {string} value
 */
PB.M.PuffWardrobe.setProfileItem = function(key, value) {
    var username = PB.M.PuffWardrobe.currentKeys.username
    return PB.M.PuffWardrobe.setUserProfileItems(username, key, value)
}

/** 
 * to get all profile items
 * @return {object}
 */
PB.M.PuffWardrobe.getAllProfileItems = function() {
    var username = PB.M.PuffWardrobe.currentKeys.username
    return PB.M.PuffWardrobe.getAllUserProfileItems(username)
}

/**
 * Get a specific profile item for a user
 * @param  {string} username
 * @param  {string} key
 * @return {object}
 */
PB.M.PuffWardrobe.getUserProfileItem = function(username, key) {
    var profile = PB.M.PuffWardrobe.getAllUserProfileItems(username)
    return profile[key]
}

/**
 * Get all of the user's profile items
 * @param  {string} username
 * @return {object}
 */
PB.M.PuffWardrobe.getAllUserProfileItems = function(username) {
    if(!username) return {} // erm derp derp
    
    var parray = PB.M.PuffWardrobe.profilearray
    if(parray[username]) return parray[username]  // is this always right?
    
    var profilefile = 'profile::' + username
    parray[username] = PB.Persist.get(profilefile) || {}
    
    return parray[username]
}

/**
 * Set the user's profile items
 * @param {string} username
 * @param {string} key
 * @param {string} value
 */
PB.M.PuffWardrobe.setUserProfileItems = function(username, key, value) {
    if(!username) return false
    
    var profile = PB.M.PuffWardrobe.getAllUserProfileItems(username)
    var newprofile = Boron.set_deep_value(profile, key, value); // allows dot-paths

    PB.M.PuffWardrobe.profilearray[username] = newprofile

    var profilefile = 'profile::' + username;
    PB.Persist.save(profilefile, newprofile)
    
    return newprofile
}

/**
 * Remove the user's profile from wardrobe
 * @param  {string} username
 * @return {(void|false)}
 */
PB.M.PuffWardrobe.removeUserProfile = function(username) {
    if(!username) return false
    
    PB.M.PuffWardrobe.profilearray.delete(username)
    
    var profilefile = 'profile::' + username;
    PB.Persist.remove(profilefile)
}