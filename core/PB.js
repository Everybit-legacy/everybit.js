/*
       _______  __   __  _______  _______  _______  _______  ___      ___     
      |       ||  | |  ||       ||       ||  _    ||   _   ||   |    |   |    
      |    _  ||  | |  ||    ___||    ___|| |_|   ||  |_|  ||   |    |   |    
      |   |_| ||  |_|  ||   |___ |   |___ |       ||       ||   |    |   |    
      |    ___||       ||    ___||    ___||  _   | |       ||   |___ |   |___ 
      |   |    |       ||   |    |   |    | |_|   ||   _   ||       ||       |
      |___|    |_______||___|    |___|    |_______||__| |__||_______||_______|                                                
 
  
    The main interface for the puffball platform. 
    
    Most calls to the platform should go through here, 
    rather than accessing core systems like PB.Data and PB.Crypto directly.

    In addition to the public-facing API many general helper functions 
    are established here for use by the deeper layers.

    Copyright 2014 EveryBit. See README for license information.

 */

if(typeof PB === 'undefined') PB = {}                   // we might load config.js first
if(!PB.CONFIG) PB.CONFIG = {}                           // or we might not

PB.Modules = {}                                         // supplementary extensions live here
PB.M = PB.Modules

PB.version = '0.7.2'

////////////// STANDARD API FUNCTIONS //////////////////


PB.init = function(options) {
    //// initializes all available modules and the platform subsystems.
    //// options is an object of configuration options that is passed to each module and subsystem.
    
    options = options || {}
    
    // BEGIN CONFIG AND OPTIONS //
    
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
    setDefault('anonPrivateAdminKey', '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx') // Used to register anon. users
    setDefault('disableSendToServer', false)    // so you can work locally
    setDefault('disableReceivePublic', false)   // no public puffs except profiles
    setDefault('supportedContentTypes', false)  // whitelist of context types; false loads all
    setDefault('shellContentThreshold', 1000)   // size of uncompacted content
    setDefault('localStorageShellLimit', 1000)  // maximum number of shells
    setDefault('localStorageMemoryLimit', 3E6)  // ~3MB
    
    function setDefault(key, val) {
        PB.CONFIG[key] = options[key] || PB.CONFIG[key] || val
    }
    
    // END CONFIG AND OPTIONS //
        
    PB.Users.init(options)                              // initialize the user record subsystem
    PB.Data.init(options)                               // initialize the data subsystem
    PB.Net.init(options)                                // initialize the network subsystem
    
    var moduleKeys = Object.keys(PB.M)
    moduleKeys.forEach(function(key) {                  // call all module initializers
        if(PB.M[key].init) 
            PB.M[key].init(options)
    })
    
    popMods()                                           // deflate any machine prefs
    function popMods() {                                // THINK: maybe move this to PB.Persist.init
        var mods = PB.Persist.get('CONFIG')
        if(!mods) return false
    
        PB.CONFIG.mods = mods
        Object.keys(PB.CONFIG.mods).forEach(function(key) { PB.CONFIG[key] = mods[key] })
    }
    
    PB.buildCryptoworker(options)
}


PB.getPuffBySig = function(sig) {
    //// get a particular puff
    var shell = PB.Data.getCachedShellBySig(sig)        // check in regular cache
    
    if(!shell)
        shell = PB.Data.getDecryptedLetterBySig(sig)    // check in private cache
    
    if(shell)
        return PB.Data.getPuffFromShell(shell)          // get a puff from the shell
        
    return PB.Data.getPuffBySig(sig)                    // get the puff
}

PB.postPublicMessage = function(content, type) {
    //// post a public puff. type is optional and defaults to 'text'
    type = type || 'text'
    
    var myUsername = PB.getCurrentUsername()
    if(!myUsername)
        return PB.emptyPromise('You must have a current identity to post a public message')
    
    var puff = PB.simpleBuildPuff(type, content)
    return PB.addPuffToSystem(puff)
}

