/** @jsx React.DOM */

// TODO: Add transitions when parts of the menu show or hide

puffworldprops = {
    menu: {
        show: false,
        identity: {
            showAdd: false
        }
    }
}

// it's immutable so we don't care
puffworlddefaults = puffworldprops;


var PuffWorld = React.createClass({

    render: function() {
        return (
            <div>
                <Menu />
                <Tools />
                <Main />
             </div>
            )
    }
});

var Menu = React.createClass({
    render: function() {
        return (
            <div>
                <PuffIcon />
                <MenuList />
            </div>
        )
    }
});

var PuffIcon = React.createClass({
    render: function() {
        return <img src={"img/puffballIcon.png"} height="32" />
    }
})

var MenuList = React.createClass({
    render: function() {
        return (
            <div className="menu">
                <Identity />
                <Publish />
                <View />
            </div>
            )
    }
})

var Identity = React.createClass({
    getInitialState: function() {
        return {
            username: PuffWardrobe.getCurrentUsername(),
            showUserRootPrivateKey: false,
            showUserAdminPrivateKey: false,
            showUserDefaultPrivateKey: false,
            showSetIdentity: false,
            showNewIdentity: false
        }
    },

    componentWillMount: function() {
        if (!this.state.username) {
            var prom = PuffWardrobe.storePrivateKeys('anon', 0, CONFIG.anon.privateKeyAdmin, 0);
            prom.then(function() {
                PuffWardrobe.switchCurrent('anon');
                events.pub('ui/puff-packer/set-identity-to-anon', {});
            })

            this.setState({username: 'anon'});

        }
    },


    render: function() {
        var cx1 = React.addons.classSet;
        var newClass = cx1({
            'linkTabHighlighted': this.state.showNewIdentity,
            'linkTab': !this.state.showNewIdentity
        });

        var cx2 = React.addons.classSet;
        var editClass = cx2({
            'linkTabHighlighted': this.state.showSetIdentity,
            'linkTab': !this.state.showSetIdentity
        });


        // TODO: Pulldown to select users if logged in
        // TODO: Logout button if logged in
        // TODO: Logout button sets alert, clears username
        // TODO: Help icon takes you to tutorial related to this.
        // TODO: Change EDIT to SELECT or AUTHENTICATE



        return (
            <div>
                <div className="menuHeader"><div className="fa fa-user"></div> Identity</div>
                <p><div className="menuLabel">Current identity: </div>
                    <div className="authorDiv">{this.state.username ? this.state.username : 'None'}</div><br />
                    <div className={editClass} onClick={this.toggleShowSetIdentity}><i className="fa fa-pencil fa-fw" onClick={this.toggleShowSetIdentity}></i>Set </div>
                    <div className={newClass} onClick={this.toggleShowNewIdentity}><i className="fa fa-plus fa-fw"></i>New </div>
                </p>
                <NewIdentity show={this.state.showNewIdentity} />
                <SetIdentity show={this.state.showSetIdentity} />
            </div>
            )
    },

    toggleShowSetIdentity: function() {
        if(this.state.showSetIdentity) {
            this.setState({showSetIdentity: false});
        } else {
            this.setState({showSetIdentity: true});
            this.setState({showNewIdentity: false});
        }
    },

    toggleShowNewIdentity: function() {
        if(this.state.showNewIdentity) {
            this.setState({showNewIdentity: false});
        } else {
            this.setState({showNewIdentity: true});
            this.setState({showSetIdentity: false});
        }
    }
});

