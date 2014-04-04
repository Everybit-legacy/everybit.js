//
// index.js
//

// .threshold is NOT a standard DOM property. This adds the property to the DOM.
// Sets the MAXIMUM characters shown in a post.
window.threshold = 200;

$(document).ready(function() {

    // Creates the contents of a Puff (or block).
    var blockContents = function(author, content, id) {
        var dots = content.length > window.threshold ? ' ...' : '';

        return $('<div class="block" id="' + id + '">\
            <div class="author">' + author + ' says:</div>\
            <div class="txt">\
            ' + content.substring(0, window.threshold) + dots + '\
            </div>\
            <div class="bar">\
                <span class="btn">\
                    <i class="fa fa-thumbs-up fa-1x"></i>\
                </span>\
                <span class="btn">\
                    <i class="fa fa-thumbs-down fa-1x"></i>\
                </span>\
                <span class="btn">\
                    <i class="fa fa-tags fa-1x"></i>\
                </span>\
                <span class="btn float-right">\
                    <i class="fa fa-cloud-download fa-1x"></i>\
                </span>\
                <span class="btn float-right">\
                    <i class="fa fa-mail-reply fa-1x"></i>\
                </span>\
                <span class="clear"></span>\
            </div>\
        </div>');
    };

    // window.location.hash returns the anchor part of the browsers URL, 
    // including the #. Hence substring removes the #.
    // Use the line below to allow the data to be selected in the browser addressbar
    // i.e. /index.html#8 will select the 8th position in data_JSON_sample. 
    //      var hardcoded = parseInt(window.location.hash.substring(1));
    var hardcoded = 9;

    // data_JSON_sample[] is hardcoded sample JSON in file: sample.js
    // This will all be replaced by the Puffball API once it's released.
    var parentPuff = data_JSON_sample[hardcoded]; 

    $(".parent").append( blockContents(parentPuff.author, parentPuff.content, "parent-puff") );

    // Append no more than 3 children to DOM.
    for (var i = 0, c = 0; i < data_JSON_sample.length && c < 3; i++) {
        var e = data_JSON_sample[i];

        if (e.ID != parentPuff.ID && e.parents.indexOf(parentPuff.ID) != -1) {
            $(".children").append( blockContents(e.author, e.content, "child" + c) );
            c++;
        }
    }

    // Draw lines between Puff's using jsPlumb library.
    // Home page for jsPlumb: 
    //      http://jsplumbtoolkit.com/demo/home/jquery.html
    //
    // Does this for each child Puff and the block of HTML that makes up the Puff.
    $(".children .block").each(function () {

        // Define jsPlumb end points.
        var e0 = jsPlumb.addEndpoint("parent-puff", {
            anchor: "BottomCenter",
            endpoint: "Blank"
        });

        var e = jsPlumb.addEndpoint($(this).attr("id"), {
            anchor: "TopCenter",
            endpoint: "Blank"
        });

        // Draw lines between end points.
        jsPlumb.connect({
            source: e0,
            target: e,
            paintStyle: {
                lineWidth: 3,
                strokeStyle: "#999"
            },
            connector: "StateMachine",
            endpoint: "Blank",
            overlays:[ ["PlainArrow", {location:100, width:20, length:10} ]]
        });
    });

    // When browser window is resized, refresh jsPlumb connecting lines.
    $(window).resize(function(){
        jsPlumb.repaintEverything();
    });
});
