/** @jsx React.DOM */


// BEGIN ADVANCED TOOLS

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


var PuffPacker = React.createClass({displayName: 'PuffPacker',

    getInitialState: function() {
        return { result: {}
            , latest: ''
            ,   puff: {}
        };
    },

    handleClose: function() {
        return events.pub('ui/puff-packer/close', {'view.mode': 'list'})
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

        // import
        if (this.props.importNetwork) payload.importNetwork = this.props.importNetwork;
        if (this.props.importToken) payload.importToken = this.props.importToken;
        if (this.props.importId) payload.importId = this.props.importId; 

        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        payload.time = Date.now();

        payload.requestedUsername = this.refs.username.getDOMNode().value;

        var privateKeys = PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.state.result = {"FAIL": "You must set your identity before building registration requests."};
            return events.pub('ui/puff-packer/user-registration/error', {});
        }

        this.state.result = {};

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
        PuffWardrobe.storePrivateKeys('anon', 0, CONFIG.anon.privateKeyAdmin, 0);
        PuffWardrobe.switchCurrent('anon');
        events.pub('ui/puff-packer/set-identity-to-anon', {});
        // var keys = Puffball.buildKeyObject(0, CONFIG.anon.privateKeyAdmin, 0);
        // PuffWardrobe.addUserReally('anon', keys);
    },
    handleImport: function() {
        var network = this.refs.import.getDOMNode().value;
        UsernameImport[network].requestAuthentication();
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
        var setIdentityField = (React.DOM.div(null, "To register new sub-usernames, you will need to set your identity first. You will also need to set keys for the new user.",React.DOM.br(null ),

                        PuffSwitchUser(null ),
                        React.DOM.input( {className:"btn-link", type:"button", value:"Set identity to anon", onClick:this.handleSetIdentityToAnon} ),React.DOM.br(null ),React.DOM.br(null )
                        ));


        // var params = getQuerystringObject();
        var params = getStashedKeysFromURL();
        var importUser = false;
        var requestedUsername = username;
        if (params['requestedUsername']) {
            // Check if import username

            // Request has to come from anon user
            this.handleSetIdentityToAnon();
            importUser  = true;
            requestedUsername = reduceUsernameToAlphanumeric(params['requestedUsername']);
            // TODO: don't mutate props!
            this.props.importToken = params['token'];
            this.props.importId = params['requestedUserId'];
            this.props.importNetwork = params['network'];
            setIdentityField = "";
        }
        var disabled = importUser ? "disabled" : "";

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
                        React.DOM.input( {className:"fixedLeft", type:"text", name:"username", ref:"username", defaultValue:requestedUsername, disabled:disabled}), " ", React.DOM.br(null ),
                        React.DOM.input( {className:"btn-link", type:"button", value:"Lookup", onClick:this.handleUsernameLookup} ),

                        React.DOM.input( {className:"btn-link", type:"button", value:"Build registration request", onClick:this.handleBuildRegisterUserPuff} ),React.DOM.br(null ),

                        "Import from: ", React.DOM.select( {id:"import", ref:"import"}, 
                                React.DOM.option( {value:"instagram"}, "Instagram"),
                                React.DOM.option( {value:"reddit"}, "Reddit")
                            ),' ',React.DOM.input( {className:"btn-link", type:"button", value:"Go", onClick:this.handleImport} ),React.DOM.br(null ),

                        React.DOM.b(null, "Current identity:"), " ", React.DOM.span( {className:"authorSpan"}, username),React.DOM.br(null ),
                        setIdentityField,

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

// END ADVANCED TOOLS
