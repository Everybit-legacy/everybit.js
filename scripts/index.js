window.onload = function () {
    console.log('Hey');

    $(".children .block").each(function () {

        var e0 = jsPlumb.addEndpoint("p");

        var e = jsPlumb.addEndpoint($(this).attr("id"), {
            anchor: "TopCenter"
        });

        jsPlumb.connect({ 
            source: e0, 
            target: e
        });
    });
};

