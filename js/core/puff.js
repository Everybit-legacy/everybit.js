/**
 * Comprehensive, canonical set of functions defining
 * and validating a puff.
 * All of these are STRICTLY FORMAL validations
 * they don't depend on the state of the puffball
 * Puff version: 0.
 */


Puff = {};

Puff.validateUsername = function(username) {

}

Puff.validatePayloadKey = function(key) {
    // Characters

    // Length


}

Puff.validateContentLength = function(content) {
    if (content.length > 10e6)
        return false
}


/**
 * Meta function that runs all sub functions to validate a puff
 * @returns boolean true if valid puff, otherwise stops at first error
 * and returns false
 */
Puff.validate = function(puff) {

}