/** @jsx React.DOM */

/*
  <p>Identity avatar</p>
 */


var Basics = React.createClass({displayName: 'Basics',
    render: function() {
        return (
            PuffIcon(null )
            )
    }
});

var Blank = React.createClass({displayName: 'Blank',
    render: function() {
        return (
            React.DOM.div(null)
            )
    }
});


var PuffIcon = React.createClass({displayName: 'PuffIcon',
    render: function() {
        return React.DOM.img( {src:"img/puffballIcon.png", className:"puffballIcon", id:"puffballIcon", height:"32", width:"27", onClick:this.toggleShowMenu} )
    },

    toggleShowMenu: function() {
        if(puffworldprops.menu.show) {
            return events.pub('ui/menu/close', {'menu.show': false})
        } else {
            return events.pub('ui/menu/close', {'menu.show': true})
        }
    }
})

var Menu = React.createClass({displayName: 'Menu',
    render: function() {
        return (
            React.DOM.div( {className:"menu"}, 
                React.DOM.div( {id:"closeDiv"}, 
                    React.DOM.a( {href:"#", onClick:this.handleClose}, 
                        React.DOM.i( {className:"fa fa-times-circle-o fa-fw"}))
                ),
                Logo(null ),
                Filter(null ),
                View(null ),
                Language(null ),
                Publish(null ),
                Identity(null ),
                About(null ),
                Tools(null )
            )
            )
    },

    handleClose: function() {
        return events.pub('ui/menu/close', {'menu.show': false})
    }
});

var Logo = React.createClass({displayName: 'Logo',
    render: function() {
        return (
            React.DOM.a( {href:CONFIG.url}, React.DOM.img( {src:"img/logo.gif", alt:"Logo", className:"logo"} ))
            )
    }
});

var Filter = React.createClass({displayName: 'Filter',
    handlePickFilter: function() {
        var user = this.refs.pickuser.getDOMNode().value || false;
        var route = this.refs.pickroute.getDOMNode().value || false;
        return events.pub('ui/view/route/set', 
                        {'view.filterroute': route, 
                         'view.filteruser':user});
    },
    handleClearRoute: function() {
        this.refs.pickroute.getDOMNode().value = '';
        return events.pub('ui/view/route/clear', {'view.filterroute': false});
    },
    handleClearUser: function() {
        this.refs.pickuser.getDOMNode().value = '';
        return events.pub('ui/view/user/clear', {'view.filteruser': false});
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var route = puffworldprops.view.filterroute || "";
        var user = puffworldprops.view.filteruser || "";
        return (
            React.DOM.div(null, React.DOM.br(null ),
                React.DOM.div( {className:"menuHeader"}, 
                    React.DOM.i( {className:"fa fa-filter fa-fw gray"}), " ", polyglot.t("menu.filter.title")
                ),
                React.DOM.div( {className:"menuItem"}, 
                    polyglot.t("menu.filter.route"),":",
                    React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"filterroute", ref:"pickroute", defaultValue:route, size:"12"} ),
                    React.DOM.a( {href:"#", onClick:this.handleClearRoute} , React.DOM.i( {className:"fa fa-trash-o fa-fw"})),
                    React.DOM.a( {href:"#", onClick:this.handlePickFilter} , React.DOM.i( {className:"fa fa-search fa-fw"}))
                    ),React.DOM.br(null)
                ),
                React.DOM.div( {className:"menuItem"}, 
                    polyglot.t("menu.filter.user"),":", 
                    React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"filteruser", ref:"pickuser", defaultValue:user, size:"12"} ), 
                    React.DOM.a( {href:"#", onClick:this.handleClearUser} , React.DOM.i( {className:"fa fa-trash-o fa-fw"})),
                    React.DOM.a( {href:"#", onClick:this.handlePickFilter} , React.DOM.i( {className:"fa fa-search fa-fw"}))
                    ),React.DOM.br(null)
                )
            )
            )
    }
});

