/** @jsx React.DOM */

// TODO: Add transitions when parts of the menu show or hide
// TODO: Add store identity on this computer option.
// TODO: Show menu on click of puffball,
// TODO: Add hide option for menu
// Can also make transition on color, etc.





puffworldprops = Object;
puffworldprops.menu = Object;
puffworldprops.user = Object;
puffworldprops.view = Object;

puffworldprops.menu.    show = false;
puffworldprops.menu.   prefs = false;
puffworldprops.menu. profile = false;

puffworldprops.user.   pick_one = false;
puffworldprops.user.   show_add = false;
puffworldprops.user. add_one=false;
puffworldprops.user. add_new=false;
puffworldprops.user.  manage=false;
puffworldprops.user. show_bc=false;
puffworldprops.user.show_key=false;

puffworldprops.view.

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


var PuffWorld = React.createClass({displayName: 'PuffWorld',
    getInitialState: function() {
        return {
            showMenu: false
        }
    },

    render: function() {
        return (
            React.DOM.div(null, 
                Menu(null )
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
        return React.DOM.img( {src:"img/puffballIcon.png", className:"puffballIcon", id:"puffballIcon", height:"32", width:"27"} )
    }
})

var MenuList = React.createClass({displayName: 'MenuList',
    render: function() {
        return (
            React.DOM.div( {className:"menu"}, 
                Identity(null ),
                Publish(null ),
                View(null ),
                About(null ),
                Tools(null )
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

        // CSS for tabs
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
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, React.DOM.div( {className:"fa fa-user"}), " Identity"),
                React.DOM.p(null, React.DOM.div( {className:"menuLabel"}, "Current identity: " ),
                    React.DOM.div( {className:"authorDiv"}, AuthorPicker(null )
                    ),React.DOM.br(null ),
                    React.DOM.div( {className:setClass,  onClick:this.toggleShowTab.bind(this,'showSetIdentity')} , React.DOM.i( {className:"fa fa-sign-in fa-fw"}),"Set " ),
                    React.DOM.div( {className:editClass, onClick:this.toggleShowTab.bind(this,'showEditIdentity')}, React.DOM.i( {className:"fa fa-pencil fa-fw"}),"Edit " ),
                    React.DOM.div( {className:newClass,  onClick:this.toggleShowTab.bind(this,'showNewIdentity')} , React.DOM.i( {className:"fa fa-plus fa-fw"}),"New " )
                ),
                SetIdentity(  {show:this.state.tabs.showSetIdentity}  ),
                EditIdentity( {show:this.state.tabs.showEditIdentity} ),
                NewIdentity(  {show:this.state.tabs.showNewIdentity}  )

            )
            )
    },

    toggleShowTab: function(tabName) {
        var self = this;

        var truthArray = [false, false, false];
        var tabArray = ['showSetIdentity', 'showEditIdentity', 'showNewIdentity'];

        if(!self.state.tabs[tabName]) {
            var toggleThis = tabArray.indexOf(tabName);
            truthArray[toggleThis] = true;
        }

        // Do the update of tab value
        this.setState({tabs: {
            showSetIdentity: truthArray[0],
            showEditIdentity: truthArray[1],
            showNewIdentity: truthArray[2]
        }
        });

    }
});

// Was PuffSwitchUser
var AuthorPicker = React.createClass({displayName: 'AuthorPicker',
    handleUserPick: function() {
        PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide', {'menu.user.pick_one': false})
    },
    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())

        if(!all_usernames.length) return React.DOM.div(null, "None")

        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)

        return (
            React.DOM.div(null, 
                React.DOM.select( {ref:"switcher", onChange:this.handleUserPick, value:username}, 
                    all_usernames.map(function(username) {
                        return React.DOM.option( {key:username, value:username}, username)
                    })
                )
            )
            );
    }
});

