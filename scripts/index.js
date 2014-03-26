$(document).ready(function() {

    console.log("hey");

    $(".children .block").each(function () {
        var e0 = jsPlumb.addEndpoint("p", {
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
            connector: ["Straight"]
        });
    });

    $(window).resize(function(){
        jsPlumb.repaintEverything();
    });
});