var View = React.createClass({displayName: 'View',

    handleViewRoots: function() {
        return events.pub('ui/show/roots', {'view.style': 'PuffRoots', 'view.puff': false, 'menu': puffworlddefaults.menu, 'view.user': ''});
    },

    handleViewLatest: function() {
        return events.pub('ui/show/latest', {'view.style': 'PuffLatest', 'view.puff': false, 'menu': puffworlddefaults.menu, 'view.user': ''});
    },

    handleShowHideRelationships: function() {

        if(puffworldprops.view.mode == 'browse') {
            return events.pub('ui/relationships/show', {'view.mode': 'arrows'});
        } else {
            return events.pub('ui/relationships/hide', {'view.mode': 'browse'});
        }
    },

    handleShowHideAnimations: function() {

        if(puffworldprops.view.animation) {
            return events.pub('ui/animation/hide', {'view.animation': false});
        } else {
            return events.pub('ui/animation/show', {'view.animation': true});
        }
    },

    handleShowUserPuffs: function(username) {
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'view.user': username})
    },

    handleShowShortcuts: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        showPuff(polyglot.t("puff.shortcut"));
        return false;
    },

    handleShowPuffsForMe: function(){
        var polyglot = Translate.language[puffworldprops.view.language];
        var username = PuffWardrobe.getCurrentUsername();
        if(!username.length) {
            alert(polyglot.t("alert.noUserSet"))
            return false;
        }
        // console.log(username);
       // var route = this.refs.pickroute.getDOMNode().value;
        return events.pub('ui/view/route/set', {'view.filterroute': username});
    },



    render: function() {
        // CSS for tabs
        var cb = React.addons.classSet;
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': (puffworldprops.view.mode == 'arrows'),
            'fa-square-o': !(puffworldprops.view.mode == 'arrows'),
            'green': (puffworldprops.view.mode == 'arrows')
        });

        var cb2 = React.addons.classSet;
        var cbClass2 = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': puffworldprops.view.animation,
            'fa-square-o': !puffworldprops.view.animation,
            'green': puffworldprops.view.animation
        });

        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, 
                    React.DOM.i( {className:"fa fa-sitemap fa-fw gray"}), " ", polyglot.t("menu.view.title")
                ),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"#", onClick:this.handleViewLatest}, polyglot.t("menu.view.latest"))),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"#", onClick:this.handleShowUserPuffs.bind(this,'choices.book')}, polyglot.t("menu.view.collection"))),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"#", onClick:this.handleShowShortcuts}, polyglot.t("menu.view.shortcut"))),

                React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass, onClick:this.handleShowHideRelationships} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowHideRelationships}, polyglot.t("menu.view.relationship"))
                ),

                React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass2, onClick:this.handleShowHideAnimations} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowHideAnimations}, polyglot.t("menu.view.animation"))
                ),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"#", onClick:this.handleShowPuffsForMe}, polyglot.t("menu.view.showpuffs")))

            )
            )
    }
});


var Language = React.createClass({displayName: 'Language',
    handlePickLanguage: function() {
        var language = this.refs.picklanguage.getDOMNode().value;
        return events.pub('ui/view/language/set', {'view.language': language});
    },
    
    render: function() {
        var language = puffworldprops.view.language || "en";
        var polyglot = Translate.language[language];
        var all_languages = Object.keys(Translate.language);
        return (
            React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.view.language"),": ", React.DOM.select( {ref:"picklanguage", onChange:this.handlePickLanguage, value:language}, 
                    all_languages.map(function(lang) {
                        return React.DOM.option( {key:lang, value:lang}, Translate.language[lang].t("dropdownDisplay"))
                    })
                )
            )
        );
    }
})


// TODO put back when working
// <div className="menuItem"><a href="#" onClick={this.handleViewRoots}>Recent conversations</a></div>

