FileFile = {}

FileFile.oldFile = null

FileFile.prepBlob = function(str, type) {
    if (typeof str != 'string')
        str = JSON.stringify(str)

    var blob

    if (type == 'file')
        blob = FileFile.dataURItoBlob(str)
    else
        blob = new Blob([str], {type: 'text/plain'})

    if (navigator.appVersion.toString().indexOf('.NET') > 0)            // IE needs to directly save the blob object
        return blob

    if(FileFile.oldFile)                                                // prevents old blobs from causing mem leaks
       window.URL.revokeObjectURL(FileFile.oldFile)

    FileFile.oldFile = window.URL.createObjectURL(blob)

    return FileFile.oldFile
}

FileFile.openPuffFile = function(element) {                
    return FileFile.handleFileOpen(element)
}

FileFile.openTextFile = function(element) {                
    return FileFile.handleFileOpen(element)
}

FileFile.openBinaryFile = function(element) {                
    return FileFile.handleFileOpen(element, 'asDataURI')
}

FileFile.handleFileOpen = function(element, asDataURI) {                
    return new Promise(function(resolve, reject) {
        var reader = new FileReader()

        reader.onload = function(event) {
            // console.log(reader)
            var dataURIContent = event.target.result
            // var blob = FileFile.dataURItoBlob(dataURIContent)
            resolve(dataURIContent)
        }
        
        if(!element.files[0]) // THINK: is false the right response?
            return reject('No file selected')
            
        if(asDataURI)
            reader.readAsDataURL(element.files[0])
        else
            reader.readAsText(element.files[0])
    })
}

FileFile.dataURItoBlob = function(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a Blob
    // via http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
    var byteString
    
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1])
    else
        byteString = unescape(dataURI.split(',')[1])

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length)
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }

    return new Blob([ia], {type:mimeString})
}
