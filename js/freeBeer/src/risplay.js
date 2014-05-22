/** @jsx React.DOM */

// TODO: Add transitions when parts of the menu show or hide
// Can also make transition on color, etc.

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
                <About />
                <Tools />
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
            tabs: {
                showSetIdentity: false,
                showEditIdentity: false,
                showNewIdentity: false
            }
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
            'linkTabHighlighted': this.state.tabs.showNewIdentity,
            'linkTab': !this.state.tabs.showNewIdentity
        });

        var cx2 = React.addons.classSet;
        var setClass = cx2({
            'linkTabHighlighted': this.state.tabs.showSetIdentity,
            'linkTab': !this.state.tabs.showSetIdentity
        });

        var cx3 = React.addons.classSet;
        var editClass = cx3({
            'linkTabHighlighted': this.state.tabs.showEditIdentity,
            'linkTab': !this.state.tabs.showEditIdentity
        });

        // TODO: Pulldown to select users if logged in
        // TODO: Logout button if logged in
        // TODO: Logout button sets alert, clears username
        // TODO: Help icon takes you to tutorial related to this.


        return (
            <div>
                <div className="menuHeader"><div className="fa fa-user"></div> Identity</div>
                <p><div className="menuLabel">Current identity: </div>
                    <div className="authorDiv"><AuthorPicker />
                    </div><br />
                    <div className={setClass}  onClick={this.toggleShowTab.bind(this,'showSetIdentity')} ><i className="fa fa-sign-in fa-fw"></i>Set </div>
                    <div className={editClass} onClick={this.toggleShowTab.bind(this,'showEditIdentity')}><i className="fa fa-pencil fa-fw"></i>Edit </div>
                    <div className={newClass}  onClick={this.toggleShowTab.bind(this,'showNewIdentity')} ><i className="fa fa-plus fa-fw"></i>New </div>
                </p>
                <SetIdentity  show={this.state.tabs.showSetIdentity}  />
                <EditIdentity show={this.state.tabs.showEditIdentity} />
                <NewIdentity  show={this.state.tabs.showNewIdentity}  />

            </div>
            )
    },

    toggleShowTab: function(tabName) {
        var self = this;

        if(self.state.tabs[tabName]) {
            this.setState({tabs: {
                showSetIdentity: false,
                showEditIdentity: false,
                showNewIdentity: false
                }
            });
        } else {
            if(tabName == 'showSetIdentity') {
                this.setState({tabs: {
                    showSetIdentity: true,
                    showEditIdentity: false,
                    showNewIdentity: false
                    }
                });
            }

            if(tabName == 'showEditIdentity') {
                this.setState({tabs: {
                    showSetIdentity: false,
                    showEditIdentity: true,
                    showNewIdentity: false
                    }
                });
            }

            if(tabName == 'showNewIdentity') {
                this.setState({tabs: {
                    showSetIdentity: false,
                    showEditIdentity: false,
                    showNewIdentity: true
                    }
                });
            }

        }
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

// Was PuffSwitchUser
var AuthorPicker = React.createClass({
    handleUserPick: function() {
        PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide', {'menu.user.pick_one': false})
    },
    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())

        if(!all_usernames.length) return <div>None</div>

        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)

        return (
            <div>
                <select ref="switcher" onChange={this.handleUserPick} value={username}>
                    {all_usernames.map(function(username) {
                        return <option key={username} value={username}>{username}</option>
                    })}
                </select>
            </div>
            );
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
        return false;
    },

    componentWillMount: function() {
        this.handleGenerateUsername();
    },

    handleUsernameRequest: function() {

        // BUILD REQUEST
        console.log("BEGIN username request for ", this.refs.newUsername.getDOMNode().value);

        // Stuff to register. These are public keys
        var rootKeyPublic = this.refs.rootKeyPublic.getDOMNode().value;
        var adminKeyPublic = this.refs.adminKeyPublic.getDOMNode().value;
        var defaultKeyPublic = this.refs.defaultKeyPublic.getDOMNode().value;

        rootKeyPrivate = this.refs.rootKeyPrivate.getDOMNode().value;
        adminKeyPrivate = this.refs.adminKeyPrivate.getDOMNode().value;
        defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;

        requestedUsername = this.refs.newUsername.getDOMNode().value;

        if(!rootKeyPublic || !adminKeyPublic || !defaultKeyPublic) {
            this.setState({usernameMessage: "You must set all of your public keys before making a registration request."});
            return false;
        }

        /*


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
         */

        var self = this;

        // SUBMIT REQUEST
        var prom = PuffNet.registerSubuser('anon', CONFIG.anon.privateKeyAdmin, requestedUsername, rootKeyPublic, adminKeyPublic, defaultKeyPublic);

        prom.then(function(userRecord) {
                // store directly because we know they're valid
                PuffWardrobe.storePrivateKeysDirectly(requestedUsername, rootKeyPrivate, adminKeyPrivate, defaultKeyPrivate);
                self.setState({usernameMessage: 'Success!'});
                events.pub('ui/event', {});
                return userRecord;
            },
            function(err) {
                console.log("ERR")
                self.setState({usernameMessage: err.toString()});
                events.pub('ui/event', {});
            });

        // TODO: Set this person as the current user


    },

    handleSendPuffToServer: function(puff) {
        // Send the contents of the puff off to userApi with type=updateUsingPuff and post['puff']
        var self = this;

        var prom = PuffNet.updateUserRecord(puff)

        prom.then(function(result) {
            self.setState({result: result});
            self.setState({usernameMessage: "Success!"});
            events.pub('ui/puff-packer/userlookup', {});
        }).catch(function(err) {
                self.setState({'FAIL': err.message});
                self.setState({usernameMessage: 'FAIL: ' + err.message});
                events.pub('ui/puff-packer/userlookup/failed', {});

        })

        return prom;
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

            var currUser = PuffWardrobe.getCurrentUsername();

            return (
                <div className="menuSection">
                    <div><em>Use this area to "login"</em></div>
                    <div className="menuLabel">Username:</div>
                    <div className="menuInput">
                        <input type="text" name="username" defaultValue={currUser} />
                    </div>
                    <br />
                    - Username<br />
                    - Existing Keys<br />
                        + default, admin, root, (click to show each new level)
                        + Click next to each one to try and set
                    - Message area below for results
                - Reminder to save keys
                 </div>
                )
        }
    }
});

