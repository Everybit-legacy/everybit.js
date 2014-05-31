/** @jsx React.DOM */



var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

puffworldprops = {
    menu: {
        show: false,
        prefs: false,
        profile: false,

        user: {
            pick_one: false,
            show_add: false,
            add_one: false,
            add_new: false,
            manage: false,
            show_bc: false,
            show_key: false
        }
    },

    view: {
        style: 'PuffRoots',
        puff: false,
        mode: 'browse',
        cols: 5
    },

    reply: {
        parents: [],
        show: false,
        type: 'text'
    },

    prefs: { },
    profile: { },
    tools: {
        users: {
            resultstyle: 'raw',
            puffstyle: 'raw'
        }
    }
}

puffworlddefaults = puffworldprops                  // it's immutable so we don't care

globalCreatePuffBox = function(puff) {
    return PuffBox( {puff:puff, key:puff.sig} )
}

var PuffWorld = React.createClass({displayName: 'PuffWorld',
    render: function() {

        $('#plumbing').empty();                     // THINK: where should this live and should it at all?

        var view;
        var viewprops = this.props.view || {};

        if( viewprops.style == 'PuffTree' )
            view  = PuffTree( {puff:viewprops.puff} )

        if( viewprops.style == 'PuffTallTree' )
            view  = PuffTallTree(    {view:viewprops, reply:this.props.reply} )

        else if( viewprops.style == 'PuffAllChildren' )
            view  = PuffAllChildren( {view:viewprops, reply:this.props.reply, puff:viewprops.puff} )

        else if( viewprops.style == 'PuffAllParents' )
            view  = PuffAllParents(  {view:viewprops, reply:this.props.reply, puff:viewprops.puff} )

        else if( viewprops.style == 'PuffPacker' )
            view  = PuffPacker( {tools:this.props.tools} )

        else view = PuffRoots(       {view:viewprops, reply:this.props.reply} )

        var reply = this.props.reply.show ? PuffReplyForm( {reply:this.props.reply} ) : ''

        var menu = this.props.menu.show ? PuffMenu( {menu:this.props.menu, prefs:this.props.prefs, profile:this.props.profile} ) : ''

        return (
            React.DOM.div(null, 
                PuffHeader( {menu:this.props.menu} ),
                menu,
                view,
                reply,
                PuffFooter(null )
            )
            )
    }
});

