/*
    Comprehensive, canonical set of functions defining and validating a puff.

    All of these are STRICTLY FORMAL validations: they don't depend on the state of the universe.

    Copyright 2014 EveryBit. See README for license information.

 */


PB.Spec = {}


/**
 * Validate the username
 * @param  {string} username
 */
PB.Spec.isValidUsername = function(username) {
    /*
    RULES:
    - Minimum length is 1
    - Maximum length of full username (including subusers and .) is 255 characters
    - Only alphanumeric
    - Only lowercase
    - Cannot begin or end with a .
     */

    PB.Spec.isValidUsername.rulesStatement = 'Usernames can only contain lowercase letters, numbers, and periods. They cannot ' +
        'be longer than 255 characters or end with a period.'

    if(!username)
        return false

    if(username.length > 255)
        return false

    if(!username.match(/^[a-z0-9.]+$/))
        return false

    if(username.slice(0, 1) == '.')
        return false

    if(username.slice(-1) == '.')
        return false

    return true
}


/**
 * Does everything possible to make a username valid
 */
PB.Spec.sanitizeUsername = function(username) {
    /*
     TRANSFORMATIONS:
     - Remove leading and trailing space
     - Convert to lowercase
     - Remove all illegal characters, including leading and trailing .
     */
    username = username.trim()

    username = username.toLowerCase()

    if(username.slice(0, 1) == '.')
        username = username.slice(1)

    if(username.slice(-1) == '.')
        username = username.slice(0,-1)

    username = username.replace(/[^a-z0-9.]+/g, '')

    return username
}


/**
 * check if it is a valid public key
 * @param {string} publicKey
 * @returns {boolean}
 */
PB.Spec.isValidPublicKey = function(publicKey) {
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
PB.Spec.isValidPrivateKey = function(privateKey) {
    if(!isset(privateKey)) {
        return false;
    } else {
        return true;
    }
}

/**
 * Check if this is a valid capa
 * @param capa
 * @returns {boolean}
 */
PB.Spec.isValidCapa = function(capa) {

    /*
     RULES:
     - Must be a natural number (1 or greater)
     */

    PB.Spec.isValidCapa.rulesStatement = 'Capa must be a natural number.';


    capa = capa.toString(); // Convert to string
    var n1 = Math.abs(n);
    var n2 = parseInt(n, 10);

    if(n2 < 1)
        return false

    return !isNaN(n1) && n2 === n1 && n1.toString() === n;
}