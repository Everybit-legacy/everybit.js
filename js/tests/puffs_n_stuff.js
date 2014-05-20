// TESTS OF PUFFS AND OTHER STUFF

// put this in the js console to run:
/*
 var script=document.createElement('script'); script.src= 'js/tests/puffs_n_stuff.js'; document.head.appendChild(script);
*/

// -- High level flows using user-facing API functions

// create an anonymous user
var userPromise = PuffWardrobe.addNewAnonUser()
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
               if(!PuffWardrobe.switchCurrent(userRecord.username))
                   throwfail('Could not set currently active user', userRecord)
           })

// post a puff with that user
userPromise.then(function(userRecord) {
               var type = 'text'
               var content = 'some content'
               var parents = []
               var metadata = {}
               var postPromise = PuffForum.addPost(type, content, parents, metadata)
               
               postPromise.catch(function(err) { 
                   throwfail('Could not post new puff', err) 
               })
               
               // post a reply puff to that first puff
               postPromise.then(function(puff) {
                   var replyPromise = PuffForum.addPost('text', 'reply content', [puff.sig], {})
               
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
var randomUsername = PuffWardrobe.generateRandomUsername()
if(!/[0-9A-Za-z]/.test(randomUsername))
    testfail('Random username failed: ', randomUsername)

// generate random private key
var randomPrivateKey = Puffball.Crypto.generatePrivateKey()
if(!randomPrivateKey) 
    testfail('Private key gen failed: ', randomPrivateKey)

// convert public to private
var randomPublicKey = Puffball.Crypto.privateToPublic(randomPrivateKey)
if(!randomPublicKey) 
    testfail('Public key gen failed: ', randomPublicKey, randomPrivateKey)


//// Identity management

// get current keys
var keys = PuffWardrobe.getCurrentKeys() 

// get current username
var username = PuffWardrobe.getCurrentUsername()

// get current user record
var userRecord = PuffWardrobe.getCurrentUserRecord()

// get all of the identities being saved on this browser
var keychain = PuffWardrobe.getAll()

// switch current user
PuffWardrobe.switchCurrent(username)

// store a new username and keys
// note that this checks the keys against the DHT, so this will *fail*
var newUserPromise = PuffWardrobe.storePrivateKeys(randomUsername, randomPublicKey, randomPublicKey, randomPublicKey)
newUserPromise.then(function(userRecord) { testfail("The wardrobe stored keys when it shouldn't have", userRecord) })


// user lookup 
var badLookupPromise = PuffNet.getUserRecord(randomUsername)
badLookupPromise.then(function(userRecord) { testfail("The user record lookup should have failed", userRecord) })

var goodLookupPromise = PuffNet.getUserRecord('anon')
goodLookupPromise.catch(function(err) { testfail("The user record lookup should have succeeded", err) })


// use this style to interact with the anon user created above
// userPromise.then(function(userRecord) {
//     var keys = PuffWardrobe.getKeys(userRecord.username) 
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


function testfail() {
    console.log.apply(console, [].slice.call(arguments))
}

function throwfail() {
    testfail([].slice.call(arguments))
    throw Error('foo')
}

