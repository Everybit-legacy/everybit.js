window.onload = function () {
    console.log('Hey');
    var e0 = jsPlumb.addEndpoint("b1");
    var e1 = jsPlumb.addEndpoint("b2");

    jsPlumb.connect({ 
        source:e0, 
        target:e1, 
        anchor: "Top"
    });
};