var EditIdentity = React.createClass({
    render: function() {
        if (!this.props.show) {
            return <p></p>
        } else {

            var currUser = PuffWardrobe.getCurrentUsername();

            return (
                <div className="menuSection">
                    <div><em>Update your existing info</em></div>
                    <div className="menuLabel">Username:</div>
                    <div className="menuInput">
                        <input type="text" name="username" defaultValue={currUser} />
                    </div>
                    <br />
                - Username is fixed<br />
                - Existing Keys<br />
                + default, admin, root, (click to show each new level)
                + Click next to each one to try and change
                - Message area below for results
                - Reminder to save keys
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
                <a href="#" onClick={this.handleNewContent}>Create new puff</a>
            </div>

            )
    },

    handleNewContent: function() {
        return events.pub('ui/reply/open', {'menu': puffworlddefaults.menu, 'reply': {show: true}});
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

var About = React.createClass({
    render: function() {
        return (
            <div>
                <br /><div className="menuHeader">
                <div className="fa fa-info-circle"></div> About
            </div>
                <div>User guide</div>
                <div>Contact us</div>
                <div>Privacy policy</div>
                <div><a href="https://github.com/puffball/freebeer/" target="_new">Source code</a></div>
            </div>
            )
    }
})


var Tools = React.createClass({
    render: function() {
        return (
            <div>
                <br /><div className="menuHeader">
                <div className="fa fa-wrench"></div> Advanced tools
            </div>
                <div>Raw puff builder</div>
                <div>Username requests</div>
            </div>
            )
    }
})

var Main = React.createClass({
    render: function() {
        return (
            <div>Main!</div>
            )
    }
});

// Called in main.js to bootstrap website
React.renderComponent(<PuffWorld />, document.getElementById('puffworld'))



