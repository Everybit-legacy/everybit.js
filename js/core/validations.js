/**
 * Set of canonical validations for everything related to puffs and users.
 *
 */


/**
 * check if it is a valid username
 * @param {string} username
 * @returns {boolean}
 */
function isValidUsername(username) {
    if (!username.match(/^[A-Za-z0-9]+$/)) {
        return false;
    } else {
        return true;
    }
}

/**
 * check if it is a valid public key
 * @param {string} publicKey
 * @returns {boolean}
 */
function isValidPublicKey(publicKey) {
    if(!isset(publicKey)) {
        return false;
    } else {
        return true;
    }

}

/**
 * check if it is a valid private key
 * @param {string} privateKey
 * @returns {boolean}
 */
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