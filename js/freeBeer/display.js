/**
 * Functions related to rendering different configurations of puffs
 */
function viewLatestConversations() {
    var puffs = PuffForum.getRootPuffs();

    // Sorting function based on payload time
    puffs.sort(function(a, b) {return b.payload.time - a.payload.time});

    $('#parents').empty();
    $('#main-content').empty();
    $('#children').empty();

    puffs.slice(0, CONFIG.maxLatestRootsToShow).forEach(function(puff) {
        $("#children").append( puffTemplate(puff, false) );
    });
}

// show a puff, its children, and some arrows
showPuff = function(puff, viewFull) {
    if(typeof viewFull !== 'undefined' && viewFull) {
        viewFull = false;
    } else {
        viewFull = true;
    }

    $('#parents').empty();
    $('#main-content').empty();
    $('#children').empty();

    $("#main-content").append( puffTemplate(puff, true, viewFull) );

    // Append parents to the DOM
    var parentPuffs = PuffForum.getParents(puff);
    parentPuffs.forEach(function(puff) {
        $('#parents').append( puffTemplate(puff, false) )
    });

    // Append no more than 3 children to DOM.
    // Use CONFIG.maxChildrenToShow
    var childrenPuffs = PuffForum.getChildren(puff);

    childrenPuffs.sort(function(a, b) {
        return b.payload.time - a.payload.time
    });

    childrenPuffs.slice(0, CONFIG.maxChildrenToShow).forEach(function(puff) {
        $("#children").append( puffTemplate(puff, false) );
    });

    // Draw lines between Puff's using jsPlumb library.
    // Does this for each child Puff and the block of HTML that makes up the Puff.
    $("#children .block").each(function () {

        // Define jsPlumb end points.
        var e0 = jsPlumb.addEndpoint(puff.sig, {
            anchor: "BottomCenter",
            endpoint: "Blank"
        });

        var e = jsPlumb.addEndpoint($(this).attr("id"), {
            anchor: "TopCenter",
            endpoint: "Blank"
        });

        // Draw lines between end points.
        jsPlumb.connect({
            source: e0,
            target: e,
            paintStyle: {
                lineWidth: 2,
                strokeStyle: "#d1d1d1"
            },
            connector: "Straight",
            endpoint: "Blank",
            overlays:[ ["Arrow", {location:-20, width:20, length:20} ]]
        });
    });

    $("#parents .block").each(function () {

        // Define jsPlumb end points.
        var e0 = jsPlumb.addEndpoint(puff.sig, {
            anchor: "TopCenter",
            endpoint: "Blank"
        });

        var e = jsPlumb.addEndpoint($(this).attr("id"), {
            anchor: "BottomCenter",
            endpoint: "Blank"
        });

        // Draw lines between end points.
        jsPlumb.connect({
            source: e,
            target: e0,
            paintStyle: {
                lineWidth: 2,
                strokeStyle: "#d1d1d1"
            },
            connector: "Straight",
            endpoint: "Blank",
            overlays:[ ["Arrow", {location:-20, width:20, length:20} ]]
        });
    });
}





    // Globals
    var FESYSTEM = new Object(); // holds anything required for front-end works

$(document).ready(function() {
    $("#puffballIcon").click(function() {
        $("#menu").toggle();
    });

    $("#newContentLink").click(function() {
        $("#menu").toggle();
    });

    $("#otherNewContentLink").click(function() {
        $("#otherForm").toggle();
    });

    $('#otherForm').eq(0).draggable();

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

    });

    // EVERYTHING BELOW HERE MIGHT NOT BE USED


    function newAnon() {
        PuffForum.addAnonUser(function(newName) {
            // PuffForum.userinfoLivesHereForNow.username
            var authorText = '<span class="author">' + newName + '</span>';
            var buttonCode = '<a href="#" onclick="clearPrivateKey(); return false;">';
            buttonCode += '<img src="img/logout.png" width="24" height="24" title="Remove private key from browser memory"></a>&nbsp;';
            document.getElementById('currentUser').innerHTML = buttonCode + authorText;
        });

    }

    function viewPrivate() {
        document.getElementById('privateKeyMenuItem').innerHTML = 'Private key: <input type="text" value="' + PuffForum.userinfoLivesHereForNow.privateKey + '">';

    }

    function hidePrivate() {
        document.getElementById('privateKeyMenuItem').innerHTML = "";

    }

    function viewPublic() {
        document.getElementById('publicKeyMenuItem').innerHTML = 'Public key: <input type="text" value="' + PuffForum.userinfoLivesHereForNow.publicKey + '">';

    }

    function hidePublic() {
        document.getElementById('publicKeyMenuItem').innerHTML = "";

    }

    function clearPrivateKey() {

        document.getElementById('currentUser').innerHTML = '';
        document.getElementById('publicKeyMenuItem').innerHTML = '';
        document.getElementById('privateKeyMenuItem').innerHTML = '';
        document.getElementById('qr').innerHTML = '';

    }

    // Do this so we don't have to store privateKey link
    function qrcodeWrapper() {
        update_qrcode(PuffForum.userinfoLivesHereForNow.privateKey);

    }

    function getBlockchian() {
        if((typeof PuffForum.userinfoLivesHereForNow.username === 'undefined') || PuffForum.userinfoLivesHereForNow.username === '') {
            return false;
        } else {

            // return


           var blocks = Puff.Blockchain.exportChain(PuffForum.userinfoLivesHereForNow.username);
           var linkData = encodeURIComponent(JSON.stringify(blocks))

           // var linkHTML = '<a href="data:application/octet-stream;charset=utf-8;base64,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';
           // var linkHTML = '<a href="data:text/json,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';

           // pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
           // pom.setAttribute('download', filename);

            var linkHTML = '<a download="blockchain.json" href="data:text/plain;charset=utf-8,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';


            document.getElementById('blockchainLink').innerHTML = linkHTML;
            console.log(link);
            console.log(linkHTML);

        }


    }
