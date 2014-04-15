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

    // Do they want to go to a specific puff?
    var pid = gup('pid');
    // console.log(pid);
    // Why is there / at end? remove it.

    pid = pid.replace('/','');
    if(pid.length > 0) {
        var gotoPuff = pid;
    } else {
        var gotoPuff = CONFIG.defaultPuff;
    }


    // is anything showing? no? ok, show something.
    if(!stupidTempGlobalFlagDeleteMe) {
        showPuff(PuffForum.getPuffById(gotoPuff));   // show the first root
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
  
    // content form
  
    $(document).on('submit', "#otherContentForm", function( event ) {
        event.preventDefault();

        // PuffForum.addPost( $("#content").val(), JSON.parse( $("#parentids").val() ));
        // $('#replyForm').toggle();



        content = $("#content").val();
        $("#content").val("");//clean form after

        PuffForum.addPost( content, JSON.parse( $("#parentids").val() ));
        $("#parentids").val('[]');
    });

    // reply-to
    $(document).on('click', '#cancel-form', function( event ) {
        $('#replyForm').hide();
        $('#content').val("");
    });

    // When browser window is resized, refresh jsPlumb connecting lines.
    $(window).resize(function(){
        jsPlumb.repaintEverything();
    });

    // Pull down menu show and hide div
    $('#puffballIcon').click(function(){
        $('#menu').toggle();
    });



});

// find $_GET var in url
// http://stackoverflow.com/questions/8460265/
function gup (name) {
    name = RegExp ('[?&]' + name.replace (/([[\]])/, '\\$1') + '=([^&#]*)');
    return (window.location.href.match (name) || ['', ''])[1];
}

/*
jQuery(document).ready(function(){

  jQuery(document).click(function(e){
          var obj = (e.target ? e.target : e.srcElement);
          if (obj.tagName != 'BODY') return true;
          alert("BODY!");
          return false;
      });

});
*/

// set state to current puff
function setBrowserHistoryPuffStateToSomething(puff) {
    var state = { 'puff': puff.sig };
    history.pushState(state, '', '#puff=' + puff.sig);
}

// onload, store the puff id we're looking for
function storePuffIdToSomePlaceOnLoad() {
    someSillyGlobalPuffId = window.location.hash.substring(1);
}


// window.location.hash returns the anchor part of the browsers URL,
// including the #. Hence substring removes the #.
// Use the line below to allow the data to be selected in the browser addressbar
// i.e. /index.html#8 will select the 8th position in data_JSON_sample.
//      var hardcoded = parseInt(window.location.hash.substring(1));
// var hardcoded = 9;





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
    document.getElementById('authorDiv').innerHTML = username;
});
