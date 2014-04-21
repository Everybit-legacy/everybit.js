// Bridge between visualization framework (plumb? angular? d3?) and js/forum files

///////// PuffForum Interface ////////////

// Register our update function
var eatPuffs = function(puffs) {
    // call the display logic
  
    if(!Array.isArray(puffs) || !puffs.length) {
        return false;
    }

    if(typeof globalForceUpdateFun == 'undefined') return false
    
    // TODO: just call some kind of 'look for puff' function instead
    if(typeof globalStupidFirstTimeFlag == 'undefined') {
        globalStupidFirstTimeFlag = true
        var hash = window.location.hash
        if(hash) {
            var puff = PuffForum.getPuffById(hash.slice(1))
            if(puff) {
                showPuff(puff)
            }
        }
        return false
    }
    
    globalForceUpdateFun() // OPT: debounce this
}

PuffForum.onNewPuffs(eatPuffs); // assign our callback

PuffForum.init(); // initialize the forum module (and by extension the puffball network)

////////// End PuffForum Interface ////////////



/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // Puff.Data.puffs.forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffById(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }


////// end minimap /////



$("#setUserInfo").submit(function( event ) {
    event.preventDefault();

    var username = $("#usernameSet").val();
    var privateKey = $("#privateKeySet").val();

    // Check that this is a valid username (ascii etc)
    if(!isValidUsername(username)) {
        alert("invalid username!");
        return false;
    }

    // Generate their public key from private key
    try {
        var currPublic = Puff.Crypto.privateToPublic(privateKey);
    } catch(err) {
        alert("invalid private key!");
        return false;
    }

    // user lookup.
    // Check the public key against API:

    // Generate new anon user
    $.ajax({
        type: "GET",
        url: CONFIG.userApi,
        data: {
            type: "getUser",
            username: username
        },
        success: function (result) {

            if(result.publicKey === currPublic) {
                // Register this user in client memory so they can sign content
                PuffForum.userinfoLivesHereForNow.username = username;
                PuffForum.userinfoLivesHereForNow.privateKey = privateKey;
                PuffForum.userinfoLivesHereForNow.publicKey = currPublic;
            }  else {
                alert("That generates a public key that doesn't match!");
                return false;
            }
        },
        error: function () {
            alert('Unable to find a matching user for that information!');
        },
        dataType: "json"
    });

    var buttonCode = '<a href="#" onclick="clearPrivateKey(); return false;">';
    buttonCode += '<img src="img/logout.png" width="16" height="16" title="Remove private key from browser memory"></a>&nbsp;';
    document.getElementById('currentUser').innerHTML = buttonCode + '<span class="author">' + username + '</span>';
    // document.getElementById('authorDiv').innerHTML = username;
});