PB.postPrivateMessage = function(content, usernames, type) {
    //// post an encrypted puff. type is optional and defaults to 'text'. usernames is an array of usernames.
    type = type || 'text'

    usernames = usernames || []
    if(!Array.isArray(usernames))
        usernames = [usernames]
    
    var myUsername = PB.getCurrentUsername()
    if(!myUsername)
        return PB.emptyPromise('You must have a current identity to post a private message')
    
    usernames.push(myUsername)
    usernames = PB.uniquify(usernames)
    var prom = PB.Users.usernamesToUserRecordsPromise(usernames)
    
    return prom.then(function(userRecords) {        
        var puff = PB.simpleBuildPuff(type, content, null, usernames, userRecords)
        return PB.addPuffToSystem(puff)
    })
    
    return prom
}

PB.getMyMessages = true

PB.createIdentity = function(username, passphrase) {
    // TODO: validations and error handling (lots of it)
    
    var prependedPassphrase = username + passphrase
        var privateKey = PB.Crypto.passphraseToPrivateKeyWif(prependedPassphrase)
    
    var prom = PB.registerTopLevelUser(username, privateKey, privateKey, privateKey)
    
    prom.then(function(userRecord) {
        var capa = 1 // THINK: does capa always start at 1? where should that knowledge live?
        PB.addAlias(username, username, capa, privateKey, privateKey, privateKey, {passphrase: passphrase})
        PB.switchIdentityTo(username)
    })
    
    // TODO: on switchIdentityTo false change undefined to ''
    
    return prom
}

PB.registerTopLevelUser = function(username, privateRootKey, privateAdminKey, privateDefaultKey) {
    //// create a brand new top-level user

    // OPT: privateToPublic is expensive -- we could reduce the number of calls if the private keys are identical
    var rootKeyPublic    = PB.Crypto.privateToPublic(privateRootKey)
    var adminKeyPublic   = PB.Crypto.privateToPublic(privateAdminKey)
    var defaultKeyPublic = PB.Crypto.privateToPublic(privateDefaultKey)

    var payload = { requestedUsername: username
                  ,           rootKey: rootKeyPublic
                  ,          adminKey: adminKeyPublic
                  ,        defaultKey: defaultKeyPublic
                  }

    var routes  = []
    var content = 'requestUsername'
    var type    = 'updateUserRecord'

    var puff = PB.buildPuff(username, privateAdminKey, routes, type, content, payload)
    
    var prom = PB.Net.updateUserRecord(puff)
    
    return prom
}

/**
 * register a subuser for the currently active identity
 * @param  {string} newUsername     desired new subuser name
 * @param  {string} rootKey         public root key for the new subuser
 * @param  {string} adminKey        public admin key for the new subuser
 * @param  {string} defaultKey      public default key for the new subuser
 * @return {object}                user record for the newly created subuser
 */
PB.registerSubuser = function(newUsername, rootKey, adminKey, defaultKey) {
    //// registers a subuser for the currently active identity
    
    var signingUsername = PB.getCurrentUsername()
    var prom
    
    PB.useSecureInfo(function(_, _, _, privateAdminKey, _) {
        prom = PB.registerSubuserForUser(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey)
    })
    
    return prom
}


