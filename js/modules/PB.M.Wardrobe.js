/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.
  ==================================================

  The Wardrobe manages outfits and identities. 

  An identity is a username, a primary outfit, a list of alias outfits, and the identity's private preferences. Aliases generally correspond to anonymous usernames created for one-time encrypted transfer. 

  An outfit is a username, a 'capa', and a set of private keys. Additional private information (like a passphrase) may be stored in the 'bonus' field.

  Username and capa define a unique outfit. The capa field references a specific moment in the username's lifecycle, and correlates to the userRecord with the same username and capa whose public keys match the outfit's private keys. 

  Currently capa counts by consecutive integers. This may change in the future. Any set deriving Eq and Ord will work.

  The identity file can be imported and exported to the local filesystem. 

  Usage examples:
      PB.M.Wardrobe.switchCurrent(user.username)
      PB.M.Wardrobe.getCurrentKeys()

*/


/*
  THINK:
    - register callback handlers for user record creation and modification
    - PB.M.Wardrobe.init registers those with PB.onUserCreation and PB.onUserModification
    - identity file encryption using a passphrase



--------------------------------------------------

This whole file needs to change, along with anything that references it. May as well do the pref/prof stuff now too.


*/

PB.M.Wardrobe = {}

PB.M.Wardrobe.outfits = []
// outfit = { username: 'dann', root: '123', admin: '333', default: '444', capa: 12, bonus: {} }

PB.M.Wardrobe.identities = {}
// identity = { username: 'dann', primary: dann12, aliases: [dann11, dann10], prefs: {} }

PB.M.Wardrobe.keychain = false     // NOTE: starts false to trigger localStorage fetch. don't use this variable directly!
PB.M.Wardrobe.currentKeys = false  // false if not set, so watch out

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

    // TODO: this doesn't belong here, move it by having registering a switchCurrent callback
    // THINK: can we automate callbackable functions by wrapping them at runtime? or at callback setting time?
    // Events.pub('ui/switchCurrent', { prefs: PB.M.Wardrobe.getAllPrefs() })
    
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
    
    if(PB.M.Wardrobe.getPreference('storeKeychain'))
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
    
    if(PB.M.Wardrobe.currentKeys.username == username) {
        PB.M.Wardrobe.currentKeys = false
        PB.Persist.remove('identity'); // remove from localStorage
    }
    
    if(PB.M.Wardrobe.getPreference('storeKeychain'))
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

    return prom
        .then(function(userRecord) {
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
    // TODO: consolidate this with the new username generation functions
    var generatedName = '';
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for(var i=0; i<10; i++) {
        generatedName += PB.Crypto.getRandomItem(alphabet)
        // var randFloat = PB.Crypto.random();
        // generatedName = generatedName + alphabet[Math.floor(randFloat * (alphabet.length))];
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


/**
 * get the current identity's preferences
 * @param  {string} key
 * @return {value}
 */
PB.M.Wardrobe.getPreference = function(key) {
    return true
    
    // get current identity or error
    
    // return specified pref or false
}

/**
 * set a preference for the current identity
 * @param {string} key
 * @param {string} value
 */
PB.M.Wardrobe.setPreference = function(key, value) {
    return false
    
    // var prefs = PB.M.Wardrobe.getAllPrefs()
    var newprefs = Boron.set_deep_value(prefs, key, value); // allows dot-paths

    PB.M.Wardrobe.prefsarray = newprefs

    var filename = 'prefs'
    PB.Persist.save(filename, newprefs)
    
    return newprefs
}
