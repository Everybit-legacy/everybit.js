/*
     ______     __   __   ______     ______     __  __     ______     __     ______  
    /\  ___\   /\ \ / /  /\  ___\   /\  == \   /\ \_\ \   /\  == \   /\ \   /\__  _\ 
    \ \  __\   \ \ \'/   \ \  __\   \ \  __<   \ \____ \  \ \  __<   \ \ \  \/_/\ \/ 
     \ \_____\  \ \__|    \ \_____\  \ \_\ \_\  \/\_____\  \ \_____\  \ \_\    \ \_\ 
      \/_____/   \/_/      \/_____/   \/_/ /_/   \/_____/   \/_____/   \/_/     \/_/ 

    The main interface for the EveryBit platform.

    Most calls to the platform should go through here,
    rather than accessing core systems like EB.Data and EB.Crypto directly.

    In addition to the public-facing API some general helper functions
    are established here for use by the deeper layers.

    Copyright 2014-2015 EveryBit. See README for license information.

*/

if(typeof EB === 'undefined') EB = {}                   // we might load config.js first
if(!EB.CONFIG) EB.CONFIG = {}                           // or we might not

EB.Modules = {}                                         // supplementary extensions live here
EB.M = EB.Modules

EB.version = '0.7.13'


////////////// STANDARD API FUNCTIONS //////////////////

// Note that almost all of the EB.* API functions return a promise, with the exception of EB.formatIdentityFile and EB.loginWithIdentityFile. 


//// RECEIVE MESSAGES


/**
 * Try to get a particular puff by its signature
 * @param {string}  sig
 * @return {promise}
 */
EB.getPuffBySig = function(sig) {
    return EB.Data.getPuffBySig(sig)                    // get a promise for the puff from cache or network
}


/**
 * Try to get a puff by its sig from the local cache,
 * or ask the network and return false
 * @param {string}  sig
 * @return {(puff|false)}
 */
EB.getPuffOrNot = function(sig) {
    return EB.Data.getPuffOrNot(sig)                    // fire-and-forget style -- see note on EB.Data.getPuffOrNot
}


/**
 * Get a list of the current identity's currently cached puffs,
 * and ask the network for more
 * @return {[puffs]}
 */
EB.getMyMessagesOrNot = function() {
    // get current username
    // ask the network for anything new from or for me
    // return things from caches
    // -- why not a promise? because we don't know how many things we'll receive: halting problem. so F-A-F instead.
}


//// SEND MESSAGES


/**
 * Send a public message
 * @param {string}  content
 * @param {string}  type
 * @return {promise}
 */
EB.postPublicMessage = function(content, type) {
    //// post a public puff. type is optional and defaults to 'text'
    type = type || 'text'
    
    var myUsername = EB.getCurrentUsername()
    if(!myUsername)
        return EB.emptyPromise('You must have a current identity to post a public message')
    
    var puff = EB.Puff.simpleBuild(type, content)
    return Promise.resolve(EB.Data.addPuffToSystem(puff))
}


/**
 * Send a private message
 * @param {string}  content
 * @param {string}  usernames
 * @param {string}  type
 * @return {promise}
 */
EB.postPrivateMessage = function(content, usernames, type) {
    //// post an encrypted puff. type is optional and defaults to 'text'. usernames is an array of usernames.
    type = type || 'text'

    var myUsername = EB.getCurrentUsername()
    if(!myUsername)
        return EB.emptyPromise('You must have a current identity to post a private message')
    
    usernames = usernames || []
    if(!Array.isArray(usernames))
        usernames = [usernames]
    
    usernames.push(myUsername)
    usernames = EB.uniquify(usernames)
    var prom = EB.Users.usernamesToUserRecordsPromise(usernames)
    
    return prom.then(function(userRecords) {        
        var puff = EB.Puff.simpleBuild(type, content, null, usernames, userRecords)
        return EB.Data.addPuffToSystem(puff)
    })
    
    return prom
}