var NewIdentity = React.createClass({displayName: 'NewIdentity',
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
            return React.DOM.span(null)
        } else {

            return (
                React.DOM.div( {className:"menuSection"}, 

                    React.DOM.div( {className:"menuLabel"}, React.DOM.em(null, "Desired username:")),React.DOM.br(null ),

                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername", readOnly:true,  value:this.state.newUsername, size:"12"} ), " ", React.DOM.a( {href:"#", onClick:this.handleGenerateUsername}, React.DOM.i( {className:"fa fa-refresh fa-fw", rel:"tooltip", title:"Generate a new username"})), " ", React.DOM.i( {className:"fa fa-question-circle fa-fw", rel:"tooltip", title:"Right now, only anonymous usernames can be registered. To be notified when regular usernames become available, send a puff with .puffball in your zones"})
                    ),

                    React.DOM.br(null ),
                    React.DOM.br(null ),
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-unlock-alt"}), " Public Keys"),


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


                    React.DOM.a( {href:"#", onClick:this.handleGeneratePrivateKeys} , "Generate"), " or ", React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , "Private",React.DOM.span( {className:"fa fa-long-arrow-right fa-fw"}),"Public"),React.DOM.br(null ),



                    React.DOM.em(null, this.state.rootKeyMessage, " ", this.state.adminKeyMessage, " ", this.state.defaultKeyMessage),
                    React.DOM.br(null ),
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-lock"}), " Private Keys"),
                    React.DOM.div( {className:"menuLabel"}, "root: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate", size:"18"} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, "admin: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate", size:"18"} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, "default: " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"18"} )
                    ),

                    React.DOM.br(null ),

                    React.DOM.input( {className:"btn-link", type:"button", value:"Submit username request", onClick:this.handleUsernameRequest} ),React.DOM.br(null ),
                    React.DOM.em(null, this.state.usernameMessage)
                )
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
            return React.DOM.span(null)
        } else {

            var currUser = PuffWardrobe.getCurrentUsername();

            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div(null, React.DOM.em(null, "Use this area to \"login\"")),
                    React.DOM.div( {className:"menuLabel"}, "Username:"),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"username", defaultValue:currUser} )
                    ),
                    React.DOM.br(null ),
                    "- Username",React.DOM.br(null ),
                    "- Existing Keys",React.DOM.br(null ),
                        "+ default, admin, root, (click to show each new level)"+' '+
                        "+ Click next to each one to try and set"+' '+
                    "- Message area below for results"+' '+
                "- Reminder to save keys"
                 )
                )
        }
    }
});

var EditIdentity = React.createClass({displayName: 'EditIdentity',
    render: function() {
        if (!this.props.show) {
            return React.DOM.span(null)
        } else {

            var currUser = PuffWardrobe.getCurrentUsername();

            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div(null, React.DOM.em(null, "Update your existing info")),
                    React.DOM.div( {className:"menuLabel"}, "Username:"),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"username", defaultValue:currUser} )
                    ),
                    React.DOM.br(null ),
                "- Username is fixed",React.DOM.br(null ),
                "- Existing Keys",React.DOM.br(null ),
                "+ default, admin, root, (click to show each new level)"+' '+
                "+ Click next to each one to try and change"+' '+
                "- Message area below for results"+' '+
                "- Reminder to save keys"
                )
                )
        }
    }
});

var defaultPrivateKeyField = React.createClass({displayName: 'defaultPrivateKeyField',
    render: function() {
        return (
            React.DOM.span(null, 
                React.DOM.div( {className:"menuLabel"}, "default: " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"18"} )
                )
            )
        )
    }

})

var Publish = React.createClass({displayName: 'Publish',
    render: function() {
        // TODO: Add puff icon to font
        return (
            React.DOM.div(null, 
                React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, 
                    React.DOM.div( {className:"fa fa-paper-plane"}), " Publish"
                ),
                React.DOM.a( {href:"#", onClick:this.handleNewContent}, "Create new puff")
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

var About = React.createClass({displayName: 'About',
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, 
                React.DOM.div( {className:"fa fa-info-circle"}), " About"
            ),
                React.DOM.div(null, "User guide"),
                React.DOM.div(null, "Contact us"),
                React.DOM.div(null, "Privacy policy"),
                React.DOM.div(null, React.DOM.a( {href:"https://github.com/puffball/freebeer/", target:"_new"}, "Source code"))
            )
            )
    }
})

/*
TODO: Add puff for
Privacy policy: If you choose to make a puff public, it is public for everyone to see. If you encrypt a puff, its true contents will only be visible to your intended recipient, subject to the limitations of the cryptograhic tools used and your ability to keep your private keys private. Nothing prevents your intended recipient from sharing decripted copies of your content. <br /> Your username entry contains your public keys and information about your most recent content. You can view your full username record in the Advanced Tools section.

TODO: Contact us link brings up a stub for a private puff with .puffball in the routing.

 */

var Tools = React.createClass({displayName: 'Tools',
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.br(null ),React.DOM.div( {className:"menuHeader"}, 
                React.DOM.div( {className:"fa fa-wrench"}), " Advanced tools"
            ),
                React.DOM.div(null, "Raw puff builder"),
                React.DOM.div(null, "Username requests")
            )
            )
    }
})

var Main = React.createClass({displayName: 'Main',
    render: function() {
        return (
            React.DOM.div(null, "Main!")
            )
    }
});

// Called in main.js to bootstrap website
React.renderComponent(PuffWorld(null ), document.getElementById('puffworld'))