var PuffPacker = React.createClass({displayName: 'PuffPacker',

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
            })
            .catch(function(err) {
                self.state.result = {'FAIL': err.message};
                events.pub('ui/puff-packer/userlookup/failed', {});
            })
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


    handleBuildModifyUserKeysPuff: function() {
        // Stuff to register. These are public keys

        var currentUser = PuffWardrobe.getCurrentUsername();
        if(!currentUser) {
            this.state.result = {"FAIL": "You must set your identity before building a request to modify keys."}
            return events.pub('ui/puff-packer/user-modify-keys/error', {});
        }

        var payload = {};
        var rootKey = PuffWardrobe.getCurrentKeys().root;
        var adminKey = PuffWardrobe.getCurrentKeys().admin;
        var defaultKey = PuffWardrobe.getCurrentKeys().default;
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'modifyUserKey';

        // What key do they want to modify?
        var keyToModify = this.refs.keyToModify.getDOMNode().value;
        payload.keyToModify = keyToModify;

        var newKey = this.refs.newKey.getDOMNode().value;
        payload.newKey = newKey;

        payload.time = Date.now();

        var privateKeys = PuffWardrobe.getCurrentKeys();


        if(keyToModify == 'rootKey' || keyToModify == 'adminKey') {
            if(!rootKey) {
                this.state.result = {"FAIL": "You must first set your root key before modifying root or admin keys."}
                return events.pub('ui/puff-packer/user-modify-keys/error', {});
            } else {
                var signingUserKey = rootKey;
                console.log("request will be signed with root key")
            }
        } else if(keyToModify == 'defaultKey') {
            if(!adminKey) {
                this.state.result = {"FAIL": "You must first set your admin key before modifying default keys."}
                return events.pub('ui/puff-packer/user-modify-keys/error', {});
            } else {
                var signingUserKey = adminKey;
                console.log("request will be signed with admin key")
            }
        }

        this.state.result = {}

        var puff = Puffball.buildPuff(currentUser, signingUserKey, routes, type, content, payload);
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

    handleSendRawEditedPuff: function() {
        // Send the raw contents of the edited puff as a string to the server
        var puffEl = document.getElementById('puffString');
        var puffString = puffEl.value;
        var self = this;

        var pprom = PuffNet.updateUserRecord(puffString);

        pprom.then(function(result) {
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

    handleShowPuffEdit: function() {
        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'edit'});
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
        // Stuff to register. These are public keys
        var payload = {};
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'setLatest';

        payload.time = Date.now();

        payload.latest = this.refs.setLatestSigTo.getDOMNode().value;

        var privateKeys = PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.state.result = {"FAIL": "You must set your identity before building set latest request."}
            return events.pub('ui/puff-packer/user-set-latest/error', {});
        }

        this.state.result = {}

        var puff = Puffball.buildPuff(privateKeys.username, privateKeys.default, routes, type, content, payload);

        var self = this;
        self.state.puff = puff;
        return events.pub('ui/puff-packer/build-register-puff', {});

        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'raw'});
    },

    handleSetIdentityToAnon: function() {
        var prom = PuffWardrobe.storePrivateKeys('anon', 0, CONFIG.anon.privateKeyAdmin, 0);
        prom.then(function() {
            PuffWardrobe.switchCurrent('anon');
            events.pub('ui/puff-packer/set-identity-to-anon', {});
        })
        // var keys = Puffball.buildKeyObject(0, CONFIG.anon.privateKeyAdmin, 0);
        // PuffWardrobe.addUserReally('anon', keys);
    },
    
    formatForDisplay: function(obj, style) {
        if(style == 'formatted') {
            return JSON.stringify(obj, null, 2)
                       .replace(/[{}",\[\]]/g, '')
                       .replace(/^\n/, '')
                       .replace(/\n$/, '');
        }
    },

    render: function() {
        // Pre-fill with current user information if exists in memory
        var username    = PuffWardrobe.getCurrentUsername();
        var result = formatForDisplay(this.state.result, this.props.tools.users.resultstyle);

        return (
            React.DOM.div( {id:"adminForm"}, 
                React.DOM.form( {id:"PuffPacker"}, 
                    React.DOM.div( {id:"closeDiv"}, 
                        React.DOM.a( {href:"#", onClick:this.handleClose, className:"under"}, 
                            React.DOM.img( {src:"img/close.png", width:"24", height:"24"} )
                        )
                    ),
                    React.DOM.div( {className:"col1"}, 
                        React.DOM.h3(null, "Tools"),
                        
                        "username:",
                        React.DOM.input( {className:"fixedLeft", type:"text", name:"username", ref:"username", defaultValue:username} ), " ", React.DOM.br(null ),
                        React.DOM.input( {className:"btn-link", type:"button", value:"Lookup", onClick:this.handleUsernameLookup} ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Build registration request", onClick:this.handleBuildRegisterUserPuff} ),React.DOM.br(null ),
                        
                        React.DOM.b(null, "Current identity:"), " ", React.DOM.span( {className:"authorSpan"}, username),React.DOM.br(null ),
                        
                        "To register new sub-usernames, you will need to set your identity first. You will also need to set keys for the new user.",React.DOM.br(null ),

                        PuffSwitchUser(null ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Set identity to anon", onClick:this.handleSetIdentityToAnon} ),React.DOM.br(null ),React.DOM.br(null ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Generate keys", onClick:this.handleGeneratePrivateKeys} ),React.DOM.br(null ),

                        "New private keys",React.DOM.br(null ),
                        "root:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate"} ),React.DOM.br(null ),

                        "admin:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate"} ),React.DOM.br(null ),

                        "default:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate"} ),React.DOM.br(null ),React.DOM.br(null ),
                            
                        "Corresponding public keys",React.DOM.br(null ),
                        
                        "root:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"rootKeyPublic", ref:"rootKeyPublic"} ),React.DOM.br(null ),

                        "admin:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"adminKeyPublic", ref:"adminKeyPublic"} ),React.DOM.br(null ),

                        "default:",
                            React.DOM.input( {className:"fixedLeft", type:"text", name:"defaultKeyPublic", ref:"defaultKeyPublic"} ),React.DOM.br(null ),React.DOM.br(null ),

                        React.DOM.h4(null,  " Content Manipulation " ),

                        React.DOM.p(null, "get latest puff sig from DHT"),

                        "Latest: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"latestSig", ref:"latestSig", value:this.state.latest, readOnly:"true"} ),React.DOM.br(null ),
                        
                        React.DOM.p(null, React.DOM.a( {href:"#", onClick:this.handleGetLatest}, "Get latest sig from DHT")),

                        React.DOM.p(null, "create a DHT-puff for setting latest"),

                        "Set latest to: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"setLatestSigTo", ref:"setLatestSigTo"} ),React.DOM.br(null ),
                        React.DOM.a( {href:"#", onClick:this.handleBuildSetLatest}, "Build setLatest DHT-style puff"),

                        React.DOM.br(null ),
                        "Key to modify: ", React.DOM.br(null ),React.DOM.select( {id:"keyToModify", ref:"keyToModify"}, 
                                            React.DOM.option( {value:"defaultKey"}, "default"),
                                            React.DOM.option( {value:"adminKey"}  , "admin"),
                                            React.DOM.option( {value:"rootKey"}   , "root")
                                        ),React.DOM.br(null ),
                        "New PUBLIC key: ", React.DOM.br(null ),React.DOM.input( {className:"fixedLeft", type:"text", name:"newKey", ref:"newKey"} ),React.DOM.br(null ),
                        React.DOM.a( {href:"#", onClick:this.handleBuildModifyUserKeysPuff}, "Build modify user keys DHT puff")

                    ),

                    React.DOM.div( {className:"col2"}, 

                        React.DOM.label( {htmlFor:"result"}, "Results:"),
                        React.DOM.a( {href:"#", onClick:this.handleShowResultsRaw}, "Raw"),
                        ' | ',
                        React.DOM.a( {href:"#", onClick:this.handleShowResultsFormatted}, "Formatted"),
                        React.DOM.br(null ),
                        React.DOM.textarea( {ref:"result", name:"result", rows:"5", cols:"50", value:result, readOnly:"true"}),React.DOM.br(null ),


                        React.DOM.label( {htmlFor:"puffString"}, "Puff:"),
                        React.DOM.a( {href:"#", onClick:this.handleShowPuffRaw}, "Raw"),
                        ' | ',
                        React.DOM.a( {href:"#", onClick:this.handleShowPuffFormatted}, "Formatted"),
                           ' | ',
                        React.DOM.a( {href:"#", onClick:this.handleShowPuffEdit}, "Edit"),
                        React.DOM.br(null ),
                        PuffToolsPuffDisplay( {style:this.props.tools.users.puffstyle, puff:this.state.puff} ),
                        React.DOM.br(null ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Send user request", onClick:this.handleSendPuffToServer} ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Send EDITED puff user request", onClick:this.handleSendRawEditedPuff} ),


                        React.DOM.br(null ),
                        React.DOM.input( {className:"btn-link", type:"button", value:"Publish puff", onClick:this.handlePublishPuff} ),

                        React.DOM.br(null ),
                        "username: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"contentPuffUsername", ref:"contentPuffUsername", value:username} ),React.DOM.br(null ),
                        "routes: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"contentPuffRoutes", ref:"contentPuffRoutes"} ),React.DOM.br(null ),
                        "previous: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"contentPuffPrevious", ref:"contentPuffPrevious"} ),React.DOM.br(null ),
                        "version: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"contentPuffVersion", ref:"contentPuffVersion"} ),React.DOM.br(null ),
                        "payload: ", React.DOM.br(null ),
                            "type: ", React.DOM.input( {className:"fixedLeft", type:"text", name:"contentPuffType", ref:"contentPuffType"} ),React.DOM.br(null ),
                            "content: ", React.DOM.br(null ),
                            React.DOM.textarea( {ref:"contentPuffContent", name:"contentPuffContent", rows:"5", cols:"50"}),React.DOM.br(null )



                    )
                )

            )
            )
    }
});

