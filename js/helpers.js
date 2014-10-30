// TODO: Rename most of these into the PB namespace

function keepNumberBetween(x,a,b) {
    if(x < a)
        return a
    if(x > b)
        return b

    return x
}

//wrapper to get puffs to display in table view
function getTableViewContent(query, filters, limit) {
    return PB.M.Forum.getPuffList(query, filters, limit).filter(Boolean)
}

/*
    The next 3 functions should definitely be living somewhere else, possibly PB.Net as that is where
    they were taken from and then modified here
 */
var getPrivateShellsFromMe = function(username) {
    if(!username) return PB.emptyPromise()

    var url  = CONFIG.puffApi
    var data = { username: username
        , contentType: 'encryptedpuff', fullOrShell: 'shell'
        , type: 'getPuffs', numb: CONFIG.globalBigBatchLimit
    }

    return PB.Net.getJSON(url, data)
}

var getPrivateShellsForMe = function(username) {
    if(!username) return PB.emptyPromise()

    var url  = CONFIG.puffApi
    var data = { route: username
        , contentType: 'encryptedpuff', fullOrShell: 'shell'
        , type: 'getPuffs', numb: CONFIG.globalBigBatchLimit
    }

    return PB.Net.getJSON(url, data)
}

function userHasShells(username, callback) {
    var checkFromMe = getPrivateShellsFromMe(username)

    checkFromMe.then(function(shells) {
        var numShells = shells.length
            var checkForMe = getPrivateShellsForMe(username)

            checkForMe.then(function(shells) {
                numShells += shells.length

                callback(numShells)
            })
    })
}

// TODO: move this
function getMorePuffs(offset, batchsize) {
    offset = offset || 20
    batchsize = batchsize || 10
    var prom
    prom = PB.Net.getMyPrivatePuffs(PB.getCurrentUsername(), batchsize, offset)
    prom = prom.then(PB.Data.addShellsThenMakeAvailable)
    return prom
    
    // .then(function(report) {
    //     // report.delivered: 10
    //     // report.valid: 8
    //     // report.new: 5
    // }
    // .catch(function(err) {
    //     // err -> Network error
    // })
}



function generateRandomUsername() {
    var animalName = PB.Crypto.getRandomItem(ICX.animalNames)
    var adjective = PB.Crypto.getRandomItem(ICX.adjectives)
    var animalColor = PB.Crypto.getRandomItem(ICX.colornames)

    return adjective+animalColor+animalName
}

// Takes in a username and passphrase and returns a new puff
function buildICXUserPuff(username, passphrase) {
    var prependedPassphrase = username + passphrase
    var privateKey = passphraseToPrivateKeyWif(prependedPassphrase)
    var publicKey = PB.Crypto.privateToPublic(privateKey)

    var rootKeyPublic     = publicKey
    var adminKeyPublic    = publicKey
    var defaultKeyPublic  = publicKey

    var privateRootKey    = privateKey
    var privateAdminKey   = privateKey
    var privateDefaultKey = privateKey

    var payload = {
        requestedUsername: username,
        rootKey: rootKeyPublic,
        adminKey: adminKeyPublic,
        defaultKey: defaultKeyPublic
    }

    var routes = []
    var type = 'updateUserRecord'
    var content = 'requestUsername'

    return PB.buildPuff(username, privateAdminKey, routes, type, content, payload)
}

function inviteICXUser(passphrase, GUIcallback) {
    var requestedUsername = generateRandomUsername()

    //needs to be here for add alias
    var prependedPassphrase = requestedUsername + passphrase
    var privateKey = passphraseToPrivateKeyWif(prependedPassphrase)

    var puff = buildICXUserPuff(requestedUsername,passphrase)

    var prom = PB.Net.updateUserRecord(puff)
    prom.then(function() {
        var capa = 1 // THINK: does capa always start at 1? where should that knowledge live?
        PB.addAlias(requestedUsername, requestedUsername, capa, privateKey, privateKey, privateKey, {passphrase: passphrase})

        GUIcallback(requestedUsername)
    })

}

