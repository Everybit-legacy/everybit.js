/** @jsx React.DOM */

puffworldprops = {    menu: {    show: false
                            ,   prefs: false
                            , profile: false
                            ,    user: { pick_one: false
                                       , show_add: false
                                       ,  add_one: false
                                       ,  add_new: false
                                       ,   manage: false
                                       ,  show_bc: false
                                       , show_key: false
                                       }
                            }
                 ,    view: { style: 'PuffRoots'
                            ,  puff: false
                 }
                 ,   reply: { parents: []
                            ,    show: false
                            ,    type: 'text'
                 }
                 ,   prefs: { }
                 , profile: { }
                 ,   tools: { users: { resultstyle: 'raw'
                                     , puffstyle: 'raw'
                                     }
                            }
                 }

puffworlddefaults = puffworldprops                  // it's immutable so we don't care

globalCreatePuffBox = function(puff) {
    return <PuffBox puff={puff} key={puff.sig} />
}

var PuffWorld = React.createClass({
    render: function() {

        $('#plumbing').empty();                     // THINK: where should this live and should it at all?

        var view;
        var viewprops = this.props.view || {};

        if( viewprops.style == 'PuffTree' )
            view = <PuffTree puff={viewprops.puff} />

        else if( viewprops.style == 'PuffAllChildren' )
            view = <PuffAllChildren puff={viewprops.puff} />

        else if( viewprops.style == 'PuffAllParents' )
            view = <PuffAllParents puff={viewprops.puff} />

        else if( viewprops.style == 'PuffPacker' )
            view = <PuffPacker tools={this.props.tools} />

        else view = <PuffRoots />

        var reply = this.props.reply.show ? <PuffReplyForm reply={this.props.reply} /> : ''

        var menu = this.props.menu.show ? <PuffMenu menu={this.props.menu} prefs={this.props.prefs} profile={this.props.profile} /> : ''

        return (
            <div>
                <PuffHeader menu={this.props.menu} />
                {menu}
                {view}
                {reply}
                <PuffFooter />
            </div>
            )
    }
});

