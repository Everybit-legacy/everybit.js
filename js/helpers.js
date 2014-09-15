// TODO: Rename into PB. namespace
function keepNumberBetween(x,a,b) {
    if(x < a)
        return a
    if(x > b)
        return b

    return x
}

// From brainwallet
function passphraseToPrivateKeyWif(passphrase) {
    var hashStr = Bitcoin.Crypto.SHA256(passphrase).toString();
    // hash = Bitcoin.Crypto.util.bytesToHex(hash);
    // var hash_str = pad(hash, 64, '0');
    hash = Bitcoin.convert.hexToBytes(hashStr);

    return Bitcoin.ECKey(hash).toWif()
}

function pad(str, len, ch) {
    padding = '';
    for (var i = 0; i < len - str.length; i++) {
        padding += ch;
    }
    return padding + str;
}


function getImageCode(sig) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = 18;
    canvas.height = 18;

    var ctx = canvas.getContext("2d");

    var blockSize = 6;
    var blocks = canvas.width / blockSize;

    colors = [
        'rgba(139, 136, 255, .99)',
        'rgba(255, 156, 0 , .99)',
        'rgba(123, 179, 26, .99)',
        'rgba(238, 219, 0, .99)',
        'rgba(204, 51, 51, .99)',
        'rgba(255, 255, 255, .99)',
        'rgba(255, 255, 255, .99)'
    ]

    /*
    // TODO: Do this as often as needed
    var h1 = Bitcoin.Crypto.MD5(sig);
    var h2 = Bitcoin.Crypto.MD5(sig+h1);
    hashed = h2 + h1;

    var parts = hashed.match(/.{1,2}/g);

    // Change into blocks of 6, find closest, then split apart.
    */




    // dec = parts.map( function(item) { return parseInt(item, 16); } );


    for (var i = 0; i < blocks; i++) {
        for(var j = 0; j < blocks; j++) {
            seed = Math.pow(2,i)+Math.pow(3,j);
            var fillIndex = murmurhash3_32_gc(sig, seed)% colors.length
            var fillRgba = colors[fillIndex];

            ctx.fillStyle = fillRgba;

            ctx.fillRect((i*blockSize),(j*blockSize),blockSize,blockSize);

            /*
            // Line overlay
            if(i) {
                ctx.lineWidth = 0.5;
                ctx.strokeStyle="#0000FF";
                ctx.beginPath();
                ctx.moveTo(i*blockSize, 0);
                ctx.lineTo(i*blockSize, canvas.height);
                ctx.stroke();
            }

            if(j) {
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, j*blockSize);
                ctx.lineTo(canvas.width, j*blockSize);
                ctx.stroke();
            }
            */




            // $r = array_pop($colors);
            //$g = array_pop($colors);
            //$b = array_pop($colors);

        }
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle="#000000";
    ctx.strokeRect(0,0,canvas.width,canvas.height);


    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    // return canvas.toDataURL('image/jpeg') // defaults to png, which 4x the size for flickr images

    return canvas.toDataURL("image/png");
    // var dataURL = canvas.toDataURL("image/png");
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

/**
 *
 * @param sig {string}
 * Return an rgba color to use
 */
function getBGcolor(sig) {
    // Get the ascii character numbers of all sigs
    var len = sig.length;
    var total = 0;
    for(var i=0; i<len; i++) {
        total += sig.charCodeAt(i);
    }

    var numbs = [255-(total % 9), 255-(total % 10),255-(total % 11) ]

    return 'rgba(' + numbs[0] + ',' + numbs[1] + ',' + numbs[2] + ',.9)';
}

Date.prototype.yyyymmdd = function() {

    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();

    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};

Date.prototype.ymdhis = function() {

    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    var hh = this.getHours().toString();
    var mn = this.getMinutes().toString();
    var ss = this.getSeconds().toString();

    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + hh+':'+mn+':'+ss;
};


/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

/* Function to construct a random passphrase from an array of words*/
var generatePassphrase = function(dict,numWords) {
    var passphrase = "";
    for(var i=0; i < numWords; i++) {
        var randWordNumber = Math.floor((Math.random() * dict.length));
        var randWord = dict[randWordNumber];

        if (i == 0) {
            passphrase +=randWord;
        } else {
            passphrase = passphrase + " " + randWord;
        }
    }
    return passphrase;
}

// Is the object empty?
// From http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

function generateRandomAnimal() {
    // Get animals
    var animalCSS = document.styleSheets[5].rules
    var animals = []
    var j = 0
    // Create blank array, if this item matches .icon- soething, then push into array with "icon-" stipped off
    for(var i=0; i<animalCSS.length; i++) {
        var selector = document.styleSheets[5].rules[i].selectorText

        if(typeof selector != 'undefined') {

            splitResult = selector.replace("::","-").split("-")

            if( splitResult[0] == '.icon') {
                animals[j] = splitResult[1]
                j++
            }
        }
    }


    var animal = animals[Math.floor(Math.random() * animals.length)]

    return animal

}
