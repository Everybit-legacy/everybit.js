/**
* Functions related to menu options
*
*/

// Generate a and display info for new anonymous user
function newAnon() {
    PuffForum.addAnonUser(function(newName) {
        // PuffForum.userinfoLivesHereForNow.username
        console.log("Created user " + newName);
        var authorText = '<span class="author">' + newName + '</span>';
        var buttonCode = '<a href="#" onclick="clearPrivateKey(); return false;">';
        buttonCode += '<img src="img/logout.png" width="16" height="16" title="Remove private key from browser memory"></a>&nbsp;';
        document.getElementById('currentUser').innerHTML = buttonCode + authorText;
        document.getElementById('authorDiv').innerHTML = newName;

    });
}

function viewPrivate() {
    document.getElementById('privateKeyMenuItem').innerHTML = 'Private key: <input type="text" onClick="this.select();" value="' + PuffForum.userinfoLivesHereForNow.privateKey + '">';
}

function hidePrivate() {
    document.getElementById('privateKeyMenuItem').innerHTML = "";

}

function viewPublic() {
    document.getElementById('publicKeyMenuItem').innerHTML = 'Public key: <input type="text" onClick="this.select();" value="' + PuffForum.userinfoLivesHereForNow.publicKey + '">';
}

function hidePublic() {
    document.getElementById('publicKeyMenuItem').innerHTML = "";

}

function clearPrivateKey() {
    document.getElementById('currentUser').innerHTML = '';
    document.getElementById('publicKeyMenuItem').innerHTML = '';
    document.getElementById('privateKeyMenuItem').innerHTML = '';
    document.getElementById('qr').innerHTML = '';
    document.getElementById('authorDiv').innerHTML = '';
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
    }
}