var PuffPacker = React.createClass({

    getInitialState: function() {
        return { result: {}
               , latest: ''
               ,   puff: {}
               };
    },

    handleClose: function() {
        return events.pub('ui/puff-packer/close', {'view.style': 'PuffRoots'})
    },
    
    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value;
        var self = this;

        var prom = Puffball.getUserRecord(username);
        
        prom.then(function(result) {
            self.state.result = result || "";
            events.pub('ui/puff-packer/userlookup', {});
        });
    },

    handleGeneratePrivateKeys: function() {
        // Get private keys
        var rootKey = Puffball.Crypto.generatePrivateKey();
        var adminKey = Puffball.Crypto.generatePrivateKey();
        var defaultKey = Puffball.Crypto.generatePrivateKey();

        this.refs.rootKeyPrivate.getDOMNode().value = rootKey;
        this.refs.adminKeyPrivate.getDOMNode().value = adminKey;
        this.refs.defaultKeyPrivate.getDOMNode().value = defaultKey;

        this.refs.rootKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(rootKey);
        this.refs.adminKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(adminKey);
        this.refs.defaultKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(defaultKey);
    },

    handleBuildRegisterUserPuff: function() {

        // Stuff to register. These are public keys
        var payload = {};
        payload.rootKey = this.refs.rootKeyPublic.getDOMNode().value;
        payload.adminKey = this.refs.adminKeyPublic.getDOMNode().value;
        payload.defaultKey = this.refs.defaultKeyPublic.getDOMNode().value;
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        payload.time = Date.now();

        payload.requestedUsername = this.refs.username.getDOMNode().value;

        var privateKeys = PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.state.result = {"FAIL": "You must set your identity before building registration requests."}
            return events.pub('ui/puff-packer/user-registration/error', {});
        }

        this.state.result = {}

        var puff = Puffball.buildPuff(privateKeys.username, privateKeys.admin, routes, type, content, payload);
        // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

        var self = this;
        self.state.puff = puff;
        return events.pub('ui/puff-packer/build-register-puff', {});
    },

    handleSendPuffToServer: function() {
        // Send the contents of the puff off to userApi with type=updateUsingPuff and post['puff']
        var puff = this.state.puff;
        var self = this;
        
        var prom = PuffNet.updateUserRecord(puff)
        
        prom.then(function(result) {
                self.state.result = result;
                events.pub('ui/puff-packer/userlookup', {});
             })
             .catch(function(err) {
                 self.state.result = {'FAIL': err.message};
                 events.pub('ui/puff-packer/userlookup/failed', {});
             })
    },

    handleShowResultsFormatted: function() {
        return events.pub('ui/puff-packer/set-result-style', {'tools.users.resultstyle': 'formatted'});
    },

    handleShowResultsRaw: function() {
        return events.pub('ui/puff-packer/set-result-style', {'tools.users.resultstyle': 'raw'});
    },

    handleShowPuffFormatted: function() {
        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'formatted'});
    },

    handleShowPuffRaw: function() {
        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'raw'});
    },

    handlePublishPuff: function() {
        return events.pub('ui/puff-packer/publish-puff', {});
    },

    handleGetLatest: function() {
        var username = PuffWardrobe.getCurrentUsername();
        var self = this;

        var prom = Puffball.getUserRecord(username);
        
        prom.then(function(userRecord) {
            self.state.latest = userRecord.latest;
            events.pub('ui/puff-packer/getUserLatest', {});
        })
    },

    handleBuildSetLatest: function() {
        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'raw'});
    },

    handleSetIdentityToAnon: function() {
        
        // var keys = Puffball.buildKeyObject(0, CONFIG.anon.privateKeyAdmin, 0);
        // PuffWardrobe.addUserReally('anon', keys);
        PuffWardrobe.switchCurrent('anon');
    },
    
    formatForDisplay: function(obj, style) {
        if(style == 'formatted') {
            return JSON.stringify(obj, null, 2)
                       .replace(/[{}",\[\]]/g, '')
                       .replace(/^\n/, '')
                       .replace(/\n$/, '');
        }

        // style is raw
        return JSON.stringify(obj).replace(/^\{\}$/, '');
    },

    render: function() {
        // Pre-fill with current user information if exists in memory
        var privateKeys = PuffWardrobe.getCurrentKeys();
        var username    = privateKeys.username;

        var result     = this.formatForDisplay(this.state.result, this.props.tools.users.resultstyle);
        var puffString = this.formatForDisplay(this.state.puff,   this.props.tools.users.puffstyle);

        return (
            <div id="adminForm">
                <form id="PuffPacker">
                    <div id="closeDiv">
                        <a href="#" onClick={this.handleClose} className="under">
                            <img src="img/close.png" width="24" height="24" />
                        </a>
                    </div>
                    <div className="col1">
                        <h3>Tools</h3>
                        
                        username:
                        <input className="fixedLeft" type="text" name="username" ref="username" defaultValue={username} /> <br />
                        <input className="btn-link" type="button" value="Lookup" onClick={this.handleUsernameLookup} />

                        <input className="btn-link" type="button" value="Build registration request" onClick={this.handleBuildRegisterUserPuff} /><br />
                        
                        <b>Current identity:</b> <span className="authorSpan">{username}</span><br />
                        
                        To register new sub-usernames, you will need to set your identity first. You will also need to set keys for the new user.<br />

                        <input className="btn-link" type="button" value="Set identity to anon" onClick={this.handleSetIdentityToAnon} /><br /><br />

                        <input className="btn-link" type="button" value="Generate keys" onClick={this.handleGeneratePrivateKeys} /><br />

                        New private keys<br />
                        root:
                            <input className="fixedLeft" type="text" name="rootKeyPrivate" ref="rootKeyPrivate" /><br />

                        admin:
                            <input className="fixedLeft" type="text" name="adminKeyPrivate" ref="adminKeyPrivate" /><br />

                        default:
                            <input className="fixedLeft" type="text" name="defaultKeyPrivate" ref="defaultKeyPrivate" /><br /><br />
                            
                        Corresponding public keys<br />
                        
                        root:
                            <input className="fixedLeft" type="text" name="rootKeyPublic" ref="rootKeyPublic" /><br />

                        admin:
                            <input className="fixedLeft" type="text" name="adminKeyPublic" ref="adminKeyPublic" /><br />

                        default:
                            <input className="fixedLeft" type="text" name="defaultKeyPublic" ref="defaultKeyPublic" /><br /><br />

                        <h4> Content Manipulation </h4>

                        <p>get latest puff sig from DHT</p>

                        Latest: <input className="fixedLeft" type="text" name="latestSig" ref="latestSig" value={this.state.latest} readOnly="true" /><br />
                        
                        <p><a href="#" onClick={this.handleGetLatest}>Get latest sig from DHT</a></p>

                        <p>create a DHT-puff for setting latest</p>
                        <a href="#" onClick={this.handleBuildSetLatest}>Build setLatest DHT-style puff</a>


                        <p>
                        --> create a new content puff
                        --> send DHT puff

                        --> send content puff to server
                        </p>

                    </div>

                    <div className="col2">

                        <label htmlFor="result">Results:</label>
                        <a href="#" onClick={this.handleShowResultsRaw}>Raw</a>
                        {' | '}
                        <a href="#" onClick={this.handleShowResultsFormatted}>Formatted</a>
                        <br />
                        <textarea ref="result" name="result" rows="5" cols="50" value={result} readOnly="true"></textarea><br />


                        <label htmlFor="puffString">Puff:</label>
                        <a href="#" onClick={this.handleShowPuffRaw}>Raw</a>
                        {' | '}
                        <a href="#" onClick={this.handleShowPuffFormatted}>Formatted</a>
                        <br />
                        <textarea ref="puffString" name="puffString" rows="5" cols="50" value={puffString}></textarea>
                        <br />


                        <input className="btn-link" type="button" value="Publish puff" onClick={this.handlePublishPuff} />

                        <input className="btn-link" type="button" value="Send user request" onClick={this.handleSendPuffToServer} />
                    </div>
                </form>

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
                    strokeStyle: "#6c6175"
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
                    strokeStyle: "#6c6175"
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
                <PuffAuthor username={puff.username} />
                <PuffContent puff={puff} />
                <PuffBar puff={puff} />
            </div>
            );
    }
});