/**
 * Send an anonymous private message
 * @param {string}  content
 * @param {string}  usernames
 * @param {string}  type
 * @return {promise}
 */
EB.postAnonymousPrivateMessage = function(content, usernames, type) {}


/**
 * Send a traceless private message
 * @param {string}  content
 * @param {string}  usernames
 * @param {string}  type
 * @return {promise}
 */
EB.postParanoidPrivateMessage = function(content, usernames, type) {}


//// IDENTITY AND USER MANAGEMENT


/**
 * Create a new identity
 * @param {string} username             new username
 * @param {string} passphrase           a string passphrase
 * @return {promise}                    userRecord for the newly created user
 */
EB.createIdentity = function(username, passphrase) {
    // TODO: validations and error handling (lots of it)
    
    var prependedPassphrase = username + passphrase
        var privateKey = EB.Crypto.passphraseToPrivateKeyWif(prependedPassphrase)
    
    var prom = EB.registerTopLevelUser(username, privateKey, privateKey, privateKey)
    
    prom.then(function(userRecord) {
        var capa = 1 // THINK: does capa always start at 1? where should that knowledge live?
        EB.addAlias(username, username, capa, privateKey, privateKey, privateKey, {passphrase: passphrase})
        EB.switchIdentityTo(username)
    })
    
    // TODO: on switchIdentityTo false change undefined to ''
    
    return prom
}


/**
 * Register a new top-level user
 * @param {string}  username            new username
 * @param {string}  privateRootKey      new private root key
 * @param {string}  privateAdminKey     new private admin key
 * @param {string}  privateDefaultKey   new private default key
 * @return {promise}                    userRecord for the newly created user
 */
EB.registerTopLevelUser = function(username, privateRootKey, privateAdminKey, privateDefaultKey) {
    // OPT: privateToPublic is expensive -- we could reduce the number of calls if the private keys are identical
    var rootKeyPublic    = EB.Crypto.privateToPublic(privateRootKey)
    var adminKeyPublic   = EB.Crypto.privateToPublic(privateAdminKey)
    var defaultKeyPublic = EB.Crypto.privateToPublic(privateDefaultKey)

    var payload = { requestedUsername: username
                  ,           rootKey: rootKeyPublic
                  ,          adminKey: adminKeyPublic
                  ,        defaultKey: defaultKeyPublic
                  }

    var routes  = []
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    var puff = EB.Puff.build(username, privateAdminKey, routes, type, content, payload)
    
    var prom = EB.Net.updateUserRecord(puff)
    
    return prom
}


/**
 * register a subuser for the currently active identity
 * @param  {string} newUsername     desired new subuser name
 * @param  {string} rootKey         public root key for the new subuser
 * @param  {string} adminKey        public admin key for the new subuser
 * @param  {string} defaultKey      public default key for the new subuser
 * @return {promise}                userRecord for the newly created subuser
 */
EB.registerSubuser = function(newUsername, rootKey, adminKey, defaultKey) {
    var signingUsername = EB.getCurrentUsername()
    var prom
    
    EB.useSecureInfo(function(_, _, _, privateAdminKey, _) {
        prom = EB.Users.registerSubuserForUser(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey)
    })
    
    return prom
}


/**
 * Attempts to update a private key for the current user
 * If successful it adds the new alias to the current identity.
 * @param {string} keyToModify          'defaultKey', 'adminKey', or 'rootKey'
 * @param {string} newPrivateKey        the new private key
 * @param {string} secrets              secret information to include in the userRecord
 * @return {promise}                    the new userRecord
 */