PB.updatePrivateKey = function(keyToModify, newPrivateKey, secrets) {
    //// attempts to update a private key for the current user. 
    //// if successful it adds the new alias to the current identity.
    //// returns a promise for the new userRecord.
    
    var username = PB.getCurrentUsername()
    var newPublicKey = PB.Crypto.privateToPublic(newPrivateKey)

    if(['defaultKey', 'adminKey', 'rootKey'].indexOf(keyToModify) == -1)
        return PB.emptyPromise('That is not a valid key to modify')

    var payload = {}
    var routes  = []
    var content = 'modifyUserKey'
    var type    = 'updateUserRecord'

    payload.keyToModify = keyToModify
    payload.newKey = newPublicKey
    payload.time = Date.now()

    var prom = new Promise(function(resolve, reject) {
        var puff

        PB.useSecureInfo(function(_, _, privateRootKey, privateAdminKey, privateDefaultKey) {
            // NOTE: puff leaks, but only contains publicly accessible data
        
            var signingUserKey = 'privateRootKey'  // changing admin or root keys requires root privileges
            var privateKey = privateRootKey

            if (keyToModify == 'defaultKey') { 
                signingUserKey = 'privateAdminKey' // changing the default key only requires admin privileges
                privateKey = privateAdminKey
            }

            if(!privateKey) {
                return reject(PB.makeError("You need the " + signingUserKey + " to change the " + keyToModify + " key."))
            } else {
                puff = PB.buildPuff(username, privateKey, routes, type, content, payload)
            }
        })

        var userRecordPromise = PB.Net.updateUserRecord(puff)

        userRecordPromise.then(function(userRecord) {
            if(keyToModify == 'defaultKey') {
                PB.useSecureInfo(function(_, username, privateRootKey, privateAdminKey, _) {
                    PB.addAlias(username, username, userRecord.capa, privateRootKey, privateAdminKey, newPrivateKey, secrets)
                })
            }

            if(keyToModify == 'adminKey') {
                PB.useSecureInfo(function(_, username, privateRootKey, _, privateDefaultKey) {
                    PB.addAlias(username, username, userRecord.capa, privateRootKey, newPrivateKey, privateDefaultKey, secrets)
                })
            }

            if(keyToModify == 'rootKey') {
                PB.useSecureInfo(function(_, username, _, privateAdminKey, privateDefaultKey) {
                    PB.addAlias(username, username, userRecord.capa, newPrivateKey, privateAdminKey,  privateDefaultKey, secrets)
                })
            }

            return resolve(userRecord)
        })
        .catch(function(err) {
            return reject(PB.makeError(err))
        })
    })

    return prom
}

PB.getProfilePuff = function(username) {
    var cached_profile = PB.Data.profiles[username]
    
    if(cached_profile) // THINK: allows a second check to the server... but could cause a lot of noise.
        return Promise.resolve(cached_profile)

    var prom = PB.Net.getProfilePuff(username)

    prom = prom.then(function(puffs) {
        var puff = puffs[0]
    
        if(!puff) {
            // THINK: we could set the cache, but may want to try again anyway
            return false
            // return PB.onError('Profile puff was not found')
        }
        
        PB.Data.profiles[PB.Users.justUsername(puff.username)] = puff
    
        return puff
    })

    return prom
}


////////////// END STANDARD API //////////////////


////////////// Handler Handlers //////////////////

PB.handlers = {}

PB.addHandler = function(type, callback) {
  if(!PB.handlers[type]) PB.handlers[type] = []
  PB.handlers[type].push(callback)
}

PB.runHandlers = function(type) {
  var args = [].slice.call(arguments, 1)
  return (PB.handlers[type] || []).reduce(
      function(acc, callback) {
          return callback.apply(null, acc == null ? args : Array.isArray(acc) ? acc : [acc])}, args)
}

PB.makeHandlerHandler = function(type) {
    return function(callback) {return PB.addHandler(type, callback)}
}

// USEFUL HANDLERS:

PB.addErrorHandler           = PB.makeHandlerHandler('error')           // receives all error messages

PB.addNewPuffHandler         = PB.makeHandlerHandler('newPuffs')        // called when new puffs are available

PB.addDHTErrorHandler        = PB.makeHandlerHandler('DHTError')        // receives DHT error messages

PB.addRelationshipHandler    = PB.makeHandlerHandler('relationship')    // manage relationships between puffs

PB.addTimeoutErrorHandler    = PB.makeHandlerHandler('timeoutError')    // receives timeout error messages

PB.addNetworkErrorHandler    = PB.makeHandlerHandler('networkError')    // receives network error messages

PB.addNewPuffReportHandler   = PB.makeHandlerHandler('newPuffReport')   // handles reports on incoming puffs

PB.addIdentityUpdateHandler  = PB.makeHandlerHandler('identityUpdate')  // general GUI update trigger

PB.addPayloadModifierHandler = PB.makeHandlerHandler('payloadModifier') // decorate puff payloads 

// PB.addClearPuffCacheHandler = PB.makeHandlerHandler('clearpuffcache')

// beforeSwitchIdentity is called prior to switchIdentity and removeIdentity, while the old identity is active
// afterSwitchIdentity is called after switchIdentity, once the new identity is active
PB.addBeforeSwitchIdentityHandler = PB.makeHandlerHandler('beforeSwitchIdentity')
PB.addAfterSwitchIdentityHandler  = PB.makeHandlerHandler('afterSwitchIdentity')

