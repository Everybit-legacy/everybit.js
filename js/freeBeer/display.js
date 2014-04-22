/** @jsx React.DOM */
var PuffWorld = React.createClass({
    getInitialState: function() {
        
        //////// FIXME: hacky hack hack hack
        globalStateSettingFun = this.setState.bind(this);
        globalStateReadingFun = (function(key) {return this.state[key]}).bind(this)
        globalForceUpdateFun  = this.forceUpdate.bind(this);
        globalReplyToggleParent = function(sig) {
            var replyTo = globalStateReadingFun('replyTo')
            var index = replyTo.indexOf(sig)
    
            if(index == -1)
                replyTo.push(sig)
            else
                replyTo.splice(index, 1)
        
            globalStateSettingFun({replyOn: true, replyTo: replyTo});
            // TODO: draw reply arrows
        }
        globalCreatePuffBox = function(puff) {
            return <PuffBox puff={puff} key={puff.sig} />
        }

        return { replyTo: []
               , replyOn: false
               ,  menuOn: false
               ,   style: 'PuffRoots'
               ,    puff: false
               }
    },
    render: function() {

        $('#plumbing').empty(); // THINK: where should this live and should it at all?
        
        if(!this.state.menuOn) {
            this.state.keysOn = false // yes, this is terrible. but whaddya gonna do?
        }
        
        var view;
        
        if( this.state.style == 'PuffTree' )
            view = <PuffTree puff={this.state.puff} />
        
        else if( this.state.style == 'PuffAllChildren' )
            view = <PuffAllChildren puff={this.state.puff} />
        
        else if( this.state.style == 'PuffAllParents' )
            view = <PuffAllParents puff={this.state.puff} />
        
        else view = <PuffRoots />
        
        var reply = this.state.replyOn ? <PuffReplyForm /> : ''
        
        var menu = this.state.menuOn ? <PuffMenu /> : ''

        return (                                         
            <div>                                        
                <PuffHeader menuOn={this.state.menuOn} />
                {menu}
                {view}
                {reply}
                <PuffFooter />
            </div>
        )
    }
});

