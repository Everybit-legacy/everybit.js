/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  PB.M.Wardrobe.switchCurrent(user.username)
  PB.M.Wardrobe.getCurrentKeys()

*/


//// USER INFO ////

/*
    
    Move this into a separate PuffIdentity module that handles identity wardrobe, profiles, and machine-based preferences.
    PB.M.Forum uses PuffIdentity for all identity-related functionality -- this way other modules can build on PuffIdentity too.
    PuffIdentity is responsible for managing persistence of identities, keeping the core clean of such messy concerns.

    -- Maybe call it PB.M.Wardrobe? Is this just a place for local identity management, or also a place for managing user records?
    -- We need to separate out these concerns...


  ---> register callback handlers for user record creation and modification
  ---> PB.M.Wardrobe.init registers those with PB.onUserCreation and PB.onUserModification
  ---> canonical identity object: username, keys.public.default, keys.private.admin, latest, etc. [or just use the spec... yeah. w/ .private for private key versions...]
  ---> always use CIO for everything; distinguish identities from users for all time. (...?)
  ---> 


*/

PB.M.Wardrobe = {}
PB.M.Wardrobe.keychain = false       // NOTE: starts false to trigger localStorage fetch. don't use this variable directly!
PB.M.Wardrobe.currentKeys = false    // false if not set, so watch out

/**
 * Get the current keys
 * @return {string}
 */
PB.M.Wardrobe.getCurrentKeys = function() {
    return PB.M.Wardrobe.currentKeys
}

/**
 * get the current username
 * @return {string}
 */
PB.M.Wardrobe.getCurrentUsername = function() {
    return (PB.M.Wardrobe.currentKeys || {}).username || ''
}

/**
 * get the current user record
 * @return {string}
 */