////////////// End Handler Handlers //////////////




//// PUFF HELPERS ////


PB.simpleBuildPuff = function(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// build a puff for the 'current user', as determined by the key manager (by default PB.M.Wardrobe)
    var puff 

    payload = PB.runHandlers('payloadModifier', payload)

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // THINK: should we confirm that our local capa matches the DHT's latest capa for the current user here? it turns the output into a promise...
        var previous = false // TODO: get the sig of this user's latest puff
        var versionedUsername = PB.getCurrentVersionedUsername()
        
        puff = PB.buildPuff(versionedUsername, privateDefaultKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    })
    
    return puff
}


/**
 * build a new puff object based on the parameters  
 * does not hit the network, hence does no real verification whatsoever
 * @param  {string} username                    user who sign the puff
 * @param  {string} privatekey                  private default key for the user
 * @param  {string} routes                      routes of the puff
 * @param  {string} type                        type of the puff
 * @param  {string} content                     content of the puff
 * @param  {object} payload                     other payload information for the puff
 * @param  {string} previous                    most recently published content by the user
 * @param  {object} userRecordsForWhomToEncrypt
 * @param  {object} privateEnvelopeAlias
 * @return {object}                             the new puff object
 */
PB.buildPuff = function(versionedUsername, privatekey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    var puff = PB.Data.packagePuffStructure(versionedUsername, routes, type, content, payload, previous)

    puff.sig = PB.Crypto.signPuff(puff, privatekey)
    
    if(userRecordsForWhomToEncrypt) {
        puff = PB.Data.encryptPuff(puff, privatekey, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    }
    
    return puff
}


/**
 * handle a newly created puff: add to our local cache and fire new content callbacks
 * @param {object} puff
 */
PB.addPuffToSystem = function(puff) {
    
    if(PB.Data.getCachedShellBySig(puff.sig)) return false
    
    PB.Data.addShellsThenMakeAvailable(puff)

    PB.Net.distributePuff(puff)
    
    return puff
}


PB.decryptPuffForReals = function(envelope, yourPublicWif, myVersionedUsername, myPrivateWif) {
    //// interface with PB.Crypto for decrypting a message
    // TODO: this should be in PB.Data, but is in PB for cryptoworker's sake
    if(!envelope.keys) return false
    var keyForMe = envelope.keys[myVersionedUsername]
    var puffkey  = PB.Crypto.decryptPrivateMessage(keyForMe, yourPublicWif, myPrivateWif)
    var letterCipher = envelope.payload.content
    var letterString = PB.Crypto.decryptWithAES(letterCipher, puffkey)
    letterString = PB.tryDecodeURIComponent(escape(letterString))   // try decoding
    return PB.parseJSON(letterString)                               // try parsing
}



//// ID FILE ////


PB.formatIdentityFile = function(username) {
    // THINK: consider passphrase protecting the identity file by default
    // TODO: add authFromIdFile -- need consistency both ways
    
    username = username || PB.getCurrentUsername()
    
    if(!username) return false

    var idFile = {}

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // this leaks all of the identity information back to the caller
        // if we passphrase protect the file, do it here to prevent that leakage

        var identity = identities[username]

        // assemble idFile manually to keep everything in the right order
        idFile.comment = "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!"

        idFile.username = username
        // idFile.primary  = identity.primary // NOTE: primary is automatically gathered from aliases
        idFile.aliases  = identity.aliases
        idFile.preferences = identity.preferences
        idFile.version  = "1.1"
    })

    return idFile
}



