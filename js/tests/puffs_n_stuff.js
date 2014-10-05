// TESTS OF PUFFS AND OTHER STUFF

// put this in the js console to run:
/*
 var script=document.createElement('script'); script.src= 'js/tests/puffs_n_stuff.js'; document.head.appendChild(script);
*/

/*

    - privateToPublic false condition
    - promise throw/catch errors 
    - PB.checkUsername (pass through network response)
    - firefox

*/



// -- High level flows using user-facing API functions

// create an anonymous user
var userPromise = PB.M.Wardrobe.addNewAnonUser()
userPromise.then(function(userRecord) {
               if(!userRecord)
                   throwfail('No user record in anon user creation', userRecord)
               if(!userRecord.username)
                   throwfail('Invalid user record in anon user creation', userRecord)
                   
               return userRecord
           }, function(err) {
               throwfail('Error in anon user creation', err)
           })

// make the new identity the currently active one
userPromise.then(function(userRecord) {
               if(!PB.switchIdentityTo(userRecord.username))
                   throwfail('Could not set currently active user', userRecord)
           })

// post a puff with that user
userPromise.then(function(userRecord) {
               var type = 'text'
               var content = 'some content'
               var parents = []
               var metadata = {}
               var postPromise = PB.M.Forum.addPost(type, content, parents, metadata)
               
               postPromise.catch(function(err) { 
                   throwfail('Could not post new puff', err) 
               })
               
               // post a reply puff to that first puff
               postPromise.then(function(puff) {
                   var replyPromise = PB.M.Forum.addPost('text', 'reply content', [puff.sig], {})
               
                   replyPromise.catch(function(err) { 
                       throwfail('Could not post reply puff', err) 
                   })
               })
           })


// create a subuser


// post as subuser


// set latest puff to something else


// change public key


// THINK: are the latest puff and the setlatest puff bundled together en route to DHT endpoints?


// change some other thing


// -- Lower level tests for primitive API layer 
// -- (in general the high level functions are preferred, as they have error handling baked in)

// generate new random username
var randomUsername = PB.generateRandomUsername()
if(!/[0-9a-z]/.test(randomUsername))
    testfail('Random username failed: ', randomUsername)

// generate random private key
var randomPrivateKey = PB.Crypto.generatePrivateKey()
if(!randomPrivateKey) 
    testfail('Private key gen failed: ', randomPrivateKey)

// convert public to private
var randomPublicKey = PB.Crypto.privateToPublic(randomPrivateKey)
if(!randomPublicKey) 
    testfail('Public key gen failed: ', randomPublicKey, randomPrivateKey)


//// Identity management

// get current keys
// var keys = PB.M.Wardrobe.getCurrentKeys()

// get current username
var username = PB.getCurrentUsername()

// get current user record
var userRecord = PB.getCurrentUserRecord()

// get all of the identities being saved on this browser
// var keychain = PB.M.Wardrobe.getAll()

// switch current user
PB.switchIdentityTo(username)

// store a new username and keys
// note that this checks the keys against the DHT, so this will *fail*
// note that this DOES NOT check keys against the DHT, and doesn't perform any validation, and doesn't return a value
PB.M.Wardrobe.storePrivateKeys(randomUsername, randomPublicKey, randomPublicKey, randomPublicKey)
// var newUserPromise = PB.M.Wardrobe.storePrivateKeys(randomUsername, randomPublicKey, randomPublicKey, randomPublicKey)
// newUserPromise.then(function(userRecord) { testfail("The wardrobe stored keys when it shouldn't have", userRecord) })


// user lookup 
var badLookupPromise = PB.Net.getUserRecord(randomUsername)
badLookupPromise.then(function(userRecord) { testfail("The user record lookup should have failed", userRecord) })

var goodLookupPromise = PB.Net.getUserRecord('anon')
goodLookupPromise.catch(function(err) { testfail("The user record lookup should have succeeded", err) })


// use this style to interact with the anon user created above
// userPromise.then(function(userRecord) {
//     var keys = PB.M.Wardrobe.getKeys(userRecord.username) 
// })
// .catch(function(err) {
//     testfail('Could not collect current keys', err) 
// })





/*
    - Identity management:
        ?- Download your keys (or any one key)
        -- View your keys
        ?- Copy easily
        ~- View a QR code of each key
        -- Generate a random username
        ?- Save a username and privateKey in your browser
        ?- Add passwords to your identity
        ?- Remove saved passwords from your identity
        -- View all of the usernames being saved on this browser
        -- Select identity from list of stored
        - Change/update your keys
            - Admin
            - Root
            - Default
        - Register new sub-users for your user
    - Lookup information about a user
    - Content creation
        - Post a puff
        - As a registered user
        - As an anon user, with username generated on the fly
        - Post a text puff
        - Post an image puff
        - Ability to re-puff
    - Send a message
        - Publicly
        - Privately
    - Reply to a puff
        - Publicly
        - Privately
    - Rebuild chain after chaining a puff
    - Tag or moderate someone else’s puff
    - View and navigate content
        - View all posts by a user
        - View all posts with a tag
        - View all posts in a zone
        - Navigate between parents, children, and siblings
        - View latest content
        - View relationships between puffs
        - Replies to a person’s own puffs should show up first
    - Show information about each puff
        - Publishing date
        - Username
        - Author
        - #Of replies
        - #Of parents
    - Tools
        - Download all your content
        - Create a puff with arbitrary key-value pairs
*/

/// gridbox tests

getScreenCoords = function() {
    return { width:  window.innerWidth - CONFIG.leftMargin
           , height: window.innerHeight
           }
}

var rows = 10
var cols = 10
var screencoords = getScreenCoords()
var myGridbox = Gridbox.getGridCoordBox(rows, cols, screencoords.width, screencoords.height)

var things = {}

things.foo = {foo: 123}
var width  = 3
var height = 4
var minx  = 3
var miny  = 3
var maxx  = 7
var maxy  = 10

myGridbox.add(width, height, miny, minx, maxy, maxx, things.foo)

things.bar = {bar: 321}
var width  = 2
var height = 2
var minx  = 1
var miny  = 3
var maxx  = 10
var maxy  = 10

myGridbox.add(width, height, miny, minx, maxy, maxx, things.bar)

things.lala = {lala: 888}
var width  = 2
var height = 2
var minx  = 1
var miny  = 3
var maxx  = 10
var maxy  = 10

myGridbox.add(width, height, miny, minx, maxy, maxx, things.lala)


function assert(value, expected) {
    if(value != expected)
        testfail(value, expected)
}

function testfail() {
    console.log.apply(console, [].slice.call(arguments))
}

function throwfail() {
    testfail([].slice.call(arguments))
    throw Error('foo')
}

