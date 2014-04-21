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
               ,  keysOn: false
               ,   style: 'PuffRoots'
               ,    puff: false
               }
    },
    render: function() {

        $('#plumbing').empty(); // THINK: where should this live and should it at all?
        
        var view;
        
        if( this.state.style == 'PuffTree' )
            view = <PuffTree puff={this.state.puff} />
        
        else if( this.state.style == 'PuffAllChildren' )
            view = <PuffAllChildren puff={this.state.puff} />
        
        else if( this.state.style == 'PuffAllParents' )
            view = <PuffAllParents puff={this.state.puff} />
        
        else view = <PuffRoots />
        
        var reply = this.state.replyOn ? <PuffReplyForm /> : ''
        
        var menu = this.state.menuOn ? <PuffMenu keysOn={this.state.keysOn} /> : ''

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
        var user = PuffForum.getUserInfo() // make this a prop or something
        
        return (
            <div id="replyForm" className="mainForm">
                <div id="authorDiv">{user.username}</div>
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
        globalStateSettingFun({menuOn: false})
        return false;
    },
    handleViewRoots: function() {
        globalStateSettingFun({style: 'PuffRoots', menuOn: false});
        return false;
    },
    handleLearnMore: function() {
        var puff = PuffForum.getPuffById('3oqfs5nwrNxmxBQ6aL2XzZvNFRv3kYXD6MED2Qo8KeyV9PPwtBXWanHKZ8eSTgFcwt6pg1AuXhzHdesC1Jd55DcZZ')
        showPuff(puff)
        return false;
    },
    handleNewContent: function() {
        globalStateSettingFun({menuOn: false, replyOn: true});
        return false;
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

                <PuffMenuUser />
            </div>
        );
    }
});

var PuffMenuUser = React.createClass({
    handleQRCode: function() {
        var user = PuffForum.getUserInfo()
        
        if(!user.privateKey) return false;
        update_qrcode(user.privateKey);
        return false;
    },
    toggleKeys: function() {
        globalStateSettingFun({keysOn: !globalStateReadingFun('keysOn')})
        return false;
    },
    newAnon: function() {
        PuffForum.addAnonUser(function(newName) {
            globalForceUpdateFun()
            // React.renderComponent(PuffWorld(), document.getElementById('puffworld'));
        });
        return false;
    },
    clearPrivateKey: function() {
        // THINK: do signout here, but that's different from removing the user account from this computer... ?
        return false;
    },
    handleBlockChainDownload: function() {
        if((typeof PuffForum.userinfoLivesHereForNow.username === 'undefined') || PuffForum.userinfoLivesHereForNow.username === '') {
            return false;
        } else {

            // return
            var blocks = Puff.Blockchain.exportChain(PuffForum.userinfoLivesHereForNow.username);
            var linkData = encodeURIComponent(JSON.stringify(blocks))

            // var linkHTML = '<a href="data:application/octet-stream;charset=utf-8;base64,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';
            // var linkHTML = '<a href="data:text/json,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';

            // pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            // pom.setAttribute('download', filename);

            var linkHTML = '<a download="blockchain.json" href="data:text/plain;charset=utf-8,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';

            document.getElementById('blockchainLink').innerHTML = linkHTML;
        }
        return false;
    },
    render: function() {
        // THINK: convert this to the stateless QR Code style, where closing the menu makes the keys go away
        var user = PuffForum.getUserInfo()

        var myKeyStuff
        if(this.props.keysOn) {            
            var prikey = user.privateKey
            var pubkey = user.publicKey
            myKeyStuff = <p>public key: <br />{pubkey}<br />private key: <br />{prikey}</p>
        }
        
        var currentUserBlock
        if(user.username) {
            currentUserBlock = <p>
                <span className="author">{user.username}</span>
                <a href="#" onClick={this.clearPrivateKey}>
                    <img src="img/logout.png" width="16" height="16" title="Remove private key from browser memory" />
                </a>
            </p>
        }
        
        return (
            <div>
                <div className="publicKeyMenuItem" id="currentUser">{currentUserBlock}</div>

                <div className="menuItem">
                    <a href="#" onClick={this.newAnon} className="under">Generate a new username</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleBlockChainDownload} className="under">Download your blockchain</a>
                </div>

                <div className="menuItem" id="blockchainLink"> </div>

                <div className="menuItem">
                    <form id="setUserInfo">
                        Set your username and private key:<br />
                        Username: <input type="text" id="usernameSet" /><br />
                        Private Key: <input type="text" id="privateKeySet" /><br />
                        <input type="submit" value="set" /><br />
                        <small>This is used to sign the content you post. Before being set, it will be converted into a public key and then the public key will be compared with the user record.</small>
                    </form>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.toggleKeys} className="under">
                        {this.props.keysOn ? 'Hide ' : 'Show '}
                        your keys
                    </a> 
            
                    {myKeyStuff}
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleQRCode} className="under">Show QR code for private key</a>
                </div>

                <div className="menuItem" id="qr"></div>
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