//// USER CREATION ////

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
PB.registerSubuserForUser = function(signingUsername, privateAdminKey, newUsername, rootKey, adminKey, defaultKey) {

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




//// BUILD CRYPTO WORKER ////

PB.buildCryptoworker = function(options) {
    var cryptoworkerURL = options.cryptoworkerURL || PB.CONFIG.cryptoworkerURL // || 'cryptoworker.js'
    
    if(!cryptoworkerURL) return false
    
    PB.cryptoworker = new Worker(cryptoworkerURL)
    PB.cryptoworker.addEventListener("message", PB.workerreceive)
}

PB.workerqueue = []
PB.workerautoid = 0

PB.workerreceive = function(msg) {
    var id = msg.data.id
    if(!id) return false // TODO: add onError here

    var fun = PB.workerqueue[id]
    if(!fun) return false // TODO: add onError here

    fun(msg.data.evaluated)

    delete PB.workerqueue[id] // THINK: this leaves a sparse array, but is probably faster than splicing
}

PB.workersend = function(funstr, args, resolve, reject) {
    PB.workerautoid += 1
    PB.workerqueue[PB.workerautoid] = resolve
    if(!Array.isArray(args))
        args = [args]
    PB.cryptoworker.postMessage({fun: funstr, args: args, id: PB.workerautoid})
}

//// END BUILD CRYPTO WORKER ////




////////////// SECURE INFORMATION INTERFACE ////////////////////

PB.implementSecureInterface = function(useSecureInfo, addIdentity, addAlias, setPrimaryAlias, setPreference, switchIdentityTo, removeIdentity) {
    // useSecureInfo    = function( function(identities, username, privateRootKey, privateAdminKey, privateDefaultKey) )
    // addIdentity      = function(username, aliases, preferences)
    // addAlias         = function(identityUsername, aliasUsername, capa, privateRootKey, privateAdminKey, privateDefaultKey, secrets)
    // setPrimaryAlias  = function(identityUsername, aliasUsername)
    // removeIdentity   = function(username)
    // setPreference    = function(key, value) // for current identity
    // switchIdentityTo = function(username)

    // THINK: consider ensuring all functions are present first, so it's harder to mix and match wardrobe implementations
    
    if(typeof useSecureInfo == 'function') {
        PB.useSecureInfo = function(callback) {
            // NOTE: useSecureInfo returns true if there is a current identity, and false otherwise
            return useSecureInfo( function(identities, username, privateRootKey, privateAdminKey, privateDefaultKey) {
                var clonedIdentities = JSON.parse(JSON.stringify(identities)) // prevent accidental mutation
                callback(clonedIdentities, username, privateRootKey, privateAdminKey, privateDefaultKey)
            })
        }
    }
    
    if(typeof addIdentity == 'function')
        PB.addIdentity = addIdentity
        
    if(typeof addAlias == 'function')
        PB.addAlias = addAlias
        
    if(typeof setPrimaryAlias == 'function')
        PB.setPrimaryAlias = setPrimaryAlias
        
    if(typeof setPreference == 'function')
        PB.setPreference = setPreference
        
    if(typeof switchIdentityTo == 'function')
        PB.switchIdentityTo = function(username) {
            PB.runHandlers('beforeSwitchIdentity', username)
            switchIdentityTo(username)
            PB.runHandlers('afterSwitchIdentity', username)
        }
        
    if(typeof removeIdentity == 'function')
        PB.removeIdentity = removeIdentity
        
    PB.getCurrentUsername = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        PB.useSecureInfo(function(identities, username) { output = username })
        return output
    }
    
    PB.getCurrentCapa = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        PB.useSecureInfo(function(identities, username) { output = ((identities[username]||{}).primary||{}).capa||0 })
        return output
    }
    
    PB.getCurrentVersionedUsername = function() {
        var username = PB.getCurrentUsername()
        if(!username)
            return PB.onError('No current user in wardrobe')
        
        return PB.Users.makeVersioned(username, PB.getCurrentCapa())
    }
    
    PB.getCurrentUserRecord = function() {
        var versionedUsername = PB.getCurrentVersionedUsername()
        if(!versionedUsername)
            return false
        
        // THINK: it's weird to hit the cache directly from here, but if we don't then we always get a promise,
        //        even if we hit the cache, and this should return a proper userRecord, not a promise, 
        //        since after all we have stored the userRecord in our wardrobe, haven't we?
    
        var userRecord = PB.Users.records[versionedUsername]
        if(!userRecord)
            return PB.onError('That user does not exist in our records')
    
        return userRecord
    }

    PB.getAllIdentityUsernames = function() {
        // yes, this technique allows you to leak data out of useSecureInfo. no, you should not use it.
        var output
        PB.useSecureInfo(function(identities, username) { output = Object.keys(identities) })
        return output
    }
    
}

