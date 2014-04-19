// Bridge between visualization framework (plumb? angular? d3?) and js/forum files

///////// PuffForum Interface ////////////

// Register our update function
var eatPuffs = function(puffs) {
    // call the display logic
    // console.log(puffs);
  
    if(!Array.isArray(puffs) || !puffs.length) {
        return false;
    }

    // Not yet implemented
    // updateMinimap();
  
    if(typeof stupidTempGlobalFlagDeleteMe == 'undefined') {
        stupidTempGlobalFlagDeleteMe = false;
    }


    // is anything showing? no? ok, show something.
    if(!stupidTempGlobalFlagDeleteMe) {
        var puffSig = window.location.hash.substring(1) || CONFIG.defaultPuff;
        
        showPuff(PuffForum.getPuffById(puffSig));
        stupidTempGlobalFlagDeleteMe = true;
        return false;
    }
  
    // ok. now that the stupid stuff is done, let's do something smart.
    // what's my main content item? is this new puff a child of it?
    // oh dear why would you do this use app data & react instead
    var currentId = $('#main-content .block').attr('id');
  
    if(puffs.some(function(puff) {return !!~puff.payload.parents.indexOf(currentId)}));

    showPuff(PuffForum.getPuffById(currentId));
}

PuffForum.onNewPuffs(eatPuffs);

// initialize the forum module (and by extension the puffball network)
PuffForum.init();

////////// End PuffForum Interface ////////////


//// grab back/forward button changes
window.onpopstate = function(event) {
    if(!event.state) return false
    
    var puff = PuffForum.getPuffById(event.state.sig)
    if(!puff) return false
    
    showPuff(puff, true)
}


/////////// REACTABLES ///////////////


/**
* Functions related to rendering different configurations of puffs
*/

// show a puff, its children, and some arrows
showPuff = function(puff, doNotSetState) {
    React.renderComponent(PuffWorld({puff: puff}), document.getElementById('puffworld'))

    // set window.location.hash and allow back button usage
    if(!doNotSetState) {  // THINK: simplify this
        var state = { 'sig': puff.sig }; 
        history.pushState(state, '', '#' + puff.sig);
    }
}





/////// minimap ////////

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



document.addEventListener('DOMContentLoaded', function() {
  
    // When browser window is resized, refresh jsPlumb connecting lines.
    $(window).resize(function(){
        jsPlumb.repaintEverything();
    });

    // Pull down menu show and hide div
    $('#puffballIcon').click(function(){
        $('#menu').toggle();
    });



});



$(document).ready(function() {
    $("#puffballIcon").click(function() {
        $("#menu").toggle();
    });

    $("#newContentLink").click(function() {
        $("#menu").toggle();
    });

    $("#otherNewContentLink").click(function() {
        $("#replyForm").toggle();
    });

    $('#replyForm').eq(0).draggable();

});

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