var PuffAuthor = React.createClass({
    render: function() {
        var username = humanizeUsernames(this.props.username)

        return (
            <div className="author">{username}</div>
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
        var formattedTime = 'Created ' + timeSince(date) + ' ago';
        var lisc = puff.payload.license || '';
        var version = puff.version || '';
        var altText = formattedTime + ' ' + lisc + ' ' + version;

        return (
            <span className="icon">
                <img width="16" height="16" src="img/info.gif" alt={altText}  title={altText} />
            </span>
            );
    }
});

var PuffParentCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', {'view.style': 'PuffAllParents', 'view.puff': puff})
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        return (
            <span className="icon" onClick={this.handleClick}>{parents.length}&uarr;</span>
            );
    }
});

var PuffChildrenCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/children', {'view.style': 'PuffAllChildren', 'view.puff': puff})
        // viewAllChildren(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        return (
            <span className="icon" onClick={this.handleClick}>{children.length}&darr;</span>
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

        var parents = puffworldprops.reply.parents         // THINK: how can we get rid of this dependency?
            ? puffworldprops.reply.parents.slice() // clone to keep pwp immutable
            : []
        var index   = parents.indexOf(sig)

        if(index == -1)
            parents.push(sig)
        else
            parents.splice(index, 1)

        return events.pub('ui/reply/add-parent', {'reply': {show: true, parents: parents}});

        // TODO: draw reply arrows
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
        var type = this.props.reply.type;
        var content = '';
        var metadata = {};

        // THINK: allow the content type itself to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
            metadata.license = this.refs.imageLicense.getDOMNode().value;
        } else {
            content = this.refs.content.getDOMNode().value.trim();
        }

        var parents = this.props.reply.parents;

        PuffForum.addPost( type, content, parents, metadata );

        return events.pub('ui/reply/submit', {'reply': {show: false, parents: []}});
    },
    handleImageLoad: function() {
        var self   = this;
        var reader = new FileReader();

        reader.onload = function(event){
            self.state.imageSrc = event.target.result;
            return events.pub('ui/reply/image-upload');
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0]);

        return false;
    },
    handleCancel: function() {
        // THINK: save the content in case they accidentally closed?
        return events.pub('ui/reply/cancel', {'reply': {show: false, parents: []}});
    },
    handlePickType: function() {
        var type = this.refs.type.getDOMNode().value;
        return events.pub('ui/reply/set-type', {'reply.type': type})
    },
    componentDidMount: function() {
        $('#replyForm').eq(0).draggable();
        $("#replyForm [name='content']").focus();
    },
    componentDidUpdate: function() {
        $('#replyForm').eq(0).draggable();
    },
    getInitialState: function() {
        return {imageSrc: ''};
    },
    render: function() {
        var username = PuffWardrobe.getCurrentUsername() // make this a prop or something
        var username = humanizeUsernames(username) || 'anonymous'

        var contentTypeNames = Object.keys(PuffForum.contentTypes)

        var type = this.props.reply.type
        var typeFields = (
            <div>
                <textarea id="content" ref="content" name="content" rows="15" cols="50" placeholder="Add your content here. Click on the reply buttons of other puffs to reply to these."></textarea>
            </div>
            )

        if(type == 'image') {
            typeFields = (
                <div>
                    <p>
                        <label htmlFor="imageLoader">Image File:</label>
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad} />
                    </p>
                    <p>
                        <label htmlFor="imageLicense">Image License:</label>
                        <select id="imageLicense" name="imageLicense" ref="imageLicense">
                            <option value="Creative Commons Attribution">Creative Commons Attribution</option>
                            <option value="GNU Public License">GNU Public License</option>
                            <option value="Public domain">Public domain</option>
                            <option value="Rights-managed">Rights-managed</option>
                            <option value="Royalty-free">Royalty-free</option>
                        </select>
                    </p>
                    <img src={this.state.imageSrc} id="preview_image" />
                </div>
                )
        }
        else if(type == 'bbcode') {
            typeFields = (
                <div>
                    {typeFields}
                    <p>You can use BBCode-style tags</p>
                </div>
                )
        }

        return (
            <div id="replyForm" className="mainForm">

                <div id="authorDiv">{username}</div>
                <form id="otherContentForm" onSubmit={this.handleSubmit}>
                    
                    {typeFields}

                    <select ref="type" className="btn" onChange={this.handlePickType}>
                        {contentTypeNames.map(function(type) {
                            return <option key={type} value={type}>{type}</option>
                        })}
                    </select>

                    <input id="cancelreply" className="btn" type="reset" value="cancel" onClick={this.handleCancel}/>
                    <input type="submit" className="btn" value="GO!" />
                </form>
            </div>
            );
    }
});

