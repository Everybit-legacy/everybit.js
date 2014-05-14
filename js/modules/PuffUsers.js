/* 
                   _____  _____                                 
    ______  __ ___/ ____\/ ____\_ __  ______ ___________  ______
    \____ \|  |  \   __\\   __\  |  \/  ___// __ \_  __ \/  ___/
    |  |_> >  |  /|  |   |  | |  |  /\___ \\  ___/|  | \/\___ \ 
    |   __/|____/ |__|   |__| |____//____  >\___  >__|  /____  >
    |__|                                 \/     \/           \/ 
  
  A Puffball module for managing identities locally.

  Usage example:
  var user = PuffUsers.addAnon()
  PuffUsers.setCurrentUser(user.username)
  PuffUsers.getCurrent()

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

PuffUsers = {}

PuffUsers.currentUser = {};
PuffUsers.users = false; // NOTE: don't access this directly -- go through the API instead. (THINK: wrap it in a closure?)

PuffUsers.getCurrent = function() {
    return PuffUsers.currentUser
}

PuffUsers.getAll = function() {
    if(!PuffUsers.users)
        PuffUsers.users = Puffball.Persist.get('users') || {}
    
    return PuffUsers.users
}

PuffUsers.addAnon = function() {
    //// create a new anonymous identity and add it to the local identity list
  
    // generate private keys
    var privateDefaultKey = Puffball.Crypto.generatePrivateKey();
    var privateAdminKey = Puffball.Crypto.generatePrivateKey();
    var privateRootKey = Puffball.Crypto.generatePrivateKey();
    
    var keys = Puffball.buildKeyObject(privateDefaultKey, privateAdminKey, privateRootKey);
    
    var pprom = PuffNet.addAnonUser(keys);

    pprom.then(function(username) {
        PuffUsers.addUserReally(username, keys);
    });
    
    return pprom;
}

PuffUsers.addUserMaybe = function(username, privateDefaultKey) {
    var pprom = PuffNet.getUser(username);
    
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
        var userinfo = PuffUsers.addUserReally(username, keys);

        return username
    })
    
    return pprom;
}

PuffUsers.addUserReally = function(username, keys) {
    var userinfo = { username: username
                   ,     keys: keys
                   }
    
    users = PuffUsers.getAll()
    users[username] = userinfo
    
    if(PuffUsers.getPref('storeusers'))
        Puffball.Persist.save('users', users)
    
    return userinfo
}

PuffUsers.setCurrentUser = function(username) {
    var users = PuffUsers.getAll()
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





PuffUsers.getUpToDateUserAtAnyCost = function() {
    //// Either get the current user's DHT record, or create a new anon user, or die trying

    var user = PuffUsers.getCurrent()

    if(user.username)
        return PuffUsers.getUserRecord(user)
    
    return PuffUsers.addAnon().then(PuffUsers.setCurrentUser)
}

PuffUsers.getUserRecord = function(user) {
    var user = JSON.parse(JSON.stringify(user))
    return PuffNet.getUser(user.username)
                  .then(function(userDHT) {
                      for(var key in userDHT)
                          user[key] = userDHT[key]
                  })
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