////////////// END SECURE INFORMATION ZONE ////////////////////






//// VALIDATIONS

// TODO: merge these into PB.Spec

/**
 * check if a username is valid
 *     a username must be shorter than 256 characters, all lowercase and contains only alphanumeric and . sign
 * @param  {string} username the string to be check
 * @return {boolean}          return true if  the parameter string is a valid username, otherwise throw error
 */
PB.validateUsername = function(username) {
    if(!username) 
        return PB.onError('Username is required', username)

    if(username.length > 256) 
        return PB.onError('Usernames must be shorter than 256 characters', username)

    if(username != username.toLowerCase()) 
        return PB.onError('Usernames must be lowercase', username)
    
    if(!/^[0-9a-z.]+$/.test(username))
        return PB.onError('Usernames must be alphanumeric', username)
    
    return true
}


/**
 * determine if it is a good shell, checks for the existence of required fields
 * @param {Shell[]}
 * @returns {boolean}
 */
PB.isValidShell = function(shell) {
    //// this just checks for the existence of required fields
    if(!shell.sig) return false
    if(!shell.routes) return false
    if(!shell.username) return false
    if(typeof shell.payload != 'object') return false
    if(!shell.payload.type) return false
        
    return true
}

/**
 * to verify a puff
 * @param  {object} puff
 * @return {(string|boolean)}
 */
PB.isGoodPuff = function(puff) {
    // CURRENTLY UNUSED
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    // TODO: use this to verify incoming puffs
    // TODO: if prom doesn't match, try again with getUserRecordNoCache
    
    // TODO: rewrite this function to give a consistent return value
    
    if (!PB.M.Forum.contentTypes[shell.payload.type]) {
        // TODO: this needs to include 'encryptedpuff' as a valid type
        Events.pub('track/unsupported-content-type', {type: shell.payload.type, sig: shell.sig})
        return false
    }
    
    var prom = PB.Users.getUserRecordPromise(puff.username) // NOTE: versionedUsername
    
    return prom.then(function(user) {
        return PB.Crypto.verifyPuffSig(puff, user.defaultKey)
    })
}



//// ERROR HELPERS

// TODO: build a more general error handling system for GUI integration

PB.onError = function(msg, obj, trigger) {
    //// override this for custom error behavior
    
    var composite = {msg: msg, obj: obj}

    PB.runHandlers('error', composite)
    
    if(trigger)
        PB.runHandlers(trigger, composite)
        
    // for debugging help, run this in the console:
    // PB.addErrorHandler(function(composite) {console.log(composite)})

    return false
}

PB.catchError = function(msg) {
    //// ex: prom.catch( PB.catchError('invalid foo') ).then(function(foo) {...})
    return function(err) {
        PB.onError(msg, err)
        throw err
    }
}

PB.throwError = function(msg, errmsg) {
    //// ex: prom.then(function(foo) {if(!foo) PB.throwError('no foo'); ...})
    var err = errmsg ? Error(errmsg) : ''
    throw PB.makeError(msg, err)
}

PB.makeError = function(msg, err, trigger) {
    //// ex: new Promise(function(resolve, reject) { if(!foo) reject( PB.makeError('no foo') ) ... })
    PB.onError(msg, err, trigger)
    return Error(msg)
}

PB.emptyPromise = function(msg) {
    //// ex: function(foo) { if(!foo) return PB.emptyPromise('no foo'); return getFooPromise(foo) }
    if(msg) PB.onError(msg)
    return Promise.reject(msg)
}

PB.throwNetError = function(msg, errmsg) {
    //// like throw error but triggers the networkError handler
    var trigger = 'networkError'
    var err = errmsg ? Error(errmsg) : ''
    throw PB.makeError(msg, err, trigger)
}

PB.throwDHTError = function(msg, errmsg) {
    //// like throw error but triggers the DHTError handler
    var trigger = 'DHTError'
    var err = errmsg ? Error(errmsg) : ''
    throw PB.makeError(msg, err, trigger)
}


//// Exceptional API wrappers