function createICXUser(username, passphrase, GUIcallback) {
    //needs to be here for add alias
    var prependedPassphrase = username + passphrase
    var privateKey = passphraseToPrivateKeyWif(prependedPassphrase)

    var puff = buildICXUserPuff(username, passphrase)

    var prom = PB.Net.updateUserRecord(puff)
    prom.then(function(userRecord) {
        var capa = 1 // THINK: does capa always start at 1? where should that knowledge live?
        PB.addAlias(username, username, capa, privateKey, privateKey, privateKey, {passphrase: passphrase})

        PB.switchIdentityTo(username)

        publishProfilePuff()
        GUIcallback()

    })
}



function toggleSpinner() {
    Events.pub('ui/thinking', { 'ICX.thinking': !puffworldprops.ICX.thinking })
}

//Decrypts files and hands them off to a callback when complete
//TODO:Implement Better Error handling
function icxDecryptFile(element, files, callback) {
    var filename = files.name
    var fileprom = PBFiles.openPuffFile(element)

    fileprom.then(function(fileguts) {
        var letterPromise = PBFiles.extractLetterPuff(fileguts)

        letterPromise.then(function(letterPuff) {
            if (!letterPuff ||typeof letterPuff === 'undefined') {
                callback(false)
            }
            else {
                var content = (letterPuff.payload || {}).content
                var type = (letterPuff.payload || {}).type

                //TODO: Move this browser dependancy out of here
                if (getBrowser() == "IE") //additional check for ie
                    window.navigator.msSaveBlob(PBFiles.prepBlob(content), filename)

                callback(PBFiles.prepBlob(content, type))
            }

        }).catch(function(err) {
            PB.onError('Improperly formatted content', err)
        })
    })
}

//Encrypts files and hands them off to a callback when complete
//TODO: Better error handling
function icxEncryptFile(promise, files, callback) {
    promise.then(function(blob) {
        var puff = PBFiles.createPuff(blob, 'file')
        var filename = files.name
        var new_filename = filename + '.puff'

        //TODO: Move this browser dependency out of here
        if (getBrowser() == "IE")
            window.navigator.msSaveBlob(PBFiles.prepBlob(puff), new_filename)
        callback(PBFiles.prepBlob(puff))

    })
}

// From brainwallet
function passphraseToPrivateKeyWif(passphrase) {
    var hashStr = Bitcoin.Crypto.SHA256(passphrase).toString();
    // hash = Bitcoin.Crypto.util.bytesToHex(hash);
    // var hash_str = pad(hash, 64, '0');
    hash = Bitcoin.convert.hexToBytes(hashStr);

    return Bitcoin.ECKey(hash).toWif()
}

function pad(str, len, ch) {
    padding = '';
    for (var i = 0; i < len - str.length; i++) {
        padding += ch;
    }
    return padding + str;
}


