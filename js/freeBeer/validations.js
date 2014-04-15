function isValidUsername(username) {
    if (!username.match(/^[A-Za-z0-9]+$/)) {
        return false;
    } else {

        return true;
    }
}

function isValidPublicKey(publicKey) {
    if(!isset(publicKey)) {
        return false;
    } else {
        return true;
    }

}

function isValidPrivateKey(privateKey) {
    if(!isset(privateKey)) {
        return false;
    } else {
        return true;
    }
}

// TODO implement
function isValidPid(pid) {
    // Validate puff id in terms of characters

}