EB.updatePrivateKey = function(keyToModify, newPrivateKey, secrets) {    
    var username = EB.getCurrentUsername()
    var newPublicKey = EB.Crypto.privateToPublic(newPrivateKey)

    if(['defaultKey', 'adminKey', 'rootKey'].indexOf(keyToModify) == -1)
        return EB.emptyPromise('That is not a valid key to modify')

    var payload = {}
    var routes  = []
    var content = 'modifyUserKey'
    var type    = 'updateUserRecord'

    payload.keyToModify = keyToModify
    payload.newKey = newPublicKey
    payload.time = Date.now()

    var prom = new Promise(function(resolve, reject) {
        var puff                                        // we use this var to return publicly accessible data 

        EB.useSecureInfo(function(_, _, privateRootKey, privateAdminKey, privateDefaultKey) {
            var signingUserKey = 'privateRootKey'       // changing admin or root keys requires root privileges
            var privateKey = privateRootKey

            if (keyToModify == 'defaultKey') { 
                signingUserKey = 'privateAdminKey'      // changing the default key only requires admin privileges
                privateKey = privateAdminKey
            }

            if(!privateKey) {
                return reject(EB.makeError("You need the " + signingUserKey + " to change the " + keyToModify + " key."))
            } else {
                puff = EB.Puff.build(username, privateKey, routes, type, content, payload)
            }
        })

        var userRecordPromise = EB.Net.updateUserRecord(puff)

        userRecordPromise.then(function(userRecord) {
            if(keyToModify == 'defaultKey') {
                EB.useSecureInfo(function(_, username, privateRootKey, privateAdminKey, _) {
                    EB.addAlias(username, username, userRecord.capa, privateRootKey, privateAdminKey, newPrivateKey, secrets)
                })
            }

            if(keyToModify == 'adminKey') {
                EB.useSecureInfo(function(_, username, privateRootKey, _, privateDefaultKey) {
                    EB.addAlias(username, username, userRecord.capa, privateRootKey, newPrivateKey, privateDefaultKey, secrets)
                })
            }

            if(keyToModify == 'rootKey') {
                EB.useSecureInfo(function(_, username, _, privateAdminKey, privateDefaultKey) {
                    EB.addAlias(username, username, userRecord.capa, newPrivateKey, privateAdminKey,  privateDefaultKey, secrets)
                })
            }

            return resolve(userRecord)
        })
        .catch(function(err) {
            return reject(EB.makeError(err))
        })
    })

    return prom
}


/**
 * Try to get a user's profile puff
 * @param {string}  username
 * @return {promise}
 */
EB.getProfilePuff = function(username) {
    var cached_profile = EB.Data.profiles[username]
    
    if(cached_profile)
        return Promise.resolve(cached_profile)

    var prom = EB.Net.getProfilePuff(username)

    prom = prom.then(function(puffs) {
        var puff = puffs[0]
    
        // NOTE: Setting this prevents us from re-trying to collect profiles from users who don't have them.
        //       This is good, because it prevents network noise, but requires a refresh to see new profile info.
        if(!puff)
            puff = {payload:{}} // TODO: get a proper empty puff from somewhere
        
        EB.Data.profiles[EB.Users.justUsername(puff.username || username)] = puff
    
        return puff
    })

    return prom
}


//// LOGIN & ID FILE MANAGEMENT


/**
 * Make an identity the current one
 * @param {string}  username
 * @param {string}  privateKey          // the key for the user's identity file
 * @return {promise}
 */
EB.login = function(username, privateKey) {
    // TODO: handle offline case...
    // TODO: encrypted localStorage identity files
    // TODO: cache encrypted puffs in localStorage
    // TODO: grab the user record from EB.loginWithPassphrase
    
    userprom = EB.Users.getUserRecordNoCache(username)
    
    return userprom.then(function(userRecord) {
        if(!userRecord)
            return EB.onError('Could not access user record')
        
        var identitySig = userRecord.identity
        
        if(identitySig) {
            var decryptprom = EB.Users.getIdentityPuff(userRecord, privateKey)
            
            return decryptprom.then(function(letter) {
                if(letter && letter.payload && letter.payload.content)
                    return EB.loginWithIdentityFile(letter.payload.content)
                else
                    return EB.throwError('Invalid password') // THINK: this could happen for other reasons
            }, function(err) {
                return EB.catchError('Could not access identity file')
            })
        }
        
        // no identity puff, so try it the old fashioned way
        // TODO: move this in to a helper function
        var publicKey = EB.Crypto.privateToPublic(privateKey)
        
        if( (userRecord.defaultKey != publicKey) 
         && (userRecord.adminKey   != publicKey) 
         && (userRecord.rootKey    != publicKey) )
            return EB.onError('That user record has no identity file, and the public key provided does not match')
    
        var secrets = {} // {passphrase: passphrase} // THINK: maybe move this up a level to loginWithPassphrase
        EB.addAlias(username, username, userRecord.capa, privateKey, privateKey, privateKey, secrets)

        EB.switchIdentityTo(username)
        
        EB.storeIdentityFileInCloud()
        
        return true
    })
}


