/** @jsx React.DOM */
var PuffWorld = React.createClass({
    getInitialState: function() {
        return { menuOn: false
               ,  style: 'PuffTree'
               }
    },
    getDefaultProps: function() {
        var defaultPuff = CONFIG.defaultPuff
                        ? PuffForum.getPuffById(CONFIG.defaultPuff)
                        : Puff.Data.puffs[0]

        return { style: 'PuffTree'
               ,  puff: defaultPuff
               }
    },
    handleHeaderPuffClick: function() {
        this.setState({menuOn: !this.state.menuOn});
    },
    render: function() {
        // use this to control the state of the master viewport,
        // and always call it instead of calling PuffRoots and PuffTree directly.
        
        $('#plumbing').empty(); // THINK: where should this live and should it at all?
        
        var view;
        
        if( this.props.style == 'PuffTree' )
            view = <PuffTree puff={this.props.puff} />
        
        else if( this.props.style == 'PuffAllChildren' )
            view = <PuffAllChildren puff={this.props.puff} />
        
        else if( this.props.style == 'PuffAllParents' )
            view = <PuffAllParents puff={this.props.puff} />
        
        else view = <PuffRoots />
        
        var menu = this.state.menuOn ? <PuffMenu onHeaderPuffClick={this.handleHeaderPuffClick} /> : ''
        
        return (
            <div>
                <PuffHeader menuOn={this.state.menuOn} onHeaderPuffClick={this.handleHeaderPuffClick} />
                {menu}
                {view}
                <PuffFooter />
            </div>
        )
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

var PuffAllChildren = React.createClass({
    render: function() {
        var kids = PuffForum.getChildren(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        return <section id="children">{kids.map(createPuffBox)}</section>
    }
});

var PuffAllParents = React.createClass({
    render: function() {
        var kids = PuffForum.getParents(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        return <section id="children">{kids.map(createPuffBox)}</section>
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
                    <PuffInfoLink puff={puff} />
                    &nbsp;&nbsp;
                    <PuffParentCount puff={puff} />
                    &nbsp;&nbsp;
                    <PuffChildrenCount puff={puff} />
                    &nbsp;&nbsp;
                    <PuffPermaLink sig={puff.sig} />
                    &nbsp;&nbsp;
                    <PuffReplyLink sig={puff.sig} />
                </span>
            </div>
        );
    }
});

var PuffInfoLink = React.createClass({
    render: function() {
        var puff = this.props.puff;
        var date = new Date(puff.payload.time);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var formattedTime = hours + ':' + minutes + ':' + seconds;
        return (
            <img width="16" height="16" src="img/info.gif" alt={formattedTime}  title={formattedTime} />
        );
    }
});

var PuffParentCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        viewAllParents(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        return (
            <span onClick={this.handleClick}>{parents.length}^</span>
        );
    }
});

var PuffChildrenCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        viewAllChildren(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        return (
            <span onClick={this.handleClick}>{children.length}v</span>
        );
    }
});

var PuffPermaLink = React.createClass({
    handleClick: function() {
        var sig  = this.props.sig;
        var puff = PuffForum.getPuffById(sig);
        showPuff(puff);                                       
    },
    render: function() {
        return (
            <a href={'#' + this.props.sig} onClick={this.handleClick}>
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

var PuffHeader = React.createClass({
    handleClick: function() {
        this.props.onHeaderPuffClick();
        return false;
    },
    render: function() {
        return (
            <div>
                <img src="img/logo.gif" id="logo" />
                <a href="#" onClick={this.handleClick}>
                    <img src="img/puffballIcon.gif" id="puffballIcon" className={this.props.menuOn ? 'menuOn' : ''} />
                </a>
            </div>
        );
    }
});

var PuffFooter = React.createClass({
    render: function() {
        return (
            <div className="footer"> 
              <div className="footerText">
                Powered by <a href="http://www.puffball.io" className="footerText">puffball</a>. 
                Responsibility for all content lies with the publishing author and not this website.
              </div>
            </div>
        );
    }
});



var PuffMenu = React.createClass({
    handleClose: function() {
        this.props.onHeaderPuffClick();
        return false;
    },
    render: function() {
        return (
            <div className="menu" id="menu">
    
              <div id="closeDiv">
                <a href="#" onClick={this.handleClose} className="under">
                  <img src="img/close.png" width="24" height="24" />
                </a>
              </div>

              <div className="publicKeyMenuItem" id="currentUser"> </div>

              <div className="menuItem">
                <a href="#" id="otherNewContentLink" onclick='$("#menu").toggle();return false;' className="under">Add new content</a>
              </div>

              <div className="menuItem">
                <a href="#" id="viewLatestConversationsLink" onclick='viewLatestConversations();' className="under">View latest conversations</a>
              </div>

              <div className="menuItem">
                <a href="#" onclick="newAnon();return false;" className="under">Generate a new username</a>
              </div>

              <div className="menuItem">
                <a href="#" onclick="viewPublic();return false;" className="under">Show</a> / <a href="#" onclick="hidePublic();return false;" className="under">Hide</a> your public key.
              </div>

              <div className="menuItem" id="publicKeyMenuItem"></div>

              <div className="menuItem">
                <a href="#" onclick="viewPrivate();return false;" className="under">Show</a> / <a href="#" onclick="hidePrivate();return false;" className="under">Hide</a> your private key.
              </div>

              <div className="menuItem" id="privateKeyMenuItem"></div>

              <div className="menuItem">
                <a href="#" onclick="getBlockchian();return false;" className="under">Download your blockchain</a>
              </div>

              <div className="menuItem" id="blockchainLink"> </div>

              <div className="menuItem">
                <form id="setUserInfo">
                  Set your username and private key:<br />
                  Username: <input type="text" id="usernameSet" /><br />
                  Private Key: <input type="text" id="privateKeySet" /><br />
                  <input type="submit" value="set" /><br />
                  <small>This is used to sign the content you post. Before being set, it will be converted into a public key and then the public key will be compared with that user's record.</small>
                </form>
              </div>
    
              <div className="menuItem">
                <a href="#" onclick="qrcodeWrapper(); return false;" className="under">Show QR code for private key</a>
              </div>

              <div className="menuItem" id="qr"></div>

              <div className="menuItem">
                <a href="#" onclick="showPuff(PuffForum.getPuffById('3oqfs5nwrNxmxBQ6aL2XzZvNFRv3kYXD6MED2Qo8KeyV9PPwtBXWanHKZ8eSTgFcwt6pg1AuXhzHdesC1Jd55DcZZ'));return false;" className="under">
                  Learn more about FreeBeer!
                </a>
              </div>

            </div>
        );
    }
});