var PuffHeader = React.createClass({
    handleClick: function() {
        if(this.props.menu.show)
            return events.pub('ui/menu/close', {'menu': puffworlddefaults.menu})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            <div>
                <img src="img/logo.gif" id="logo" height="53" />
                <img onClick={this.handleClick} src="img/puffballIcon.gif" id="puffballIcon" width="32" className={this.props.menu.show ? 'menuOn' : ''} />
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
        return events.pub('ui/menu/close', {'menu': puffworlddefaults.menu})
    },
    handlePackPuffs: function() {
        return events.pub('ui/show/puffpacker', {'view.style': 'PuffPacker', 'menu': puffworlddefaults.menu});
    },
    handleViewRoots: function() {
        return events.pub('ui/show/roots', {'view.style': 'PuffRoots', 'menu': puffworlddefaults.menu});
    },
    handleNewContent: function() {
        return events.pub('ui/reply/open', {'menu': puffworlddefaults.menu, 'reply': {show: true}});
    },
    handleShowPrefs: function() {
        return events.pub('ui/menu/prefs/show', {'menu.prefs': true})
    },
    handleShowProfile: function() {
        return events.pub('ui/menu/profile/show', {'menu.profile': true})
    },
    handleLearnMore: function() {
        var puff = PuffForum.getPuffById('3oqfs5nwrNxmxBQ6aL2XzZvNFRv3kYXD6MED2Qo8KeyV9PPwtBXWanHKZ8eSTgFcwt6pg1AuXhzHdesC1Jd55DcZZ')
        showPuff(puff)
        return false
    },
    render: function() {
        var learnMore = (
            <div className="menuItem">
                <a href="#" onClick={this.handleLearnMore} className="under">
                Learn more about FreeBeer!
                </a>
            </div>
            );

        // Machine preferences
        var prefs = <PuffPrefs prefs={this.props.prefs} />

        if(!this.props.menu.prefs) {
            prefs = (
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowPrefs} id="show_prefs" className="under">Preferences</a>
                </div>
                );
        }

        // Identity profile
        var profile = <PuffProfile profile={this.props.profile} />

        if(!this.props.menu.profile) {
            profile = (
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowProfile} id="show_profile" className="under">Profile</a>
                </div>
                );
        }

        // no current user
        var username = PuffWardrobe.getCurrentUsername()
        var username = humanizeUsernames(username) || ''

        if(!username) {
            // prefs = <div></div>
            profile = <div></div>
        }

        return (
            <div className="menu" id="menu">

                <div id="closeDiv">
                    <a href="#" onClick={this.handleClose} className="under">
                        <img src="img/close.png" width="24" height="24" />
                    </a>
                </div>
            DISPLAY: <br />
                <div className="menuItem">
                    <a href="#" onClick={this.handleViewRoots} className="under">View latest</a>
                </div>

            CONTENT: <br />
                <div className="menuItem">
                    <a href="#" onClick={this.handleNewContent} className="under">Add new</a>
                </div>

            TOOLS<br />
                <div className="menuItem">
                    <a href="#" onClick={this.handlePackPuffs} className="under">Puff builder</a>
                </div>

                <br />
            IDENTITY: <br />
                <PuffUserMenu user={this.props.menu.user} />
                
                {prefs}
                
                {profile}
            </div>
            );
    }
});