var PuffRoots = React.createClass({
    render: function() {
        var puffs = PuffForum.getRootPuffs();

        puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        puffs = puffs.slice(0, CONFIG.maxLatestRootsToShow);                      // don't show them all

        return <section id="children">{puffs.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllChildren = React.createClass({
    render: function() {
        var kids = PuffForum.getChildren(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllParents = React.createClass({
    render: function() {
        var kids = PuffForum.getParents(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        return <section id="children">{kids.map(globalCreatePuffBox)}</section>
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
                <section id="parents">{parentPuffs.map(globalCreatePuffBox)}</section>
                <section id="main-content"><PuffBox puff={puff} /></section>
                <section id="children">{childrenPuffs.map(globalCreatePuffBox)}</section>
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
        var puff = this.props.puff
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
                <PuffInfoLink puff={puff} />
                <PuffParentCount puff={puff} />
                <PuffChildrenCount puff={puff} />
                <PuffPermaLink sig={puff.sig} />
                <PuffReplyLink sig={puff.sig} />
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
            <span className="icon">
                <img width="16" height="16" src="img/info.gif" alt={formattedTime}  title={formattedTime} />
            </span>
        );
    }
});

var PuffParentCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        globalStateSettingFun({style: 'PuffAllParents', puff: puff})
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        return (
            <span className="icon" onClick={this.handleClick}>{parents.length}^</span>
        );
    }
});

var PuffChildrenCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        globalStateSettingFun({style: 'PuffAllChildren', puff: puff})
        // viewAllChildren(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        return (
            <span className="icon" onClick={this.handleClick}>{children.length}v</span>
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
            <span className="icon">
                <a href={'#' + this.props.sig} onClick={this.handleClick}>
                    <img className="permalink" src="img/permalink.png" alt="permalink" width="16" height="16" />
                </a>
            </span>
        );
    }
});

var PuffReplyLink = React.createClass({
    handleClick: function() {
        var sig = this.props.sig;
        globalReplyToggleParent(sig);
    },
    render: function() {
        return (
            <span className="icon">
                <img className="reply" onClick={this.handleClick} src="img/reply.png" width="16" height="16" />
            </span>
        );
    }
});

var PuffReplyForm = React.createClass({
    handleSubmit: function() {
        var content = this.refs.content.getDOMNode().value.trim();
        var parents = globalStateReadingFun('replyTo')

        PuffForum.addPost( content, parents );

        globalStateSettingFun({replyOn: false, replyTo: []});

        return false
    },
    handleCancel: function() {
        // THINK: save the content in case they accidentally closed?
        globalStateSettingFun({replyOn: false, replyTo: []});
        return false  
    },
    componentDidMount: function() {
        $('#replyForm').eq(0).draggable();
        $("#replyForm [name='content']").focus();
    },
    componentDidUpdate: function() {
        $('#replyForm').eq(0).draggable();
    },
    render: function() {
        var user = PuffForum.getCurrentUser() // make this a prop or something
        
        return (
            <div id="replyForm" className="mainForm">
                <div id="authorDiv">{user.username || 'anonymous'}</div>
                <form id="otherContentForm" onSubmit={this.handleSubmit}>
                  <br />
                  <textarea id="content" ref="content" name="content" rows="15" cols="50" placeholder="Add your content here. Click on the reply buttons of other puffs to reply to these."></textarea>
                  <br /><br />
                  <input id="cancelreply" type="reset" value="Cancel" onClick={this.handleCancel}/>
                  <input type="submit" value="GO!" />
                </form>
            </div>
        );
    }
});

var PuffHeader = React.createClass({
    handleClick: function() {
        globalStateSettingFun({menuOn: !globalStateReadingFun('menuOn')})
    },
    render: function() {
        return (
            <div>
                <img src="img/logo.gif" id="logo" />
                <img onClick={this.handleClick} src="img/puffballIcon.gif" id="puffballIcon" className={this.props.menuOn ? 'menuOn' : ''} />
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
        globalStateSettingFun({menuOn: false})
    },
    handleViewRoots: function() {
        globalStateSettingFun({style: 'PuffRoots', menuOn: false});
    },
    handleLearnMore: function() {
        var puff = PuffForum.getPuffById('3oqfs5nwrNxmxBQ6aL2XzZvNFRv3kYXD6MED2Qo8KeyV9PPwtBXWanHKZ8eSTgFcwt6pg1AuXhzHdesC1Jd55DcZZ')
        showPuff(puff)
    },
    handleNewContent: function() {
        globalStateSettingFun({menuOn: false, replyOn: true});
    },
    render: function() {
        var learnMore = (
            <div className="menuItem">
                <a href="#" onClick={this.handleLearnMore} className="under">
                    Learn more about FreeBeer!
                </a>
            </div>
        );
        
        return (
            <div className="menu" id="menu">
    
                <div id="closeDiv">
                    <a href="#" onClick={this.handleClose} className="under">
                        <img src="img/close.png" width="24" height="24" />
                    </a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleNewContent} className="under">Add new content</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleViewRoots} className="under">View latest conversations</a>
                </div>
                
                <PuffCurrentUser />
                
                <PuffSwitchUser />
                
                <PuffAddUser />
            </div>
        );
    }
});

