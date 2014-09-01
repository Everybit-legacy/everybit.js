/** @jsx React.DOM */
/*

 PUFFBALL DECENTRALIZED PUBLISHING PLATFORM
 @2014 UNDER MIT LICENSE
 CONTACT USER .PUFFBALL ON THE PLATFORM

 */

var PuffToolsPuffDisplay = React.createClass({
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
                <textarea ref="puffString" name="puffString" id="puffString" cols="50" value={puffString} onChange={this.handleChange} />
            )
        }

        // for raw or formatted styles:
        var puffString = formatForDisplay(this.props.puff, this.props.style);

        return (
            <textarea ref="puffString" name="puffString" rows="5" cols="50" value={puffString}></textarea>
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
        return events.pub('ui/puff-packer/close', {'view.mode': 'list'})
    },

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value;
        var self = this;

        var prom = PB.getUserRecord(username);

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
        var rootKey = PB.Crypto.generatePrivateKey();
        var adminKey = PB.Crypto.generatePrivateKey();
        var defaultKey = PB.Crypto.generatePrivateKey();

        this.refs.rootKeyPrivate.getDOMNode().value = rootKey;
        this.refs.adminKeyPrivate.getDOMNode().value = adminKey;
        this.refs.defaultKeyPrivate.getDOMNode().value = defaultKey;

        this.refs.rootKeyPublic.getDOMNode().value = PB.Crypto.privateToPublic(rootKey);
        this.refs.adminKeyPublic.getDOMNode().value = PB.Crypto.privateToPublic(adminKey);
        this.refs.defaultKeyPublic.getDOMNode().value = PB.Crypto.privateToPublic(defaultKey);
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

        var privateKeys = PB.M.PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.state.result = {"FAIL": "You must set your identity before building registration requests."};
            return events.pub('ui/puff-packer/user-registration/error', {});
        }

        this.state.result = {};

        var puff = PB.buildPuff(privateKeys.username, privateKeys.admin, routes, type, content, payload);
        // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

        var self = this;
        self.state.puff = puff;
        return events.pub('ui/puff-packer/build-register-puff', {});
    },


    handleBuildModifyUserKeysPuff: function() {
        // Stuff to register. These are public keys

        var currentUser = PB.M.PuffWardrobe.getCurrentUsername();
        if(!currentUser) {
            this.state.result = {"FAIL": "You must set your identity before building a request to modify keys."}
            return events.pub('ui/puff-packer/user-modify-keys/error', {});
        }

        var payload = {};
        var rootKey = PB.M.PuffWardrobe.getCurrentKeys().root;
        var adminKey = PB.M.PuffWardrobe.getCurrentKeys().admin;
        var defaultKey = PB.M.PuffWardrobe.getCurrentKeys().default;
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'modifyUserKey';

        // What key do they want to modify?
        var keyToModify = this.refs.keyToModify.getDOMNode().value;
        payload.keyToModify = keyToModify;

        var newKey = this.refs.newKey.getDOMNode().value;
        payload.newKey = newKey;

        payload.time = Date.now();

        var privateKeys = PB.M.PuffWardrobe.getCurrentKeys();


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

        var puff = PB.buildPuff(currentUser, signingUserKey, routes, type, content, payload);
        // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

        var self = this;
        self.state.puff = puff;
        return events.pub('ui/puff-packer/build-register-puff', {});
    },

    handleSendPuffToServer: function() {
        // Send the contents of the puff off to userApi with type=updateUsingPuff and post['puff']
        var puff = this.state.puff;
        var self = this;

        var prom = PB.Net.updateUserRecord(puff)

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

        var pprom = PB.Net.updateUserRecord(puffString);

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
        var username = PB.M.PuffWardrobe.getCurrentUsername();
        var self = this;

        var prom = PB.getUserRecord(username);

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

        var privateKeys = PB.M.PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.state.result = {"FAIL": "You must set your identity before building set latest request."}
            return events.pub('ui/puff-packer/user-set-latest/error', {});
        }

        this.state.result = {}

        var puff = PB.buildPuff(privateKeys.username, privateKeys.default, routes, type, content, payload);

        var self = this;
        self.state.puff = puff;
        return events.pub('ui/puff-packer/build-register-puff', {});

        return events.pub('ui/puff-packer/set-puff-style', {'tools.users.puffstyle': 'raw'});
    },

    handleSetIdentityToAnon: function() {
        PB.M.PuffWardrobe.storePrivateKeys('anon', 0, CONFIG.users.anon.adminKey, 0);
        PB.M.PuffWardrobe.switchCurrent('anon');
        events.pub('ui/puff-packer/set-identity-to-anon', {});
        // var keys = PB.buildKeyObject(0, CONFIG.users.anon.adminKey, 0);
        // PB.M.PuffWardrobe.addUserReally('anon', keys);
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
        var username    = PB.M.PuffWardrobe.getCurrentUsername();
        var result = formatForDisplay(this.state.result, this.props.tools.users.resultstyle);
        var setIdentityField = (<div>To register new sub-usernames, you will need to set your identity first. You will also need to set keys for the new user.<br />

                        <PuffSwitchUser />
                        <input className="btn-link" type="button" value="Set identity to anon" onClick={this.handleSetIdentityToAnon} /><br /><br />
                        </div>);


        // var params = getQuerystringObject();
        var params = getStashedKeysFromURL();
        var importUser = false;
        var requestedUsername = username;
        if (params['requestedUsername']) {
            // Check if import username

            // Request has to come from anon user
            this.handleSetIdentityToAnon();
            importUser  = true;
            requestedUsername = StringConversion.reduceUsernameToAlphanumeric(params['requestedUsername']);
            // TODO: don't mutate props!
            this.props.importToken = params['token'];
            this.props.importId = params['requestedUserId'];
            this.props.importNetwork = params['network'];
            setIdentityField = "";
        }
        var disabled = importUser ? "disabled" : "";

        // Where is our menu?
        var menuSideSpace = CONFIG.menuWidth + 20;
        var nonMenuSideSpace = 10;

        if(CONFIG.menuRight) {
            var rightSpacing = menuSideSpace + 'px';
            var leftSpacing = nonMenuSideSpace + 'px';
        } else {
            var leftSpacing = menuSideSpace + 'px';
            var rightSpacing = nonMenuSideSpace + 'px'
        }

        var width = window.innerWidth - menuSideSpace - nonMenuSideSpace;
        width = width < CONFIG.minWidthAdvancedTools ? CONFIG.minWidthAdvancedTools : width;

        var styleInfo = {
                            left: leftSpacing,
                            right: rightSpacing,
                            width: width
                        }

        return (
            <div id="adminForm" style={styleInfo}>
                <form id="PuffPacker">
                    <div className="closeBox">
                        <a href="#" onClick={this.handleClose}><i className="fa fa-fw fa-times-circle" />
                        </a>
                    </div>
                    <div className="col1">
                        <div className="menuHeader">Advanced tools</div>
                        <br />
                        username:
                        <input className="fixedLeft" type="text" name="username" ref="username" defaultValue={requestedUsername} disabled={disabled}/> <br />
                        <input className="btn-link" type="button" value="Lookup" onClick={this.handleUsernameLookup} />

                        <input className="btn-link" type="button" value="Build registration request" onClick={this.handleBuildRegisterUserPuff} /><br />

                        Import from: <select id="import" ref="import">
                                <option value="instagram">Instagram</option>
                                <option value="reddit">Reddit</option>
                            </select>{' '}<input className="btn-link" type="button" value="Go" onClick={this.handleImport} /><br />

                        <b>Current identity:</b> <span className="authorSpan">{username}</span><br />
                        {setIdentityField}

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


                    Key to modify: <br /><select id="keyToModify" ref="keyToModify">
                        <option value="defaultKey">default</option>
                        <option value="adminKey"  >admin</option>
                        <option value="rootKey"   >root</option>
                    </select><br />
                    New PUBLIC key: <br /><input className="fixedLeft" type="text" name="newKey" ref="newKey" /><br />
                        <a href="#" onClick={this.handleBuildModifyUserKeysPuff}>Build modify user keys DHT puff</a>

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
                           {' | '}
                        <a href="#" onClick={this.handleShowPuffEdit}>Edit</a>
                        <br />
                        <PuffToolsPuffDisplay style={this.props.tools.users.puffstyle} puff={this.state.puff} />
                        <br />

                        <input className="btn-link" type="button" value="Send user request" onClick={this.handleSendPuffToServer} />

                        <input className="btn-link" type="button" value="Send EDITED puff user request" onClick={this.handleSendRawEditedPuff} />


                        <br />
                        <input className="btn-link" type="button" value="Publish puff" onClick={this.handlePublishPuff} />

                        <br />
                    username: <input className="fixedLeft" type="text" name="contentPuffUsername" ref="contentPuffUsername" value={username} /><br />
                    routes: <input className="fixedLeft" type="text" name="contentPuffRoutes" ref="contentPuffRoutes" /><br />
                    previous: <input className="fixedLeft" type="text" name="contentPuffPrevious" ref="contentPuffPrevious" /><br />
                    version: <input className="fixedLeft" type="text" name="contentPuffVersion" ref="contentPuffVersion" /><br />
                    payload: <br />
                    type: <input className="fixedLeft" type="text" name="contentPuffType" ref="contentPuffType" /><br />
                    content: <br />
                        <textarea ref="contentPuffContent" name="contentPuffContent" rows="5" cols="50"></textarea><br />



                    </div>
                </form>

            </div>
            )
    }
});

var PuffSwitchUser = React.createClass({
    handleUserPick: function() {
        PB.M.PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide', {'menu.user.pick_one': false})
    },
    render: function() {
        var all_usernames = Object.keys(PB.M.PuffWardrobe.getAll())

        if(!all_usernames.length) return <div></div>

        var username = PB.M.PuffWardrobe.getCurrentUsername()

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

// END ADVANCED TOOLS