var PuffToolsPuffDisplay = React.createClass({displayName: 'PuffToolsPuffDisplay',
    getInitialState: function() {
        return {value: '', oldpuff: ''};
    },
    handleChange: function(event) {
        this.setState({value: event.target.value});
    },
    render: function() {
        if(this.state.oldpuff != this.props.puff) {
            this.state.value = formatForDisplay(this.props.puff, 'edit');
            this.state.oldpuff = this.props.puff;
        }


        if(this.props.style == 'edit') {
            var puffString = this.state.value;

            return (
                React.DOM.textarea( {ref:"puffString", name:"puffString", id:"puffString", cols:"50", value:puffString, onChange:this.handleChange} )
            )
        }

        // for raw or formatted styles:
        var puffString = formatForDisplay(this.props.puff, this.props.style);

        return (
            React.DOM.textarea( {ref:"puffString", name:"puffString", rows:"5", cols:"50", value:puffString})
            )
    }
});

var PuffRoots = React.createClass({displayName: 'PuffRoots',
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var puffs = PuffForum.getRootPuffs();

        puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        // puffs = puffs.slice(-1 * CONFIG.maxLatestRootsToShow);                    // don't show them all

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )

        // return <section id="children">{puffs.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllChildren = React.createClass({displayName: 'PuffAllChildren',
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var kids = PuffForum.getChildren(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )

        // return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllParents = React.createClass({displayName: 'PuffAllParents',
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var kids = PuffForum.getParents(this.props.puff);

        kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )

        // return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffTree = React.createClass({displayName: 'PuffTree',
    render: function() {

        var puff = this.props.puff;
        var parentPuffs = PuffForum.getParents(puff);
        var childrenPuffs = PuffForum.getChildren(puff);

        childrenPuffs.sort(function(a, b) {return b.payload.time - a.payload.time});
        childrenPuffs = childrenPuffs.slice(0, CONFIG.maxChildrenToShow);

        return (
            React.DOM.div(null, 
                React.DOM.section( {id:"parents"}, parentPuffs.map(globalCreatePuffBox)),
                React.DOM.section( {id:"main-content"}, PuffBox( {puff:puff} )),
                React.DOM.section( {id:"children"}, childrenPuffs.map(globalCreatePuffBox))
            )
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


var PuffTallTree = React.createClass({displayName: 'PuffTallTree',
    componentDidMount: function() {
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {

        var puff   = this.props.view.puff
        var mode   = this.props.view.mode
        var cols   = this.props.view.cols
        var sigfun = function(item) {return item.sig}
        
        // gather puffs
        var parentPuffs   = PuffForum.getParents(puff)
                                     .sort(function(a, b) {return b.payload.time - a.payload.time})

        var grandPuffs    = parentPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
        var greatPuffs    =  grandPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
  
            parentPuffs   = parentPuffs.concat(grandPuffs, greatPuffs)
                                       .filter(function(item, index, array) {return array.indexOf(item) == index}) 
                                       .slice(0, 5)
  
        var siblingPuffs  = PuffForum.getSiblings(puff)
                                     .sort(function(a, b) {return b.payload.time - a.payload.time})
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun)).indexOf(item.sig)})
                                     .slice(0, 6)
        var childrenPuffs = PuffForum.getChildren(puff)
                                     .sort(function(a, b) {return b.payload.time - a.payload.time})
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun), siblingPuffs.map(sigfun))
                                                            .indexOf(item.sig)})
                                     .slice(0, 5)
        
        // gridCoord params
        var screenwidth  = window.innerWidth - CONFIG.leftMargin;
        var screenheight = window.innerHeight
        // var cols = mode == 'browse' ? 5 : 8
        var rows = 4

        var gridbox = getGridCoordBox(rows, cols, screenwidth, screenheight)
        var standardBox  = applySizes(1, 1, gridbox, {mode: mode})
        var secondRowBox = applySizes(1, 1, gridbox, {mode: mode}, 1)
        var fourthRowBox = applySizes(1, 1, gridbox, {mode: mode}, 4)
        var stuckbigBox  = applySizes(2, 2, gridbox, {mode: mode}, 1, 0, 1, 0)
        
        var allPuffs = [].concat( [puff].map(stuckbigBox('focused'))
                                , parentPuffs.map(standardBox('parent'))
                                , siblingPuffs.map(secondRowBox('sibling'))
                                , childrenPuffs.map(fourthRowBox('child'))
                                )
                         .filter(function(x) {return x.width})                  // remove nodes that don't fit in the grid 
                         .sort(function(a, b) {                                 // sort required so React doesn't have to 
                             if(a.puff.sig+'' < b.puff.sig+'') return -1;       // remove and re-add DOM nodes in order to
                             if(a.puff.sig+'' > b.puff.sig+'') return 1;        // order them properly
                             return 0; })
                             // return a.puff.sig+'' < b.puff.sig+'' ? 1 : a.puff.sig+'' == b.puff.sig+'' ? 0 : -1})
        
        /*
            - resize in place
            - draw arrows
        
        
                <ReactCSSTransitionGroup transitionName="example">
                    {puffBoxList}
                </ReactCSSTransitionGroup>
        
        
        
        
        
        
                <svg width={screenwidth} height={screenheight} style={{position:'absolute', top:'0px', left:'0px'}}>
                    <defs dangerouslySetInnerHTML={{__html: '<marker id="triangle" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>'}} ></defs>
                    {puffBoxList.map(function(puffbox) {
                        return <Arrow key={'arrow-'+puffbox.props.key+puffbox.props.stats.x+puffbox.props.stats.y} x1={screenwidth} y1={screenheight} x2={puffbox.props.stats.x} y2={puffbox.props.stats.y} />
                    })}
                    
                </svg>
        
        */
        
        // debugger;
        
        
        var puffBoxList = allPuffs.map(globalCreateFancyPuffBox)

        return (
            React.DOM.div(null, 
                React.DOM.div( {id:"talltree"}, 
                    puffBoxList
                )
            )
        );
    }
})

