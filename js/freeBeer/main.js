// Bridge between visualization framework (plumb? angular? d3?) and js/forum files


///////// PuffForum Interface ////////////

// register our update function
var eatPuffs = function(puffs) {
  // call the display logic
  console.log(puffs)
  
  if(!Array.isArray(puffs) || !puffs.length)
    return false
  
  if(typeof stupidTempGlobalFlagDeleteMe == 'undefined')
    stupidTempGlobalFlagDeleteMe = false
  
  // is anything showing? no? ok, show something.
  if(!stupidTempGlobalFlagDeleteMe) {
    showPuff(puffs[0])   // show the first root
    stupidTempGlobalFlagDeleteMe = true
    return false
  }
  
  // ok. now that the stupid stuff is done, let's do something smart.
  // what's my main content item? is this new puff a child of it?
  
  var currentId = $('.blockMain').attr('id') // oh dear why would you do this use app data & react instead
  
  if(puffs.some(function(puff) {return !!~puff.payload.parents.indexOf(currentId)}))
    showPuff(PuffForum.getPuffById(currentId))
}

PuffForum.onNewPuffs(eatPuffs);

// initialize the forum module (and by extension the puffball network)
PuffForum.init();

////////// End PuffForum Interface ////////////



// Creates the contents of a Puff (or block).
puffTemplate = function(puff, isMain) {
  if(isMain) {
    var classToUse = 'blockMain';
  } else {
    var classToUse = 'block';
  }

  var author = puff.payload.username;
  var content = puff.payload.content;

  // Apply BBCODE styling
  // TODO: Condition on contentType
  bbcodeParse = XBBCODE.process({
    text: content
  });

  var parsedText = bbcodeParse.html;

  var id = puff.sig;
  var dots = parsedText.length > window.threshold ? ' ...' : '';

  return $('<div class="' + classToUse + '" id="' + id + '">\
  <div class="author">' + author + '</div>\
  <div class="txt">\
  ' + parsedText.substring(0, window.threshold) + dots + '\
  </div>\
  <div class="bar">\
  <span class="icon">\
  <img class="reply" data-value="' + id + '" src="img/reply.png" width="16" height="16"> \
  </span>\
  </div>\
  </div>');
}; 


// show a puff, its children, and some arrows
showPuff = function(puff) {
  $('#parents').empty();
  $('#main-content').empty();
  $('#children').empty();
  
  $("#main-content").append( puffTemplate(puff, true) );

  // Append parents to the DOM 
  var parentPuffs = PuffForum.getParents(puff);
  parentPuffs.forEach(function(puff) {
    $('#parents').append( puffTemplate(puff, false) )
  })

  // Append no more than 3 children to DOM.
  var childrenPuffs = PuffForum.getChildren(puff);

  childrenPuffs.forEach(function(puff) {
    $("#children").append( puffTemplate(puff, false) );
  });

  // Draw lines between Puff's using jsPlumb library.
  // Home page for jsPlumb:
  //      http://jsplumbtoolkit.com/demo/home/jquery.html
  //
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
}



// window.location.hash returns the anchor part of the browsers URL,
// including the #. Hence substring removes the #.
// Use the line below to allow the data to be selected in the browser addressbar
// i.e. /index.html#8 will select the 8th position in data_JSON_sample.
//      var hardcoded = parseInt(window.location.hash.substring(1));
// var hardcoded = 9;

window.threshold = 400;

document.addEventListener('DOMContentLoaded', function() {
  
  // add content form
  $(document).on('submit', "#otherContentForm", function( event ) {
    event.preventDefault()
    PuffForum.addPost( $("#content").val(), JSON.parse( $("#parentids").val() ));
    $('#otherForm').toggle();
  });

  // reply-to
  $(document).on('click', '.reply', function( event ) {
    event.preventDefault()
    var sig = event.target.dataset.value
    var parents = $('#parentids').val()
    if(!parents) return false
    
    var newParents = JSON.parse(parents)
    newParents.push(sig)
    
    $('#parentids').val(JSON.stringify(newParents))
    
    // TODO: draw arrows
    // TODO: undo if sig is already in parents array
  });

  // change root when text is clicked [TEMP]
  $(document).on('click', '.txt', function(ev) {
    var id   = ev.target.parentNode.id;
    var puff = PuffForum.getPuffById(id);
    showPuff(puff)
  });

  // When browser window is resized, refresh jsPlumb connecting lines.
  $(window).resize(function(){
    jsPlumb.repaintEverything();
  });

  // Pull down menu show and hide div
  $('#puffballIcon').click(function(){
    $('#menu').toggle();
  });

});

/*
// Looking for double click to add content
jQuery(document).ready(function(){

  jQuery(document).dblclick(function(event){
    // TODO: Toggle show div on double click


  });

});
*/
