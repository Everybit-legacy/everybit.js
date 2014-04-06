// 
// zoom.js
//

// See jQuery UI docs here:
//    http://api.jqueryui.com/slider/
//
$(function() {

    //
    //  Slider for Puff/Block Detail level.
    //
    $( "#slider-puff-detail" ).slider({
      range: "min",
      value: 50,
      min: 1,
      max: 100,
      slide: function( event, ui ) {
        // TODO: Put code here to update details, or trigger an action.
      }
    });


    //
    //  Slider for Puff/Block text font zoom.
    //
    $( "#slider-puff-text-zoom" ).slider({
      range: "min",
      value: 18,
      min: 10,
      max: 48,
      slide: function( event, ui ) {
        // Updated text field with font size. 
        // TODO: this isn't on the main spec here http://extrazoom.com/image-10847.html, delete or keep?
        $( "#text-zoom" ).val( ui.value );

        // When slider is changed updated font-size in main Puff block text.
        $(".block").css( { "font-size": ui.value } );

        jsPlumb.repaintEverything();
      }
    });

    // TODO: This just updates the text input field, 
    // can get rid of it if we aren't keeping this part of the GUI, see TODO above.
    // It may be usefull for debugging until the GUI is more finalized.
    $( "#text-zoom" ).val( $( "#slider-puff-text-zoom" ).slider( "value" ) );


    //
    //  Slider for Puff/Block Branching level.
    //
    $( "#slider-puff-branching-level" ).slider({
      range: "min",
      value: 50,
      min: 1,
      max: 100,
      slide: function( event, ui ) {
        // TODO: Put code here to update details, or trigger an action.
        $( "#puff-branching-level" ).val( ui.value );
      }
    });    

    $( "#puff-branching-level" ).val( $( "#slider-puff-branching-level" ).slider( "value" ) );
});

// End zoom.js