var Publish = React.createClass({displayName: 'Publish',
    handleNewContent: function() {
        return events.pub('ui/reply/open', {'menu': puffworlddefaults.menu, 'reply': {show: true}});
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, 
                    React.DOM.i( {className:"fa fa-paper-plane fa-fw gray"}), " ", polyglot.t("menu.publish.title")
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleNewContent}, polyglot.t("menu.publish.new"))
                )
            )
            )
    }
});

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
            // var prom = PuffWardrobe.storePrivateKeys('anon', 0, CONFIG.anon.privateKeyAdmin, 0);
            // prom.then(function() {
            //     PuffWardrobe.switchCurrent('anon');
            //     events.pub('ui/puff-packer/set-identity-to-anon', {});
            // });
            // 
            // this.setState({username: 'anon'});

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

        var currUser = PuffWardrobe.getCurrentUsername();

        // TODO: Help icon takes you to tutorial related to this.

        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-user fa-fw gray"}), " ", polyglot.t("menu.identity.title")),
                AuthorPicker(null ),
                React.DOM.div( {className:"leftIndent"}, 
                React.DOM.div( {className:setClass,  onClick:this.toggleShowTab.bind(this,'showSetIdentity')} , React.DOM.i( {className:"fa fa-sign-in fa-fw"})),
                React.DOM.div( {className:editClass, onClick:this.toggleShowTab.bind(this,'showEditIdentity')}, React.DOM.i( {className:"fa fa-eye fa-fw"})),
                React.DOM.div( {className:newClass,  onClick:this.toggleShowTab.bind(this,'showNewIdentity')} , React.DOM.i( {className:"fa fa-plus fa-fw"})),
                React.DOM.br(null ),
                SetIdentity(  {show:this.state.tabs.showSetIdentity,  username:currUser}),
                EditIdentity( {show:this.state.tabs.showEditIdentity, username:currUser}),
                NewIdentity(  {show:this.state.tabs.showNewIdentity}  )
                )

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

    handleRemoveUser: function() {
        var userToRemove = this.refs.switcher.getDOMNode().value;

        // Confirm alert first
        var msg = "WARNING: This will erase all of this user's private keys from your web browser. If you have not yet saved your private keys, hit Cancel and use the EDIT section of the menu to save your keys. Are you sure you wish to continue?"
        var r = confirm(msg);
        if (r == false) {
            return false
        }

        PuffWardrobe.removeKeys(userToRemove);
        events.pub('user/'+userToRemove+'/remove', {});
        events.pub('ui/user/'+userToRemove+'/remove', {}); // this should be generated by previous event
        return false;
    },

    handleViewUser: function() {
        var username = this.props.username;
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'view.user': username})
    },

    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())
        var polyglot = Translate.language[puffworldprops.view.language];
        if(!all_usernames.length) return React.DOM.div( {className:"menuItem"}, polyglot.t("menu.identity.none"))

        // Force selection of the single user when just one
        if(all_usernames.length == 1) {
            PuffWardrobe.switchCurrent(all_usernames[0]);
        }

        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)
        // TODO: Need 2-way bind to prevent select from changing back every time you change it

        return (
            React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.identity.current"),": ", React.DOM.select( {ref:"switcher", onChange:this.handleUserPick, value:username}, 
                    all_usernames.map(function(username) {
                        return React.DOM.option( {key:username, value:username}, username)
                    })
                ),
                ' ',React.DOM.a( {href:"#", onClick:this.handleRemoveUser}, React.DOM.i( {className:"fa fa-trash-o fa-fw"})),
                ' ',ViewUserLink( {username:username} )
            )
            );
    }
    // TODO add alt tags to icons, or link it too a "help" puff.
    // NOTE: This might destroy the puff the person was working on
});

var ViewUserLink = React.createClass({displayName: 'ViewUserLink',
    viewUser: function() {
        var username = this.props.username;
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'view.user': username})
    },

    render: function() {
        if(!Object.keys(PuffWardrobe.getAll()).length) {
            return React.DOM.i(null);
        }

        return (
            React.DOM.a( {href:"#", onClick:this.viewUser}, 
                React.DOM.i( {className:"fa fa-search fa-fw"})
            )
            )
    }

});