PB.parseJSON = function(str) {
    //// JSON.parse throws, so we catch it. throw/catch borks the JS VM optimizer, so we box it.
    try {
        return JSON.parse(str)
    } catch(err) {
        return PB.onError('Invalid JSON string', err)
    }
}

PB.stringifyJSON = function(obj) {
    //// JSON.stringify throws on dumb DOM objects, so we catch it. throw/catch borks the JS VM optimizer, so we box it.
    try {
        return JSON.stringify(obj)
    } catch(err) {
        return PB.onError('Invalid object', err)
    }
}

PB.tryDecodeURIComponent = function(str) {
    //// decodeURIComponent throws, so we wrap it. try/catch kills the optimizer, so we isolate it.
    try {
        return decodeURIComponent(str)
    } catch(err) {
        return PB.onError('Invalid URI string', err)
    }
}


//// something different

PB.promisesPending = {}

// Major jujitsu here
PB.promiseMemoize = function(fun, ohboy) {
    if(!ohboy) ohboy = PB.removePromisePending
    
    return function() {
        var key = JSON.stringify([fun.toString(),arguments])
        
        if(PB.promisesPending[key])
            return PB.promisesPending[key]
        
        var prom = fun.apply(fun, arguments)
        prom = prom.then(function(value) {
            ohboy(key, value)
            return value                                        // deliver successes
        }, function(value) {
            ohboy(key, value)
            throw value                                         // propagate failures
        })
        
        PB.promisesPending[key] = prom
        return prom
    }
}

PB.removePromisePending = function(key) {
    delete PB.promisesPending[key]
}

//// TIMING HELPERS


// TODO: move these into a library

~function() {
    //// postpone until next tick
    // inspired by http://dbaron.org/log/20100309-faster-timeouts
    var later = []
    var messageName = 12345
    var gimme_a_tick = true

    function setImmediate(fun) {
        later.push(fun)
        
        if(gimme_a_tick) {
            gimme_a_tick = false
            window.postMessage(messageName, "*")
        }
        
        return false
    }

    function handleMessage(event) {
        if(event.data != messageName) return false

        event.stopPropagation()
        gimme_a_tick = true

        var now = later
        later = []

        for(var i=0, l=now.length; i < l; i++)
            now[i]()
    }
  
    if(typeof window != 'undefined') {
        window.addEventListener('message', handleMessage, true)
        window.setImmediate = setImmediate
    }
}()

PB.queuer = function() {
    //// do something after some other things
    var queue = []
    
    var nexttime = function(invoker) {
        invoker(function() {
            if(!queue.length) return false
            queue.shift()()
            nexttime(invoker)
        })
    }
            
    var queuer = function(invoker, fun) {
        queue.push(fun)
        if(queue.length > 1) return false // THINK: possible race condition
        nexttime(invoker) 
    }
    
    return queuer
}

PB.once = function() {
    //// do something later, but only once
    var later = []

    var step = function() {
        var now = later
        later = []
        for(var i=0, l=now.length; i < l; i++)
            now[i]()
    }
            
    var once = function(invoker, fun) {
        if(~later.indexOf(fun)) return false
        later.push(fun)
        if(later.length > 1) return false // THINK: possible race condition
        invoker(step) 
    }
    
    return once
}

~function() {
    if(typeof window != 'undefined') {
        window.queueImmediate = PB.queuer().bind(null, setImmediate)
        window.onceImmediate  = PB.once().bind(null, setImmediate)
        window.queueRAF = PB.queuer().bind(null, requestAnimationFrame)
        window.onceRAF  = PB.once().bind(null, requestAnimationFrame)
    
        var timefunbind = {}
        window.onceInAwhile = function(fun, time) {
            //// NOTE: don't use the same fun with different times
            if(timefunbind[fun]) return false
            timefunbind[fun] = setTimeout(function() {fun(); timefunbind[fun] = false}, time)
        }
    }
}()




////////////// A few small helpers for building functional pipelines ///////////////

PB.prop = function(p, obj) { // THINK: consider importing all of Rambda.js
    return arguments.length < 2 ? function (obj) { return obj[p]; } : obj[p]
}

PB.uniquify = function(list) {
    return list.filter(PB.unique)
}

PB.unique = function(item, index, array) {return array.indexOf(item) == index}
