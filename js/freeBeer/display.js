/** @jsx React.DOM */
var PuffWorld = React.createClass({
    render: function() {
        // decide whether we're showing a particular puff or all roots
    }
});

var PuffRoots = React.createClass({
    render: function() {
        var puffs = PuffForum.getRootPuffs();

        puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time
    
        puffs = puffs.slice(0, CONFIG.maxLatestRootsToShow);                      // don't show them all

        var createPuffBox = function(puff) {
            return <PuffBox puff={puff} />
        }

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
        
        var createPuffBox = function(puff) {
            return <PuffBox puff={puff} />
        }
        
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
            <div className="block" id={puff.sig}>
                <div className="author">{puff.payload.username}</div>
                <div className="txt"><PuffContent puff={puff} /></div>
                <div className="bar">
                    <span className="icon">
                        <a href={'?pid=' + puff.sig}>
                            <img className="permalink" src="img/permalink.png" alt="permalink" width="16" height="16"></img>
                        </a>
                        &nbsp;&nbsp;
                        <img className="reply" data-value={puff.sig} src="img/reply.png" width="16" height="16"></img>
                    </span>
                </div>
            </div>
        );                
    }
});

var PuffContent = React.createClass({
    render: function() {
        var puff = this.props.puff
        var puffcontent = PuffForum.getProcessedPuffContent(puff)
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this
        return <div dangerouslySetInnerHTML={{__html: puffcontent}}></div>
    }
});



/**
* Functions related to rendering different configurations of puffs
*/
function viewLatestConversations() {
    React.renderComponent(PuffRoots(), document.getElementById('puffworld'));
}

// show a puff, its children, and some arrows
showPuff = function(puff) {
    React.renderComponent(PuffTree({puff: puff}), document.getElementById('puffworld'))
}




