/** @jsx React.DOM */
var PuffWorld = React.createClass({
    // getInitialState: function() {
    getDefaultProps: function() {
        var defaultPuff = CONFIG.defaultPuff
                        ? PuffForum.getPuffById(CONFIG.defaultPuff)
                        : Puff.Data.puffs[0]
        
        return { style: 'PuffTree'
               ,  puff: defaultPuff
               }
    },
    render: function() {
        // use this to control the state of the master viewport,
        // and always call it instead of calling PuffRoots and PuffTree directly.
        
        var comp
        if( this.props.style == 'PuffTree')
            comp = <PuffTree puff={this.props.puff} />
        else
            comp = <PuffRoots />
            
        return comp
    }
});

var createPuffBox = function(puff) {
    return <PuffBox puff={puff} key={puff.sig} />
}

var PuffRoots = React.createClass({
    render: function() {
        var puffs = PuffForum.getRootPuffs();

        puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        puffs = puffs.slice(0, CONFIG.maxLatestRootsToShow);                      // don't show them all

        return <section id="children">{puffs.map(createPuffBox)}</section>
    }
});

var PuffTree = React.createClass({
    render: function() {
        
        var puff = this.props.puff;
        var parentPuffs = PuffForum.getParents(puff);
        var childrenPuffs = PuffForum.getChildren(puff);
        
        childrenPuffs.sort(function(a, b) {return b.payload.time - a.payload.time});
        childrenPuffs = childrenPuffs.slice(0, CONFIG.maxChildrenToShow);
        
        return (
            <div>
                <section id="parents">{parentPuffs.map(createPuffBox)}</section>
                <section id="main-content"><PuffBox puff={puff} /></section>
                <section id="children">{childrenPuffs.map(createPuffBox)}</section>
            </div>
        );
    },
    
    componentDidMount: function() {
        this.doSillyJsPlumbStuff()
    },
    
    componentDidUpdate: function() {
        this.doSillyJsPlumbStuff()
    },
    
    doSillyJsPlumbStuff: function() {
        jsPlumb.Defaults.Container = $('#plumbing') // THINK: this is the wrong place for this
        $('#plumbing').empty()
        
        var puff = this.props.puff
        
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
});

var PuffBox = React.createClass({
    render: function() {
        var puff = this.props.puff
        return (
            <div className="block" id={puff.sig} key={puff.sig}>
                <PuffAuthor username={puff.payload.username} />
                <PuffContent puff={puff} />
                <PuffBar puff={puff} />
            </div>
        );
    }
});

var PuffAuthor = React.createClass({
    render: function() {
        return (
            <div className="author">{this.props.username}</div>
        );
    }
});

var PuffContent = React.createClass({
    handleClick: function() {
        var sig  = this.props.puff.sig
        var puff = PuffForum.getPuffById(sig);
        showPuff(puff)
    },
    render: function() {
        var puff = this.props.puff
        var puffcontent = PuffForum.getProcessedPuffContent(puff)
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return <div className="txt" onClick={this.handleClick} dangerouslySetInnerHTML={{__html: puffcontent}}></div>
    }
});

var PuffBar = React.createClass({
    render: function() {
        var puff = this.props.puff
        return (
            <div className="bar">
                <span className="icon">
                    <PuffPermaLink sig={puff.sig} />
                    &nbsp;&nbsp;
                    <PuffReplyLink sig={puff.sig} />
                </span>
            </div>
        );
    }
});

var PuffPermaLink = React.createClass({
    render: function() {
        return (
            <a href={'?pid=' + this.props.sig}>
                <img className="permalink" src="img/permalink.png" alt="permalink" width="16" height="16"></img>
            </a>
        );
    }
});

var PuffReplyLink = React.createClass({
    handleClick: function() {

            $("#replyForm").show();

        React.renderComponent(PuffReply(), document.getElementById('replyForm'));
        
            $("#replyForm [name='content']").focus();

        var sig = this.props.sig;
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
        
    },
    render: function() {
        return (
            <img className="reply" onClick={this.handleClick} src="img/reply.png" width="16" height="16"></img>
        );
    }
});

var PuffReply = React.createClass({
    // getInitialState: function() {
    //   return {items: [], text: ''};
    // },
    // onChange: function(e) {
    //   this.setState({text: e.target.value});
    // },
    // handleSubmit: function(e) {
    //   e.preventDefault();
    //   var nextItems = this.state.items.concat([this.state.text]);
    //   var nextText = '';
    //   this.setState({items: nextItems, text: nextText});
    // },
    handleSubmit: function() {
        var content = this.refs.content.getDOMNode().value.trim();
        var parents = JSON.parse(this.refs.parentids.getDOMNode().value.trim());

        PuffForum.addPost( content, parents );

            $("#parentids").val('[]');
            $('#replyForm').hide();
            $('#content').val("");

        return false
    },
    handleCancel: function() {
            $("#parentids").val('[]');
            $('#replyForm').hide();
            $('#content').val("");
      
      return false  
    },
    render: function() {
        return (
            <div>
                <div id="authorDiv"></div>
                <form id="otherContentForm" onSubmit={this.handleSubmit}>
                  <br />
                  <textarea id="content" ref="content" name="content" rows="15" cols="50" placeholder="Add your content here. Click on the reply buttons of other puffs to reply to these."></textarea>
                  <br /><br />
                  <input id='cancel-form' type="reset" value="Cancel" onClick={this.handleCancel}/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <input type="submit" value="GO!" />
                  <input type="hidden" ref="parentids" id="parentids" name="parentids" value="[]" />
                </form>
            </div>
        );
    }
});



/**
* Functions related to rendering different configurations of puffs
*/
function viewLatestConversations() {
    React.renderComponent(PuffWorld({style: 'PuffRoots'}), document.getElementById('puffworld'))
}

// show a puff, its children, and some arrows
showPuff = function(puff) {
    React.renderComponent(PuffWorld({puff: puff}), document.getElementById('puffworld'))
}