var SetIdentity = React.createClass({displayName: 'SetIdentity',

    getInitialState: function() {
        return {
            rootKeyStatus: false,
            adminKeyStatus: false,
            defaultKeyStatus: false,

            usernameStatus: false,
            rootKey: false,
            adminKey: false,
            defaultKey: false

        }
    },

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value;
        var self = this;

        // Check for zero length
        if(!username.length) {
            this.state.usernameStatus = 'Missing';
            events.pub('ui/event', {});
            return false;
        }

        var prom = Puffball.getUserRecord(username);

        prom.then(function(result) {
            self.state.usernameStatus = true;
            events.pub('ui/puff-packer/userlookup', {});
        })
            .catch(function(err) {
                self.state.usernameStatus = 'Not found';
                events.pub('ui/puff-packer/userlookup/failed', {});
            })
        return false;
    },

    handleKeyCheck: function(keyType) {
        // console.log(keyType);

        var self = this;

        // Reset state
        /*
        this.state[keyType] = false;
        events.pub('ui/event', {});
        */

        var username = this.refs.username.getDOMNode().value;
        var privateKey = this.refs[keyType].getDOMNode().value;

        // Check for zero length
        if(!privateKey.length) {
            this.state[keyType] = 'Key missing';
            events.pub('ui/event', {});
            return false;
        }

        // Convert to public key
        var publicKey = Puffball.Crypto.privateToPublic(privateKey);
        if(!publicKey) {
            this.state[keyType] = 'Bad key';
            events.pub('ui/event', {});
            return false;
        }

        var prom = Puffball.getUserRecord(username);

        prom.then(function(userInfo) {

            if(publicKey != userInfo[keyType]) {
                self.state[keyType] = 'Incorrect key';
                events.pub('ui/event', {});
                return false;
            } else {
                self.state[keyType] = true;
                self.state.usernameStatus = true;

                // Add this to wardrobe, set username to current
                if(keyType == 'defaultKey') {
                    PuffWardrobe.storeDefaultKey(username, privateKey);
                    console.log("Updated default key");
                }

                if(keyType == 'adminKey') {
                    PuffWardrobe.storeAdminKey(username, privateKey);
                }

                if(keyType == 'rootKey') {
                    PuffWardrobe.storeRootKey(username, privateKey);
                }

                // At least one good key, set this to current user
                PuffWardrobe.switchCurrent(username);

                events.pub('ui/event', {});
                return false;
            }
        })
            .catch(function(err) {
                self.state[keyType] = 'Not found';
                events.pub('ui/event', {});
                return false;
            })
        return false;

    },

    render: function() {
        if (!this.props.show) {
            return React.DOM.div(null)
        } else {
            var currUser = this.props.username;
            var polyglot = Translate.language[puffworldprops.view.language];
            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div(null, React.DOM.em(null, polyglot.t("menu.identity.storeKey.msg"))),
                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.username"),":"),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"username", ref:"username", defaultValue:currUser, size:"12"} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handleUsernameLookup}, Checkmark( {show:this.state.usernameStatus} )),
                        React.DOM.em(null, this.state.usernameStatus)
                    ),React.DOM.br(null ),
                    React.DOM.div(null, React.DOM.i( {className:"fa fa-lock fa-fw gray"}), " ", polyglot.t("menu.identity.private")),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKey", ref:"defaultKey", size:"12"} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'defaultKey')}, 
                                Checkmark( {show:this.state.defaultKey} )),
                                React.DOM.em(null, this.state.defaultKey)
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKey", ref:"adminKey", size:"12"} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'adminKey')}, 
                        Checkmark( {show:this.state.adminKey} )),
                        React.DOM.em(null, this.state.adminKey)
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKey", ref:"rootKey", size:"12"} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'rootKey')}, 
                        Checkmark( {show:this.state.rootKey} )),
                        React.DOM.em(null, this.state.rootKey)
                    ),React.DOM.br(null )
                )
                )
        }
    }
});

var Checkmark = React.createClass({displayName: 'Checkmark',
   render: function() {
       if(this.props.show === false) {
           return React.DOM.i( {className:"fa fa-check-circle fa-fw gray"})
       } else if(this.props.show === true) {
           return React.DOM.i( {className:"fa fa-check-circle fa-fw green"})
       } else {
           return React.DOM.i( {className:"fa fa-check-circle fa-fw red"})
       }

   }
});