var PuffPrefs = React.createClass({
    handleStoreusers: function() {
        return events.pub('prefs/store-keychain/toggle')
    },
    render: function() {
        return (
            <div>
                <div className="menuItem">
                    <input type="checkbox" ref="store-keychain" name="store-keychain" onChange={this.handleStoreusers} checked={this.props.prefs.store-keychain} />
                Store identities on this machine
                </div>
                <div className="menuItem">
                    <p>Number of puffs to show in root view</p>
                    <p>Default view</p>
                </div>
            </div>
            );
    }
});

var PuffProfile = React.createClass({
    handleStoreusers: function() {
        return events.pub('profile/nickname/set', this.refs.nickname.state.value)
    },
    render: function() {
        return (
            <div>
                <div className="menuItem">
                    <input type="checkbox" ref="nickname" name="nickname" onChange={this.handleSetNickname} checked={this.props.profile.nickname} />
                Set nickname
                </div>
                <div className="menuItem">
                    <p>Identity avatar</p>
                    <p>More profile</p>
                </div>
            </div>
            );
    }
});


var PuffUserMenu = React.createClass({
    // responsible for showing either components or the link / static text

    handleShowAdd: function() {
        return events.pub('ui/menu/user/show-add/show', {'menu.user.show_add': true})
    },
    handleShowManage: function() {
        return events.pub('ui/menu/user/show-manage/show', {'menu.user.manage': true})
    },
    handlePickOne: function() {
        return events.pub('ui/menu/user/pick_one/show', {'menu.user.pick_one': true})
    },
    render: function() {

        // Current User
        var username = PuffWardrobe.getCurrentUsername()
        var username = humanizeUsernames(username) || ''
        var all_usernames = Object.keys(PuffWardrobe.getAll())

        // Add User
        var add_user = <PuffAddUser user={this.props.user} />

        if(!this.props.user.show_add) {
            add_user = (
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowAdd} id="show_add" className="under">Add an identity</a>
                </div>
                );
        }

        // User Management
        var manage_user = <PuffManageUser user={this.props.user} />

        if(!this.props.user.manage && username) {
            manage_user = (
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowManage} id="show_manage" className="under">Identity management</a>
                </div>
                );
        }

        return (
            <div>
                <div className="menuItem"> 
                    {username ? <span>Posting as {username} </span>
                        : <span>No current identity</span>}
                              
                    { (all_usernames.length && !this.props.user.pick_one)
                        ? <a onClick={this.handlePickOne} className="under">(change)</a>
                        : '' }
                </div>

                {this.props.user.pick_one ? <PuffSwitchUser /> : ''}

                {add_user}
                
                {manage_user}
            </div>
            );
    }
});

var PuffSwitchUser = React.createClass({
    handleUserPick: function() {
        PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide', {'menu.user.pick_one': false})
    },
    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())
        
        if(!all_usernames.length) return <div></div>
        
        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)

        return (
            <div className="menuItem">
            Change user:
                <select ref="switcher" onChange={this.handleUserPick} value={username}>
                    {all_usernames.map(function(username) {
                        return <option key={username} value={username}>{username}</option>
                    })}
                </select>
            </div>
            );
    }
});