PB.M.Wardrobe.getCurrentUserRecord = function() {
    var username = PB.M.Wardrobe.getCurrentUsername()
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
PB.M.Wardrobe.getAll = function() {
    if(!PB.M.Wardrobe.keychain)
        PB.M.Wardrobe.keychain = PB.Persist.get('keychain') || {}
    
    return PB.M.Wardrobe.keychain
}

/**
 * Change current keyset. also used for clearing the current keyset (call with '')
 * @param  {string} username
 * @return {string[]}
 */
PB.M.Wardrobe.switchCurrent = function(username) {
    //// Change current keyset. also used for clearing the current keyset (call with '')

    if(!username)
        return PB.M.Wardrobe.currentKeys = false
    
    var keychain = PB.M.Wardrobe.getAll()
    var keys     = keychain[username]

    if(!keys)
        return PB.onError('There are no keys in the wardrobe for that identity -- try adding it first')

    PB.Persist.save('identity', username); // save to localStorage
    
    // TODO: this doesn't belong here, move it (probably by registering interesting users with the platform)
    PB.Data.clearExistingPrivateShells() // OPT: destroying and re-requesting this is unnecessary
    PB.Data.importPrivateShells(username)
    
    return PB.M.Wardrobe.currentKeys = keys
}

/**
 * Store the user's root key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.Wardrobe.storeRootKey = function(username, rootKey) {
    PB.M.Wardrobe.storePrivateKeys(username, rootKey)
}

/**
 * Store the user's admin key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.Wardrobe.storeAdminKey = function(username, adminKey) {
    PB.M.Wardrobe.storePrivateKeys(username, false, adminKey)
}

/**
 * Store the user's default key
 * @param  {string} username
 * @param  {string} rootKey
 */
PB.M.Wardrobe.storeDefaultKey = function(username, defaultKey) {
    PB.M.Wardrobe.storePrivateKeys(username, false, false, defaultKey)
}

/**
 * Store some extra information
 * @param  {string} username
 * @param  {obj} bonusInfo
 */
PB.M.Wardrobe.storePrivateBonus = function(username, bonusInfo) {
    // TODO: this should probably merge with existing bonuses instead of overwriting them
    PB.M.Wardrobe.storePrivateKeys(username, false, false, false, bonusInfo)
}

/**
 * Add keys to the wardrobe with no validation
 * @param  {string} username
 * @param  {string} rootKey
 * @param  {string} adminKey
 * @param  {string} defaultKey
 * @param  {obj} bonusInfo
 */
PB.M.Wardrobe.storePrivateKeys = function(username, rootKey, adminKey, defaultKey, bonusInfo) {
    //// Add keys to the wardrobe with no validation
    PB.M.Wardrobe.keychain = PB.M.Wardrobe.getAll()
    
    PB.M.Wardrobe.keychain[username] = PB.M.Wardrobe.keychain[username] || {username: username}
    
    if(rootKey)
        PB.M.Wardrobe.keychain[username].root    = rootKey
    if(adminKey)
        PB.M.Wardrobe.keychain[username].admin   = adminKey
    if(defaultKey)
        PB.M.Wardrobe.keychain[username].default = defaultKey
    if(typeof bonusInfo != 'undefined')
        PB.M.Wardrobe.keychain[username].bonus   = bonusInfo
    
    if(PB.M.Wardrobe.getPref('storeKeychain'))
        PB.Persist.save('keychain', PB.M.Wardrobe.keychain)
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
PB.M.Wardrobe.validatePrivateKeys = function(username, rootKey, adminKey, defaultKey, callback) {
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
PB.M.Wardrobe.removeKeys = function(username) {
    //// clear the identity's private keys from the wardrobe
    PB.M.Wardrobe.keychain = PB.M.Wardrobe.getAll()

    delete PB.M.Wardrobe.keychain[username]
    
    if(PB.M.Wardrobe.currentKeys.username == username)
        PB.M.Wardrobe.currentKeys = false
    
    if(PB.M.Wardrobe.getPref('storeKeychain'))
        PB.Persist.save('keychain', PB.M.Wardrobe.keychain)
}

/**
 * Create a new anonymous identity and add it to the local identity list
 */
PB.M.Wardrobe.addNewAnonUser = function() {
    //// create a new anonymous identity and add it to the local identity list
    //// it seems strange to have this in PB.M.Wardrobe, but we have to keep the generated private keys here.

    // generate private keys
    var privateRootKey    = PB.Crypto.generatePrivateKey();
    var privateAdminKey   = PB.Crypto.generatePrivateKey();
    var privateDefaultKey = PB.Crypto.generatePrivateKey();
    
    // generate public keys
    var rootKey    = PB.Crypto.privateToPublic(privateRootKey);
    var adminKey   = PB.Crypto.privateToPublic(privateAdminKey);
    var defaultKey = PB.Crypto.privateToPublic(privateDefaultKey);

    // build new username
    var anonUsername = PB.M.Wardrobe.generateRandomUsername();
    var newUsername  = 'anon.' + anonUsername;

    // send it off
    var prom = PB.Net.registerSubuser('anon', CONFIG.users.anon.adminKey, newUsername, rootKey, adminKey, defaultKey);

    return prom.then(function(userRecord) {
                   // store directly because we know they're valid, and so we don't get tangled up in more promises
                   PB.M.Wardrobe.storePrivateKeys(newUsername, privateRootKey, privateAdminKey, privateDefaultKey);
                   return userRecord;
               },
               PB.promiseError('Anonymous user ' + anonUsername + ' could not be added'));
}

/**
 * Generate a random username
 * @return {string}
 */
PB.M.Wardrobe.generateRandomUsername = function() {
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
PB.M.Wardrobe.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var username = PB.M.Wardrobe.getCurrentUsername()

    if(username)
        return PB.getUserRecordNoCache(username)
    
    var prom = PB.M.Wardrobe.addNewAnonUser()
    
    return prom.then(function(userRecord) {
        PB.M.Wardrobe.switchCurrent(userRecord.username)
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


PB.M.Wardrobe.prefsarray = false  // put this somewhere else

/**
 * to get the preference 
 * @param  {string} key
 * @return {Prefs(String|Boolean)}
 */
PB.M.Wardrobe.getPref = function(key) {
    var prefs = PB.M.Wardrobe.getAllPrefs()
    return prefs[key]
}

/**
 * to get all the preferences
 * @return {Prefs(string|boolean)[]}
 */
PB.M.Wardrobe.getAllPrefs = function() {
    if(!PB.M.Wardrobe.prefsarray)
        PB.M.Wardrobe.prefsarray = PB.Persist.get('prefs') || {}
    
    return PB.M.Wardrobe.prefsarray
}

/**
 * to set the preference
 * @param {string} key
 * @param {string} value
 */
PB.M.Wardrobe.setPref = function(key, value) {
    var prefs = PB.M.Wardrobe.getAllPrefs()
    var newprefs = Boron.set_deep_value(prefs, key, value); // allows dot-paths

    PB.M.Wardrobe.prefsarray = newprefs

    var filename = 'prefs'
    PB.Persist.save(filename, newprefs)
    
    return newprefs
}

/**
 * to remove the preferences
 */
PB.M.Wardrobe.removePrefs = function() {
    var filename = 'prefs'
    PB.Persist.remove(filename)
}



////// PROFILE ///////

/*
    These exist on a per-identity basis, and are stored on the machine 
    as part of the identity's presence in the user's identity wardrobe.
*/

PB.M.Wardrobe.profilearray = {}  // THINK: put this somewhere else

/**
 * to get the profile item
 * @param  {string} key
 * @return {object}
 */
PB.M.Wardrobe.getProfileItem = function(key) {
    var username = PB.M.Wardrobe.currentKeys.username
    return PB.M.Wardrobe.getUserProfileItem(username, key)
}

/**
 * to set the profile item
 * @param {string} key
 * @param {string} value
 */
PB.M.Wardrobe.setProfileItem = function(key, value) {
    var username = PB.M.Wardrobe.currentKeys.username
    return PB.M.Wardrobe.setUserProfileItems(username, key, value)
}

/** 
 * to get all profile items
 * @return {object}
 */
PB.M.Wardrobe.getAllProfileItems = function() {
    var username = PB.M.Wardrobe.currentKeys.username
    return PB.M.Wardrobe.getAllUserProfileItems(username)
}

/**
 * Get a specific profile item for a user
 * @param  {string} username
 * @param  {string} key
 * @return {object}
 */
PB.M.Wardrobe.getUserProfileItem = function(username, key) {
    var profile = PB.M.Wardrobe.getAllUserProfileItems(username)
    return profile[key]
}

/**
 * Get all of the user's profile items
 * @param  {string} username
 * @return {object}
 */
PB.M.Wardrobe.getAllUserProfileItems = function(username) {
    if(!username) return {} // erm derp derp
    
    var parray = PB.M.Wardrobe.profilearray
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
PB.M.Wardrobe.setUserProfileItems = function(username, key, value) {
    if(!username) return false
    
    var profile = PB.M.Wardrobe.getAllUserProfileItems(username)
    var newprofile = Boron.set_deep_value(profile, key, value); // allows dot-paths

    PB.M.Wardrobe.profilearray[username] = newprofile

    var profilefile = 'profile::' + username;
    PB.Persist.save(profilefile, newprofile)
    
    return newprofile
}

/**
 * Remove the user's profile from wardrobe
 * @param  {string} username
 * @return {(void|false)}
 */
PB.M.Wardrobe.removeUserProfile = function(username) {
    if(!username) return false
    
    PB.M.Wardrobe.profilearray.delete(username)
    
    var profilefile = 'profile::' + username;
    PB.Persist.remove(profilefile)
}