var NewIdentity = React.createClass({
    getInitialState: function() {
        return {
            usernameAvailable: 'unknown',
            rootKeyMessage: '',
            adminKeyMessage: '',
            defaultKeyMessage: '',
            usernameMessage: '',
            newUsername: ''
        }
    },

    // TODO: Add save keys abilities
    // TODO: Add to advanced tools <UsernameCheckbox show={this.state.usernameAvailable} />
    render: function() {
        if (!this.props.show) {
            return <div></div>
        } else {

            return (
                <div className="menuSection">

                    <div className="menuLabel"><em>Desired username:</em></div><br />

                    <div className="menuInput">
                        <input type="text" name="newUsername" ref="newUsername" readOnly  value={this.state.newUsername} size="12" /> <a href="#" onClick={this.handleGenerateUsername}><i className="fa fa-refresh fa-fw" rel="tooltip" title="Generate a new username"></i></a> <i className="fa fa-question-circle fa-fw" rel="tooltip" title="Right now, only anonymous usernames can be registered. To be notified when regular usernames become available, send a puff with .puffball in your zones"></i>
                    </div>

                    <br />
                    <br />
                    <div className="menuHeader"><i className="fa fa-unlock-alt"></i> Public Keys</div>


                    <div className="menuLabel"><sup>*</sup>root: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKeyPublic" ref="rootKeyPublic" size="18" />
                    </div>
                    <br />
                    
                    <div className="menuLabel"><sup>*</sup>admin: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKeyPublic" ref="adminKeyPublic" size="18" />
                    </div>

                    <br />
                    
                    <div className="menuLabel"><sup>*</sup>default: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKeyPublic" ref="defaultKeyPublic" size="18" />
                    </div>

                    <br />


                    <a href="#" onClick={this.handleGeneratePrivateKeys} >Generate</a> or <a href="#" onClick={this.handleConvertPrivatePublic} >Private<span className="fa fa-long-arrow-right fa-fw"></span>Public</a><br />



                    <em>{this.state.rootKeyMessage} {this.state.adminKeyMessage} {this.state.defaultKeyMessage}</em>
                    <br />
                    <div className="menuHeader"><i className="fa fa-lock"></i> Private Keys</div>
                    <div className="menuLabel">root: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKeyPrivate" ref="rootKeyPrivate" size="18" />
                    </div>
                    <br />

                    <div className="menuLabel">admin: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKeyPrivate" ref="adminKeyPrivate" size="18" />
                    </div>
                    <br />

                    <div className="menuLabel">default: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKeyPrivate" ref="defaultKeyPrivate" size="18" />
                    </div>

                    <br />

                    <input className="btn-link" type="button" value="Submit username request" onClick={this.handleUsernameRequest} /><br />
                    <em>{this.state.usernameMessage}</em>
                </div>
                )
        }
    },

    handleGenerateUsername: function() {

        var generatedName = 'anon.' + PuffWardrobe.generateRandomUsername();
        this.setState({newUsername: generatedName});
    },

    componentWillMount: function() {
        this.handleGenerateUsername();
    },

    handleUsernameRequest: function() {

        // BUILD REQUEST
        console.log("BEGIN username request for ", this.refs.newUsername.getDOMNode().value);

        // Stuff to register. These are public keys
        var payload = {};
        payload.rootKey = this.refs.rootKeyPublic.getDOMNode().value;
        payload.adminKey = this.refs.adminKeyPublic.getDOMNode().value;
        payload.defaultKey = this.refs.defaultKeyPublic.getDOMNode().value;
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        payload.time = Date.now();
        payload.requestedUsername = this.refs.newUsername.getDOMNode().value;

        var privateKeys = PuffWardrobe.getCurrentKeys();

        if(!privateKeys.username) {
            this.setState({usernameMessage: "You must set your identity before building registration requests."});
            // this.state.result = {"FAIL": "You must set your identity before building registration requests."}
            return events.pub('ui/puff-packer/user-registration/error', {});
        }

        var puff = Puffball.buildPuff(privateKeys.username, privateKeys.admin, routes, type, content, payload);
        // NOTE: we're skipping previous, because requestUsername-style puffs don't use it.

        var self = this;
        self.state.puff = puff;
        events.pub('ui/puff-packer/build-register-puff', {});

        // SUBMIT REQUEST
        this.handleSendPuffToServer(puff);

        // this.setState({usernameMessage: result});
    },

    handleSendPuffToServer: function(puff) {
        // Send the contents of the puff off to userApi with type=updateUsingPuff and post['puff']
        var self = this;

        var prom = PuffNet.updateUserRecord(puff)

        prom.then(function(result) {
            self.state.result = result;
            this.setState({usernameMessage: "Success!"});
            events.pub('ui/puff-packer/userlookup', {});
        }).catch(function(err) {
                self.state.result = {'FAIL': err.message};
                this.setState({usernameMessage: 'FAIL: ' + err.message});
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

        // Clear out any error messages
        this.setState({rootKeyMessage: ''});
        this.setState({adminKeyMessage: ''});
        this.setState({defaultKeyMessage: ''});
    },

    handleConvertPrivatePublic: function() {
        // NOTE: When blank, Puffball.Crypto.privateToPublic generates a new public key
        var rP = this.refs.rootKeyPrivate.getDOMNode().value;
        var aP = this.refs.adminKeyPrivate.getDOMNode().value;
        var dP = this.refs.defaultKeyPrivate.getDOMNode().value;

        var missingValues = false;
        if(!rP.length) {
            this.setState({rootKeyMessage: 'Missing root key. '});
            missingValues = true;
        }

        if(!aP.length) {
            this.setState({adminKeyMessage: 'Missing admin key. '});
            missingValues = true;
        }

        if(!dP.length) {
            this.setState({defaultKeyMessage: 'Missing default key. '});
            missingValues = true;
        }

        // TODO: Combine into a single keyMessage. Add note: "Generate or enter your private keys before converting
        if(missingValues) {
            return false;
        }

        var rPublic = Puffball.Crypto.privateToPublic(rP);
        var aPublic = Puffball.Crypto.privateToPublic(aP);
        var dPublic = Puffball.Crypto.privateToPublic(dP);

        rPublic ? this.refs.rootKeyPublic.getDOMNode().value = rPublic : this.setState({rootKeyMessage: 'Invalid root key. '});
        aPublic ? this.refs.adminKeyPublic.getDOMNode().value = aPublic : this.setState({adminKeyMessage: 'Invalid admin key. '});
        dPublic ? this.refs.defaultKeyPublic.getDOMNode().value = dPublic : this.setState({defaultKeyMessage: 'Invalid default key. '});

        /*
        this.refs.rootKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(rP);
        this.refs.adminKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(aP);
        this.refs.defaultKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(dP);
        */

    },

    handleUsernameLookup: function() {

        this.state.usernameAvailable = 'checking';
        var username = this.refs.newUsername.getDOMNode().value;
        var self = this;

        var prom = Puffball.getUserRecord(username);

        prom.then(function(result) {
            console.log(result);
            if(result.username !== undefined) {
                this.setState({usernameAvailable: 'registered'});
            } else {
                this.setState({usernameAvailable: 'available'});
            }
            // this.state.usernameAvailable
        }).catch(function(err) {
            console.log("ERROR");
            console.log(err.message);
        })
    }
});

var UsernameCheckbox = React.createClass({
    render: function () {
        /*
         var cx = React.addons.classSet;
         var classes = cx({

         'fa': true,
         'fa-check red': (this.props.usernameAvailable === 'registered'),
         'fa-check blue': (this.props.usernameAvailable === 'available'),
         'fa-spinner': (this.props.usernameAvailable === 'checking')
         });

         return (
         <div className={classes} rel="tooltip" title="Check availability"></div>
         )
        */


        var checkboxClass = 'menuIcon fa fa-check gray';
        if (this.props.usernameAvailable === 'registered') {
            checkboxClass = 'menuIcon fa fa-check red';
            var usernameNotice = 'Sorry! Not available.';
        } else if(this.props.usernameAvailable === 'available') {
            checkboxClass = 'menuIcon fa fa-check blue';
            var usernameNotice = 'Yes! Username unavailable.';
        } else if(this.props.usernameAvailable === 'checking') {
            checkboxClass = 'menuIcon fa fa-spinner';
            var usernameNotice = '';
        }

        return (
            <span>
            <div className={checkboxClass} rel="tooltip" title="Check availability"></div>
            {usernameNotice}
            </span>
            )

    }
});

var SetIdentity = React.createClass({
    render: function() {
        if (!this.props.show) {
            return <p></p>
        } else {

            return (
                <div className="menuSection">
                    <div><em>Username to set:</em></div>
                    <div className="menuLabel">Username:</div>
                    <div className="menuInput">
                        <input type="text" name="username" />
                    </div>
                </div>
                )
        }
    }
});

var defaultPrivateKeyField = React.createClass({
    render: function() {
        return (
            <span>
                <div className="menuLabel">default: </div>
                <div className="menuInput">
                    <input type="text" name="defaultKeyPrivate" ref="defaultKeyPrivate" size="18" />
                </div>
            </span>
        )
    }

})

var Publish = React.createClass({
    render: function() {
        // TODO: Add puff icon to font
        return (
            <div>
                <br /><div className="menuHeader">
                    <div className="fa fa-paper-plane"></div> Publish
                </div>
                <div>Create puff</div>
            </div>

            )
    }
})

var View = React.createClass({
    render: function() {
        return (
        <div>
            <br /><div className="menuHeader">
                <div className="fa fa-sitemap"></div> View
            </div>
            <div>Newest conversations</div>
            <div>Latest puffs</div>
            <div>Search</div>
        </div>
            )
    }
})



var Tools = React.createClass({
    render: function() {
        return (
            <div>Tools!</div>
            )
    }
});

var Main = React.createClass({
    render: function() {
        return (
            <div>Main!</div>
            )
    }
});

// Called in main.js to bootstrap website
React.renderComponent(<PuffWorld />, document.getElementById('puffworld'))