var Arrow =  React.createClass({displayName: 'Arrow',
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {
        
        
        var result = (
            React.DOM.line( {x1:this.props.x1, y1:this.props.y1, x2:this.props.x2, y2:this.props.y2, stroke:"black", strokeWidth:"10", dangerouslySetInnerHTML:{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}} 
                
            )
        )
        
        return result
    }
})
 

globalCreateFancyPuffBox = function(puffplus) {
    var puff = puffplus.puff
    var className = puffplus.className
    var stats = puffplus
    return PuffFancyBox( {puff:puff, key:puff.sig, extraClassy:className, stats:stats} )
}

var PuffFancyBox = React.createClass({displayName: 'PuffFancyBox',
    render: function() {
        var puff = this.props.puff
        var className = 'block ' + (this.props.extraClassy || '')
        var style = {}
        var stats = this.props.stats
        var mode = stats.mode
        var width = stats.width
        var height = stats.height
        var top = stats.y
        var left = stats.x + CONFIG.leftMargin
        
        var offset = 30
        if(mode == 'arrows') {
            width -= offset
            height -= offset
            top += offset/2
            left += offset/2
        }
        
        if(stats)
            style = {position: 'absolute', width: width, height: height, left: left, top: top }
        
        return (
            React.DOM.div( {className:className, id:puff.sig, key:puff.sig, style:style}, 
                PuffAuthor( {username:puff.username} ),
                PuffContent( {puff:puff} ),
                PuffBar( {puff:puff} )
            )
            );
    }
});



