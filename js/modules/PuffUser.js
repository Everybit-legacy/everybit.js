
//// USER INFO ////

/*
    
    Move this into a separate PuffIdentity module that handles identity wardrobe, profiles, and machine-based preferences.
    PuffForum uses PuffIdentity for all identity-related functionality -- this way other modules can build on PuffIdentity too.
    PuffIdentity is responsible for managing persistence of identities, keeping the core clean of such messy concerns.

*/

PuffForum.currentUser = {};
PuffForum.users = false; // NOTE: don't access this directly -- go through the API instead. (THINK: wrap it in a closure?)

PuffForum.getCurrentUser = function() {
    return PuffForum.currentUser
}

PuffForum.getAllUsers = function() {
    if(!PuffForum.users)
        PuffForum.users = Puff.Persist.get('users') || {}
    
    return PuffForum.users
}

PuffForum.addAnonUser = function(callback) {
    //// create a new anonymous user and add it to the local user list
  
    // generate defaultKey
    var privateDefaultKey = Puff.Crypto.generatePrivateKey();
    var publicDefaultKey  = Puff.Crypto.privateToPublic(privateDefaultKey);
    
    // generate adminKey
    var privateAdminKey = Puff.Crypto.generatePrivateKey();
    var publicAdminKey  = Puff.Crypto.privateToPublic(privateAdminKey);
    
    // generate rootKey
    var privateRootKey = Puff.Crypto.generatePrivateKey();
    var publicRootKey  = Puff.Crypto.privateToPublic(privateRootKey);
    
    var keys = { default: { 'private': privateDefaultKey
                          ,  'public': publicDefaultKey }
               ,   admin: { 'private': privateAdminKey
                          ,  'public': publicAdminKey }
               ,    root: { 'private': privateRootKey
                          ,  'public': publicRootKey }
               }
    
    var my_callback = function(username) {
        PuffForum.addUserReally(username, keys);
        if(typeof callback == 'function') {
            callback(username)
        }
    }
  
    Puff.Network.addAnonUser(keys, my_callback);
}

PuffForum.addUserMaybe = function(username, privateDefaultKey, callback, errback) {
    var publicDefaultKey = Puff.Crypto.privateToPublic(privateDefaultKey);
    if(!publicDefaultKey) 
        return Puff.onError('That private key could not generate a public key');

    var my_callback = function(user) {
        if(!user) 
            return Puff.onError('No result returned');
        
        // THINK: return a promise instead
        if(user.defaultKey === publicDefaultKey) {
            var keys = { default: { 'private': privateDefaultKey
                                  ,  'public': publicDefaultKey } }
            var userinfo = PuffForum.addUserReally(username, keys);
            if(typeof callback === 'function')
                callback(userinfo)
        } else {
            if(typeof errback === 'function')
                errback(username, privateDefaultKey)
            else
                return Puff.onError('That private key does not match the record for that username')
        }
    }
    
    Puff.Network.getUser(username, my_callback)
}

PuffForum.addUserReally = function(username, keys) {
    var userinfo = { username: username
                   ,     keys: keys
                   }
    
    users = PuffForum.getAllUsers()
    users[username] = userinfo
    
    if(PuffForum.getPref('storeusers'))
        Puff.Persist.save('users', users)
    
    return userinfo
}

PuffForum.setCurrentUser = function(username) {
    var users = PuffForum.getAllUsers()
    var user = users[username]
    
    if(!user || !user.username)
        return Puff.onError('No record of that username exists locally -- try adding it first')
    
    PuffForum.currentUser = user
}

PuffForum.removeUser = function(username) {
    //// clear the user from our system
    delete PuffForum.users[username]
    
    if(PuffForum.currentUser.username == username)
        PuffForum.currentUser = {}
    
    if(PuffForum.getPref('storeusers'))
        Puff.Persist.save('users', users)
}



////// PREFS ///////

/*
    These are related to this individual machine, as opposed to the identities stored therein.
    Identity-related preferences are... encrypted in the profile? That seems ugly, but maybe. 
    How are these machine-based prefs shared between machines? A special prefs puff?
*/


PuffForum.prefsarray = false  // put this somewhere else

PuffForum.getPref = function(key) {
    var prefs = PuffForum.getAllPrefs()
    return prefs[key]
}

PuffForum.getAllPrefs = function() {
    if(!PuffForum.prefsarray)
        PuffForum.prefsarray = Puff.Persist.get('prefs') || {}
    
    return PuffForum.prefsarray
}

PuffForum.setPref = function(key, value) {
    var prefs = PuffForum.getAllPrefs()
    var newprefs = events.merge_props(prefs, key, value); // allows dot-paths

    PuffForum.prefsarray = newprefs

    var filename = 'prefs'
    Puff.Persist.save(filename, newprefs)
    
    return newprefs
}

PuffForum.removePrefs = function() {
    var filename = 'prefs'
    Puff.Persist.remove(filename)
}



////// PROFILE ///////

/*
    These exist on a per-identity basis, and are stored on the machine 
    as part of the identity's presence in the user's identity wardrobe.
*/

PuffForum.profilearray = {}  // THINK: put this somewhere else

PuffForum.getProfileItem = function(key) {
    var username = PuffForum.currentUser.username
    return PuffForum.getUserProfileItem(username, key)
}

PuffForum.setProfileItem = function(key, value) {
    var username = PuffForum.currentUser.username
    return PuffForum.setUserProfileItems(username, key, value)
}

PuffForum.getAllProfileItems = function() {
    var username = PuffForum.currentUser.username
    return PuffForum.getAllUserProfileItems(username)
}

PuffForum.getUserProfileItem = function(username, key) {
    var profile = PuffForum.getAllUserProfileItems(username)
    return profile[key]
}

PuffForum.getAllUserProfileItems = function(username) {
    if(!username) return {} // erm derp derp
    
    var parray = PuffForum.profilearray
    if(parray[username]) return parray[username]  // is this always right?
    
    var profilefile = 'profile::' + username
    parray[username] = Puff.Persist.get(profilefile) || {}
    
    return parray[username]
}

PuffForum.setUserProfileItems = function(username, key, value) {
    if(!username) return false
    
    var profile = PuffForum.getAllUserProfileItems(username)
    var newprofile = events.merge_props(profile, key, value); // allows dot-paths

    PuffForum.profilearray[username] = newprofile

    var profilefile = 'profile::' + username;
    Puff.Persist.save(profilefile, newprofile)
    
    return newprofile
}

PuffForum.removeUserProfile = function(username) {
    if(!username) return false
    
    PuffForum.profilearray.delete(username)
    
    var profilefile = 'profile::' + username;
    Puff.Persist.remove(profilefile)
}