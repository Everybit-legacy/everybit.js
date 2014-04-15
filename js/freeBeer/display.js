/** @jsx React.DOM */
var PuffView = React.createClass({
  render: function() {
    // Apply BBCODE styling
    // TODO: Condition on contentType
    var bbcodeParse = XBBCODE.process({ text: this.props.payload.content });
    var parsedText  = bbcodeParse.html.replace(/\n/g, '<br />'); 
    var content     = parsedText;
    
    if(!this.props.viewFull) // TODO: pull this in to the template instead of living dangerously
      content = parsedText.substring(0, CONFIG.text_threshold)
              + '<a href="#" onclick="showPuff(puff, true); return false;">'
              + (parsedText.length > CONFIG.text_threshold ? ' •••' : '')
              + '</a>';
    
    return (
      <div className="block" id={this.props.sig}>
        <div className="author">{this.props.payload.username}</div>
        <div className="txt" dangerouslySetInnerHTML={{__html: content}}></div>
        <div className="bar">
          <span className="icon">
            <a href={'?pid=' + this.props.sig}>
              <img className="permalink" src="img/permalink.png" alt="permalink"  width="16" height="16"></img>
            </a>
            &nbsp;&nbsp;
            <img className="reply" data-value={this.props.sig} src="img/reply.png" width="16" height="16"></img>
          </span>
        </div>
      </div>
    );        
  }
});




// Creates the contents of a Puff (or block).
// puffTemplate = function(puff, isMain, viewFull) {
//   var author = puff.payload.username;
//   var content = puff.payload.content;
// 
//   // Apply BBCODE styling
//   // TODO: Condition on contentType
//   bbcodeParse = XBBCODE.process({
//     text: content
//   });
// 
//   var parsedText = bbcodeParse.html;
// 
//     // Replace newline chars with <br />
//     parsedText = parsedText.replace(/\n/g, '<br />');
// 
//   var id = puff.sig;
//   var dots = parsedText.length > CONFIG.text_threshold ? ' •••' : '';
// 
//   if(viewFull) {
//       var contentToShow = parsedText;
//   } else {
//       var contentToShow = parsedText.substring(0, CONFIG.text_threshold);
//       contentToShow += '<a href="#" onclick="showPuff(puff, true, true); return false;">';
//       contentToShow +=  dots;
//       contentToShow += '</a>';
//   }
// 
//   return $('<div class="block" id="' + id + '">\
//   <div class="author">' + author + '</div>\
//   <div class="txt">\
//   ' + contentToShow + '\
//   </div>\
//   <div class="bar">\
//   <span class="icon">\
//   <a href="?pid=' + id + '"><img class="permalink" src="img/permalink.png" alt="permalink"  width="16" height="16"></a>&nbsp;&nbsp;\
//   <img class="reply" data-value="' + id + '" src="img/reply.png" width="16" height="16">\
//   </span>\
//   </div>\
//   </div>');
// }


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