var PuffBox = React.createClass({displayName: 'PuffBox',
    render: function() {
        var puff = this.props.puff

        return (
            React.DOM.div( {id:puff.sig, key:puff.sig, className:"block"}, 
                PuffAuthor( {username:puff.username} ),
                PuffContent( {puff:puff} ),
                PuffBar( {puff:puff} )
            )
            );
    }
});

var PuffAuthor = React.createClass({displayName: 'PuffAuthor',
    render: function() {
        var username = humanizeUsernames(this.props.username)

        return (
            React.DOM.div( {className:"author"}, username)
            );
    }
});

var PuffContent = React.createClass({displayName: 'PuffContent',
    handleClick: function() {
        var puff = this.props.puff
        showPuff(puff)
    },
    render: function() {
        var puff = this.props.puff
        var puffcontent = PuffForum.getProcessedPuffContent(puff)
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return React.DOM.div( {className:"txt", onClick:this.handleClick, dangerouslySetInnerHTML:{__html: puffcontent}})
    }
});

var PuffBar = React.createClass({displayName: 'PuffBar',
    render: function() {
        var puff = this.props.puff
        return (
            React.DOM.div( {className:"bar"}, 
                PuffInfoLink( {puff:puff} ),
                PuffChildrenCount( {puff:puff} ),
                PuffParentCount( {puff:puff} ),
                PuffPermaLink( {sig:puff.sig} ),
                PuffReplyLink( {sig:puff.sig} )
            )
            );
    }
});


var PuffInfoLink = React.createClass({displayName: 'PuffInfoLink',
    handleClick: function() {
        var puff = this.props.puff;
        var date = new Date(puff.payload.time);
        var formattedTime = 'Created ' + timeSince(date) + ' ago';
        var lisc = puff.payload.license ? '\n' + 'License: ' + puff.payload.license : '';
        var photographer = puff.photographer ? '\n' + 'Photographer: ' + puff.photographer : '';
        var version = '\n' + 'Version: ' + puff.version;
        var altText = formattedTime + ' ' + lisc + ' ' + photographer + ' ' + version;

        alert(altText);
        return false;
    },

    render: function() {


        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-info fa-fw"})
                )
            )
            );
    }
});

