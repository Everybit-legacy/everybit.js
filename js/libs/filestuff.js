PBFiles = {}

PBFiles.oldFile = null

PBFiles.createPuff = function(content, type) {
    var payload = {}
    payload.time = Date.now()
    
    var type   = type || 'file'
    var routes = ['local'];

    var userRecord = PB.getCurrentUserRecord()
    var userRecordsForWhomToEncrypt = [userRecord]
    var previous, puff

    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {    
        var privateEnvelopeOutfit
        puff = PB.buildPuff(currentUsername, privateDefaultKey, routes, type, content, payload, previous, userRecordsForWhomToEncrypt, privateEnvelopeOutfit)
    })

    return puff
}

PBFiles.prepBlob = function(str, type) {
    if(typeof str != 'string')
        str = JSON.stringify(str)
    
    var blob
    
    if(type == 'file')
        blob = PBFiles.dataURItoBlob(str)
    else
        blob = new Blob([str], {type: 'text/plain'})
    
    if(PBFiles.oldFile)
      window.URL.revokeObjectURL(PBFiles.oldFile)

    PBFiles.oldFile = window.URL.createObjectURL(blob)

    return PBFiles.oldFile
}

PBFiles.extractLetterPuff = function(content) {
    var puff = PB.parseJSON(content)
    if(!puff) 
        return PB.onError('Envelope was not JSON encoded')
    
    if(!puff.keys) 
        return PB.onError('Envelope does not contain an encrypted letter')
    
    var userRecord  = PB.getCurrentUserRecord()
    var pubkey = userRecord.defaultKey
    
    var letter
    
    PB.useSecureInfo(function(identities, currentUsername, privateRootKey, privateAdminKey, privateDefaultKey) {    
        letter = PB.decryptPuff(puff, pubkey, currentUsername, privateDefaultKey)
    })
    
    return letter
}

PBFiles.openPuffFile = function(element) {                
    return PBFiles.handleFileOpen(element)
}

PBFiles.openTextFile = function(element) {                
    return PBFiles.handleFileOpen(element)
}

PBFiles.openBinaryFile = function(element) {                
    return PBFiles.handleFileOpen(element, 'asDataURI')
}

PBFiles.handleFileOpen = function(element, asDataURI) {                
    return new Promise(function(resolve, reject) {
        var reader = new FileReader()

        reader.onload = function(event) {
            console.log(reader)
            var dataURIContent = event.target.result
            // var blob = PBFiles.dataURItoBlob(dataURIContent)
            resolve(dataURIContent)
        }

        if(asDataURI)
            reader.readAsDataURL(element.files[0])
        else
            reader.readAsText(element.files[0])
    })
}

// via http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
PBFiles.dataURItoBlob = function(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a Blob
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}