var PuffAddUser = React.createClass({
    handleUserAuth: function() {
        var username   = (this.refs  .username.state.value || '').trim()
        var rootKey    = (this.refs   .rootKey.state.value || '').trim()
        var adminKey   = (this.refs  .adminKey.state.value || '').trim()
        var defaultKey = (this.refs.defaultKey.state.value || '').trim()

        if(!username)
            return Puffball.onError('Invalid username')

        this.refs  .username.getDOMNode().value = "" // what oh dear
        this.refs   .rootKey.getDOMNode().value = ""
        this.refs  .adminKey.getDOMNode().value = ""
        this.refs.defaultKey.getDOMNode().value = ""

        // what we'd like to do here is take a username and up to three private keys, 
        // and then add both the DHT userRecord to Puffball.Data and those keys to our PuffWardrobe.
        // the wardrobe should manage that, but only by passing most of it through to Puffball / PuffNet.
        // does the wardrobe always check private keys before adding them locally? 
        // would you ever want it not to?

        var prom = PuffWardrobe.storePrivateKeys(username, rootKey, adminKey, defaultKey)

        prom.then(function(userRecord) {
                PuffWardrobe.switchCurrent(username)
                events.pub('ui/menu/user/added', {'menu.user.show_add': false, 'menu.user.add_one': false})
            },
            Puffball.promiseError('Failed to add user'))

        return false
    },
    handleUserCreate: function() {

        return false
    },
    handleNewAnon: function() {
        var prom = PuffWardrobe.addNewAnonUser()
        
        prom.then(function(userRecord) {
            events.pub('user/add/anon', {})
            events.pub('ui/user/add/anon', {}) // THINK: should this be generated by previous event?
            PuffWardrobe.switchCurrent(userRecord.username)
            events.pub('ui/menu/user/show-add/hide', {'menu.user.show_add': false})
        });

        return false
    },
    handleShowAddOne: function() {
        return events.pub('ui/menu/user/add-one', {'menu.user.add_one': true})
    },
    handleShowAddNew: function() {
        return events.pub('ui/menu/user/add-new', {'menu.user.add_new': true})
    },
    render: function() {
        // THINK: put some breadcrumbs in?

        // Add a user: 
        // Anonymous
        // Existing
        // need: username / prikey
        // New named:
        // New sub-user
        // need: existing user, sub user username / private key
        // New top level
        // need: username > 33 / private key


        // Add existing identity
        if(this.props.user.add_one) {
            return (
                <div className="menuItem">
                    <form id="setUserInfo" onSubmit={this.handleUserAuth}>
                        <p>Authenticate with an existing identity</p>
                        <p>Identity: <input type="text" ref="username" /></p>
                        <p>Private Key: <input type="text" ref="privkey" /></p>
                        <p><input type="submit" value="set" /></p>
                        <small>
                        Your private key is never sent over the network. Keep it secret. Keep it safe.
                        </small>
                    </form>
                </div>
                );
        }

        // Create new identity
        if(this.props.user.add_new) {
            return (
                <div className="menuItem">
                    <form id="setUserInfo" onSubmit={this.handleUserCreate}>
                        <p>Create a new identity</p>
                        <p>Identity: <input type="text" ref="username" /></p>
                        <p>Private Key: <input type="text" ref="privkey" /></p>
                        <p><input type="submit" value="set" /></p>
                        <small>
                        Your identity must consist of 33 or more alphanumeric characters.
                        Your identity signs each piece of content that you create.
                        If the content is modified your identity will no longer match its signature.
                        Your private key is never sent over the network. Keep it secret. Keep it safe.
                        </small>
                    </form>
                </div>
                );
        }

        // Regular menu
        return (
            <div>
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowAddOne} id="add_local" className="under">Add existing identity</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleNewAnon} id="add_anon" className="under">Create anonymous identity</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleShowAddNew} id="add_new" className="under">Create new identity</a>
                </div>
            </div>
            );
    }
});