var PuffParentCount = React.createClass({displayName: 'PuffParentCount',
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', {'view.style': 'PuffAllParents', 'view.puff': puff})
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                    parents.length,React.DOM.i( {className:"fa fa-male fa-fw"})
                )
            )
            );
    }
});

var PuffChildrenCount = React.createClass({displayName: 'PuffChildrenCount',
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/children', {'view.style': 'PuffAllChildren', 'view.puff': puff})
        // viewAllChildren(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                    children.length,React.DOM.i( {className:"fa fa-child fa-fw"})
                )
            )
            );
    }
});

var PuffPermaLink = React.createClass({displayName: 'PuffPermaLink',
    handleClick: function() {
        var sig  = this.props.sig;
        var puff = PuffForum.getPuffById(sig);
        showPuff(puff);
    },
    render: function() {
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-link fa-fw"})
                )
            )
            );
    }
});

var PuffReplyLink = React.createClass({displayName: 'PuffReplyLink',
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
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-reply fa-fw"})
                )
            )
            );
    }
});

var PuffReplyForm = React.createClass({displayName: 'PuffReplyForm',
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
            React.DOM.div(null, 
                React.DOM.textarea( {id:"content", ref:"content", name:"content", rows:"15", cols:"50", placeholder:"Add your content here. Click on the reply buttons of other puffs to reply to these."})
            )
            )

        if(type == 'image') {
            typeFields = (
                React.DOM.div(null, 
                    React.DOM.p(null, 
                        React.DOM.label( {htmlFor:"imageLoader"}, "Image File:"),
                        React.DOM.input( {type:"file", id:"imageLoader", name:"imageLoader", ref:"imageLoader", onChange:this.handleImageLoad} )
                    ),
                    React.DOM.p(null, 
                        React.DOM.label( {htmlFor:"imageLicense"}, "Image License:"),
                        React.DOM.select( {id:"imageLicense", name:"imageLicense", ref:"imageLicense"}, 
                            React.DOM.option( {value:"Creative Commons Attribution"}, "Creative Commons Attribution"),
                            React.DOM.option( {value:"GNU Public License"}, "GNU Public License"),
                            React.DOM.option( {value:"Public domain"}, "Public domain"),
                            React.DOM.option( {value:"Rights-managed"}, "Rights-managed"),
                            React.DOM.option( {value:"Royalty-free"}, "Royalty-free")
                        )
                    ),
                    React.DOM.img( {src:this.state.imageSrc, id:"preview_image"} )
                )
                )
        }
        else if(type == 'bbcode') {
            typeFields = (
                React.DOM.div(null, 
                    typeFields,
                    React.DOM.p(null, "You can use BBCode-style tags")
                )
                )
        }

        return (
            React.DOM.div( {id:"replyForm", className:"mainForm"}, 

                React.DOM.div( {id:"authorDiv"}, username),
                React.DOM.form( {id:"otherContentForm", onSubmit:this.handleSubmit}, 
                    
                    typeFields,

                    React.DOM.select( {ref:"type", className:"btn", onChange:this.handlePickType}, 
                        contentTypeNames.map(function(type) {
                            return React.DOM.option( {key:type, value:type}, type)
                        })
                    ),

                    React.DOM.input( {id:"cancelreply", className:"btn", type:"reset", value:"cancel", onClick:this.handleCancel}),
                    React.DOM.input( {type:"submit", className:"btn", value:"GO!"} )
                )
            )
            );
    }
});

var PuffHeader = React.createClass({displayName: 'PuffHeader',
    handleClick: function() {
        if(this.props.menu.show)
            return events.pub('ui/menu/close', {'menu': puffworlddefaults.menu})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.img( {onClick:this.handleClick, src:"img/puffballIconBigger.png", id:"puffballIcon", height:"48", width:"41", className:this.props.menu.show ? 'menuOn' : ''} )
            )
            );
    }
});

var PuffFooter = React.createClass({displayName: 'PuffFooter',
    render: function() {
        return (
            React.DOM.div( {className:"footer"}, 
                React.DOM.div( {className:"footerText"}, 
                "Powered by ", React.DOM.a( {href:"http://www.puffball.io", className:"footerText"}, "puffball"),"."+' '+
                "Responsibility for all content lies with the publishing author and not this website."
                )
            )
            );
    }
});