/**
 * Takes a canonical identity file object, adds it to the wardrobe, and signs you in
 * @param {object} Identity file
 * @return 
 */
EB.loginWithIdentityFile = function(object) {
    //// 
    
    var username = object.username
    var aliases  = object.aliases
    var preferences = object.preferences
    
    if(!username || !aliases || !preferences)
        return EB.onError('That is not a valid identity object')
    
    EB.currentIdentityHash = EB.Crypto.createMessageHash(JSON.stringify(object))
    
    EB.addIdentity(username, aliases, preferences)
    
    return EB.switchIdentityTo(username)
}


/**
 * Try to access the system with a username/passphrase combo
 * @param {string} username
 * @param {string} passphrase
 * @param {string} legacy
 * @return {promise}
 */
EB.loginWithPassphrase = function(username, passphrase, legacy) {
    // First attempt to prepend username to passphrase
    // If that fails then try just using the passphrase
    var pass = legacy ? passphrase : username + passphrase

    var privateKey = EB.Crypto.passphraseToPrivateKeyWif(pass)
    var publicKey = EB.Crypto.privateToPublic(privateKey)

    var userprom = EB.Users.getUserRecordNoCache(username)

    return userprom.then(function(userRecord) {
        if(!userRecord)
            return EB.onError('Could not access user record')
        
        if( (userRecord.defaultKey != publicKey) 
         && (userRecord.adminKey   != publicKey) 
         && (userRecord.rootKey    != publicKey) )
            return (legacy) ? false : EB.loginWithPassphrase(username, passphrase, true)

        return EB.login(username, privateKey)
    })
}


/**
 * Store the current identity's identity file in the cloud
 * @return {promise}
 */
EB.storeIdentityFileInCloud = function() {
    if(!EB.currentIdentityHash) {
        // THINK: user did not log in with identity file... so what should we do here?
    }

    // get identity file
    var content = EB.formatIdentityFile()
    if(!content) return false
    
    // check against latest
    var newIdentityHash = EB.Crypto.createMessageHash(JSON.stringify(content))
    if(EB.currentIdentityHash == newIdentityHash) return false
    EB.currentIdentityHash = newIdentityHash
    
    // package as encrypted puff
    var payload = {}
    var routes  = []
    var type    = 'identity'
        
    var userRecord = EB.getCurrentUserRecord()
    var userRecordsForWhomToEncrypt = [userRecord]

    if(!userRecord) return false

    // THINK: using simpleBuildPuff puts a timestamp in the identity file...
    var puff = EB.Puff.simpleBuild(type, content, payload, routes, userRecordsForWhomToEncrypt)
    
    if(!puff) return false
        
    // if(puff.sig == userRecord.identity) return false // always false, because of the timestamp -- if you remove it, add this back
    
    EB.Net.distributePuff(puff)                         // send it to the server
    
    // update user record
    var payload = {}                                    // NOTE: the double "var"s don't hurt, and help keep us focused
    var routes  = []
    var type    = 'updateUserRecord'
    var content = 'setIdentity'
    var update_puff

    payload.identity = puff.sig

    EB.useSecureInfo(function(_, currentUsername, _, privateAdminKey, _) {
        if(!privateAdminKey)
            return EB.onError('You must have an administrative key to upload your identity file')
        
        update_puff = EB.Puff.build(currentUsername, privateAdminKey, routes, type, content, payload)
    })
    
    if(!update_puff)
        return false
    
    var update_prom = EB.Net.updateUserRecord(update_puff)
        
    return update_prom
}


