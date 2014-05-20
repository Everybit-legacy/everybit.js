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

        // TODO: Pulldown to select users if logged in
        // TODO: Logout button if logged in
        // TODO: Logout button sets alert, clears username
        // TODO: Help icon takes you to tutorial related to this.

        return (
            <div>
                <p><div className="menuHeader"><div className="fa fa-user"></div> Identity</div></p>
                <p><div className="menuLabel">Current identity: </div>
                    <div className="menuInput"><span className="authorSpan">{this.username ? this.username : 'None'}</span></div>
                    <div className="menuInput"><i className="fa fa-pencil fa-fw" onClick={this.toggleShowSetIdentity}></i></div>
                    <div className="menuInput"><i className="fa fa-plus fa-fw" onClick={this.toggleShowNewIdentity}></i></div>
                </p>
                <NewIdentity show={this.state.showNewIdentity} />
                <SetIdentity show={this.state.showSetIdentity} />
            </div>
            )
    },

    toggleShowSetIdentity: function() {
        this.state.showSetIdentity ? this.setState({showSetIdentity: false}) : this.setState({showSetIdentity: true})
    },

    toggleShowNewIdentity: function() {
        this.state.showNewIdentity ? this.setState({showNewIdentity: false}) : this.setState({showNewIdentity: true})
    }
});

var NewIdentity = React.createClass({
    getInitialState: function() {
        return {
            usernameAvailable: 'unknown'
        }
    },

    // TODO: Add save keys abilities
    render: function() {
        if (!this.props.show) {
            return <p></p>
        } else {

            return (
                <form name="newUserForm" id="newUserForm">

                <p>
                    <div className="menuHeader">Public Keys</div>
                </p>
                <p>
                    <div className="menuLabel"><sup>*</sup>root: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKeyPublic" ref="rootKeyPublic" size="15" />
                    </div>
                </p>
                <p>
                    <div className="menuLabel"><sup>*</sup>admin: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKeyPublic" ref="adminKeyPublic" size="15" />
                    </div>
                </p>
                <p>
                    <div className="menuLabel"><sup>*</sup>default: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKeyPublic" ref="defaultKeyPublic" size="15" />
                    </div>
                </p>
                <p><a href="#" onClick={this.handleConvertPrivatePublic} >Private <span className="fa fa-long-arrow-right fa-fw"></span> Public</a></p>
                <p><a href="#" onClick={this.handleGeneratePrivateKeys} >Generate</a></p>

                    <p>
                        <div className="menuHeader">Private Keys</div>
                    </p>
                    <p>
                        <div className="menuLabel"><sup>*</sup>root: </div>
                        <div className="menuInput">
                            <input type="text" name="rootKeyPrivate" ref="rootKeyPrivate" size="15" />
                        </div>
                    </p>
                    <p>
                        <div className="menuLabel"><sup>*</sup>admin: </div>
                        <div className="menuInput">
                            <input type="text" name="adminKeyPrivate" ref="adminKeyPrivate" size="15" />
                        </div>
                    </p>
                    <p>
                        <div className="menuLabel"><sup>*</sup>default: </div>
                        <div className="menuInput">
                            <input type="text" name="defaultKeyPrivate" ref="defaultKeyPrivate" size="15" />
                        </div>
                    </p>



                <p>
                    <div className="menuLabel">New username:</div>
                    <div className="menuInput">
                        <input type="text" name="newUsername" ref="newUsername" size="10" />
                        <a href="#" onClick={this.handleUsernameLookup}><UsernameCheckbox show={this.state.usernameAvailable} /></a>
                    </div>
                </p>

                </form>
                )
        }
    },

    handleGeneratePrivateKeys: function() {
        // Get private keys
        var rootKey = Puffball.Crypto.generatePrivateKey();
        var adminKey = Puffball.Crypto.generatePrivateKey();
        var defaultKey = Puffball.Crypto.generatePrivateKey();

        // this.refs.rootKeyPrivate.getDOMNode().value = rootKey;
        // this.refs.adminKeyPrivate.getDOMNode().value = adminKey;
        // this.refs.defaultKeyPrivate.getDOMNode().value = defaultKey;

        this.refs.rootKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(rootKey);
        this.refs.adminKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(adminKey);
        this.refs.defaultKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(defaultKey);
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
        var checkboxClass = 'fa fa-check gray';
        if (this.props.usernameAvailable === 'registered') {
            checkboxClass = 'fa fa-check red';
        } else if(this.props.usernameAvailable === 'available') {
            checkboxClass = 'fa fa-check blue';
        } else if(this.props.usernameAvailable === 'checking') {
            checkboxClass = 'fa fa-spinner';
        }

        return (
            <div className={checkboxClass} rel="tooltip" title="Check availability"></div>
            )

    }
});

var SetIdentity = React.createClass({
    render: function() {
        if (!this.props.show) {
            return <p></p>
        } else {

            return (
                <p>
                    <div>Set an existing identity</div>
                    <div className="menuLabel">Username:</div>
                    <div className="menuInput">
                        <input type="text" name="username" />
                    </div>
                </p>
                )
        }
    }
});

var Publish = React.createClass({
    render: function() {
        // TODO: Add puff icon to font
        return (
            <div>
                <div className="menuHeader">
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
            <div className="menuHeader">
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
