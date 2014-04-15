// Bridge between visualization framework (plumb? angular? d3?) and js/forum files

///////// PuffForum Interface ////////////

// Register our update function
var eatPuffs = function(puffs) {
  // call the display logic
  console.log(puffs);
  
  if(!Array.isArray(puffs) || !puffs.length) {
      return false;
  }

    // Not yet implemented
  // updateMinimap();
  
  if(typeof stupidTempGlobalFlagDeleteMe == 'undefined') {
      stupidTempGlobalFlagDeleteMe = false;
  }

    // Do they want to go to a specific puff?
    var pid = gup('pid');
    console.log(pid);
    // Why is there / at end? remove it.

    pid = pid.replace('/','');
    if(pid.length > 0) {
        var gotoPuff = pid;
    } else {
        var gotoPuff = CONFIG.defaultPuff;
    }


    // is anything showing? no? ok, show something.
  if(!stupidTempGlobalFlagDeleteMe) {
    showPuff(PuffForum.getPuffById(gotoPuff));   // show the first root
    stupidTempGlobalFlagDeleteMe = true;
    return false;
  }
  
  // ok. now that the stupid stuff is done, let's do something smart.
  // what's my main content item? is this new puff a child of it?
  // oh dear why would you do this use app data & react instead
  var currentId = $('#main-content .block').attr('id');
  
  if(puffs.some(function(puff) {return !!~puff.payload.parents.indexOf(currentId)}));

    showPuff(PuffForum.getPuffById(currentId));
}

PuffForum.onNewPuffs(eatPuffs);

// initialize the forum module (and by extension the puffball network)
PuffForum.init();

////////// End PuffForum Interface ////////////



/////// minimap ////////

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // Puff.Data.puffs.forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PuffForum.getPuffById(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }


////// end minimap /////



// Creates the contents of a Puff (or block).
puffTemplate = function(puff, isMain, viewFull) {
  var author = puff.payload.username;
  var content = puff.payload.content;

  // Apply BBCODE styling
  // TODO: Condition on contentType
  bbcodeParse = XBBCODE.process({
    text: content
  });

  var parsedText = bbcodeParse.html;

    // Replace newline chars with <br />
    parsedText = parsedText.replace(/\n/g, '<br />');

  var id = puff.sig;
  var dots = parsedText.length > CONFIG.text_threshold ? ' •••' : '';

  if(viewFull) {
      var contentToShow = parsedText;
  } else {
      var contentToShow = parsedText.substring(0, CONFIG.text_threshold);
      contentToShow += '<a href="#" onclick="showPuff(puff, true, true); return false;">';
      contentToShow +=  dots;
      contentToShow += '</a>';
  }
    var localTime = new Date(puff.payload.time).toLocaleString();

  return $('<div class="block" id="' + id + '">\
  <div class="author">' + author + '</div>\
  <div class="txt">\
  ' + contentToShow + '\
  </div>\
  <div class="bar">\
  <span class="icon">\
  <img class="infoIcon" src="img/info.gif" width="16" height="16" \
  alt="' + localTime + '" title="' + localTime + '"></a>&nbsp;&nbsp;\
  <a href="?pid=' + id + '"><img class="permalink" src="img/permalink.png" alt="permalink"  width="16" height="16"></a>&nbsp;&nbsp;\
  <img class="reply" data-value="' + id + '" src="img/reply.png" width="16" height="16">\
  </span>\
  </div>\
  </div>');
}; 



// /** @jsx React.DOM */
// var Puff = React.createClass({
//   render: function() {
//     var createItem = function(itemText) {
//       return <li>{itemText}</li>;
//     };
//     return <ul>{this.props.items.map(createItem)}</ul>;
//   }
// });
// 

document.addEventListener('DOMContentLoaded', function() {
  
  // add content form
  
  $(document).on('submit', "#otherContentForm", function( event ) {
    event.preventDefault();

    // PuffForum.addPost( $("#content").val(), JSON.parse( $("#parentids").val() ));
    // $('#otherForm').toggle();



    content = $("#content").val();
    $("#content").val("");//clean form after

    PuffForum.addPost( content, JSON.parse( $("#parentids").val() ));
      $("#parentids").val('[]');
  });

  // reply-to
  $(document).on('click', '#cancel-form', function( event ) {
    $('#otherForm').hide();
    $('#content').val("");
  });

  $(document).on('click', '.reply', function( event ) {
    event.preventDefault();
    $("#otherForm").show();
    $("#otherForm [name='content']").focus();

    var sig = event.target.dataset.value;
    var parents = $('#parentids').val();
    if(!parents) return false;
    
    var newParents = JSON.parse(parents);

    if($.inArray(sig, newParents) !== -1) {
      var index = newParents.indexOf(sig);
      newParents.splice(index, 1);

      // TODO: Set class of reply arrow to Black. Will need to use transparent gif or trap click in front and background css image change

    } else {
      newParents.push(sig);

      $('#parentids').val(JSON.stringify(newParents));

      // TODO: Set class of reply arrow to red
    }

    
    // TODO: draw arrows
    // TODO: undo if sig is already in parents array
  });

  // change root when text is clicked [TEMP]
  $(document).on('click', '.txt', function(ev) {
    var id   = $(ev.target).parents('.block').attr('id')
    if(!id) return false
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

// find $_GET var in url
// http://stackoverflow.com/questions/8460265/
function gup (name) {
    name = RegExp ('[?&]' + name.replace (/([[\]])/, '\\$1') + '=([^&#]*)');
    return (window.location.href.match (name) || ['', ''])[1];
}

/*
jQuery(document).ready(function(){

  jQuery(document).click(function(e){
          var obj = (e.target ? e.target : e.srcElement);
          if (obj.tagName != 'BODY') return true;
          alert("BODY!");
          return false;
      });

});
*/

// set state to current puff
function setBrowserHistoryPuffStateToSomething(puff) {
  var state = { 'puff': puff.sig };
  history.pushState(state, '', '#puff=' + puff.sig);
}

// onload, store the puff id we're looking for
function storePuffIdToSomePlaceOnLoad() {
  someSillyGlobalPuffId = window.location.hash.substring(1);
}


// window.location.hash returns the anchor part of the browsers URL,
// including the #. Hence substring removes the #.
// Use the line below to allow the data to be selected in the browser addressbar
// i.e. /index.html#8 will select the 8th position in data_JSON_sample.
//      var hardcoded = parseInt(window.location.hash.substring(1));
// var hardcoded = 9;