/**
 * Try to get an identity file and format it correctly
 * @param {string} username
 * @return {(object|false)}
 */
EB.formatIdentityFile = function(username) {
    // THINK: consider passphrase protecting the identity file by default
    // TODO: add authFromIdFile -- need consistency both ways
    
    username = username || EB.getCurrentUsername()
    
    if(!username) return false

    var idFile = {}

    EB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // this leaks all of the identity information back to the caller
        // if we passphrase protect the file, do it here to prevent that leakage

        var identity = identities[username]

        // assemble idFile manually to keep everything in the right order
        // idFile.comment = "This file contains your private passphrase. The information here can be used to login to websites on the EveryBit platform. Keep this file safe and secure!"

        idFile.username = username
        // idFile.primary  = identity.primary // NOTE: primary is automatically gathered from aliases
        idFile.aliases  = identity.aliases
        idFile.preferences = identity.preferences
        idFile.version  = "1.1"
    })

    return idFile
}

//// END STANDARD API ////





//// SECURE INFORMATION INTERFACE

EB.implementSecureInterface = function(useSecureInfo, addIdentity, addAlias, setPrimaryAlias, setPreference, switchIdentityTo, removeIdentity) {
    // useSecureInfo    = function( function(identities, username, privateRootKey, privateAdminKey, privateDefaultKey) )
    // addIdentity      = function(username, aliases, preferences)
    // addAlias         = function(identityUsername, aliasUsername, capa, privateRootKey, privateAdminKey, privateDefaultKey, secrets)
    // setPrimaryAlias  = function(identityUsername, aliasUsername)
    // removeIdentity   = function(username)
    // setPreference    = function(key, value) // for current identity
    // switchIdentityTo = function(username)

    // THINK: consider ensuring all functions are present first, so it's harder to mix and match wardrobe implementations
    
    if(typeof useSecureInfo == 'function') {
        EB.useSecureInfo = function(callback) {
            // NOTE: useSecureInfo returns true if there is a current identity, and false otherwise
            return useSecureInfo( function(identities, username, privateRootKey, privateAdminKey, privateDefaultKey) {
                var clonedIdentities = JSON.parse(JSON.stringify(identities)) // prevent accidental mutation
                callback(clonedIdentities, username, privateRootKey, privateAdminKey, privateDefaultKey)
            })
        }
    }
    
    if(typeof addIdentity == 'function')
        EB.addIdentity = addIdentity
        
    if(typeof addAlias == 'function')
        EB.addAlias = addAlias
        
    if(typeof setPrimaryAlias == 'function')
        EB.setPrimaryAlias = setPrimaryAlias
        
    if(typeof setPreference == 'function')
        EB.setPreference = setPreference
        
    if(typeof switchIdentityTo == 'function')
        EB.switchIdentityTo = function(username) {
            EB.runHandlers('beforeSwitchIdentity', username)
            var output = switchIdentityTo(username)
            EB.runHandlers('afterSwitchIdentity', username)
            return output
        }
        
    if(typeof removeIdentity == 'function')
        EB.removeIdentity = removeIdentity
        
    EB.getCurrentUsername = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        EB.useSecureInfo(function(identities, username) { output = username })
        return output
    }
    
    EB.getCurrentCapa = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        EB.useSecureInfo(function(identities, username) { output = ((identities[username]||{}).primary||{}).capa||0 })
        return output
    }
    
    EB.getCurrentVersionedUsername = function() {
        var username = EB.getCurrentUsername()
        if(!username)
            return EB.onError('No current user in wardrobe')
        
        return EB.Users.makeVersioned(username, EB.getCurrentCapa())
    }
    
    EB.getCurrentUserRecord = function() {
        var versionedUsername = EB.getCurrentVersionedUsername()
        if(!versionedUsername)
            return false
        
        // THINK: it's weird to hit the cache directly from here, but if we don't then we always get a promise,
        //        even if we hit the cache, and this should return a proper userRecord, not a promise, 
        //        since after all we have stored the userRecord in our wardrobe, haven't we?
    
        var userRecord = EB.Users.records[versionedUsername]
        if(!userRecord)
            return EB.onError('That user does not exist in our records')
    
        return userRecord
    }

    EB.getAllIdentityUsernames = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        EB.useSecureInfo(function(identities, username) { output = Object.keys(identities) })
        return output
    }
    
}