var PuffMenu = React.createClass({displayName: 'PuffMenu',
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
            React.DOM.div( {className:"menuItem"}, 
                React.DOM.a( {href:"#", onClick:this.handleLearnMore, className:"under"}, 
                "Learn more about FreeBeer!"
                )
            )
            );

        // Machine preferences
        var prefs = PuffPrefs( {prefs:this.props.prefs} )

        if(!this.props.menu.prefs) {
            prefs = (
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowPrefs, id:"show_prefs", className:"under"}, "Preferences")
                )
                );
        }

        // Identity profile
        var profile = PuffProfile( {profile:this.props.profile} )

        if(!this.props.menu.profile) {
            profile = (
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowProfile, id:"show_profile", className:"under"}, "Profile")
                )
                );
        }

        // no current user
        var username = PuffWardrobe.getCurrentUsername()
        var username = humanizeUsernames(username) || ''

        if(!username) {
            // prefs = <div></div>
            profile = React.DOM.div(null)
        }

        return (
            React.DOM.div( {className:"menu", id:"menu"}, 

                React.DOM.div( {id:"closeDiv"}, 
                    React.DOM.a( {href:"#", onClick:this.handleClose, className:"under"}, 
                        React.DOM.img( {src:"img/close.png", width:"24", height:"24"} )
                    )
                ),
                React.DOM.img( {src:"img/logo.gif", alt:"FreeBeer! logo", height:"63", className:"logo"} ),React.DOM.br(null ),
            "DISPLAY: ", React.DOM.br(null ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleViewRoots, className:"under"}, "View latest")
                ),

            "CONTENT: ", React.DOM.br(null ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleNewContent, className:"under"}, "Add new")
                ),

            "TOOLS",React.DOM.br(null ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handlePackPuffs, className:"under"}, "Puff builder")
                ),

                React.DOM.br(null ),
            "IDENTITY: ", React.DOM.br(null ),
                PuffUserMenu( {user:this.props.menu.user} ),
                
                prefs,
                
                profile
            )
            );
    }
});


var PuffPrefs = React.createClass({displayName: 'PuffPrefs',
    handleStoreusers: function() {
        return events.pub('prefs/storeKeychain/toggle')
    },
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.input( {type:"checkbox", ref:"storeKeychain", name:"storeKeychain", onChange:this.handleStoreusers, checked:this.props.prefs.storeKeychain} ),
                "Store identities on this machine"
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.p(null, "Number of puffs to show in root view"),
                    React.DOM.p(null, "Default view")
                )
            )
            );
    }
});

var PuffProfile = React.createClass({displayName: 'PuffProfile',
    handleStoreusers: function() {
        return events.pub('profile/nickname/set', this.refs.nickname.state.value)
    },
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.input( {type:"checkbox", ref:"nickname", name:"nickname", onChange:this.handleSetNickname, checked:this.props.profile.nickname} ),
                "Set nickname"
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.p(null, "Identity avatar"),
                    React.DOM.p(null, "More profile")
                )
            )
            );
    }
});


var PuffUserMenu = React.createClass({displayName: 'PuffUserMenu',
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
        var add_user = PuffAddUser( {user:this.props.user} )

        if(!this.props.user.show_add) {
            add_user = (
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowAdd, id:"show_add", className:"under"}, "Add an identity")
                )
                );
        }

        // User Management
        var manage_user = PuffManageUser( {user:this.props.user} )

        if(!this.props.user.manage && username) {
            manage_user = (
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowManage, id:"show_manage", className:"under"}, "Identity management")
                )
                );
        }

        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"},  
                    username ? React.DOM.span(null, "Posting as ", username, " " )
                        : React.DOM.span(null, "No current identity"),
                              
                     (all_usernames.length && !this.props.user.pick_one)
                        ? React.DOM.a( {onClick:this.handlePickOne, className:"under"}, "(change)")
                        : '' 
                ),

                this.props.user.pick_one ? PuffSwitchUser(null ) : '',

                add_user,
                
                manage_user
            )
            );
    }
});

