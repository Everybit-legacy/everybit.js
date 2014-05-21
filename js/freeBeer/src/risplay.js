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
                    <div className="authorDiv">{this.username ? this.username : 'None'}</div><br />
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
            usernameAvailable: 'unknown'
        }
    },

    // TODO: Add save keys abilities
    // TODO: Fix but that causes reactjs to output extra p after PublicKeys. Note p tag is demon spawn
    // TODO: use fa-unlock-alt and fa-lock
    render: function() {
        if (!this.props.show) {
            return <div></div>
        } else {

            return (
                <div className="menuSection">
                    <div className="menuLabel"><em>Desired username:</em></div><br />
                    <div className="menuInput">
                        <input type="text" name="newUsername" ref="newUsername" size="18" />
                        <a href="#" onClick={this.handleUsernameLookup}><UsernameCheckbox show={this.state.usernameAvailable} /></a>
                    </div>
                    <br /><br /><div className="menuHeader">Public Keys</div>
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
                <a href="#" onClick={this.handleGeneratePrivateKeys} >Generate</a> or <a href="#" onClick={this.handleConvertPrivatePublic} >Convert <span className="fa fa-arrow-up fa-fw"></span></a><br />


                    <br /><div className="menuHeader">Private Keys</div>
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
                </div>
                )
        }
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

    handleConvertPrivatePublic: function() {
        var rP = this.refs.rootKeyPrivate.getDOMNode().value;
        var aP = this.refs.adminKeyPrivate.getDOMNode().value;
        var dP = this.refs.defaultKeyPrivate.getDOMNode().value;

        this.refs.rootKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(rP);
        this.refs.adminKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(aP);
        this.refs.defaultKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(dP);

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