var EditIdentity = React.createClass({displayName: 'EditIdentity',

    render: function() {
        if (!this.props.show) {
            return React.DOM.span(null)
        } else {

            var currUser = this.props.username;

            // TODO: make sure not None
            // TODO: Allow erase keys here?
            var polyglot = Translate.language[puffworldprops.view.language];
            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div(null, React.DOM.em(null, polyglot.t("menu.identity.edit.msg"),": " ),React.DOM.span( {className:"authorSpan"}, currUser)
                    ),

                    React.DOM.div(null, React.DOM.i( {className:"fa fa-lock fa-fw gray"}), " ", polyglot.t("menu.identity.private")),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKey", ref:"defaultKey", size:"12", value:PuffWardrobe.getCurrentKeys()['default']} )
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKey", ref:"adminKey", size:"12", value:PuffWardrobe.getCurrentKeys()['admin']} )
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKey", ref:"rootKey", size:"12", value:PuffWardrobe.getCurrentKeys()['root']} )
                    ),React.DOM.br(null )
                )
                )
        }
    },

    toggleShowRootKey: function() {
        console.log(this.state.rootKey);
        if(this.state.rootKey == 'hidden') {
            this.setState({rootKey: PuffWardrobe.getCurrentUserRecord().rootKey});
        } else {
            this.setState({rootKey: 'hidden'});
        }
        return false;
    },

    handleChange: function(event){
        return false;
    }

});

/*

 <br />
 - Place to view
 - Username is fixed<br />
 - Existing Keys<br />
 + default, admin, root, (click to show each new level)<br />
 + Click next to each one to try and change<br />
 - Message area below for results<br />
 - Reminder to save keys<br />
 */


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