var PuffCurrentUser = React.createClass({
    handleQRCode: function() {
        var user = PuffForum.getCurrentUser()
        if(!user.privateKey) return false;
        update_qrcode(user.privateKey);
    },
    handleRemoveUser: function() {
        PuffForum.removeUser(PuffForum.getCurrentUser().username)
        globalForceUpdateFun()
    },
    handleBlockChainDownload: function() {
        var user = PuffForum.getCurrentUser()
        
        if(!user.username) return false

        var blocks = Puff.Blockchain.exportChain(PuffForum.currentUser.username);
        var linkData = encodeURIComponent(JSON.stringify(blocks))
        var linkHTML = '<a download="blockchain.json" href="data:text/plain;charset=utf-8,' 
                     + linkData 
                     + '">DOWNLOAD BLOCKCHAIN</a>';

        document.getElementById('blockchainLink').innerHTML = linkHTML; // ugh puke derp
    },
    handleShowKeys: function() {
        globalStateSettingFun({keysOn: !globalStateReadingFun('keysOn')})
    },
    render: function() {    
        var user = PuffForum.getCurrentUser();
        
        if(!user.username)
            return <div className="menuItem"> No currently active identity </div>

        var myKeyStuff
        if(globalStateReadingFun('keysOn')) {            
            var prikey = user.privateKey
            var pubkey = user.publicKey
            myKeyStuff = <p>public key: <br />{pubkey}<br />private key: <br />{prikey}</p>
        }

        // TODO: only show user options on click
        // TODO: make all these settings revert on menu close (maybe in PuffWorld render?)
        
        return (
            <div>
                <div className="menuItem">
                    Current user: 
                    <strong>{' ' + user.username}</strong>
                    
                    <p onClick={this.handleRemoveUser}>Remove user from this machine</p>
                    <p onClick={this.handleBlockChainDownload}>Download blockchain</p>
                    <p onClick={this.handleQRCode}>Show QR code</p>
                    <p onClick={this.handleShowKeys}>Show keys</p>
                </div>

                <div className="menuItem" id="keys">{myKeyStuff}</div>
                <div className="menuItem" id="blockchainLink"></div>
                <div className="menuItem" id="qr"></div>
            </div>
        ); 
    }
});

var PuffSwitchUser = React.createClass({
    handleUserPick: function() {
        PuffForum.setCurrentUser(this.refs.select.value)
    },
    render: function() {
        var usernames = Object.keys(PuffForum.users)
        
        return (
            <div className="menuItem">
                Change user: 
                <select onChange={this.handleUserPick}>
                    {usernames.map(function(username) {return <option>{username}</option>})}
                </select>
            </div>
        ); 
    }
});

var PuffAddUser = React.createClass({
    handleUserAuth: function() {
        var username = this.refs.username.getDOMNode().value.trim();
        var privkey = this.refs.privkey.getDOMNode().value.trim();

        PuffForum.addUserMaybe(username, privkey)
    },
    newAnon: function() {
        PuffForum.addAnonUser(function(newName) {
            globalForceUpdateFun()
            // React.renderComponent(PuffWorld(), document.getElementById('puffworld'));
        });
    },
    render: function() {       
        return (
            <div className="menuItem">
                <form id="setUserInfo" onSubmit={this.handleUserAuth}>
                    Set your username and private key:<br />
                    Username: <input type="text" ref="username" /><br />
                    Private Key: <input type="text" ref="privkey" /><br />
                    <input type="submit" value="set" /><br />
                    <small>
                        This is used to sign the content you post. 
                        Before being set, it will be converted into a public key and then the public key 
                        will be compared with the user record.
                    </small>
                </form>
            </div>
        ); 
    }
});




// bootstrap
React.renderComponent(PuffWorld(), document.getElementById('puffworld'))



showPuff = function(puff) {
    //// show a puff and do other stuff
    showPuffDirectly(puff)

    // set window.location.hash and allow back button usage
    // TODO: convert this to a simple event system
    if(history.state && history.state.sig == puff.sig) return false
    
    var state = { 'sig': puff.sig }; 
    history.pushState(state, '', '#' + puff.sig);
}

showPuffDirectly = function(puff) {
    // show a puff without doing pushState
    // TODO: once this is evented this goes away
    globalStateSettingFun({puff: puff, style: 'PuffTree', menuOn: false, replyOn: false})
}


window.onpopstate = function(event) {
    //// grab back/forward button changes

    if(!event.state) return false
    
    var puff = PuffForum.getPuffById(event.state.sig)
    
    if(!puff)
        globalStateSettingFun({style: 'PuffRoots', menuOn: false, replyOn: false})
    else 
        showPuffDirectly(puff)
}


$(window).resize(function(){
    // When browser window is resized, refresh jsPlumb connecting lines.
    jsPlumb.repaintEverything();
});
