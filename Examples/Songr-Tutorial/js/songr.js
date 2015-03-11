EB.init();

EB.Data.addContentType('audio', {
    toHtml: function(content) {
        return '<audio controls><source src=' + content + ' type=\"audio/mpeg\">' + '</audio>'
    }
});


/**
 *  Adds a valid username to the current user's friends list in the "preferences" field of their user record. If the current user does not have a "friends" field, one is created and defaulted to [EB.getCurrentUsername(),friendToAdd]
 *
 *  If the desired friend is added, their username is appended to #friendsList, otherwise error is shown in 'alert'
 *
 */
function addFriend() {
    var friendToAdd = $("#friendToAdd").val();
    var prom = EB.Users.getUserRecordPromise(friendToAdd);
    prom.then(function() {
        var prefs = getPrefs();
        if (!prefs.friends) {
            EB.setPreference("friends",[EB.getCurrentUsername(),friendToAdd]);
        } else {
            prefs.friends.push(friendToAdd);
            EB.setPreference("friends",prefs.friends);
        }

        $("#friendsList").append("<li>" + friendToAdd + "<button onclick='removeFriend(\""+ friendToAdd +"\")' class=\"btn btn-primary\">x</button></li>");
    })
    .catch (function(err) {
        alert(err)
    });
}


/**
 * Removes a user from the current user's preferences.friends if it exists
 *
 * Clears and regenerates #friendsList if changes were made to preferences.friends array, alert otherwise
 *
 * @returns {boolean}
 */
function removeFriend(friendToRemove) {
    var prefs = getPrefs();
    if(!prefs.friends || prefs.friends.indexOf(friendToRemove) < 0){
        alert("This person isn't on your friends list");
        return false;
    }

    var index = prefs.friends.indexOf(friendToRemove);

    prefs.friends.splice(index,1);
    EB.setPreference("friends",prefs.friends);
    $("#friendsList").html('');
    showFriends();
}


/**
 * Wrapper for EB.useSecureInfo used to access the current user's preferences in their user record
 *
 * @returns Object prefs
 */
function getPrefs() {
    var prefs = {};
    EB.useSecureInfo(function(identities,currentUsername) {
        prefs = identities[currentUsername].preferences;
    });
    return prefs;
}


/**
 * Populates #friendsList with the contents of preferences.friends for the current user
 *
 * Appends <li> to #friendsList for each friend in preferences.friends
 */
function showFriends() {
    var friends = getFriends();
    friends.forEach(function(friend) {
        $("#friendsList").append("<li>" + friend + "<button onclick='removeFriend(\""+ friendToAdd +"\")' class=\"btn btn-primary\">x</button></li>");
    });
}

/**
 * Gets the array of friends for a user from their preferences, if this user doesn't have any friends
 * the array is initialized with themselves
 *
 * @returns Array the list of friends for this user
 */
function getFriends() {
    var prefs = getPrefs();

    if (!prefs.friends || prefs.friends.length == 0) {
        EB.setPreference("friends",[EB.getCurrentUsername()]);
        return [EB.getCurrentUsername()];
    } else {
        return prefs.friends
    }
}

/**
 * Sends an audio clip to all friends of the current user
 *
 * Raises an alert on failure or success
 */
function sendClip() {

    var usernames = getFriends();

    var clipToSend = $("#sendInput")[0];

    var clipEncodingPromise = FileFile.openBinaryFile(clipToSend);

    clipEncodingPromise.then (function(encodedURI) {

        //set up additional info
        var type = "audio";
        var routes = usernames;
        var payload = {};
        payload.filename = clipToSend.files[0].name;

        var prom = EB.Users.usernamesToUserRecordsPromise(usernames);

        prom.then(function(userRecords) {        
            var puff = EB.Puff.simpleBuild(type, encodedURI, payload, routes, userRecords);
            EB.Data.addPuffToSystem(puff);
            alert("Sent successfully!");
        })
        .catch(function(err) {
            alert(err);
        })
    })

}

/**
 * Gets the 10 latest puffs for the current user and displays the audio clips among them
 *
 * Populates  #inbox with <audio> for each audio clip in the 10 latest puffs
 *
 * @returns {boolean}
 */
function getSongsForMe() {
    var inbox = $("#inbox");
    if (!EB.getCurrentUsername()) {
        inbox.html("<p>You are not logged in.</p>");
        return false;
    }
    var prom = EB.Data.getMorePrivatePuffs(EB.getCurrentUsername(),0,10)
    prom.then( function(report) {
        report.private_promise.then(function() {
            var myClips = EB.Data.getCurrentDecryptedLetters();
            inbox.html("");
            myClips.forEach(function(puff) {
                if(puff.payload.type == "audio") {
                    var content = EB.Data.getProcessedPuffContent(puff);
                    inbox.append(content);
                }
            });
        });
        return true;
    });
}

/**
 * Displays the relevant fields for a user based on if they are logged in or not
 *
 * Changes the content of #userArea based on the return value of EB.getCurrentUsername
 */
function manageUserArea() {
    if(EB.getCurrentUsername()) {
        $("#userArea").html("Logged in as: "+ EB.getCurrentUsername() + " <button id='logout' class='btn btn-primary' >Logout</button>");
        $("#logout").bind("click",handleLogout);
        $("#submitFile").removeAttr("disabled");
    } else {
        $("#userArea").html("<input type='text' id='username' placeholder='username'><br /><input type='text' id='password' placeholder='password'><br /><button id='login' class='btn btn-primary'>Login</button> or <button id='signup' class='btn btn-primary'>Create new user</button>");
        $("#login").bind("click",handleLogin);
        $("#signup").bind("click",handleSignup);
        $("#submitFile").attr("disabled","true");

    }
}


/**
 * Removes the current user's identity and data from the browser's storage
 *
 * #userArea may change after the call to manageUserArea
 */
function handleLogout() {
    var username = EB.getCurrentUsername();
    EB.switchIdentityTo();
    EB.removeIdentity(username);
    EB.Data.removeAllPrivateShells();
    manageUserArea();
    $("#friendsList").html("");
}


/**
 * Authenticates a user and adds their information and makes them the current identity if successful
 *
 * Updates #userArea, updates #inbox, updates #friendsList
 */
function handleLogin() {
    var username = $("#username").val();
    var password = $("#password").val();
    var prom = EB.loginWithPassphrase(username, password);
    prom.then(function(success) {
        console.log(success);
        if(success) {
            alert("Login Successful!");
            manageUserArea();
            getSongsForMe();
            showFriends();
        } else {
            alert("Login Failed. Please try again")
        }
    });
}


/**
 * Creates a new user account and makes it the current user
 *
 * Updates #userArea if a new user was created
 */
function handleSignup() {
    var requestedUser = $("#username").val();
    var password = $("#password").val();
    var prom = EB.createIdentity(requestedUser, password);
    prom.then(function() {
        alert("user creation successfull!")
        manageUserArea();
        getSongsForMe();
        showFriends();
    })
    .catch(function(err) {
        alert(err);
    })
}

$(document).ready(function() {
    $("#submitFile").bind("click", function(e) {
        e.preventDefault();
        var toUser = $("#sendTo").val();
        var fileToSend = $("#sendInput")[0].files[0];

        var sendContent = FileFile.openBinaryFile($("#sendInput")[0])

        if (!sendContent) {
            alert("you need to select a file to send");
        } else {
            sendClip();
        }

    });
    $("#getNewClips").bind("click",getSongsForMe);

    manageUserArea();

    getSongsForMe();

    showFriends();

});