function getImageCode(sig) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = 18;
    canvas.height = 18;

    var ctx = canvas.getContext("2d");

    var blockSize = 6;
    var blocks = canvas.width / blockSize;

    colors = [
        'rgba(139, 136, 255, .99)',
        'rgba(255, 156, 0 , .99)',
        'rgba(123, 179, 26, .99)',
        'rgba(238, 219, 0, .99)',
        'rgba(204, 51, 51, .99)',
        'rgba(255, 255, 255, .99)',
        'rgba(255, 255, 255, .99)'
    ]

    /*
    // TODO: Do this as often as needed
    var h1 = Bitcoin.Crypto.MD5(sig);
    var h2 = Bitcoin.Crypto.MD5(sig+h1);
    hashed = h2 + h1;

    var parts = hashed.match(/.{1,2}/g);

    // Change into blocks of 6, find closest, then split apart.
    */




    // dec = parts.map( function(item) { return parseInt(item, 16); } );


    for (var i = 0; i < blocks; i++) {
        for(var j = 0; j < blocks; j++) {
            seed = Math.pow(2,i)+Math.pow(3,j);
            var fillIndex = murmurhash3_32_gc(sig, seed)% colors.length
            var fillRgba = colors[fillIndex];

            ctx.fillStyle = fillRgba;

            ctx.fillRect((i*blockSize),(j*blockSize),blockSize,blockSize);

            /*
            // Line overlay
            if(i) {
                ctx.lineWidth = 0.5;
                ctx.strokeStyle="#0000FF";
                ctx.beginPath();
                ctx.moveTo(i*blockSize, 0);
                ctx.lineTo(i*blockSize, canvas.height);
                ctx.stroke();
            }

            if(j) {
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, j*blockSize);
                ctx.lineTo(canvas.width, j*blockSize);
                ctx.stroke();
            }
            */




            // $r = array_pop($colors);
            //$g = array_pop($colors);
            //$b = array_pop($colors);

        }
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle="#000000";
    ctx.strokeRect(0,0,canvas.width,canvas.height);


    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    // return canvas.toDataURL('image/jpeg') // defaults to png, which 4x the size for flickr images

    return canvas.toDataURL("image/png");
    // var dataURL = canvas.toDataURL("image/png");
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

/**
 *
 * @param sig {string}
 * Return an rgba color to use
 */
function getBGcolor(sig) {
    // Get the ascii character numbers of all sigs
    var len = sig.length;
    var total = 0;
    for(var i=0; i<len; i++) {
        total += sig.charCodeAt(i);
    }

    var numbs = [255-(total % 9), 255-(total % 10),255-(total % 11) ]

    return 'rgba(' + numbs[0] + ',' + numbs[1] + ',' + numbs[2] + ',.9)';
}

Date.prototype.yyyymmdd = function() {

    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();

    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};

Date.prototype.ymdhis = function() {

    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    var hh = this.getHours().toString();
    var mn = this.getMinutes().toString();
    var ss = this.getSeconds().toString();

    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + hh+':'+mn+':'+ss;
};


/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

/* Function to construct a random passphrase from an array of words*/
var generatePassphrase = function(dict,numWords) {
    var passphrase = "";
    for(var i=0; i < numWords; i++) {
        var randWord = PB.Crypto.getRandomItem(dict)

        if (i == 0) {
            passphrase += randWord;
        } else {
            passphrase = passphrase + " " + randWord;
        }
    }
    return passphrase;
}

// Is the object empty?
// From http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

// Browser detection by kennebec
// http://stackoverflow.com/questions/2400935/browser-detection-in-javascript

// Original function, keep this here for now 
// might be useful later on when support on more browser is needed

// function getBrowserAndVersion() {
//     var ua= navigator.userAgent, tem, 
//     M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
//     if(/trident/i.test(M[1])){
//         tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
//         return 'IE '+(tem[1] || '');
//     }
//     if(M[1]=== 'Chrome'){
//         tem= ua.match(/\bOPR\/(\d+)/)
//         if(tem!= null) return 'Opera '+tem[1];
//     }
//     M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
//     if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
//     return M.join(' ');
// }

function getBrowser() {
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){ // IE
        return 'IE';
    } else { // Chrome or FF
        return M[1];
    }
}

function getAnimalCSS() {
    // Get animals

    // Chrome uses "rules"
    // Firefox and IE uses "cssRules"
    var animalCSS = [];
    var animals = [];
    var i = 0;

    // on source site stylesheets are not compiled into one single file
    // on live site all stylesheets are pulled into one file
    for(var j = 0; j < document.styleSheets.length; j++) {
        if (getBrowser() == "Chrome") {
            animalCSS = document.styleSheets[j].rules;
        } else {
            animalCSS = document.styleSheets[j].cssRules;
        }

        for(var k = 0; k < animalCSS.length; k++) {
            var selector = animalCSS[k].selectorText;

            if(typeof selector != 'undefined') {

                // Chrome and IE inserts an ":" between animal name and before
                // Firefox doesn't
                splitResult = selector.replace("::",":").replace(":","-").split("-");

                if( splitResult[0] == '.icon') {
                    animals[i] = splitResult[1];
                    i++;
                }
            }
        }
    }
    return animals;
}