//// INITIALIZATION

EB.init = function(options) {
    //// initializes all available modules and the platform subsystems.
    //// options is an object of configuration options that is passed to each module and subsystem.
    
    // BEGIN CONFIG AND OPTIONS //
    
    options = options || {}
    
    setDefault('zone', '')
    setDefault('puffApi', 'https://i.cx/api/puffs/api.php')
    setDefault('userApi', 'https://i.cx/api/users/api.php')
    setDefault('eventsApi', 'https://i.cx/api/puffs/api.php')
    setDefault('enableP2P', false)
    setDefault('pageBatchSize', 10)
    setDefault('initLoadGiveup', 200)
    setDefault('networkTimeout', 20000)         // twenty second timeout
    setDefault('noLocalStorage', false)
    setDefault('netblockSuffix', 'local')
    setDefault('cryptoworkerURL', '')           // point to cryptoworker.js to enable worker thread
    setDefault('ephemeralKeychain', false)      // prevents keychain from being saved to localStorage
    setDefault('initLoadBatchSize', 20)
    setDefault('inMemoryShellLimit', 10000)     // shells are removed to compensate
    setDefault('globalBigBatchLimit', 2000)     // maximum number of shells to receive at once // TODO: align with API
    setDefault('inMemoryMemoryLimit', 300E6)    // ~300MB
    setDefault('anonPrivateAdminKey', '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx') // for registering anon users
    setDefault('disableSendToServer', false)    // so you can work locally
    setDefault('disableReceivePublic', false)   // no public puffs except profiles
    setDefault('disableCloudIdentity', false)   // don't store encrypted identity in the cloud
    setDefault('supportedContentTypes', false)  // whitelist of context types; false loads all
    setDefault('shellContentThreshold', 1000)   // size of uncompacted content
    setDefault('localStorageShellLimit', 1000)  // maximum number of shells
    setDefault('localStorageMemoryLimit', 3E6)  // ~3MB
    
    function setDefault(key, val) {
        EB.CONFIG[key] = options[key] || EB.CONFIG[key] || val
    }
    
    // END CONFIG AND OPTIONS //
        
    EB.Users.init(options)                              // initialize the user record subsystem
    EB.Data.init(options)                               // initialize the data subsystem
    EB.Net.init(options)                                // initialize the network subsystem
    
    var moduleKeys = Object.keys(EB.M)
    moduleKeys.forEach(function(key) {                  // call all module initializers
        if(EB.M[key].init) 
            EB.M[key].init(options)
    })
    
    popMods()                                           // deflate any machine prefs
    function popMods() {                                // THINK: maybe move this to EB.Persist.init
        var mods = EB.Persist.get('CONFIG')
        if(!mods) return false
    
        EB.CONFIG.mods = mods
        Object.keys(EB.CONFIG.mods).forEach(function(key) { EB.CONFIG[key] = mods[key] })
    }
    
    EB.buildCryptoworker(options)
}


////////////// END STANDARD API //////////////////



////////////// HANDLER HANDLERS //////////////////

EB.handlers = {}

EB.addHandler = function(type, callback) {
  if(!EB.handlers[type]) EB.handlers[type] = []
  EB.handlers[type].push(callback)
}

