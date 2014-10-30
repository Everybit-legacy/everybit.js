/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities and private data locally.
  ==================================================

  The Wardrobe manages identities, aliases, and private data.

  An identity is a username and a list of all known aliases. The identity also lists the last known primary alias, if there is one, and the identity's private preferences. 

  An alias is a username, a 'capa', and a set of private keys. Additional private information (like a passphrase) may be stored in the alias's 'secrets' field.

  Aliases generally correspond either to previous versions of the identity's username (previous primaries), or to anonymous usernames created for one-time encrypted transfer. 

  Username and capa define a unique alias. The capa field references a specific moment in the username's lifecycle, and correlates to the userRecord with the same username and capa whose public keys match the alias's private keys. In other words, capa == version.

  Currently capa counts by consecutive integers. This may change in the future. Any set deriving Eq and Ord will work.

  An identity file can be exported to the local filesystem and imported back in to the system.

  Private data is a black box for 

  Usage examples:
      PB.switchIdentityTo(username)

*/

/*
  THINK:
    - register callback handlers for user record creation and modification
    - PB.M.Wardrobe.init registers those with PB.onUserCreation and PB.onUserModification
    - identity file encryption using a passphrase
*/


PB.M.Wardrobe = {}

~function() { // begin the closure

    var identities = {}
    // {asdf: { username: 'asdf', primary: asdf-12, aliases: [asdf-11, asdf-10], preferences: {} } }

    // an alias: { username: 'asdf', capa: 12, privateRootKey: '123', privateAdminKey: '333', privateDefaultKey: '444', secrets: {} }

    var currentUsername = false


    // TODO: integrate capa with userRecords and puffs everywhere
    // TODO: use capa returned from server on update passphrase
    // TODO: get anon creation working


    PB.M.Wardrobe.init = init
    
    function init() {
        PB.implementSecureInterface(useSecureInfo, addIdentity, addAlias, setPreference, switchIdentityTo, removeIdentity)
    
        var identities = PB.Persist.get('identities') || {}
    
        Object.keys(identities).forEach(function(username) {
            var identity = identities[username]
            addIdentity(username, identity.aliases, identity.preferences, true)
        })
    
        var lastUsername = PB.Persist.get('currentUsername')
        
        if (lastUsername)
            switchIdentityTo(lastUsername)
    }
    
    
    //// exported via implementSecureInterface

    var useSecureInfo = function(callback) {
        var identity = getCurrentIdentity() || {}
        var primary = identity.primary || {}

        // we have to return all the identities because the user might be trying to list them
        callback(identities, currentUsername, primary.privateRootKey, primary.privateAdminKey, primary.privateDefaultKey)
        
        return true
    }

    var addIdentity = function(username, aliases, preferences, nosave) { // TODO: check if nosave is needed
        // TODO: validation on all available values
        // TODO: check for existing identity
        // TODO: add any unknown aliases
        // THINK: what about aliases that belong to other identities?
        // THINK: ensure primary alias exists?



        var identity = { username: username
                       , primary: {}
                       , aliases: []
                       , preferences: preferences || {}
                       }

        identities[username] = identity
        
        if(!Array.isArray(aliases))
            aliases = aliases ? [aliases] : []
        
        aliases.forEach(
            function(alias) {
                addAlias(username, alias.username, alias.capa, alias.privateRootKey, alias.privateAdminKey, alias.privateDefaultKey, alias.secrets)})
        
        // TODO: handle prefs
        
        if(!nosave) // TODO: change processUpdates so it only saves if we're not busy opening all identities? or just let the 100ms throttle handle it...
            processUpdates()
            
            
        // TODO: remove this it leaks
        return true
    }

    var addAlias = function(identityUsername, aliasUsername, capa, privateRootKey, privateAdminKey, privateDefaultKey, secrets) {
        // TODO: validation on all available values
        // TODO: check for existing username/capa
        // THINK: hit network for confirmation?
        // THINK: maybe only include viable values?
        // NOTE: this doesn't trigger processUpdates (see notes there)

        var alias = { username: aliasUsername
                    , capa: capa || 1
                    , privateRootKey: privateRootKey || false
                    , privateAdminKey: privateAdminKey || false
                    , privateDefaultKey: privateDefaultKey || false
                    , secrets: secrets || {}
                    }

        var identity = getIdentity(identityUsername)
        
        if(!identity) {
            addIdentity(identityUsername)                   // creates an empty identity
            identity = getIdentity(identityUsername)
        }
        
        // merge alias
        var old_alias = getOldAlias(identity, alias)
        if(old_alias) {
            alias.secrets = Boron.extend(old_alias.secrets, alias.secrets)
            for(var key in alias) 
                if(alias[key])
                    old_alias[key] = alias[key]
        } else {
            identity.aliases.push(alias)
        }
        
        if(aliasUsername == identityUsername && alias.capa >= (identity.capa||0)) {
            
            identity.primary = alias                        // set primary for identity (which may have been empty)
        }


        // - Wardrobe->PB.M.Identity

        processUpdates()

       return true
    }

    var setPreference = function(key, value) {
        // NOTE: this only works for the current identity
        var identity = getCurrentIdentity()
    
        if(!identity)
            return PB.onError('Preferences can only be set for an active identity')
    
        identity.preferences[key] = value

        processUpdates()
    }
    
    var switchIdentityTo = function(username) {
        if(username) {
            var identity = getIdentity(username)

            if(!identity)
                return PB.onError('No identity found with username "' + username + '"')
        }
        
        currentUsername = username

        processUpdates()
        
        if(username && identity && identity.primary)
            PB.getUserRecordPromise(username, identity.primary.capa) // fetch our userRecord 


            /// TODO: move this!

        // TODO: this doesn't belong here, move it (probably by registering interesting users with the platform)
        PB.Data.removeAllPrivateShells() // OPT: destroying and re-requesting this is unnecessary
        PB.Data.getMorePrivatePuffs(username, 0, CONFIG.initLoadBatchSize)

        // TODO: this doesn't belong here, move it by having registering a switchIdentityTo callback
        // THINK: can we automate callbackable functions by wrapping them at runtime? or at callback setting time?
        // Events.pub('ui/switchIdentityTo')
    }
    
    var removeIdentity = function(username) {
        var identity = getIdentity(username)

        if(!identity)
            return PB.onError('Could not find that identity for removal')

        delete identities[username]

        if(currentUsername == username)
            currentUsername = false

        processUpdates()
    }

    ////
    //// internal helper functions. not exported.
    ////

    function getOldAlias(identity, alias) {
        for(var i=0, l=identity.aliases.length; i<l; i++) {
            var test = identity.aliases[i]
            if(alias.username == test.username && alias.capa == test.capa)
                return test
        }
    }

    function validatePrivateKeys(username, capa, privateRootKey, privateAdminKey, privateDefaultKey) {
        //// Ensure keys match the userRecord
        //// NOTE: this is currently unused
    
        var prom = PB.getUserRecordPromise(username, capa)
    
        return prom
            .then(function(userRecord) {
                // validate any provided private keys against the userRecord's public keys
                if(   privateRootKey && PB.Crypto.privateToPublic(privateRootKey) != userRecord.rootKey)
                    PB.throwError('That private root key does not match the public root key on record')
                if(  privateAdminKey && PB.Crypto.privateToPublic(privateAdminKey) != userRecord.adminKey)
                    PB.throwError('That private admin key does not match the public admin key on record')
                if(privateDefaultKey && PB.Crypto.privateToPublic(privateDefaultKey) != userRecord.defaultKey)
                    PB.throwError('That private default key does not match the public default key on record')
        
                return userRecord
            }
            , PB.catchError('Could not store private keys due to faulty user record'))
    }

    function processUpdates() {
        // TODO: only persist if the CONFIG setting for saving keys is turned on. (also, store CONFIG overrides in localStorage -- machine prefs issue solved!)

        if(!CONFIG.ephemeralKeychain)
            PB.Persist.save('identities', identities)
    
        // THINK: consider zipping identities in localStorage to prevent shoulder-surfing and save space (same for puffs)
        // THINK: consider passphrase protecting identities and private puffs in localStorage
        PB.Persist.save('currentUsername', currentUsername)
            
        updateUI() // THINK: there should probably be a PB function that calls this for us... or maybe just PB.updateUI?
    }

    function getCurrentIdentity() {
        return getIdentity(currentUsername)
    }

    function getIdentity(username) {
        if(!username) 
            return false

        var identity = identities[username]

        // TODO: move this error up into the callsite so we don't spam it when adding identities
        if(!identity) 
            return false
            // return PB.onError('That username does not match any available identity')

        return identity
    }
    

}() // end the closure