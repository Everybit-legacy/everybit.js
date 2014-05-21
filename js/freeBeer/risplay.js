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
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, React.DOM.div( {className:"fa fa-user"}), " Identity"),
                React.DOM.p(null, React.DOM.div( {className:"menuLabel"}, "Current identity: " ),
                    React.DOM.div( {className:"authorDiv"}, this.username ? this.username : 'None'),React.DOM.br(null ),
                    React.DOM.div( {className:editClass, onClick:this.toggleShowSetIdentity}, React.DOM.i( {className:"fa fa-pencil fa-fw", onClick:this.toggleShowSetIdentity}),"Edit " ),
                    React.DOM.div( {className:newClass, onClick:this.toggleShowNewIdentity}, React.DOM.i( {className:"fa fa-plus fa-fw"}),"New " )
                ),
                NewIdentity( {show:this.state.showNewIdentity} ),
                SetIdentity( {show:this.state.showSetIdentity} )
            )
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

var NewIdentity = React.createClass({displayName: 'NewIdentity',
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
            return React.DOM.div(null)
        } else {

            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div( {className:"menuLabel"}, React.DOM.em(null, "Desired username:")),React.DOM.br(null ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername", size:"18"} ),
                        React.DOM.a( {href:"#", onClick:this.handleUsernameLookup}, UsernameCheckbox( {show:this.state.usernameAvailable} ))
                    ),
                    React.DOM.br(null ),React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, "Public Keys"),
                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"root: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"rootKeyPublic", ref:"rootKeyPublic", size:"18"} )
                        ),
                    React.DOM.br(null ),
                    
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"admin: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"adminKeyPublic", ref:"adminKeyPublic", size:"18"} )
                        ),
                    React.DOM.br(null ),
                    
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"default: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"defaultKeyPublic", ref:"defaultKeyPublic", size:"18"} )
                        ),
                    React.DOM.br(null ),
                React.DOM.a( {href:"#", onClick:this.handleGeneratePrivateKeys} , "Generate"), " or ", React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , "Convert ", React.DOM.span( {className:"fa fa-arrow-up fa-fw"})),React.DOM.br(null ),


                    React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, "Private Keys"),
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"root: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate", size:"18"} )
                        ),
                    React.DOM.br(null ),
                    
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"admin: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate", size:"18"} )
                        ),
                    React.DOM.br(null ),
                    
                        React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),"default: " ),
                        React.DOM.div( {className:"menuInput"}, 
                            React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"18"} )
                        ),
                    React.DOM.br(null )



                

                )
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

var UsernameCheckbox = React.createClass({displayName: 'UsernameCheckbox',
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
            React.DOM.span(null, 
            React.DOM.div( {className:checkboxClass, rel:"tooltip", title:"Check availability"}),
            usernameNotice
            )
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
                React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, 
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
            React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, 
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