EB.runHandlers = function(type) {
  var args = [].slice.call(arguments, 1)
  return (EB.handlers[type] || []).reduce(
      function(acc, callback) {
          return callback.apply(null, acc == null ? args : Array.isArray(acc) ? acc : [acc])}, args)
}

EB.makeHandlerHandler = function(type) {
    return function(callback) {return EB.addHandler(type, callback)}
}

// USEFUL HANDLERS:

EB.addErrorHandler           = EB.makeHandlerHandler('error')           // receives all error messages

EB.addNewPuffHandler         = EB.makeHandlerHandler('newPuffs')        // called when new puffs are available

EB.addDHTErrorHandler        = EB.makeHandlerHandler('DHTError')        // receives DHT error messages

EB.addRelationshipHandler    = EB.makeHandlerHandler('relationship')    // manage relationships between puffs

EB.addTimeoutErrorHandler    = EB.makeHandlerHandler('timeoutError')    // receives timeout error messages

EB.addNetworkErrorHandler    = EB.makeHandlerHandler('networkError')    // receives network error messages

EB.addNewPuffReportHandler   = EB.makeHandlerHandler('newPuffReport')   // handles reports on incoming puffs

EB.addIdentityUpdateHandler  = EB.makeHandlerHandler('identityUpdate')  // general GUI update trigger

EB.addNetworkResponseHandler = EB.makeHandlerHandler('networkresponse') // receives all network response

EB.addPayloadModifierHandler = EB.makeHandlerHandler('payloadModifier') // decorate puff payloads 

// EB.addClearPuffCacheHandler = EB.makeHandlerHandler('clearpuffcache')

// beforeSwitchIdentity is called prior to switchIdentity and removeIdentity, while the old identity is active
// afterSwitchIdentity  is called after switchIdentity, once the new identity is active
EB.addBeforeSwitchIdentityHandler = EB.makeHandlerHandler('beforeSwitchIdentity')
EB.addAfterSwitchIdentityHandler  = EB.makeHandlerHandler('afterSwitchIdentity')

////////////// END HANDLER HANDLERS //////////////




//// PUFF HELPERS ////

EB.decryptPuffForReals = function(envelope, yourPublicWif, myVersionedUsername, myPrivateWif) {
    //// interface with EB.Crypto for decrypting a message
    // TODO: this should be in EB.Data, but is in EB for cryptoworker's sake
    if(!envelope.keys) return false
    var keyForMe = envelope.keys[myVersionedUsername]
    var puffkey  = EB.Crypto.decryptPrivateMessage(keyForMe, yourPublicWif, myPrivateWif)
    var letterCipher = envelope.payload.content
    var letterString = EB.Crypto.decryptWithAES(letterCipher, puffkey)
    var betterString = EB.tryDecodeURIComponent(escape(letterString))   // try decoding
    return EB.parseJSON(betterString)                                   // try parsing
}

//// END PUFF HELPERS ////






//// BUILD CRYPTO WORKER ////

EB.buildCryptoworker = function(options) {
    var cryptoworkerURL = options.cryptoworkerURL || EB.CONFIG.cryptoworkerURL // || 'cryptoworker.js'
    
    if(!cryptoworkerURL) return false
    
    EB.cryptoworker = new Worker(cryptoworkerURL)
    EB.cryptoworker.addEventListener("message", EB.workerreceive)
}

EB.workerqueue = []
EB.workerautoid = 0

EB.workerreceive = function(msg) {
    var id = msg.data.id
    if(!id) return false // TODO: add onError here

    var fun = EB.workerqueue[id]
    if(!fun) return false // TODO: add onError here

    fun(msg.data.evaluated)

    delete EB.workerqueue[id] // THINK: this leaves a sparse array, but is probably faster than splicing
}

EB.workersend = function(funstr, args, resolve, reject) {
    EB.workerautoid += 1
    EB.workerqueue[EB.workerautoid] = resolve
    if(!Array.isArray(args))
        args = [args]
    EB.cryptoworker.postMessage({fun: funstr, args: args, id: EB.workerautoid})
}