var NewIdentity = React.createClass({displayName: 'NewIdentity',
    getInitialState: function() {
        return {
            usernameAvailable: 'unknown',
            usernameMessage: '',
            newUsername: ''
        }
    },

    handleFocus: function(e) {
        var target = e.target;
        setTimeout(function() {
            target.select();
        }, 0);
    },

    // TODO: Add options for users to save keys
    // TODO: Add to advanced tools <UsernameCheckbox show={this.state.usernameAvailable} />
    render: function() {
        if (!this.props.show) {
            return React.DOM.span(null)
        } else {
            var polyglot = Translate.language[puffworldprops.view.language];
            return (
                React.DOM.div( {className:"menuSection"}, 

                    React.DOM.div( {className:"menuLabel"}, React.DOM.em(null, polyglot.t("menu.identity.newKey.msg"),":")),React.DOM.br(null ),


                    React.DOM.div( {className:  "menuItem"}, 
                        React.DOM.select( {ref:"prefix"}, 
                            CONFIG.users.map(function(u) {
                                return React.DOM.option( {key:u.username, value:u.username}, u.username)
                            })
                        ), " ", React.DOM.em(null, "."),' ',
                        React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername",  defaultValue:this.state.newUsername, size:"12"} ), " ", React.DOM.a( {href:"#", onClick:this.handleGenerateUsername}), " ", React.DOM.i( {className:"fa fa-question-circle fa-fw", rel:"tooltip", title:"Right now, only anonymous usernames can be registered. To be notified when regular usernames become available, send a puff with .puffball in your zones"})
                       ),

                    React.DOM.em(null, this.state.usernameMessage),
                    React.DOM.br(null ),
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-unlock-alt"}), " ", polyglot.t("menu.identity.public")),


                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKeyPublic", ref:"rootKeyPublic", size:"18", onFocus:this.handleFocus} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKeyPublic", ref:"adminKeyPublic", size:"18", onFocus:this.handleFocus} )
                    ),

                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKeyPublic", ref:"defaultKeyPublic", size:"18", onFocus:this.handleFocus} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.a( {href:"#", onClick:this.handleGeneratePrivateKeys} , polyglot.t("menu.identity.newKey.generate")), " ", polyglot.t("menu.identity.newKey.or"), " ", React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , polyglot.t("menu.identity.newKey.convert.private"),React.DOM.span( {className:"fa fa-long-arrow-right fa-fw"}),polyglot.t("menu.identity.newKey.convert.public")),React.DOM.br(null ),

                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-lock"}), " ", polyglot.t("menu.identity.private")),
                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate", size:"18"} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate", size:"18"} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"18"} )
                    ),

                    React.DOM.br(null ),

                    React.DOM.a( {href:"#", onClick:this.handleUsernameRequest}, polyglot.t("menu.identity.newKey.submit")),React.DOM.br(null )

                )
                )
        }
    },

    handleGenerateUsername: function() {
        var generatedName = PuffWardrobe.generateRandomUsername();
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

        var prefix = this.refs.prefix.getDOMNode().value;

        rootKeyPrivate = this.refs.rootKeyPrivate.getDOMNode().value;
        adminKeyPrivate = this.refs.adminKeyPrivate.getDOMNode().value;
        defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;

        requestedUsername = prefix +'.'+ this.refs.newUsername.getDOMNode().value;

        // TODO: Make sure it is at least 5 chars long
        // TODO: Make sure it is valid characters
        // 
        var polyglot = Translate.language[puffworldprops.view.language];
        if(!rootKeyPublic || !adminKeyPublic || !defaultKeyPublic) {
            this.setState({usernameMessage: polyglot.t("menu.identity.newKey.error.missing")});
            return false;
        }

        var self = this;

        // SUBMIT REQUEST
        var prom = PuffNet.registerSubuser(prefix, CONFIG.users[prefix].adminKey, requestedUsername, rootKeyPublic, adminKeyPublic, defaultKeyPublic);
        prom.then(function(userRecord) {
                // store directly because we know they're valid
                PuffWardrobe.storePrivateKeys(requestedUsername, rootKeyPrivate, adminKeyPrivate, defaultKeyPrivate);
                self.setState({usernameMessage: polyglot.t("menu.identity.newKey.success")});

                // Set this person as the current user
                PuffWardrobe.switchCurrent(requestedUsername);

                events.pub('ui/event', {});

            },
            function(err) {
                console.log("ERR")
                self.setState({usernameMessage: err.toString()});
                events.pub('ui/event', {});
            });

        return false;
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
        return false;
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

        if(missingValues) {
            return false;
        }

        var rPublic = Puffball.Crypto.privateToPublic(rP);
        var aPublic = Puffball.Crypto.privateToPublic(aP);
        var dPublic = Puffball.Crypto.privateToPublic(dP);

        rPublic ? this.refs.rootKeyPublic.getDOMNode().value = rPublic : this.setState({rootKeyMessage: 'Invalid root key. '});
        aPublic ? this.refs.adminKeyPublic.getDOMNode().value = aPublic : this.setState({adminKeyMessage: 'Invalid admin key. '});
        dPublic ? this.refs.defaultKeyPublic.getDOMNode().value = dPublic : this.setState({defaultKeyMessage: 'Invalid default key. '});

        return false;

    },

    handleUsernameLookup: function() {

        this.state.usernameAvailable = 'checking';
        var username = this.refs.newUsername.getDOMNode().value;

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
        return false;
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


var About = React.createClass({displayName: 'About',
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, 
                React.DOM.i( {className:"fa fa-info-circle fa-fw gray"}), " ", polyglot.t("menu.about.title")
            ),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"https://github.com/puffball/freebeer/", target:"_new"}, polyglot.t("menu.about.code")))
            )
            )
    }
})

/*
// TODO: Put in stuff for
Call this Info instead of about, and have About puff
 <div>User guide</div>
 <div>Contact us</div>
 <div>Privacy policy</div>
 TODO: Add puff for
 Privacy policy: If you choose to make a puff public, it is public for everyone to see. If you encrypt a puff, its true contents will only be visible to your intended recipient, subject to the limitations of the cryptograhic tools used and your ability to keep your private keys private. Nothing prevents your intended recipient from sharing decripted copies of your content. <br /> Your username entry contains your public keys and information about your most recent content. You can view your full username record in the Advanced Tools section.

 TODO: Contact us link brings up a stub for a private puff with .puffball in the routing.

 */

var Tools = React.createClass({displayName: 'Tools',
    handlePackPuffs: function() {
        return events.pub('ui/show/puffpacker', {'view.style': 'PuffPacker', 'menu': puffworlddefaults.menu});
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuHeader"}, 
                React.DOM.i( {className:"fa fa-wrench fa-fw gray"}), " ", polyglot.t("menu.tool.title")
            ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handlePackPuffs}, polyglot.t("menu.tool.builder"))
                )
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
