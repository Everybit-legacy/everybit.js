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


var PuffWorld = React.createClass({displayName: 'PuffWorld',

    render: function() {
        return (
            React.DOM.div(null, 
                Menu(null ),
                Tools(null ),
                Main(null )
             )
            )
    }
});

var Menu = React.createClass({displayName: 'Menu',
    render: function() {
        return (
            React.DOM.div(null, 
                PuffIcon(null ),
                MenuList(null )
            )
        )
    }
});

var PuffIcon = React.createClass({displayName: 'PuffIcon',
    render: function() {
        return React.DOM.img( {src:"img/puffballIcon.png", height:"32"} )
    }
})

var MenuList = React.createClass({displayName: 'MenuList',
    render: function() {
        return (
            React.DOM.div( {className:"menu"}, 
                Identity(null ),
                Publish(null ),
                View(null )
            )
            )
    }
})

var Identity = React.createClass({displayName: 'Identity',
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
            React.DOM.div(null, 
                React.DOM.p(null, React.DOM.div( {className:"menuHeader"}, React.DOM.div( {className:"fa fa-user"}), " Identity")),
                React.DOM.p(null, React.DOM.div( {className:"menuLabel"}, "Current identity: " ),
                    React.DOM.div( {className:"menuInput"}, React.DOM.span( {className:"authorSpan"}, this.username ? this.username : 'None')),
                    React.DOM.div( {className:"menuInput"}, React.DOM.i( {className:"fa fa-pencil fa-fw", onClick:this.toggleShowSetIdentity})),
                    React.DOM.div( {className:"menuInput"}, React.DOM.i( {className:"fa fa-plus fa-fw", onClick:this.toggleShowNewIdentity}))
                ),
                NewIdentity( {show:this.state.showNewIdentity} ),
                SetIdentity( {show:this.state.showSetIdentity} )
            )
            )
    },

    toggleShowSetIdentity: function() {
        this.state.showSetIdentity ? this.setState({showSetIdentity: false}) : this.setState({showSetIdentity: true})
    },

    toggleShowNewIdentity: function() {
        this.state.showNewIdentity ? this.setState({showNewIdentity: false}) : this.setState({showNewIdentity: true})
    }
});

var NewIdentity = React.createClass({displayName: 'NewIdentity',
    getInitialState: function() {
        return {
            usernameAvailable: 'unknown'
        }
    },

    // TODO: Add save keys abilities
    render: function() {
        if (!this.props.show) {
            return React.DOM.p(null)
        } else {

            return (
                React.DOM.form( {name:"newUserForm", id:"newUserForm"}, 

                React.DOM.p(null, 
                    React.DOM.div( {className:"menuHeader"}, "Public Keys")
                ),
                React.DOM.p(null, 
                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"root: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKeyPublic", ref:"rootKeyPublic", size:"15"} )
                    )
                ),
                React.DOM.p(null, 
                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"admin: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKeyPublic", ref:"adminKeyPublic", size:"15"} )
                    )
                ),
                React.DOM.p(null, 
                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"default: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKeyPublic", ref:"defaultKeyPublic", size:"15"} )
                    )
                ),
                React.DOM.p(null, React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , "Private ", React.DOM.span( {className:"fa fa-long-arrow-right fa-fw"}), " Public")),
                React.DOM.p(null, React.DOM.a( {href:"#", onClick:this.handleGeneratePrivateKeys} , "Generate")),

                    React.DOM.p(null, 
                        React.DOM.div( {className:"menuHeader"}, "Private Keys")
                    ),
                    React.DOM.p(null, 
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"root: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate", size:"15"} )
                        )
                    ),
                    React.DOM.p(null, 
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"admin: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate", size:"15"} )
                        )
                    ),
                    React.DOM.p(null, 
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"default: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"15"} )
                        )
                    ),



                React.DOM.p(null, 
                    React.DOM.div( {className:"menuLabel"}, "New username:"),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername", size:"10"} ),
                        React.DOM.a( {href:"#", onClick:this.handleUsernameLookup}, UsernameCheckbox( {show:this.state.usernameAvailable} ))
                    )
                )

                )
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

var UsernameCheckbox = React.createClass({displayName: 'UsernameCheckbox',
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
            React.DOM.div( {className:checkboxClass, rel:"tooltip", title:"Check availability"})
            )

    }
});

var SetIdentity = React.createClass({displayName: 'SetIdentity',
    render: function() {
        if (!this.props.show) {
            return React.DOM.p(null)
        } else {

            return (
                React.DOM.p(null, 
                    React.DOM.div(null, "Set an existing identity"),
                    React.DOM.div( {className:"menuLabel"}, "Username:"),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"username"} )
                    )
                )
                )
        }
    }
});

var Publish = React.createClass({displayName: 'Publish',
    render: function() {
        // TODO: Add puff icon to font
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, 
                    React.DOM.div( {className:"fa fa-paper-plane"}), " Publish"
                ),
                React.DOM.div(null, "Create puff")
            )

            )
    }
})

var View = React.createClass({displayName: 'View',
    render: function() {
        return (
        React.DOM.div(null, 
            React.DOM.div( {className:"menuHeader"}, 
                React.DOM.div( {className:"fa fa-sitemap"}), " View"
            ),
            React.DOM.div(null, "Newest conversations"),
            React.DOM.div(null, "Latest puffs"),
            React.DOM.div(null, "Search")
        )
            )
    }
})



var Tools = React.createClass({displayName: 'Tools',
    render: function() {
        return (
            React.DOM.div(null, "Tools!")
            )
    }
});

var Main = React.createClass({displayName: 'Main',
    render: function() {
        return (
            React.DOM.div(null, "Main!")
            )
    }
});

// Called in main.js to bootstrap website
React.renderComponent(PuffWorld(null ), document.getElementById('puffworld'))
