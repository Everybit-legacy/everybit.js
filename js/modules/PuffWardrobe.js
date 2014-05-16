/* 
                   _____  _____                          .___            ___.           
    ______  __ ___/ ____\/ ____\_  _  _______ _______  __| _/______  ____\_ |__   ____  
    \____ \|  |  \   __\\   __\\ \/ \/ /\__  \\_  __ \/ __ |\_  __ \/  _ \| __ \_/ __ \ 
    |  |_> >  |  /|  |   |  |   \     /  / __ \|  | \/ /_/ | |  | \(  <_> ) \_\ \  ___/ 
    |   __/|____/ |__|   |__|    \/\_/  (____  /__|  \____ | |__|   \____/|___  /\___  >
    |__|                                     \/           \/                  \/     \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  PuffWardrobe.setCurrentUser(user.username)
  PuffWardrobe.getCurrent()

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
PuffWardrobe.keysafe = {}

PuffWardrobe.currentUser = {};
PuffWardrobe.users = false; // NOTE: don't access this directly -- go through the API instead. (THINK: wrap it in a closure?)

PuffWardrobe.getCurrent = function() {
    return PuffWardrobe.currentUser
}

PuffWardrobe.getAll = function() {
    if(!PuffWardrobe.users)
        PuffWardrobe.users = Puffball.Persist.get('users') || {}
    
    return PuffWardrobe.users
}

PuffWardrobe.addUserMaybe = function(username, privateDefaultKey) {
    var pprom = PuffNet.getUserRecord(username);
    
    pprom.then(function(user) {
        if(!user)
            throw Error('No result returned');
    
        var publicDefaultKey = Puffball.Crypto.privateToPublic(privateDefaultKey);  // OPT: do this prior to getUser
        
        if(!publicDefaultKey) 
            throw Error('That private key could not generate a public key');
    
        if(user.defaultKey !== publicDefaultKey)
            throw Error('That private key does not match the record for that username')
        
        var keys = { default: { 'private': privateDefaultKey
                              ,  'public': publicDefaultKey } }
        var userinfo = PuffWardrobe.addUserReally(username, keys);

        return username
    })
    
    return pprom;
}

PuffWardrobe.setCurrentUser = function(username) {
    var users = PuffWardrobe.getAll()
    var user = users[username]
    
    if(!user || !user.username)
        return Puffball.onError('No record of that username exists locally -- try adding it first')
    
    return PuffWardrobe.currentUser = user
}

PuffWardrobe.removeUser = function(username) {
    //// clear the user from our system
    delete PuffWardrobe.users[username]
    
    if(PuffWardrobe.currentUser.username == username)
        PuffWardrobe.currentUser = {}
    
    if(PuffWardrobe.getPref('storeusers'))
        Puffball.Persist.save('users', users)
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

    // generate username
    var anonUsername = Bitcoin.ECKey().toWif().slice(-10).toLowerCase(); // OPT: this is a slow way to get a random string
    var newUsername = 'anon.' + anonUsername;

    // send it off
    var pprom = PuffNet.registerSubuser('anon', CONFIG.anon.privateKeyAdmin, newUsername, rootKey, adminKey, defaultKey);

    return pprom.then(function(userRecord) {
                    return PuffUser.storeUserRecord(userRecord, privateRootKey, privateAdminKey, privateDefaultKey);
                })
                .catch(Puffball.promiseError('Anonymous user ' + anonUsername + ' could not be added'));
}


PuffWardrobe.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var user = PuffWardrobe.getCurrent()

    if(user.username)
        return PuffWardrobe.getUserRecord(user)
    
    var pprom = PuffWardrobe.addAnon()
    return pprom.then(function(user) {
        PuffWardrobe.setCurrentUser(user.username)
    })
}

PuffWardrobe.getUserRecord = function(user) {
    //// make this better
    var user = JSON.parse(JSON.stringify(user))
    return PuffNet.getUserRecord(user.username)
                  .then(function(userDHT) {
                      for(var key in userDHT)
                          user[key] = userDHT[key]
                      return user
                  })
}


PuffWardrobe.storeUserRecord = function(userRecord, privateRootKey, privateAdminKey, privateDefaultKey) {
// PuffWardrobe.addUserReally = function(username, defaultKey, adminKey, rootKey) {
    
    var newUserRecord = Puffball.Data.cacheUserRecord(userRecord)
    
    if(!newUserRecord)
        return false
    
    
    // plop this into local storage
    // also handle private keys
    // also take it back out on load
    // so one unified API for persisting a userRecord and accepting private keys? 
    // yeah... don't see why not. 
    
    PuffWardrobe.storeKeys(newUserRecord.username, privateRootKey, privateAdminKey, privateDefaultKey);
    
    // TODO: store both newUserRecord and keysafe
    
    // var users = PuffWardrobe.getAll()
    // users[username] = userinfo
    // 
    // if(PuffWardrobe.getPref('storeusers'))
    //     Puffball.Persist.save('users', users)

    return newUserRecord
}

PuffWardrobe.storeKeys = function(username, privateRootKey, privateAdminKey, privateDefaultKey) {
    PuffWardrobe.keysafe[username] = { root: privateRootKey
                                  , admin: privateAdminKey
                                  , default: privateDefaultKey
                                  }
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
    var username = PuffWardrobe.currentUser.username
    return PuffWardrobe.getUserProfileItem(username, key)
}

PuffWardrobe.setProfileItem = function(key, value) {
    var username = PuffWardrobe.currentUser.username
    return PuffWardrobe.setUserProfileItems(username, key, value)
}

PuffWardrobe.getAllProfileItems = function() {
    var username = PuffWardrobe.currentUser.username
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