var PuffManageUser = React.createClass({
    handleRemoveUser: function() {
        PuffWardrobe.removeKeys(PuffWardrobe.getCurrentUsername())
        events.pub('user/current/remove', {})
        events.pub('ui/user/current/remove', {}) // this should be generated by previous event
        events.pub('ui/menu/user/show-manage/hide', {'menu.user.manage': false})
        return false
    },
    handleShowKeys: function() {
        return events.pub('ui/menu/keys/show', {'menu.user.show_key': true})
    },
    handleShowBlockchainLink: function() {
        return events.pub('ui/menu/blockchain/show', {'menu.user.show_bc': true})
    },
    render: function() {
        // OPT: once current user is in props, only rerender on change (blockchain and QR are expensive)

        var props = this.props.user
        
        var privateKeys = PuffWardrobe.getCurrentKeys() || {}

        var username = humanizeUsernames(privateKeys.username) || ''
        if(!username) return <div></div>

        var qrCode = ''
        var myKeyStuff = ''
        var blockchainLink = ''
        var privateDefaultKey = privateKeys.default
        
        var userRecord = PuffWardrobe.getCurrentUserRecord() 
        if(!userRecord)
            return <div></div>

        if(props.show_key) {
            myKeyStuff = <div><p>public key: <br />{userRecord.defaultKey}</p><p>private key: <br />{privateDefaultKey}</p></div>

            var msg = privateDefaultKey.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');

            var qr = qrcode(4, 'M');
            qr.addData(msg);
            qr.make();

            var image_data = qr.createImgTag() || {}
            var data = 'data:image/gif;base64,' + image_data.base64
            qrCode = <img src={data} width={stuff.width} height={stuff.height} />
        }

        if(props.show_bc) {
            if(!privateKeys.username) return false

            var blocks = Puffball.Blockchain.exportChain(privateKeys.username);
            var linkData = encodeURIComponent(JSON.stringify(blocks))
            var data = 'data:text/plain;charset=utf-8,' + linkData
            blockchainLink = <a download="blockchain.json" href={data} className="under">DOWNLOAD BLOCKCHAIN</a>
        }

        return (
            <div>
                <div className="menuItem">
                    <a href="#" onClick={this.handleRemoveUser} className="under">Remove identity from this machine</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleShowKeys} className="under">View this identity's keys</a>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleShowBlockchainLink} className="under">Download this identity's blockchain</a>
                </div>
                
                { qrCode         ? <div className="menuItem">{qrCode}</div> : '' }
                { myKeyStuff     ? <div className="menuItem">{myKeyStuff}</div> : '' }
                { blockchainLink ? <div className="menuItem">{blockchainLink}</div> : '' }
            </div>
            );
    }
});





var renderPuffWorld = function() {
    var puffworlddiv = document.getElementById('puffworld') // OPT: cache this for speed

    // puffworldprops has to contain some important things like prefs
    // THINK: this is probably not the right place for this...
    puffworldprops.prefs = PuffWardrobe.getAllPrefs()
    puffworldprops.profile = PuffWardrobe.getAllProfileItems()

    React.renderComponent(PuffWorld(puffworldprops), puffworlddiv)
}



// bootstrap
renderPuffWorld()






events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    // change props in a persistent fashion
    if(data)
        if(Array.isArray(data))
            puffworldprops = React.addons.update(puffworldprops, data[0]) // this is a bit weird
        else
            puffworldprops = events.handle_merge_array(puffworldprops, data)

    // then re-render PuffWorld w/ the new props
    renderPuffWorld()
})

events.merge_props = function(props, path, value) {
    var segs = path.split('.')
    var last = segs.pop()
    var final = next = events.shallow_copy(props)

    segs.forEach(function(seg) {
        next[seg] = events.shallow_copy(next[seg])
        next = next[seg]
    })

    next[last] = value
    return final
}

events.shallow_copy = function(obj) {
    return Object.keys(obj || {}).reduce(function(acc, key) {acc[key] = obj[key]; return acc}, {})
}

events.handle_merge_array = function(props, data) {
    return Object.keys(data).reduce(function(props, key) {
        return events.merge_props(props, key, data[key])
    }, props)
}


humanizeUsernames = function(username) {
    if(/^[A-Za-z0-9]{32}$/.test(username))
        return username.slice(0, 7) + '...'
    return username
}




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
    //// show a puff without doing pushState
    events.pub('ui/show/tree', {'view.style': 'PuffTree', 'view.puff': puff, 'menu': puffworlddefaults.menu, 'reply': puffworlddefaults.reply})
}


window.onpopstate = function(event) {
    //// grab back/forward button changes

    if(!event.state) return false

    var puff = PuffForum.getPuffById(event.state.sig)

    if(!puff)
        events.pub('ui/show/roots', {'view.style': 'PuffRoots', 'menu': puffworlddefaults.menu, 'reply': puffworlddefaults.reply})
    else
        showPuffDirectly(puff)
}


$(window).resize(function(){
    // When browser window is resized, refresh jsPlumb connecting lines.
    jsPlumb.repaintEverything();
});
