/* 
                   _____  _____                                 
    ______  __ ___/ ____\/ ____\_ __  ______ ___________  ______
    \____ \|  |  \   __\\   __\  |  \/  ___// __ \_  __ \/  ___/
    |  |_> >  |  /|  |   |  | |  |  /\___ \\  ___/|  | \/\___ \ 
    |   __/|____/ |__|   |__| |____//____  >\___  >__|  /____  >
    |__|                                 \/     \/           \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  PuffUsers.onNewPuffs( function(puffs) { console.log(puffs) } )
  PuffUsers.init()

*/


//// USER INFO ////

/*
    
    Move this into a separate PuffIdentity module that handles identity wardrobe, profiles, and machine-based preferences.
    PuffUsers uses PuffIdentity for all identity-related functionality -- this way other modules can build on PuffIdentity too.
    PuffIdentity is responsible for managing persistence of identities, keeping the core clean of such messy concerns.

*/

PuffUsers = {}

PuffUsers.currentUser = {};
PuffUsers.users = false; // NOTE: don't access this directly -- go through the API instead. (THINK: wrap it in a closure?)

PuffUsers.getCurrentUser = function() {
    return PuffUsers.currentUser
}

PuffUsers.getAllUsers = function() {
    if(!PuffUsers.users)
        PuffUsers.users = Puffball.Persist.get('users') || {}
    
    return PuffUsers.users
}

PuffUsers.addAnonUser = function(callback) {
    //// create a new anonymous user and add it to the local user list
  
    // generate private keys
    var privateDefaultKey = Puffball.Crypto.generatePrivateKey();
    var privateAdminKey = Puffball.Crypto.generatePrivateKey();
    var privateRootKey = Puffball.Crypto.generatePrivateKey();
    
    var keys = Puffball.buildKeyObject(privateDefaultKey, privateAdminKey, privateRootKey);
    
    var my_callback = function(username) {
        PuffUsers.addUserReally(username, keys);
        if(typeof callback == 'function') {
            callback(username)
        }
    }
  
    Puffnet.addAnonUser(keys, my_callback);
}

PuffUsers.addUserMaybe = function(username, privateDefaultKey, callback, errback) {
    var publicDefaultKey = Puffball.Crypto.privateToPublic(privateDefaultKey);
    if(!publicDefaultKey) 
        return Puffball.onError('That private key could not generate a public key');

    var my_callback = function(user) {
        if(!user) 
            return Puffball.onError('No result returned');
        
        // THINK: return a promise instead
        if(user.defaultKey === publicDefaultKey) {
            var keys = { default: { 'private': privateDefaultKey
                                  ,  'public': publicDefaultKey } }
            var userinfo = PuffUsers.addUserReally(username, keys);
            if(typeof callback === 'function')
                callback(userinfo)
        } else {
            if(typeof errback === 'function')
                errback(username, privateDefaultKey)
            else
                return Puffball.onError('That private key does not match the record for that username')
        }
    }
    
    Puffnet.getUser(username, my_callback)
}

PuffUsers.addUserReally = function(username, keys) {
    var userinfo = { username: username
                   ,     keys: keys
                   }
    
    users = PuffUsers.getAllUsers()
    users[username] = userinfo
    
    if(PuffUsers.getPref('storeusers'))
        Puffball.Persist.save('users', users)
    
    return userinfo
}

PuffUsers.setCurrentUser = function(username) {
    var users = PuffUsers.getAllUsers()
    var user = users[username]
    
    if(!user || !user.username)
        return Puffball.onError('No record of that username exists locally -- try adding it first')
    
    PuffUsers.currentUser = user
}

PuffUsers.removeUser = function(username) {
    //// clear the user from our system
    delete PuffUsers.users[username]
    
    if(PuffUsers.currentUser.username == username)
        PuffUsers.currentUser = {}
    
    if(PuffUsers.getPref('storeusers'))
        Puffball.Persist.save('users', users)
}



////// PREFS ///////

/*
    These are related to this individual machine, as opposed to the identities stored therein.
    Identity-related preferences are... encrypted in the profile? That seems ugly, but maybe. 
    How are these machine-based prefs shared between machines? A special prefs puff?
*/


PuffUsers.prefsarray = false  // put this somewhere else

PuffUsers.getPref = function(key) {
    var prefs = PuffUsers.getAllPrefs()
    return prefs[key]
}

PuffUsers.getAllPrefs = function() {
    if(!PuffUsers.prefsarray)
        PuffUsers.prefsarray = Puffball.Persist.get('prefs') || {}
    
    return PuffUsers.prefsarray
}

PuffUsers.setPref = function(key, value) {
    var prefs = PuffUsers.getAllPrefs()
    var newprefs = events.merge_props(prefs, key, value); // allows dot-paths

    PuffUsers.prefsarray = newprefs

    var filename = 'prefs'
    Puffball.Persist.save(filename, newprefs)
    
    return newprefs
}

PuffUsers.removePrefs = function() {
    var filename = 'prefs'
    Puffball.Persist.remove(filename)
}



////// PROFILE ///////

/*
    These exist on a per-identity basis, and are stored on the machine 
    as part of the identity's presence in the user's identity wardrobe.
*/

PuffUsers.profilearray = {}  // THINK: put this somewhere else

PuffUsers.getProfileItem = function(key) {
    var username = PuffUsers.currentUser.username
    return PuffUsers.getUserProfileItem(username, key)
}

PuffUsers.setProfileItem = function(key, value) {
    var username = PuffUsers.currentUser.username
    return PuffUsers.setUserProfileItems(username, key, value)
}

PuffUsers.getAllProfileItems = function() {
    var username = PuffUsers.currentUser.username
    return PuffUsers.getAllUserProfileItems(username)
}

PuffUsers.getUserProfileItem = function(username, key) {
    var profile = PuffUsers.getAllUserProfileItems(username)
    return profile[key]
}

PuffUsers.getAllUserProfileItems = function(username) {
    if(!username) return {} // erm derp derp
    
    var parray = PuffUsers.profilearray
    if(parray[username]) return parray[username]  // is this always right?
    
    var profilefile = 'profile::' + username
    parray[username] = Puffball.Persist.get(profilefile) || {}
    
    return parray[username]
}

PuffUsers.setUserProfileItems = function(username, key, value) {
    if(!username) return false
    
    var profile = PuffUsers.getAllUserProfileItems(username)
    var newprofile = events.merge_props(profile, key, value); // allows dot-paths

    PuffUsers.profilearray[username] = newprofile

    var profilefile = 'profile::' + username;
    Puffball.Persist.save(profilefile, newprofile)
    
    return newprofile
}

PuffUsers.removeUserProfile = function(username) {
    if(!username) return false
    
    PuffUsers.profilearray.delete(username)
    
    var profilefile = 'profile::' + username;
    Puffball.Persist.remove(profilefile)
}