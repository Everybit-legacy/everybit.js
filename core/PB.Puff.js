/*
    Puffs are the lifeblood of EveryBit. This file contains relatively pure functions for working with them.
*/

PB.Puff = {}

PB.Puff.createPrivate = function(content, type) {
    var payload = {}
    
    var type   = type || 'file'
    var routes = ['local']

    var userRecord = PB.getCurrentUserRecord()
    var userRecordsForWhomToEncrypt = [userRecord]
    var previous, puff
    
    puff = PB.Puff.simpleBuild(type, content, payload, routes, userRecordsForWhomToEncrypt)
    
    return puff
}


PB.Puff.simpleBuild = function(type, content, payload, routes, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    //// build a puff for the 'current user', as determined by the key manager (by default PB.M.Wardrobe)
    var puff 

    payload = PB.runHandlers('payloadModifier', payload)

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {
        // THINK: should we confirm that our local capa matches the DHT's latest capa for the current user here? it turns the output into a promise...
        var previous = false // TODO: get the sig of this user's latest puff
        var versionedUsername = PB.getCurrentVersionedUsername()
        
        puff = PB.Puff.build(versionedUsername, privateDefaultKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    })
    
    return puff
}


/**
 * build a new puff object based on the parameters  
 * does not hit the network, hence does no real verification whatsoever
 * @param  {string} username                    user who sign the puff
 * @param  {string} privateKey                  private default key for the user
 * @param  {string} routes                      routes of the puff
 * @param  {string} type                        type of the puff
 * @param  {string} content                     content of the puff
 * @param  {object} payload                     other payload information for the puff
 * @param  {string} previous                    most recently published content by the user
 * @param  {object} userRecordsForWhomToEncrypt
 * @param  {object} privateEnvelopeAlias
 * @return {object}                             the new puff object
 */
PB.Puff.build = function(versionedUsername, privateKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeAlias) {
    var puff = PB.Data.packagePuffStructure(versionedUsername, routes, type, content, payload, previous)

    puff.sig = PB.Crypto.signPuff(puff, privateKey)
    
    if(userRecordsForWhomToEncrypt) {
        puff = PB.Data.encryptPuff(puff, privateKey, userRecordsForWhomToEncrypt, privateEnvelopeAlias)
    }
    
    return puff
}



