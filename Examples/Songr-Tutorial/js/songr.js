PB.init();

PB.M.Forum.addContentType('audio', {
    toHtml: function(content) {
        return '<audio controls><source src=' + content + ' type=\"audio/mpeg\">' + '</audio>'
    }
});




// Helpers



/* addFriend:
*
*  Purpose: Adds a valid username to the current user's friends list in the "preferences" field of their user record.
*           If the current user does not have a "friends" field, one is created and defaulted to [PB.getCurrentUsername(),friendToAdd]
*
*  Returns: nothing     
*  
*  Effects: If the desired friend is added, their username is appended to #friendsList, else error is shown in 'alert'
*/
function addFriend() {
    var friendToAdd = $("#friendToAdd").val();
    var prom = PB.Users.getUserRecordPromise(friendToAdd);
    prom.then(function() {
        var prefs = getPrefs();
        if (!prefs.friends) {
            PB.setPreference("friends",[PB.getCurrentUsername(),friendToAdd]);
        } else {
            prefs.friends.push(friendToAdd);
            PB.setPreference("friends",prefs.friends);
        }

        $("#friendsList").append("<li>" + friendToAdd + "</li>");
    })
    .catch (function(err) {
        alert(err)
    });
}

/* removeFriend:
*
*  Purpose: Removes a user from the current user's preferences.friends if it exists
*
*  Returns: nothing
*  
*  Effects: Clears and regenerates #friendsList if changes were made to preferences.friends, alert otherwise
*/
function removeFriend() {
    var friendToRemove = $("#friendToRemove").val();
    var prefs = getPrefs();
    if(!prefs.friends || prefs.friends.indexOf(friendToRemove) < 0){
        alert("This person isn't on your friends list");
        return false;
    }

    var index = prefs.friends.indexOf(friendToRemove);

    prefs.friends.splice(index,1);
    PB.setPreference("friends",prefs.friends);
    $("#friendsList").html('');
    showFriends();
}

/* getPrefs:
*
*  Purpose: Wrapper for PB.useSecureInfo used to access the current user's preferences in their user record
*
*  Returns: Object
*
*  Effects: none
*/
function getPrefs() {
    var prefs = {};
    PB.useSecureInfo(function(identities,currentUsername) {
        prefs = identities[currentUsername].preferences;
    });
    return prefs;
}

/* showFriends:
*
*  Purpose: Populates #friendsList with the contents of preferences.friends for the current user
*
*  Returns: nothing
*
*  Effects: Appends a <li> to #friendsList for each friend in preferences.friends
*/
function showFriends() {
    var friends = getFriends();
    friends.forEach(function(friend) {
        $("#friendsList").append("<li>" + friend + "</li>");
    });
}

function getFriends() {
    var prefs = getPrefs();

    if (!prefs.friends || prefs.friends.length == 0) {
        PB.setPreference("friends",[PB.getCurrentUsername()]);
        return [PB.getCurrentUsername()];
    } else {
        return prefs.friends
    }
}

/* sendClip: string string
*
*  Purpose: Sends an audio clip to all friends of the current user
*
*  Returns: nothing
*
*  Effects: shows alert based on the success of sending the clip
*/
function sendClip() {

    var usernames = getFriends();

    var clipToSend = $("#sendInput")[0];

    var clipEncodingPromise = PBFiles.openBinaryFile(clipToSend);

    clipEncodingPromise.then (function(encodedURI) {

        //set up additional info
        var type = "audio";
        var routes = usernames;
        var payload = {};
        payload.filename = clipToSend.files[0].name;

        var prom = PB.Users.usernamesToUserRecordsPromise(usernames);

        prom.then(function(userRecords) {        
            var puff = PB.simpleBuildPuff(type, encodedURI, payload, routes, userRecords);
            PB.addPuffToSystem(puff);
            alert("Sent successfully!");
        })
        .catch(function(err) {
            alert(err);
        })
    })

}

/* getSongsForMe:
*
*  Purpose: Gets the 10 latest puffs for the current user and displays the audio clips among them
*
*  Returns: nothing || false
*
*  Effects: Populates  #inbox with an <audio> for each audio clip in the 10 latest puffs
*/
function getSongsForMe() {
    var inbox = $("#inbox");
    if (!PB.getCurrentUsername()) {
        inbox.html("<p>You are not logged in.</p>");
        return false;
    }
    var prom = PB.Data.getMorePrivatePuffs(PB.getCurrentUsername(),0,10)
    prom.then( function(report) {
        report.private_promise.then(function() {
            var myClips = PB.Data.getCurrentDecryptedLetters();
            inbox.html("");
            myClips.forEach(function(puff) {
                if(puff.payload.type == "audio") {
                    var content = PB.M.Forum.getProcessedPuffContent(puff);
                    inbox.append(content);
                }
            });
        });
    });
}

/* manageUserArea:
*
*  Purpose: Displays the relevant fields for a user based on if they are logged in or not
*
*  Returns: nothing
* 
*  Effects: Changes the content of #userArea based on the return value of PB.getCurrentUsername
*/
function manageUserArea() {
    if(PB.getCurrentUsername()) {
        $("#userArea").html("Logged in as: "+ PB.getCurrentUsername() + "<button id='logout' >Logout</button>");
        $("#logout").bind("click",handleLogout);
        $("#submitFile").removeAttr("disabled");
    } else {
        $("#userArea").html("<input type='text' id='username'><input type='text' id='password'><button id='login'>Login</button><button id='signup'>Sign up</button>");
        $("#login").bind("click",handleLogin);
        $("#signup").bind("click",handleSignup);
        $("#submitFile").attr("disabled","true");

    }
}

/* handleLogout:
*
*  Purpose: Removes the current user's identity and data from the brower's storage
*
*  Returns: nothing
*
*  Effects: #userArea may change after the call to manageUserArea
*/
function handleLogout() {
    var username = PB.getCurrentUsername();
    PB.switchIdentityTo();
    PB.removeIdentity(username);
    PB.Data.removeAllPrivateShells();
    manageUserArea();
}

/* handleLogin:
*
*  Purpose: Authenticates a user and add's their information and makes them the current identity if successful
*
*  Returns: nothing
*
*  Effects: updates #userArea, updates #inbox, updates #friendsList
*/
function handleLogin() {
    var username = $("#username").val();
    var password = $("#password").val();
    var prom = PB.loginWithPassphrase(username, password);
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

/* handleSignup:
*
*  Purpose: Creates a new user account and makes it the current user
*
*  Returns: nothing
*
*  Effects: updates #userArea if a new user was created
*/
function handleSignup() {
    var requestedUser = $("#username").val();
    var password = $("#password").val();
    var prom = PB.createIdentity(requestedUser, password);
    prom.then(function() {
        alert("user creation successfull!")
        manageUserArea();
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

        var sendContent = PBFiles.openBinaryFile($("#sendInput")[0])

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
