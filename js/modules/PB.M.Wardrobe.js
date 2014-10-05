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

  An outfit is a username, a 'capa', and a set of private keys. Additional private information (like a passphrase) may be stored in the 'secrets' field.

  Username and capa define a unique outfit. The capa field references a specific moment in the username's lifecycle, and correlates to the userRecord with the same username and capa whose public keys match the outfit's private keys. In other words, capa == version.

  Currently capa counts by consecutive integers. This may change in the future. Any set deriving Eq and Ord will work.

  An identity file can be exported to the local filesystem and imported back in to the system.

  Usage examples:
      PB.switchIdentityTo(user.username)
      PB.M.Wardrobe.getCurrentKeys()

*/


/*
  THINK:
    - register callback handlers for user record creation and modification
    - PB.M.Wardrobe.init registers those with PB.onUserCreation and PB.onUserModification
    - identity file encryption using a passphrase
*/


PB.M.Wardrobe = {}

~function() { // begin the closure

    var outfits = []
// [{ username: 'asdf', capa: 12, privateRootKey: '123', privateAdminKey: '333', privateDefaultKey: '444', secrets: {} }]

    var identities = {}
// {asdf: { username: 'asdf', primary: asdf-12, aliases: [asdf-11, asdf-10], preferences: {} } }

    var currentUsername = false


////////// remove these functions /////////////
existing_to_outfit = function(keychain) {
    // TODO: this is deprecated, remove it
    return addOutfit(keychain.username, 1, keychain.root, keychain.admin, keychain.default, keychain.bonus)
}

all_existing_to_identities = function() {
    // TODO: this is deprecated, remove it
    
    // for each keychain
    Object.keys(PB.M.Wardrobe.keychain).forEach(function(username) {
        var keychain = PB.M.Wardrobe.keychain[username]
        var outfit = existing_to_outfit(keychain)
        addIdentity(outfit.username, outfit)
    })
    
}
////////// end removal zone /////////////


    PB.M.Wardrobe.init = init
    
    function init() {
        PB.implementSecureInterface(useSecureInfo, addIdentity, addOutfit, setPreference, switchIdentityTo, removeIdentity)
    
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
        var identity = getCurrentIdentity()
    
        if(!identity)
            return false
        
        var primary = identity.primary
        if(!primary)
            return PB.onError('That identity has no primary outfit') // this shouldn't ever happen...

        // we have to return all the identities because the user might be trying to list them
        callback(identities, currentUsername, primary.privateRootKey, primary.privateAdminKey, primary.privateDefaultKey)
        
        return true
    }

    var addIdentity = function(username, primary, aliases, preferences, nosave) {
        // TODO: validation on all available values
        // TODO: check for existing identity
        // TODO: add any unknown outfits
        // THINK: what about outfit that belong to other identities?
        // TODO: ensure primary outfit exists

    

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

    var addOutfit = function(username, capa, privateRootKey, privateAdminKey, privateDefaultKey, secrets) {
        // TODO: validation on all available values
        // TODO: check for existing username/capa
        // THINK: hit network for confirmation?
        // THINK: maybe only include viable values?
        // NOTE: this doesn't trigger processUpdates (see notes there)
    
        var outfit = { username: username
                     , capa: capa || 1
                     , privateRootKey: privateRootKey || false
                     , privateAdminKey: privateAdminKey || false
                     , privateDefaultKey: privateDefaultKey || false
                     , secrets: secrets || {}
                     }
                 
        outfits.push(outfit)
    
        return outfit
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
        var identity = getIdentity(username)

        if(!identity)
            return PB.onError('No identity found with username "' + username + '"')

        currentUsername = username

        processUpdates()

        // TODO: this doesn't belong here, move it (probably by registering interesting users with the platform)
        PB.Data.clearExistingPrivateShells() // OPT: destroying and re-requesting this is unnecessary
        PB.Data.importPrivateShells(username)

        // TODO: this doesn't belong here, move it by having registering a switchIdentityTo callback
        // THINK: can we automate callbackable functions by wrapping them at runtime? or at callback setting time?
        Events.pub('ui/switchIdentityTo')

        PB.Persist.save('identity', username); // save to localStorage
    }
    
    var removeIdentity = function(username) {
        var identity = getIdentity(username)

        if(!identity)
            return PB.onError('Could not find that identity for removal')

        removeOutfit(identity.primary)
        identity.aliases.map(removeOutfit)

        delete identities[username]

        if(currentUsername == username)
            currentUsername = false

        processUpdates()
    }


    //// not exported
    

    function addOutfitToIdentity(username, outfit) {
        var identity = getIdentity(username)
    
        if(!identity)
            return false
    
        // TODO: validate outfit 
        // TODO: add outfit if it isn't already in the list
        // TODO: ensure outfit isn't already in identity
    
        if(outfit.username == identity.username && outfit.capa > identity.capa) {
            identity.aliases.push(identity.primary)
            identity.primary = outfit
        } else {
            identity.aliases.push(outfit)
        }

        processUpdates()
    }

    function removeOutfit(outfit) {
        // NOTE: this doesn't trigger processUpdates
        
        var index = outfits.indexOf(outfit)
        if(!index)
            return PB.onError('Could not find that outfit for removal')
    
        outfits.splice(index, 1)
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

        // THINK: saving both identities and outfits wrecks pointers. saving only identities ignores orphaned outfits. could convert identity pointers and reref on depersist...
        PB.Persist.save('identities', identities)
        // PB.Persist.save('outfits', outfits)
    
        // THINK: consider zipping identities in localStorage to prevent shoulder-surfing and save space (same for puffs)
        // THINK: consider passphrase protecting identities and private puffs in localStorage
        if(currentUsername)
            PB.Persist.save('currentUsername', currentUsername)
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
    









PB.M.Wardrobe.getIdentityFile = function(username) {
    // TODO: move this to PB.M.Forum or something
    username = username || PB.getCurrentUsername()
    
    if(!username) return false

    var identity = PB.M.Wardrobe.getIdentity(username)

    var idFile = {}

    // assemble idFile manually to keep everything in the right order
    idFile.comment = "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!"

    idFile.username = username
    idFile.primary  = identity.primary
    idFile.aliases  = identity.aliases
    idFile.preferences = identity.preferences
    idFile.version  = "1.1"

    // THINK: consider passphrase protecting identity file by default

    return JSON.parse(JSON.stringify(idFile)) // deep clone for safety
}


















PB.M.Wardrobe.getCurrentPrivateRootKey = function() {
    var identity = PB.M.Wardrobe.getCurrentIdentity()
    return ((identity||{}).primary||{}).privateRootKey
}

PB.M.Wardrobe.getCurrentPrivateAdminKey = function() {
    var identity = PB.M.Wardrobe.getCurrentIdentity()
    return ((identity||{}).primary||{}).privateAdminKey
}

PB.M.Wardrobe.getCurrentPrivateDefaultKey = function() {
    var identity = PB.M.Wardrobe.getCurrentIdentity()
    return ((identity||{}).primary||{}).privateDefaultKey
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

    var username = PB.getCurrentUsername()

    if(username)
        return PB.getUserRecordNoCache(username)
    
    var prom = PB.M.Wardrobe.addNewAnonUser()
    
    return prom.then(function(userRecord) {
        PB.switchIdentityTo(userRecord.username)
        console.log("Setting current user to " + userRecord.username);
        return userRecord
    })
}

}() // end the closure