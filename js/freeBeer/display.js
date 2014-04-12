/**
 * Functions related to rendering different configurations of puffs
 */
function viewLatestConversations() {
    var puffs = PuffForum.getRootPuffs();

    // Sorting function based on payload time
    puffs.sort(function(a, b) {return b.payload.time - a.payload.time});

    $('#parents').empty();
    $('#main-content').empty();
    $('#children').empty();

    puffs.slice(0, CONFIG.maxLatestRootsToShow).forEach(function(puff) {
        $("#children").append( puffTemplate(puff, false) );
    });
}

// show a puff, its children, and some arrows
showPuff = function(puff, viewFull) {
    if(typeof viewFull !== 'undefined' && viewFull) {
        viewFull = false;
    } else {
        viewFull = true;
    }

    $('#parents').empty();
    $('#main-content').empty();
    $('#children').empty();

    $("#main-content").append( puffTemplate(puff, true, viewFull) );

    // Append parents to the DOM
    var parentPuffs = PuffForum.getParents(puff);
    parentPuffs.forEach(function(puff) {
        $('#parents').append( puffTemplate(puff, false) )
    });

    // Append no more than 3 children to DOM.
    // Use CONFIG.maxChildrenToShow
    var childrenPuffs = PuffForum.getChildren(puff);

    childrenPuffs.sort(function(a, b) {
        return b.payload.time - a.payload.time
    });

    childrenPuffs.slice(0, CONFIG.maxChildrenToShow).forEach(function(puff) {
        $("#children").append( puffTemplate(puff, false) );
    });

    // Draw lines between Puff's using jsPlumb library.
    // Does this for each child Puff and the block of HTML that makes up the Puff.
    $("#children .block").each(function () {

        // Define jsPlumb end points.
        var e0 = jsPlumb.addEndpoint(puff.sig, {
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
                lineWidth: 2,
                strokeStyle: "#d1d1d1"
            },
            connector: "Straight",
            endpoint: "Blank",
            overlays:[ ["Arrow", {location:-20, width:20, length:20} ]]
        });
    });

    $("#parents .block").each(function () {

        // Define jsPlumb end points.
        var e0 = jsPlumb.addEndpoint(puff.sig, {
            anchor: "TopCenter",
            endpoint: "Blank"
        });

        var e = jsPlumb.addEndpoint($(this).attr("id"), {
            anchor: "BottomCenter",
            endpoint: "Blank"
        });

        // Draw lines between end points.
        jsPlumb.connect({
            source: e,
            target: e0,
            paintStyle: {
                lineWidth: 2,
                strokeStyle: "#d1d1d1"
            },
            connector: "Straight",
            endpoint: "Blank",
            overlays:[ ["Arrow", {location:-20, width:20, length:20} ]]
        });
    });
}
