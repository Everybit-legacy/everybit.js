/*

    Comprehensive (in progress!), canonical set of functions defining and validating a puff.

    All of these are STRICTLY FORMAL validations: they don't depend on the state of the universe.

    Copyright 2014-2015 EveryBit. See README for license information.

 */


EB.Spec = {}


/**
 * Validate the username
 * @param  {string} username
 */
EB.Spec.isValidUsername = function(username) {
    /*
    RULES:
    - Minimum length is 1
    - Maximum length of full username (including subusers and .) is 255 characters
    - Only alphanumeric
    - Only lowercase
    - Cannot begin or end with a .
     */

    EB.Spec.isValidUsername.rulesStatement = 'Usernames can only contain lowercase letters, numbers, and periods. They cannot ' +
        'be longer than 255 characters, or begin or end with a period.'

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
 * Note: This may have unintended consequences for the user
 */
EB.Spec.sanitizeUsername = function(username) {
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
EB.Spec.isValidPublicKey = function(publicKey) {
    // TODO: do "checksum" validation

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
EB.Spec.isValidPrivateKey = function(privateKey) {
    // TODO: Validate by testing if can be converted to public key

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
EB.Spec.isValidCapa = function(capa) {

    /*
     RULES:
     - Must be a natural number (1 or greater)
     */

    EB.Spec.isValidCapa.rulesStatement = 'capa must be a natural number.';


    capa = capa.toString(); // Convert to string
    var n1 = Math.abs(n);
    var n2 = parseInt(n, 10);

    if(n2 < 1)
        return false

    return !isNaN(n1) && n2 === n1 && n1.toString() === n;
}



/**
 * check if a username is valid
 *     a username must be shorter than 256 characters, all lowercase and contains only alphanumeric and . sign
 * @param  {string} username the string to be check
 * @return {boolean}          return true if  the parameter string is a valid username, otherwise throw error
 */
EB.Spec.validateUsername = function(username) {
    if(!username) 
        return EB.onError('Username is required', username)

    if(username.length > 256) 
        return EB.onError('Usernames must be shorter than 256 characters', username)

    if(username != username.toLowerCase()) 
        return EB.onError('Usernames must be lowercase', username)
    
    if(!/^[0-9a-z.]+$/.test(username))
        return EB.onError('Usernames must be alphanumeric', username)
    
    return true
}


/**
 * determine if it is a good shell, checks for the existence of required fields
 * @param {Shell[]}
 * @returns {boolean}
 */
EB.Spec.isValidShell = function(shell) {
    //// this just checks for the existence of required fields
    if(!shell.sig) return false
    if(!shell.routes) return false
    if(!shell.username) return false
    if(typeof shell.payload != 'object') return false
    if(!shell.payload.type) return false
        
    return true
}

/**
 * to verify a puff
 * @param  {object} puff
 * @return {(string|boolean)}
 */
EB.Spec.isGoodPuff = function(puff) {
    // CURRENTLY UNUSED
    // TODO: check previous sig, maybe
    // TODO: check for well-formed-ness
    // TODO: use this to verify incoming puffs
    // TODO: if prom doesn't match, try again with getUserRecordNoCache
    
    // TODO: rewrite this function to give a consistent return value
    
    if (!EB.Data.contentTypes[shell.payload.type]) {
        // TODO: this needs to include 'encryptedpuff' as a valid type
        Events.pub('track/unsupported-content-type', {type: shell.payload.type, sig: shell.sig})
        return false
    }
    
    var prom = EB.Users.getUserRecordPromise(puff.username) // NOTE: versionedUsername
    
    return prom.then(function(user) {
        return EB.Crypto.verifyPuffSig(puff, user.defaultKey)
    })
}
