/**
 * Comprehensive, canonical set of functions defining
 * and validating a puff.
 * All of these are STRICTLY FORMAL validations
 * they don't depend on the state of the puffball
 * Puff version: 0.
 */


PB.Spec = {}

PB.Spec.Puff = {};

/**
 * to validate the username
 * @param  {string} username
 */
PB.Spec.Puff.validateUsername = function(username) {

}

/**
 * to validate the payload key
 * @param  {string} key
 */
PB.Spec.Puff.validatePayloadKey = function(key) {
    // Characters

    // Length

}

/**
 * to validate the content length
 * @param  {string} content
 * @return {boolean}
 */
PB.Spec.Puff.validateContentLength = function(content) {
    if (content.length > 10e6)
        return false
}


/**
 * Meta function that runs all sub functions to validate a puff
 * @returns boolean true if valid puff, otherwise stops at first error
 * and returns false
 */
PB.Spec.Puff.validate = function(puff) {

}



/**
 * Set of canonical validations for everything related to puffs and users.
 *
 */



/**
 * check if it is a valid username
 * @param {string} username
 * @returns {boolean}
 */
PB.Spec.isValidUsername function(username) {
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
PB.Spec.isValidPublicKey function(publicKey) {
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
PB.Spec.isValidPrivateKey function(privateKey) {
    if(!isset(privateKey)) {
        return false;
    } else {
        return true;
    }
}

// TODO implement
PB.Spec.isValidPid function(pid) {
    // Validate puff id in terms of characters

}