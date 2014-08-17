function getImageCode(sig) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = 18;
    canvas.height = 18;

    var ctx = canvas.getContext("2d");

    var blockSize = 6;
    var blocks = canvas.width / blockSize;

    // TODO: Do this as often as needed
    var h1 = Bitcoin.Crypto.MD5(sig);
    var h2 = Bitcoin.Crypto.MD5(sig+h1);
    hashed = h1 + h2;

    var parts = hashed.match(/.{1,2}/g);

    colors = [];

    dec = parts.map( function(item) { return parseInt(item, 16); } );

    for (var i = 0; i < blocks; i++) {
        for(var j = 0; j < blocks; j++) {

            ctx.fillRect((i*blockSize),(j*blockSize),blockSize,blockSize);
            ctx.fillStyle=ctx.fillStyle = 'rgba('+dec.pop()+ ', '+dec.pop()+ ','+dec.pop()+ ',.7)';

            // $r = array_pop($colors);
            //$g = array_pop($colors);
            //$b = array_pop($colors);

        }
    }

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpg" will re-encode the image.
    // return canvas.toDataURL('image/jpeg') // defaults to png, which 4x the size for flickr images

    return canvas.toDataURL("image/png");
    // var dataURL = canvas.toDataURL("image/png");
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
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