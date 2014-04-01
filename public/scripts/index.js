(function($, window){
    window.threshold = 200;

    $(document).ready(function() {

        var block = function(author, content, id) {
            var dots = content.length > window.threshold ? ' ...' : '';

            return $('<div class="block" id="' + id + '">\
                <div class="author">' + author + ' says:</div>\
                <div class="txt">\
                ' + content.substring(0, window.threshold) + dots + '\
                </div>\
                <div class="bar">\
                    <span class="btn">\
                        <i class="fa fa-thumbs-up fa-2x"></i>\
                    </span>\
                    <span class="btn">\
                        <i class="fa fa-thumbs-down fa-2x"></i>\
                    </span>\
                    <span class="btn r">\
                        <i class="fa fa-mail-reply fa-2x"></i>\
                    </span>\
                    <span class="clear"></span>\
                </div>\
            </div>');
        };

        var hardcoded = parseInt(window.location.hash.substring(1)) || 9;

        var prt = data[hardcoded];

        $(".parent").append(block(prt.author, prt.content, "prt"));

        for (var i = 0, c = 0; i < data.length && c < 3; i++) {
            var e = data[i];

            if (e.ID != prt.ID && e.parents.indexOf(prt.ID) != -1) {
                $(".children").append(block(e.author, e.content, "child" + c));
                c++;
            }
        }

        $(".children .block").each(function () {
            var e0 = jsPlumb.addEndpoint("prt", {
                anchor: "BottomCenter",
                endpoint: "Blank"
            });

            var e = jsPlumb.addEndpoint($(this).attr("id"), {
                anchor: "TopCenter",
                endpoint: "Blank"
            });

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

        $(window).resize(function(){
            jsPlumb.repaintEverything();
        });
    });

})(jQuery, window)