var PuffSwitchUser = React.createClass({displayName: 'PuffSwitchUser',
    handleUserPick: function() {
        PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide', {'menu.user.pick_one': false})
    },
    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())
        
        if(!all_usernames.length) return React.DOM.div(null)
        
        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)

        return (
            React.DOM.div( {className:"menuItem"}, 
            "Change user:",
                React.DOM.select( {ref:"switcher", onChange:this.handleUserPick, value:username}, 
                    all_usernames.map(function(username) {
                        return React.DOM.option( {key:username, value:username}, username)
                    })
                )
            )
            );
    }
});

var PuffAddUser = React.createClass({displayName: 'PuffAddUser',
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
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.form( {id:"setUserInfo", onSubmit:this.handleUserAuth}, 
                        React.DOM.p(null, "Authenticate with an existing identity"),
                        React.DOM.p(null, "Identity: ", React.DOM.input( {type:"text", ref:"username"} )),
                        React.DOM.p(null, "Private Key: ", React.DOM.input( {type:"text", ref:"privkey"} )),
                        React.DOM.p(null, React.DOM.input( {type:"submit", value:"set"} )),
                        React.DOM.small(null, 
                        "Your private key is never sent over the network. Keep it secret. Keep it safe."
                        )
                    )
                )
                );
        }

        // Create new identity
        if(this.props.user.add_new) {
            return (
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.form( {id:"setUserInfo", onSubmit:this.handleUserCreate}, 
                        React.DOM.p(null, "Create a new identity"),
                        React.DOM.p(null, "Identity: ", React.DOM.input( {type:"text", ref:"username"} )),
                        React.DOM.p(null, "Private Key: ", React.DOM.input( {type:"text", ref:"privkey"} )),
                        React.DOM.p(null, React.DOM.input( {type:"submit", value:"set"} )),
                        React.DOM.small(null, 
                        "Your identity must consist of 33 or more alphanumeric characters."+' '+
                        "Your identity signs each piece of content that you create."+' '+
                        "If the content is modified your identity will no longer match its signature."+' '+
                        "Your private key is never sent over the network. Keep it secret. Keep it safe."
                        )
                    )
                )
                );
        }

        // Regular menu
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowAddOne, id:"add_local", className:"under"}, "Add existing identity")
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleNewAnon, id:"add_anon", className:"under"}, "Create anonymous identity")
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowAddNew, id:"add_new", className:"under"}, "Create new identity")
                )
            )
            );
    }
});

var PuffManageUser = React.createClass({displayName: 'PuffManageUser',
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

        var qrCode = ''
        var myKeyStuff = ''
        var blockchainLink = ''

        var props = this.props.user
        
        var username = PuffWardrobe.getCurrentUsername()
        if(!username) return React.DOM.div(null)

        var privateKeys = PuffWardrobe.getCurrentKeys() || {}
        var myPrivateKey = privateKeys.default || privateKeys.admin || privateKeys.root || '' // derp
        
        var userRecord = PuffWardrobe.getCurrentUserRecord() 
        if(!userRecord)
            return React.DOM.div(null)

        if(props.show_key) {
            myKeyStuff = React.DOM.div(null, React.DOM.p(null, "public key: ", React.DOM.br(null ),userRecord.defaultKey),React.DOM.p(null, "private key: ", React.DOM.br(null ),myPrivateKey))

            var msg = myPrivateKey.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');

            var qr = qrcode(4, 'M');
            qr.addData(msg);
            qr.make();

            var image_data = qr.createImgTag() || {}
            var data = 'data:image/gif;base64,' + image_data.base64
            qrCode = React.DOM.img( {src:data, width:image_data.width, height:image_data.height} )
        }

        if(props.show_bc) {
            if(!username) return false

            var allPuffs = Puffball.Data.getMyPuffChain(username)
            var linkData = encodeURIComponent(JSON.stringify(allPuffs))
            var data = 'data:text/plain;charset=utf-8,' + linkData
            blockchainLink = React.DOM.a( {download:"blockchain.json", href:data, className:"under"}, "DOWNLOAD BLOCKCHAIN")
        }

        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleRemoveUser, className:"under"}, "Remove identity from this machine")
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowKeys, className:"under"}, "View this identity's keys")
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowBlockchainLink, className:"under"}, "Download this identity's blockchain")
                ),
                
                 qrCode         ? React.DOM.div( {className:"menuItem"}, qrCode) : '', 
                 myKeyStuff     ? React.DOM.div( {className:"menuItem"}, myKeyStuff) : '', 
                 blockchainLink ? React.DOM.div( {className:"menuItem"}, blockchainLink) : '' 
            )
            );
    }
});



// bootstrap
renderPuffWorld()



