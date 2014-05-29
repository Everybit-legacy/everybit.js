// load all the functions into the console, then run these three lines pausing between to let stuff happen

pics.forEach(loadem(document.getElementsByTagName('body')[0]))
sigs = []; images = document.querySelectorAll('body > div > img'); ppuffs = getPseudoPuffs(pics, images)
rec(ppuffs)


function rec(ppuffs) {
    ppuff = ppuffs.shift()
    
    prom = PuffForum.addPost( 'image', ppuff[0], choose(sigs, 5), ppuff[1] )
    prom.then(function(puff) {
        sigs.push(puff.sig)
        rec(ppuffs)
    })
}

function choose(arr, num) {
    var output = []
    for (var i = 0; i < num; i++)
        output.push(arrayRandom(arr))
    return output.filter(Boolean).filter(function(item, index, array) {return array.indexOf(item) == index}) 
}

function arrayRandom(arr) {
    return arr[~~(Math.random()*arr.length)]
}

function getPseudoPuffs(pics, images) {
    return pics.map(function(pic, index) {
        return [ getBase64Image(images[index])
               , { license: get_license(pic.license)
                 , tags: pic.tags.split(' ')
                 , photographer: pic.ownername
                 , url: pic.url_z
                 }
               ]
})}

function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
return canvas.toDataURL('image/jpeg') // defaults to png, which 4x the size for flickr images
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function get_license(index) {
    return [ "Attribution-NonCommercial-ShareAlike License"
           , "Attribution-NonCommercial License"
           , "Attribution-NonCommercial-NoDerivs License"
           , "Attribution License"
           , "Attribution-ShareAlike License"
           , "Attribution-NoDerivs License"
           ]
           [index-1]
}

function loadem(body) {
    return function(photo) {
        div = document.createElement('div')
        if(!photo.url_z) {
            console.log(photo); return;
        }
        body.appendChild(div).innerHTML = '<img crossOrigin src="http://sherpa.local:8080/' + photo.url_z.split('/').slice(2).join('/') + '">'
    }
}