//// END BUILD CRYPTO WORKER ////




//// ERROR HELPERS

// TODO: build a more general error handling system for GUI integration

EB.onError = function(msg, obj, trigger) {
    //// override this for custom error behavior
    
    var composite = {msg: msg, obj: obj}

    EB.runHandlers('error', composite)
    
    if(trigger)
        EB.runHandlers(trigger, composite)
        
    // for debugging help, run this in the console:
    // EB.addErrorHandler(function(composite) {console.log(composite)})

    return false
}

EB.catchError = function(msg) {
    //// ex: prom.catch( EB.catchError('invalid foo') ).then(function(foo) {...})
    return function(err) {
        EB.onError(msg, err)
        throw err
    }
}

EB.throwError = function(msg, errmsg) {
    //// ex: prom.then(function(foo) {if(!foo) EB.throwError('no foo'); ...})
    var err = errmsg ? Error(errmsg) : ''
    throw EB.makeError(msg, err)
}

EB.makeError = function(msg, err, trigger) {
    //// ex: new Promise(function(resolve, reject) { if(!foo) reject( EB.makeError('no foo') ) ... })
    EB.onError(msg, err, trigger)
    return Error(msg)
}

EB.emptyPromise = function(msg) {
    //// ex: function(foo) { if(!foo) return EB.emptyPromise('no foo'); return getFooPromise(foo) }
    if(msg) EB.onError(msg)
    return Promise.reject(msg)
}

EB.throwNetError = function(msg, errmsg) {
    //// like throw error but triggers the networkError handler
    var trigger = 'networkError'
    var err = errmsg ? Error(errmsg) : ''
    throw EB.makeError(msg, err, trigger)
}

EB.throwDHTError = function(msg, errmsg) {
    //// like throw error but triggers the DHTError handler
    var trigger = 'DHTError'
    var err = errmsg ? Error(errmsg) : ''
    throw EB.makeError(msg, err, trigger)
}


//// Exceptional API wrappers

EB.parseJSON = function(str) {
    //// JSON.parse throws, so we catch it. throw/catch borks the JS VM optimizer, so we box it.
    try {
        return JSON.parse(str)
    } catch(err) {
        return EB.onError('Invalid JSON string', err)
    }
}

EB.stringifyJSON = function(obj) {
    //// JSON.stringify throws on dumb DOM objects, so we catch it. throw/catch borks the JS VM optimizer, so we box it.
    try {
        return JSON.stringify(obj)
    } catch(err) {
        return EB.onError('Invalid object', err)
    }
}

EB.tryDecodeURIComponent = function(str) {
    //// decodeURIComponent throws, so we wrap it. try/catch kills the optimizer, so we isolate it.
    try {
        return decodeURIComponent(str)
    } catch(err) {
        return EB.onError('Invalid URI string', err)
    }
}


//// something different

EB.promisesPending = {}

// Major jujitsu here
EB.promiseMemoize = function(fun, ohboy) {
    if(!ohboy) ohboy = EB.removePromisePending
    
    return function() {
        var key = JSON.stringify([fun.toString(),arguments])
        
        if(EB.promisesPending[key])
            return EB.promisesPending[key]
        
        var prom = fun.apply(fun, arguments)
        prom = prom.then(function(value) {
            ohboy(key, value)
            return value                                        // deliver successes
        }, function(value) {
            ohboy(key, value)
            throw value                                         // propagate failures
        })
        
        EB.promisesPending[key] = prom
        return prom
    }
}

EB.removePromisePending = function(key) {
    delete EB.promisesPending[key]
}


////////////// A few small helpers for building functional pipelines ///////////////

EB.prop = function(p, obj) { // THINK: consider importing all of Rambda.js
    return arguments.length < 2 ? function (obj) { return obj[p]; } : obj[p]
}

EB.uniquify = function(list) {
    return list.filter(EB.unique)
}

EB.unique = function(item, index, array) {return array.indexOf(item) == index}