function getAnimalUnicodes() {
    // Get animals

    // Chrome uses "rules"
    // Firefox and IE uses "cssRules"
    var animalCSS = [];
    var unicodes = [];
    var i = 0;

    // on source site stylesheets are not compiled into one single file
    // on live site all stylesheets are pulled into one file
    for(var j = 0; j < document.styleSheets.length; j++) {
        animalCSS = document.styleSheets[j].cssRules;

        for(var k = 0; k < animalCSS.length; k++) {
            var selector = animalCSS[k].selectorText;

            if(typeof selector != 'undefined') {

                // Chrome and IE inserts an ":" between animal name and before
                // Firefox doesn't
                splitResult = selector.replace("::",":").replace(":","-").split("-");


                if( splitResult[0] == '.icon') {
                    var unicode = animalCSS[k].style.content.replace(/"/g, "").replace(/'/g, "").replace("\\", "");
                    
                    if (getBrowser() == "IE") { // IE doesn't encode the unicode
                        unicodes[i] = unicode;
                    } else {
                        unicodes[i] = unicode.charCodeAt(0).toString(16);
                    }
                    i++;
                }
            }
        }
    }
    return unicodes;
}


function generateRandomAnimal() {

    var animals = getAnimalCSS();
    var animal = PB.Crypto.getRandomItem(animals);

    return animal;

}

// Basic check to see if something has the form of an email address:
// http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
function looksLikeEmailAddress(str) {
    if (!str) return false
    var lastAtPos = str.lastIndexOf('@');
    var lastDotPos = str.lastIndexOf('.');
    return (lastAtPos < lastDotPos && lastAtPos > 0 && str.indexOf('@@') == -1 && lastDotPos > 2 && (str.length - lastDotPos) > 2);
}

/**
 * Convert an image 
 * to a base64 string
 * @author HaNdTriX
 * http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
 * @param  {String}   url         
 * @param  {Function} callback    
 * @param  {String}   [outputFormat=image/png]           
 */
// function convertImgToBase64(url, callback, outputFormat){
//     var canvas = document.createElement('CANVAS'),
//         ctx = canvas.getContext('2d'),
//         img = new Image;
//     img.crossOrigin = 'Anonymous';
//     img.onload = function(){
//         var dataURL;
//         canvas.height = img.height;
//         canvas.width = img.width;
//         ctx.drawImage(img, 0, 0);
//         dataURL = canvas.toDataURL(outputFormat);
//         callback.call(this, dataURL);
//         canvas = null; 
//     };
//     img.src = url;
// }

function getAvatar(color, name) {
    var canvas = document.getElementById("avatarCanvas");
    var ctx = canvas.getContext('2d');
    ctx.clearRect ( 0 , 0 , 105 , 105 );
    var unicode = getUnicodeFromName(name);

    /*
    ctx.font = "100px icxicon";
    ctx.fillStyle = "black";
    ctx.fillText(String.fromCharCode(unicode), 0, 100);

    ctx.font = "90px icxicon";
    ctx.fillStyle = color;
    ctx.fillText(String.fromCharCode(unicode), 5, 95);
    */

    ctx.font = "100px icxicon";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2;
    ctx.fillText(String.fromCharCode(unicode), 5, 95);
    ctx.strokeText(String.fromCharCode(unicode), 5, 95);
    ctx.fill();
    ctx.stroke();

    if(!puffworldprops.profile.customAvatar) {
        return Events.pub('ui/event',
            {'profile.avatarUrl': canvas.toDataURL('png')}
        )
    }
}

function getUnicodeFromName(name) {
    var animals = getAnimalCSS();
    var unicodes = getAnimalUnicodes();
    var index = animals.indexOf(name);
    if(index < 0) {
        return false;
    } else {
        return "0x" + unicodes[index];
    }
}



function updatePassphrase(newPassphrase) {
    //// update the passphrase of the current user. 
    //// returns a promise that resolves with the final newUserRecord after all the modifications are made, 
    //// or rejects with an error thrown along the way
    
    var newPrivateKey = passphraseToPrivateKeyWif(newPassphrase)
    var secrets = {passphrase: newPassphrase}
    var newUserRecord = false

    var keysToModify = ['rootKey', 'adminKey', 'defaultKey']

    var prom = new Promise(function(resolve, reject) {
        updateKeyHelper(keysToModify, resolve, reject)
    })

    return prom
    
    // recursive helper function

    function updateKeyHelper(keys, resolve, reject) {
        if(keys.length == 0) {
            resolve(newUserRecord) // End of processing cycle: resolve to final newUserRecord
        }

        var keyToModify = keys.pop()

        var userRecordPromise = PB.updatePrivateKey(keyToModify, newPrivateKey, secrets)

        userRecordPromise.then(function(userRecord) {
            newUserRecord = userRecord
            updateKeyHelper(keys, resolve, reject)
        }).catch(function(err) {
            reject(err) // error while updating the user record, so reject
        })
    }
}


function ICXAddPost(toUser, type, parents, content, metadata, envelopeUserKeys, callback) {

    var prom = Promise.resolve() // a promise we use to string everything along
    var usernames = [toUser]

    var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
    var userRecordUsernames = userRecords.map(function (userRecord) {
        return userRecord.username
    })

    if (userRecords.length < usernames.length) {
        usernames.forEach(function (username) {
            if (!~userRecordUsernames.indexOf(username)) {
                prom = prom.then(function () {
                    return PB.getUserRecordNoCache(username).then(function (userRecord) {
                        userRecords.push(userRecord)
                    })
                })
            }
        })
    }

    prom = prom.then(function () {
        if (envelopeUserKeys) {      // add our secret identity to the list of available keys
            userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
        } else {                     // add our regular old boring identity to the list of available keys
            userRecords.push(PB.getCurrentUserRecord())
        }

        if( type == 'file') {
            content.then(function (blob) {
                var post_prom = PB.M.Forum.addPost(type, blob, parents, metadata, userRecords, envelopeUserKeys)
                post_prom = post_prom.then(function (){
                    // GUI cleanup in callback
                    callback()
                }).catch(function (err) {
                    callback(err)
                })

                return post_prom
            })
        } else {
            var post_prom = PB.M.Forum.addPost(type, content, parents, metadata, userRecords, envelopeUserKeys)
            post_prom = post_prom.then(function () {
                callback()
            }).catch(function (err) {
                callback(err)
            })

            return post_prom
        }
    }).catch(function (err) {
        callback(err)
    })
}

function ICXAuthenticateIdFile(content, callback) {
    // Try and parse, if can't return error
    // NOTE: don't inline try/catch, it kills browser optimizations. use PB.parseJSON &c instead.
    var identityObj = PB.parseJSON(content)
    var username = identityObj.username
    var aliases = identityObj.aliases

    if(!identityObj || !username || !aliases) {
        callback("Corrupt Identity File", 'Incorrect')
    }

    Events.pub('ui/thinking', { 'ICX.thinking': true })
    
    var preferences = identityObj.preferences || {}
    
    // load complete identity
    PB.addIdentity(username, aliases, preferences)
    
    // then check against the up-to-date user record
    var prom = PB.getUserRecordNoCache(username)

    prom.then(function (userInfo) {
        if(!userInfo || userInfo.username != username) {
            PB.removeIdentity(username)
            ICX.errors = "ERROR: Username not found in public record."
            Events.pub('ui/thinking', { 'ICX.thinking': false })
            Events.pub('/ui/icx/error', {"icx.errorMessage": true})
            return PB.onError('Username not found in public record')
        }
            
        PB.useSecureInfo( function(identities, currentUsername, currentPrivateRootKey, currentPrivateAdminKey, currentPrivateDefaultKey) {
            var identity = identities[username]
            if(!identity || !identity.primary) {
                PB.removeIdentity(username)
                ICX.errors = "ERROR: Identity not properly loaded."
                Events.pub('ui/thinking', { 'ICX.thinking': false })
                Events.pub('/ui/icx/error', {"icx.errorMessage": true})
                return PB.onError('Identity not properly loaded')
            }
            
            var primary = identity.primary
            
            if(primary.privateDefaultKey) {
                if(userInfo.defaultKey != PB.Crypto.privateToPublic(primary.privateDefaultKey)) {
                    PB.removeIdentity(username)
                    ICX.errors = "ERROR: The identity file does not contain a valid public user record."
                    Events.pub('/ui/icx/error', {"icx.errorMessage": true})
                    Events.pub('ui/thinking', { 'ICX.thinking': false })
                    Events.pub('ui/event', { 'ICX.defaultKey':'Incorrect key' })
                    return PB.onError('Private default key in identity file does not match public user record')
                }
            }
            // TODO: add public-private sanity check for root and admin keys
            
            Events.pub('ui/thinking', { 'ICX.thinking': false })
            PB.switchIdentityTo(username)
            callback()
        })
    })
    .catch(function (err) {
        callback(err.message, 'Not found')

        Events.pub('ui/thinking', { 'ICX.thinking': false })
        PB.removeIdentity(username)
        return PB.throwError('File-based login failed')
    })
}

function ICXAuthenticateUser (username, passphrase, callback, flag) {
    // Convert passphrase to private key
    //needs to be here for add alias
    if (flag) {
        var privateKey = passphraseToPrivateKeyWif(passphrase)
    } else {
        var prependedPassphrase = username + passphrase
        var privateKey = passphraseToPrivateKeyWif(prependedPassphrase)
    }

    // Convert private key to public key
    var publicKey = PB.Crypto.privateToPublic(privateKey)
    if (!publicKey) {
        callback('ERROR: Failed to generate public key', 'Bad Key',true)
    }

    var prom = PB.getUserRecordNoCache(username)

    prom.then(function (userInfo) {

        var goodKeys = {}
    
        if (publicKey == userInfo.defaultKey)
            goodKeys.privateDefaultKey = privateKey
    
        if (publicKey == userInfo.adminKey) 
            goodKeys.privateAdminKey = privateKey                
    
        if (publicKey == userInfo.rootKey)
            goodKeys.privateRootKey = privateKey
        
        if(Object.keys(goodKeys).length == 0) {
            if (flag) {
                callback('ERROR: Invalid passphrase', 'Incorrect', true)
                PB.onError('Passphrase did not match any keys in the user record')
                return false
            }
            else {
                ICXAuthenticateUser (username,passphrase,callback,true)
            }
        }
        else {
            // At least one good key: make current user and add passphrase to wardrobe
            var capa = username.capa || 1
            var secrets = {passphrase: passphrase}
            // TODO: pull this out of GUI and push it down a level
            PB.addAlias(username, username, capa, goodKeys.privateRootKey, goodKeys.privateAdminKey, goodKeys.privateDefaultKey, secrets)

            PB.switchIdentityTo(username)

            callback()
            return false
        }

    }).catch(function (err) {
        callback(err.message, 'Not found')
        return PB.onError('Passphrase-based login failed')
    })
}


/////////////////////////////////////////////
// THINGS FROM MAIN



///// puff display helpers /////// 

function showPuff(sig) {
    //// show a puff and do other stuff

    if(!sig)
        return false

    var puff = PB.getPuffBySig(sig)                                 // get it?

    if(puff)
        return showPuffDirectly(puff)                               // got it.

    var prom = PB.Data.pending[sig]                                 // say what?
    if(!prom)
        return PB.onError('Bad sig in pushstate')

    prom.then(function(puffs) {                                     // okay got it.
        showPuffDirectly(puffs[0])
    })
}

function showPuffDirectly(puff) {
    //// show a puff with no checks or balances
    Events.pub('ui/show/tree', { 'view.mode' : 'focus'
                               , 'view.filters' : {}
                               , 'view.query' : puffworlddefaults.view.query
                               , 'view.query.focus' : puff.sig
                               // , 'menu'      : puffworlddefaults.menu
                               })
}


//// props and urls and pushstate oh my ////

stashedKeysFromURL = {}

function getStashedKeysFromURL() {
    return stashedKeysFromURL
}

function handleImportRedirect() {
    var state = getQuerystringObject();
    var keysToStash = ['requestedUsername', 'network', 'token', 'requestedUserId']
    if (state['requestedUsername']) {
        // update_puffworldprops({'menu.show': true, 'menu.import': true, 'menu.section': 'identity'})
        update_puffworldprops({'view.slider.show': true, 'view.slider.wizard':true, 'view.slider.currentSlide': 3})

        state = Boron.shallow_copy(state)                               // clone before delete
        
        for(var key in state) {
            if(!~keysToStash.indexOf(key)) continue
            stashedKeysFromURL[key] = state[key]

            delete state[key]
        }
        setURLfromViewProps();
    }
    //setURLfromViewProps();
}

function setURLfromViewProps() {
    var diff = Boron.deep_diff(puffworlddefaults.view, puffworldprops.view)
    var viewprops = Boron.shallow_copy(diff)
    setURL(viewprops)
}

function setURL(state, path) {
    var currentState = history.state || {}
    var flatCurrent  = JSON.stringify(currentState)
    var flatState    = JSON.stringify(state)
    if(flatState == flatCurrent)                                        // are they equivalent?
        return false

    var url = convertStateToURL(state)

    history.pushState(state, path || '', url)
}

function convertStateToURL(state) {
    // state = stashKeysFromURL(state)
    state = Boron.flatten(state)
    
    var url = Object.keys(state)
                    .filter(function(key) {
                        return key 
                            && (typeof state[key] != 'object' || state[key].length !== 0)})
                    .map(function(key) {
                        var val = state[key] ? state[key] : 0
                        return encodeURIComponent(key) + "=" 
                             + encodeURIComponent(val.join ? val.join('~') : val) })
                    .join('&')

    return '?' + url
}


function setPropsFromURL() {
    var qobj = getQuerystringObject()
    Object.keys(qobj).forEach(function(key) {
        if(~qobj[key].indexOf('~'))
            qobj[key] = qobj[key].split('~')
        if(qobj[key] == '0')
            qobj[key] = 0
    })
    var pushstate = Boron.unflatten(qobj)
    setPropsFromPushstate(pushstate)
}

function setPropsFromPushstate(pushstate) {
    var flat  = Boron.flatten(pushstate)
    var props = Object.keys(flat).reduce(function(acc, key) 
                    {acc['view.' + key] = flat[key]; return acc}, {})

    /* setting the filter to NONE when no filter is specified in the url but there is other property set
        to deal with filter issue on reload
    */
    // THINK: do we still need this?
    var filterProps = Object.keys(props).filter(function(k){return k.indexOf('view.filters') == 0});
    if (Object.keys(pushstate).filter(Boolean).length > 0 && filterProps.length == 0) {
        props['view.filters'] = {};
    }

    update_puffworldprops(props)
    
    updateUI()
}

function getQuerystringObject() {
    return window.location.search.substring(1).split('&')
        .reduce(function(acc, chunk) {
            var pair = chunk.split('=')
            acc[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
            return acc}, {})
}


//////////////// some string things /////////

// functions that convert string for displaying
var StringConversion = {};

/**
 * reduce imported username to alphanumeric
 * @param  {string} username original username
 * @param  {string} allowDot allow '.' in the username for subusers
 * @return {string}          valid username
 */
StringConversion.reduceUsernameToAlphanumeric = function(username, allowDot) {
    allowDot = allowDot || false;
    var pattern = allowDot ? /[^.A-Za-z0-9]/ : /[^A-Za-z0-9]/;
    return username.split(pattern).join('');
}

StringConversion.toLowerCamelCase = function(str) {
    str = str.split(" ");
    var first = str[0];
    var rest = str.slice(1)
                .map(function(s){
                    if (s.length < 2) return s.toUpperCase();
                    return s.slice(0, 1).toUpperCase() + s.slice(1);
                })
                .join("");
    return first+rest;
}

StringConversion.toDisplayUsername = function(username) {
    if (username.length == 0) return username;
    username = username.replace(/\s+/g, '');
    if (username.slice(0, 1) != '.')
        username = '.' + username;
    return username;
}
StringConversion.toActualUsername = function(username) {
    if (username.length == 0) return username;
    username = username.toLowerCase().replace(/\s+/g, '');
    if (username.slice(0, 1) == '.')
        username = username.slice(1);
    return username;
}

/**
 * Truncate long usernames. May be depricated
 * @param username string
 * @returns string
 */
StringConversion.humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}

formatForDisplay = function(obj, style) {
    if(style == 'formatted') {
        return JSON.stringify(obj, null, 2)
            .replace(/[{}",\[\]]/g, '')
            .replace(/^\n/, '')
            .replace(/\n$/, '');
    }

    // style is raw
    return JSON.stringify(obj).replace(/^\{\}$/, '');
}



// publishing a profile puff in ICX after registering a new user
// Move this
function handleUpdateProfile(puff) {
    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        if(!currentUsername)
            return false // THINK: is this an error?
        
        var userRecord = PB.getCurrentUserRecord()
        if(!userRecord)
            return false // THINK: is this an error?
        
        var oldProfile = userRecord.profile
        if(!userRecord)
            return false // THINK: okay how 'bout now?

        var type = 'updateUserRecord'
        var content = "setProfile"
        var payload = {}
        payload.profile = puff.sig

        var update_puff = PB.buildPuff(currentUsername, privateAdminKey, [], type, content, payload)

        var update_prom = PB.Net.updateUserRecord(update_puff)
        update_prom.then(function(userRecord){
            //console.log('Profile updated!')
        }).catch(function(err){
            //console.log('error', err)
        })
    })
}

function publishProfilePuff() {
   // console.log(puffworldprops.ICX.newUser)

    // build puff
    var content = puffworldprops.profile.avatarUrl
    var type = 'profile'
    // var self = this

    // publish public profile
    var post_prom = PB.M.Forum.addPost( type, content, [], {})
    post_prom.then(function(puff){
        // self.cleanUpSubmit()
        // self.refs.meta.handleCleanFields()
        handleUpdateProfile(puff)
    }).catch(PB.catchError('Posting failed'))
}

function getProfilePuff(username) {
    var existing_profile = PB.Data.profiles[username]
    if(existing_profile)
        return existing_profile === true ? false : existing_profile  // 'true' is our placeholder

    PB.Data.profiles[username] = true

    var prom = PB.Net.getProfilePuff(username)
    prom.then(function(puffs) {
        var puff = puffs[0]
        if(!puff) return false
        PB.Data.profiles[puff.username.stripCapa()] = puff
    })
    
    return false
}

function modConfig(key, value) {
    CONFIG[key] = value
    if(!CONFIG.mods)
        CONFIG.mods = {}
    CONFIG.mods[key] = value
    PB.Persist.save('CONFIG', CONFIG.mods)
}

function popMods() {
    var mods = PB.Persist.get('CONFIG')
    if(!mods) return false
    
    CONFIG.mods = mods
    Object.keys(CONFIG.mods).forEach(function(key) { CONFIG[key] = mods[key] })
}


String.prototype.stripCapa = function() {
    return this.replace(/:.*$/,"")
}

// END OF THINGS
/////////////////////////////////////////////






/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // PB.Data.getShells().forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PB.getPuffBySig(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////




/* not in use
function draggableize(el) {
    /// modified from http://jsfiddle.net/tovic/Xcb8d/light/
    
    var x_pos = 0,  y_pos = 0,                                      // mouse coordinates
        x_elem = 0, y_elem = 0;                                     // top and left element coords
                                                                    
    // called when user starts dragging an element              
    function drag_init(e) {                                     
        x_pos = e.pageX;                                            // store coords
        y_pos = e.pageY;                                            
        x_elem = x_pos - el.offsetLeft;                         
        y_elem = y_pos - el.offsetTop;                          
        document.addEventListener('mousemove', move_el);            // start moving
        return false
    }

    // called each time the mouse moves
    function move_el(e) {
        x_pos = e.pageX;
        y_pos = e.pageY;
        el.style.left = (x_pos - x_elem) + 'px';
        el.style.top  = (y_pos - y_elem) + 'px';
    }

    // bind the functions
    el.addEventListener('mousedown', drag_init);
    el.addEventListener('mouseup', function() {
        document.removeEventListener('mousemove', move_el);
    });
}
*/




// KEEP THIS HERE FOR NOW

// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
//
// var function makeWorker(url) {
//     var worker = new Worker(url)
//     var queue = []
//     var id = 0
//
//     obj = { worker: worker
//           , queue: []
//           , id: 0
//           , send: worker.postMessage.bind(worker)
//     }
//
//     var receive = function(msg) {
//         var id = msg._id
//         if(!id) return false // TODO: add onError here
//
//         var fun = queue[_id]
//         if(!fun) return false // TODO: add onError here
//
//         fun(msg.data)
//
//         delete queue[id]
//     }
//
//     worker.addEventListener("message", receive)
//
//     var send = function(msg, fun) {
//         msg._id = ++id
//         queue[id] = funfix(fun)
//         worker.postMessage(msg)
//     }
//
//     return obj
// }
//
// var cryptoworker = {
//     worker: new Worker("js/cryptoworker.js")
//     queue: []
//     id: 0
// }
//
// cryptoworker.addEventListener("message", console.log.bind(console))
// 
// Object.keys(PB.Crypto).forEach(function(key) {
//     PB.Crypto[key] = function() {
//         cryptoworker.postMessage({fun: key, args: [].slice.call(arguments)})
//         return Promise
//         // build response list, match by id
//         // change all requests to async requests
//     }
// })
// 
// cryptoworker.postMessage({fun: 'puffToSiglessString', args: [{asdF:123}]})
//
// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
// var partial = function(fun) {
//     var args = [].slice.call(arguments, 1)
//     return function() {
//         return fun.apply(fun, args.concat([].slice.call(arguments)))
//     }
// }


