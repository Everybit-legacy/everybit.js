/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.
  ==================================================

  The Wardrobe manages identities and aliases.  

  An identity is a username and a list of all known aliases. The identity also lists the last known primary alias, if there is one, and the identity's private preferences. 

  An alias is a username, a 'capa', and a set of private keys. Additional private information (like a passphrase) may be stored in the alias's 'secrets' field.

  Aliases generally correspond either to previous versions of the identity's username (previous primaries), or to anonymous usernames created for one-time encrypted transfer. 

  Username and capa define a unique alias. The capa field references a specific moment in the username's lifecycle, and correlates to the userRecord with the same username and capa whose public keys match the alias's private keys. In other words, capa == version.

  Currently capa counts by consecutive integers. This may change in the future. Any set deriving Eq and Ord will work.

  An identity file can be exported to the local filesystem and imported back in to the system.

  Usage examples:
      PB.switchIdentityTo(user.username)
      PB.M.Wardrobe.getCurrentKeys()

*/

// FIXME: resolve the addIdentity / addAlias conflict: you only ever add aliases to an identity... addAlias? 
// addAlias is nice. Wardrobe->PB.M.Identity. addAlias(identityUsername, aliasUsername, capa, etc)
// if it already exists we just merge the new details in with it as much as possible, overwriting otherwise.



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


////////// remove these functions /////////////
existing_to_alias = function(keychain) {
    // TODO: this is deprecated, remove it
    return addAlias(keychain.username, 1, keychain.root, keychain.admin, keychain.default, keychain.bonus)
}

all_existing_to_identities = function() {
    // TODO: this is deprecated, remove it
    
    // for each keychain
    Object.keys(PB.M.Wardrobe.keychain).forEach(function(username) {
        var keychain = PB.M.Wardrobe.keychain[username]
        var alias = existing_to_alias(keychain)
        addIdentity(alias.username, alias)
    })
}
////////// end removal zone /////////////


    PB.M.Wardrobe.init = init
    
    function init() {
        PB.implementSecureInterface(useSecureInfo, addIdentity, addAlias, setPreference, switchIdentityTo, removeIdentity)
    
        var identities = PB.Persist.get('identities')
    
        Object.keys(identities).forEach(function(username) {
            var identity = identities[username]
            addIdentity(username, identity.primary, identity.aliases, identity.preferences, true)
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

    var addIdentity = function(username, primary, aliases, preferences, nosave) {
        // TODO: validation on all available values
        // TODO: check for existing identity
        // TODO: add any unknown aliases
        // THINK: what about aliases that belong to other identities?
        // THINK: ensure primary alias exists?

        var identity = { username: username
                       , primary: primary
                       , aliases: aliases || []
                       , preferences: preferences || {}
                       }

        identities[username] = identity
    
        if(!nosave)
            processUpdates()
    
        return identity
    }

    var addAlias = function(identity, username, capa, privateRootKey, privateAdminKey, privateDefaultKey, secrets) {
        // TODO: validation on all available values
        // TODO: check for existing username/capa
        // THINK: hit network for confirmation?
        // THINK: maybe only include viable values?
        // NOTE: this doesn't trigger processUpdates (see notes there)

        var alias = { username: username
                    , capa: capa || 1
                    , privateRootKey: privateRootKey || false
                    , privateAdminKey: privateAdminKey || false
                    , privateDefaultKey: privateDefaultKey || false
                    , secrets: secrets || {}
                    }
  
        // do smrt stuff
                 
//        return alias
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

        // TODO: this doesn't belong here, move it (probably by registering interesting users with the platform)
        PB.Data.clearExistingPrivateShells() // OPT: destroying and re-requesting this is unnecessary
        PB.Data.importPrivateShells(username)

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
    //// not exported
    ////

    function addAliasToIdentity(username, alias) {
        //// TODO: merge in to addAlias
        
        var identity = getIdentity(username)
    
        if(!identity)
            return false
    
        // TODO: validate alias 
        // TODO: add alias if it isn't already in the list
        // TODO: ensure alias isn't already in identity
    
        if(alias.username == identity.username && alias.capa > identity.capa) {
            identity.aliases.push(identity.primary)
            identity.primary = alias
        } else {
            identity.aliases.push(alias)
        }

        processUpdates()
    }

    function validatePrivateKeys(username, capa, privateRootKey, privateAdminKey, privateDefaultKey) {
        //// Ensure keys match the userRecord
        //// NOTE: this is currently unused
    
        var prom = PB.getUserRecord(username, capa)
    
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
            , PB.promiseError('Could not store private keys due to faulty user record'))
    }

    function processUpdates() {
        // TODO: only persist if the CONFIG setting for saving keys is turned on. (also, store CONFIG overrides in localStorage -- machine prefs issue solved!)

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

        if(!identity) 
            return PB.onError('That username does not match any available identity')

        return identity
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
    
    if(!CONFIG.ephemeralKeychain)
        PB.Persist.save('keychain', PB.M.Wardrobe.keychain)
}



}() // end the closure