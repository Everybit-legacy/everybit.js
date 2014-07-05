/** @jsx React.DOM */

   
var Tooltip = React.createClass({displayName: 'Tooltip',
    render: function() {
        var className = "menuTooltip";
        if (this.props.position) className += " " + this.props.position;
        else className += " right";
        return (
            React.DOM.div( {className:className}, this.props.content)
            );
    }
});

var TooltipMixin = {
    handleShowTooltip: function() {
        var parent = this;
        var tooltip = this.getElementsByClassName('menuTooltip')[0];
        tooltip.style.display = "block";
    },
    handleHideTooltip: function() {
        var parent = this;
        var tooltip = this.getElementsByClassName('menuTooltip')[0];
        tooltip.style.display = "none";
    },
    componentDidMount: function() {
        var current = this.getDOMNode();
        var tooltips = current.getElementsByClassName('menuTooltip');
        for (var i=0; i<tooltips.length; i++) {
            var parent = tooltips[i].parentNode;
            parent.firstChild.onmouseover = TooltipMixin.handleShowTooltip.bind(parent);
            parent.firstChild.onmouseout  = TooltipMixin.handleHideTooltip.bind(parent);
        }
    }
};

var FlashSectionMixin = {
    switchMenuSection: function() {
        var section = this.props.section || false;
        events.pub("ui/menu-section", {'menu.section': section});
    },
    componentDidMount: function() {
        this.getDOMNode().onclick = this.switchMenuSection;
    }
};


var Menu = React.createClass({displayName: 'Menu',

    handleClose: function() {
        return events.pub('ui/menu/close', {'menu.show': false})
    },

    render: function() {
        return (
            React.DOM.div( {className:"menu"}, 
                    React.DOM.a( {href:"#", onClick:this.handleClose}, 
                        React.DOM.i( {className:"fa fa-times-circle-o fa-fw closeBox"})
                    ),

                Logo(null ),

                React.DOM.br(null ),
                Cluster( {clusterName:"filter", clusterPath:"ui/clusters/filter", clusterPropPath:"clusters.filter", clusterMenu:"FilterMenu", clusterIcon:"fa-search-plus"} ),
                Cluster( {clusterName:"publish", clusterPath:"ui/clusters/publish", clusterPropPath:"clusters.publish", clusterMenu:"PuffPublishFormEmbed", clusterIcon:"fa-paper-plane"} ),
                Cluster( {clusterName:"view", clusterPath:"ui/clusters/view", clusterPropPath:"clusters.view", clusterMenu:"ViewMenu", clusterIcon:"fa-sitemap"} ),
                Cluster( {clusterName:"identity", clusterPath:"ui/clusters/identity", clusterPropPath:"clusters.identity", clusterMenu:"IdentityMenu", clusterIcon:"fa-user"} ),
                Cluster( {clusterName:"preferences", clusterPath:"ui/clusters/preferences", clusterPropPath:"clusters.preferences", clusterMenu:"PreferencesMenu", clusterIcon:"fa-gears"} ),
                Cluster( {clusterName:"about", clusterPath:"ui/clusters/about", clusterPropPath:"clusters.about", clusterMenu:"AboutMenu", clusterIcon:"fa-info-circle"} ),
                Cluster( {clusterName:"tools", clusterPath:"ui/clusters/tools", clusterPropPath:"clusters.tools", clusterMenu:"ToolsMenu", clusterIcon:"fa-wrench"} )
            )
            )
    }

});



var Cluster = React.createClass({displayName: 'Cluster',
 mixins: [TooltipMixin],
    switchMenuSection: function() {
        var section = this.props.clusterName || false;
        events.pub("ui/menu-section", {'menu.section': section});
    },
    componentDidMount: function() {
        this.getDOMNode().onclick = this.switchMenuSection;
    },
 handleToggleShowMenu: function() {
     var changed = !puffworldprops.clusters[this.props.clusterName];
     var eventJSON = {};
     eventJSON[this.props.clusterPropPath] = changed;

     return events.pub(this.props.clusterPath, eventJSON);
 },

 render: function() {
     var polyglot = Translate.language[puffworldprops.view.language];

     var cls = React.addons.classSet;
     var setClass = cls({
     'fa': true,
     'fa-chevron-circle-down': true,
     'rot90': !puffworldprops.clusters[this.props.clusterName]
     });

     var menuTitle = 'menu.' + this.props.clusterName + '.title';
     var clusterMenu;

     switch (this.props.clusterName) {

         case "filter":
             clusterMenu = React.DOM.div(null, CurrentFilters(null ),FilterMenu(null ))
             break;
         case "publish":
             clusterMenu = puffworldprops.reply.expand ? '' : PuffPublishFormEmbed( {reply:puffworldprops.reply} )
             break;
         case "view":
             clusterMenu = ViewMenu(null )
             break;
         case "identity":
             clusterMenu = IdentityMenu(null )
             break;
         case "preferences":
             clusterMenu = PreferencesMenu(null )
             break;
         case "about":
             clusterMenu = AboutMenu(null )
             break;
         case "tools":
             clusterMenu = ToolsMenu(null )
             break;
         default:
             break;
     }


     if(!puffworldprops.clusters[this.props.clusterName]) {
        clusterMenu = '';
     } 

     var section = this.props.clusterName;
     var className = (puffworldprops.clusters[section] && section == puffworldprops.menu.section) ? 'flash' : '';
    // <span className="floatRight gray"><i className={setClass}></i></span>

     return (
         React.DOM.div( {className:"menuCluster"}, 
             React.DOM.div( {className:className}, 
             React.DOM.a( {href:"#", onClick:this.handleToggleShowMenu}, 

             React.DOM.div( {className:"menuHeader"}, 
                 React.DOM.i( {className:"fa " + this.props.clusterIcon + " fa-fw gray"}),
                polyglot.t(menuTitle)
             )
             ),
             clusterMenu
             )
         )
     )
 }
 });

var Logo = React.createClass({displayName: 'Logo',
    render: function() {
        return (
            React.DOM.a( {href:CONFIG.url}, React.DOM.img( {src:CONFIG.logo, alt:"Logo", className:"logo"} ))
            )
    }
});

var FilterMenu = React.createClass({displayName: 'FilterMenu',
    mixins: [TooltipMixin],
    handlePickFilter: function() {
        var user = this.refs.pickuser.getDOMNode().value || false;
        var route = this.refs.pickroute.getDOMNode().value || false;

        var filterRoutes = puffworldprops.filter.routes;
        if (route && filterRoutes.indexOf(route) == -1) filterRoutes.push(route);
        var filterUsernames = puffworldprops.filter.usernames;
        if (user && filterUsernames.indexOf(user) == -1) filterUsernames.push(user);
        
        this.refs.pickroute.getDOMNode().value = '';
        this.refs.pickuser.getDOMNode().value = '';

        return events.pub('ui/view/route/set',
            {'filter.usernames': filterUsernames,
             'filter.routes': filterRoutes,
             'view.style':'PuffLatest'});
    },
    handleKeyDown: function(event) {
        if (event.keyCode == 13) {
            this.handlePickFilter();
        }
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        // var route = puffworldprops.view.filterroute || "";
        // var user = puffworldprops.view.filteruser || "";
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    polyglot.t("menu.filter.route"),":",
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"filterroute", ref:"pickroute", size:"12", defaultValue:"", onKeyDown:this.handleKeyDown} ),
                        Tooltip( {position:"under", content:polyglot.t("menu.tooltip.routeSearch")} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handlePickFilter}, React.DOM.i( {className:"fa fa-search-plus fa-fw"}))
                    ),React.DOM.br(null)
                ),
                React.DOM.div( {className:"menuItem"}, 
                    polyglot.t("menu.filter.user"),":",
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"filteruser", ref:"pickuser", size:"12", onKeyDown:this.handleKeyDown}  ),
                        Tooltip( {position:"under", content:polyglot.t("menu.tooltip.userSearch")} ),
                        ' ',React.DOM.a( {href:"#", onClick:this.handlePickFilter} , React.DOM.i( {className:"fa fa-search-plus fa-fw"}))
                    ),React.DOM.br(null)
                )
            )
            )
    }
});

var CurrentFilters = React.createClass({displayName: 'CurrentFilters',
    render: function() {
        var filterNodes = Object.keys(puffworldprops.filter).map(function(prop) {
            return Filter( {filterName:prop, filterValue:puffworldprops.filter[prop]} )
        })

        return (
            React.DOM.div(null, 
                filterNodes
            )
            );
    }
});

var Filter = React.createClass({displayName: 'Filter',
    handleRemoveFilter: function(toRemove) {
        // TODO: Remove this value from the props array
         var filterPath = 'filter.' + this.props.filterName;
         var propPiece = puffworldprops.filter[this.props.filterName];

         var viewStyle = puffworldprops.view.style;
         if (viewStyle=='PuffByUser') viewStyle = "PuffLatest";

         var index = propPiece.indexOf(toRemove);
         if (index > -1) {
            propPiece.splice(index, 1);
            return events.pub('ui/filter/remove', {'view.style': viewStyle, 
                                                   filterPath: propPiece})
         }

        return false;

    },

    render: function() {
        var self = this;

        var toReturn = (this.props.filterValue).map(function(value) {
            return (
                React.DOM.span( {className:"filterNode"}, 
                    value,
                    React.DOM.a( {href:"#", onClick:self.handleRemoveFilter.bind(this,value)}, 
                        React.DOM.i( {className:"fa fa-times-circle-o fa-fw"})
                    )
                )
                )
        });
        if (this.props.filterValue.length == 0) return React.DOM.span(null);
        return (
            React.DOM.div( {className:"menuItem"}, 
                self.props.filterName,":",' ',
                toReturn
            )
        );
    }

});


/*
 <p>Identity avatar</p>
 */

var ViewMenu = React.createClass({displayName: 'ViewMenu',
    mixins: [TooltipMixin],
    handleViewRoots: function() {
        return events.pub('ui/show/roots', {'view.style': 'PuffRoots', 'view.puff': false, 'menu': puffworlddefaults.menu, 'view.user': ''});
    },

    handleViewLatest: function() {
        return events.pub('ui/show/latest', {'view.style': 'PuffLatest', 'view.puff': false, 'menu': puffworlddefaults.menu, 'view.user': '', 'view.filterroute': false});
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
        var polyglot = Translate.language[puffworldprops.view.language];

        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleViewLatest}, polyglot.t("menu.view.latest")),' ',React.DOM.span( {className:"shortcut"}, "[l]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.latest")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowUserPuffs.bind(this,'choices.book')}, polyglot.t("menu.view.collection")),
                    Tooltip( {content:polyglot.t("menu.tooltip.collection")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowShortcuts}, polyglot.t("menu.view.shortcut")),
                    Tooltip( {content:polyglot.t("menu.tooltip.shortcut")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowPuffsForMe}, polyglot.t("menu.view.showpuffs")),
                    Tooltip( {content:polyglot.t("menu.tooltip.showPuffs")} )
                )

            )
            )
    }
});



var IdentityMenu = React.createClass({displayName: 'IdentityMenu',
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {
            username: PuffWardrobe.getCurrentUsername(),
            showUserRootPrivateKey: false,
            showUserAdminPrivateKey: false,
            showUserDefaultPrivateKey: false,
            tabs: {
                showSetIdentity: false,
                showEditIdentity: false,
                showNewIdentity: (puffworldprops.view.style == 'MenuAdd')
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
                AuthorPicker(null ),
                React.DOM.div( {className:"leftIndent"}, 
                    React.DOM.div( {className:setClass,  onClick:this.toggleShowTab.bind(this,'showSetIdentity')}, React.DOM.i( {className:"fa fa-sign-in fa-fw"}),Tooltip( {position:"under", content:polyglot.t("menu.tooltip.setIdentity")} )),
                    React.DOM.div( {className:editClass, onClick:this.toggleShowTab.bind(this,'showEditIdentity')}, React.DOM.i( {className:"fa fa-eye fa-fw"}),Tooltip( {position:"under", content:polyglot.t("menu.tooltip.editIdentity")} )),
                    React.DOM.div( {className:newClass,  onClick:this.toggleShowTab.bind(this,'showNewIdentity')} , React.DOM.i( {className:"fa fa-plus fa-fw"}),Tooltip( {position:"under", content:polyglot.t("menu.tooltip.newIdentity")} )),
                    React.DOM.br(null ),
                    SetIdentity( {show:this.state.tabs.showSetIdentity,  username:currUser}),
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


var PreferencesMenu = React.createClass({displayName: 'PreferencesMenu',
    mixins: [TooltipMixin],
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

    handleShowHideInfobar: function() {
        return events.pub( 'ui/view/showinfo/toggle',
            { 'view.showinfo': !puffworldprops.view.showinfo})
    },

    handlePickLanguage: function() {
        var language = this.refs.picklanguage.getDOMNode().value;
        return events.pub('ui/view/language/set', {'view.language': language});
    },

    render: function() {
        var language = puffworldprops.view.language || "en";
        var polyglot = Translate.language[language];
        var all_languages = Object.keys(Translate.language);

        // CSS for checkboxes
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

        var cbClass3 = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': puffworldprops.view.showinfo,
            'fa-square-o': !puffworldprops.view.showinfo,
            'green': puffworldprops.view.showinfo
        });

        return(
            React.DOM.div(null, 

                React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass, onClick:this.handleShowHideRelationships} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowHideRelationships}, polyglot.t("menu.preferences.relationship")),' ',React.DOM.span( {className:"shortcut"}, "[space]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.relationship")} )
                ),

                React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass2, onClick:this.handleShowHideAnimations} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowHideAnimations}, polyglot.t("menu.preferences.animation")),' ',React.DOM.span( {className:"shortcut"}, "[a]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.animation")} )
                ),

                React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass3, onClick:this.handleShowHideInfobar} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowHideInfobar}, polyglot.t("menu.preferences.infobar")),' ',React.DOM.span( {className:"shortcut"}, "[i]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.infobar")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.preferences.language"),": ", React.DOM.select( {ref:"picklanguage", onChange:this.handlePickLanguage, value:language}, 
                    all_languages.map(function(lang) {
                        return React.DOM.option( {key:lang, value:lang}, Translate.language[lang].t("dropdownDisplay"))
                    })
                )
                )

            )
            )

    }

});


var AboutMenu = React.createClass({displayName: 'AboutMenu',
    mixins: [TooltipMixin],
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"https://github.com/puffball/freebeer/", target:"_new"}, polyglot.t("menu.about.code")),
                Tooltip( {content:polyglot.t("menu.tooltip.code")} )
            )
            )
    }
})



var ToolsMenu = React.createClass({displayName: 'ToolsMenu',
    mixins: [TooltipMixin],
    handlePackPuffs: function() {
        return events.pub('ui/show/puffpacker', {'view.style': 'PuffPacker', 'menu': puffworlddefaults.menu});
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div( {className:"menuItem"}, 
                React.DOM.a( {href:"#", onClick:this.handlePackPuffs}, polyglot.t("menu.tools.builder")),
                Tooltip( {content:polyglot.t("menu.tooltip.puffBuilder")} )
            )
            )
    }
})



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
        var username = this.refs.switcher.getDOMNode().value;
        // var username = this.props.username;
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'filter.usernames': [username]})
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
        var relativeStyle = {position: 'relative'};
        return (
            React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.identity.current"),": ", React.DOM.select( {ref:"switcher", onChange:this.handleUserPick, value:username}, 
                    all_usernames.map(function(username) {
                        return React.DOM.option( {key:username, value:username}, username)
                    })
            ),
                ' ',React.DOM.span( {style:relativeStyle}, React.DOM.a( {href:"#", onClick:this.handleRemoveUser}, React.DOM.i( {className:"fa fa-trash-o fa-fw"})),Tooltip( {position:"under", content:polyglot.t('menu.tooltip.currentDelete')} )),
                ' ',React.DOM.span( {style:relativeStyle}, React.DOM.a( {href:"#", onClick:this.handleViewUser}, React.DOM.i( {className:"fa fa-search fa-fw"})),Tooltip( {position:"under", content:polyglot.t('menu.tooltip.userSearch')} ))
            )
            );
    }
    // TODO add alt tags to icons, or link it too a "help" puff.
    // NOTE: This might destroy the puff the person was working on
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
    getInitialState: function() {
        return {
            qrCode: false,
            qrCodeUser: false
        }
    },

    handleFocus: function(e) {
        var target = e.target;
        setTimeout(function() {
            target.select();
        }, 0);
    },

    handleShowQRCode: function(e) {
        var keyType = e.target.getAttribute('name');
        var key = this.refs[keyType+'Key'].getDOMNode().value;
        if (keyType == this.state.qrCode || key.length < 1) {
            this.setState({qrCode: false});
        } else {
            this.setState({'qrCode' : keyType,
                'qrCodeUser' : this.props.username});
        }
    },
    handleClickQRCode: function(){
        // create the qr code
        var key = PuffWardrobe.getCurrentKeys()[this.state.qrCode];
        var qr = qrcode(4, 'M');
        qr.addData(key);
        qr.make();
        var image_data = qr.createImgTag(10);
        var data = 'data:image/gif;base64,' + image_data.base64;
        window.open(data, 'Image')
    },

    render: function() {
        if (!this.props.show) {
            return React.DOM.span(null)
        } else {

            var currUser = this.props.username;
            var qrcodeField = "";
            var showQRCode = this.state.qrCode && this.state.qrCodeUser == currUser;
            if (showQRCode) {
                var keyType = this.state.qrCode;
                var key = PuffWardrobe.getCurrentKeys()[keyType];
                if (key.length < 1) {
                    showQRCode = false;
                } else {
                    var qr = qrcode(4, 'M');
                    qr.addData(key);
                    qr.make();

                    var image_data = qr.createImgTag() || {};
                    var data = 'data:image/gif;base64,' + image_data.base64;
                    qrcodeField = (React.DOM.img( {id:"qrcode", src:data, width:image_data.width, height:image_data.height, onClick:this.handleClickQRCode}));
                }

            }

            var qrcodeBaseStyle = "fa fa-qrcode fa-fw";

            var defaultKey = PuffWardrobe.getCurrentKeys()['default'];
            var defaultKeyQRStyle = (showQRCode && this.state.qrCode == 'default') ? qrcodeBaseStyle + " green" : qrcodeBaseStyle + " gray";
            var adminKey = PuffWardrobe.getCurrentKeys()['admin'];
            var adminKeyQRStyle   = (showQRCode && this.state.qrCode == 'admin')   ? qrcodeBaseStyle + " green" : qrcodeBaseStyle + " gray";
            var rootKey = PuffWardrobe.getCurrentKeys()['root'];
            var rootKeyQRStyle    = (showQRCode && this.state.qrCode == 'root')    ? qrcodeBaseStyle + " green" : qrcodeBaseStyle + " gray";

            // TODO: make sure not None
            // TODO: Allow erase keys here?
            var polyglot = Translate.language[puffworldprops.view.language];
            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div(null, React.DOM.em(null, polyglot.t("menu.identity.edit.msg"),": " ),React.DOM.span( {className:"authorSpan"}, currUser)
                    ),

                    React.DOM.div(null, React.DOM.i( {className:"fa fa-lock fa-fw gray"}), " ", polyglot.t("menu.identity.private")),
                    qrcodeField,

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKey", ref:"defaultKey", size:"12", value:defaultKey, onFocus:this.handleFocus} ),
                        React.DOM.i( {className:defaultKeyQRStyle, name:"default", onClick:this.handleShowQRCode} )
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKey", ref:"adminKey", size:"12", value:adminKey, onFocus:this.handleFocus} ),
                        React.DOM.i( {className:adminKeyQRStyle, name:"admin", onClick:this.handleShowQRCode})
                    ),React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKey", ref:"rootKey", size:"12", value:rootKey, onFocus:this.handleFocus} ),
                        React.DOM.i( {className:rootKeyQRStyle, name:"root", onClick:this.handleShowQRCode})
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
            step: 0,
            keys: {},
            desiredUsername: '',
            importInfo: {},
            enableContentImport: false,
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
    handleImport: function() {
        var network = this.refs.import.getDOMNode().value;
        UsernameImport[network].requestAuthentication();
    },
    handleContentImport: function() {
        var network = this.state.importInfo.network;
        var prom = UsernameImport[network].importContent(this.state.importInfo.username, this.state.importInfo.id, this.state.importInfo.id);
        prom.then(function() {
            console.log('import finished');
            this.props.importUsername = "";
            this.setState({enableContentImport: false});
        })  .catch(function(err) {
            this.setState({usernameMessage: err.message})
        });
    },
    handleCancelImport: function() {
        this.setState({desiredUsername: '', importInfo: {}})
    },
    handleBack: function() {
        this.state.keys = {};
        this.setState({step: (this.state.step+3)%4,
            usernameMessage: ''});
    },
    handleNext: function() {
        if (this.state.step == 0) {
            // set the desired username
            var username = "";
            if (!this.state.importInfo.username) {
                username = this.refs.prefix.getDOMNode().value + '.' + this.refs.newUsername.getDOMNode().value;
            } else {
                username = this.state.importInfo.username;
            }
            // TODO check the username and make sure it is valid
            this.setState({desiredUsername: username});
            setURLfromViewProps();
        } else if (this.state.step == 1) {
            var valid = this.checkKeys();
            if (!valid) return;
            this.setState({usernameMessage: ''});
        }
        this.setState({step: (this.state.step+1)%4});
    },

    handleStartOver: function() {
        var show = this.props.show;
        this.props = {};
        this.props.show = show;
        this.setState({
            step: 0,
            desiredUsername: '',
            usernameMessage: ''
        });
        this.handleGenerateUsername();
    },

    // TODO: Add options for users to save keys
    // TODO: Add to advanced tools <UsernameCheckbox show={this.state.usernameAvailable} />
    render: function() {
        if (!this.props.show) {
            return React.DOM.span(null)
        } else {
            var showNext = true;
            var polyglot = Translate.language[puffworldprops.view.language];
            var usernameField = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuLabel"}, React.DOM.em(null, polyglot.t("menu.identity.newKey.msg"),":")),React.DOM.br(null ),
                    React.DOM.div( {className:  "menuItem"}, 
                        React.DOM.select( {ref:"prefix"}, 
                        CONFIG.users.map(function(u) {
                            return React.DOM.option( {key:u.username, value:u.username}, u.username)
                        })
                        ), " ", React.DOM.em(null, "."),' ',
                        React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername",  defaultValue:this.state.newUsername, size:"12"} ), " ", React.DOM.a( {href:"#", onClick:this.handleGenerateUsername}), " ", React.DOM.i( {className:"fa fa-question-circle fa-fw", rel:"tooltip", title:"Right now, only anonymous usernames can be registered. To be notified when regular usernames become available, send a puff with .puffball in your zones"})
                    ),
                polyglot.t("menu.identity.step.import"),
                ' ',React.DOM.select( {id:"import", ref:"import", onChange:this.handleImport}, 
                    React.DOM.option( {value:""}),
                    React.DOM.option( {value:"instagram"}, "Instagram"),
                    React.DOM.option( {value:"reddit"}, "Reddit")
                )
                ));

            // check if there is requestedUsername parameter
            // var params = getQuerystringObject();
            var params = getStashedKeysFromURL();
            if (params['requestedUsername'] && Object.keys(this.state.importInfo).length == 0) {
                this.props.importUsername = reduceUsernameToAlphanumeric(params['requestedUsername']).toLowerCase();
                var importInfo = {
                    username: this.props.importUsername,
                    token  : params['token'],
                    id     : params['requestedUserId'],
                    network: params['network']
                };
                this.setState({'importInfo': importInfo});
                setURLfromViewProps();
            }
            if (Object.keys(this.state.importInfo).length != 0) {
                showNext = true;
                usernameField = (
                    React.DOM.div(null, 
                        React.DOM.div( {className:"menuLabel"}, React.DOM.em(null, "Imported Username")),' ',React.DOM.span(null, this.state.importInfo.username),' ',React.DOM.input( {className:"btn-link", type:"button", onClick:this.handleCancelImport, value:"Cancel"})
                    ));
            }

            var publicKeyField= (
                React.DOM.div(null, 
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
                    React.DOM.br(null )
                )
                );
            var privateKeyField = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-lock"}), " ", polyglot.t("menu.identity.private")),
                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"rootKeyPrivate", ref:"rootKeyPrivate", size:"18", onFocus:this.handleFocus} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"adminKeyPrivate", ref:"adminKeyPrivate", size:"18", onFocus:this.handleFocus} )
                    ),
                    React.DOM.br(null ),

                    React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                    React.DOM.div( {className:"menuInput"}, 
                        React.DOM.input( {type:"text", name:"defaultKeyPrivate", ref:"defaultKeyPrivate", size:"18", onFocus:this.handleFocus} )
                    ),
                    React.DOM.br(null)
                )
                )
            var keyField = (
                React.DOM.div(null, 
                    React.DOM.em(null, polyglot.t("menu.identity.step.remember")),
                publicKeyField,
                    React.DOM.a( {href:"#", onClick:this.handleGeneratePrivateKeys} , polyglot.t("menu.identity.newKey.generate")), " ", polyglot.t("menu.identity.newKey.or"), " ", React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , polyglot.t("menu.identity.newKey.convert.private"),React.DOM.span( {className:"fa fa-long-arrow-right fa-fw"}),polyglot.t("menu.identity.newKey.convert.public")),React.DOM.br(null ),
                privateKeyField
                )
                );

            var submitField = (
                React.DOM.a( {href:"#", className:"floatRight steps", onClick:this.handleUsernameRequest}, polyglot.t("menu.identity.newKey.submit"),React.DOM.i( {className:"fa fa-chevron-right fa-fw"}))
                );

            var importContentField = "";
            if (this.state.enableContentImport) {
                importContentField = (
                    React.DOM.a( {href:"#", onClick:this.handleContentImport}, "Import Content")
                );
            }

            var mainField = [usernameField, keyField, submitField, importContentField];
            var stepMessage = [
                polyglot.t("menu.identity.step.select"),
                    polyglot.t("menu.identity.step.generate") + this.state.desiredUsername,
                    polyglot.t("menu.identity.step.request") + this.state.desiredUsername,
                this.state.desiredUsername
            ];

            var nextField = (
                React.DOM.a( {className:"floatRight steps", onClick:this.handleNext}, "Next",React.DOM.i( {className:"fa fa-chevron-right fa-fw"}))
                );
            if (!showNext || this.state.step > 1) nextField = "";

            var backField = (
                React.DOM.a( {className:"floatLeft steps", onClick:this.handleBack}, React.DOM.i( {className:"fa fa-chevron-left fa-fw"}),"Back")
                );
            if (this.state.step == 0) backField="";
            if (this.state.step == 3) backField=(
                React.DOM.a( {className:"floatLeft steps", onClick:this.handleStartOver}, React.DOM.i( {className:"fa fa-chevron-left fa-fw"}),"Start Over")
                );

            var messageField = this.state.usernameMessage ? (React.DOM.div(null, React.DOM.em(null, this.state.usernameMessage))) : "";

            return (
                React.DOM.div( {className:"menuSection"}, 
                    React.DOM.div( {className:"menuLabel"}, "Step ", this.state.step+1,
                    ': ',
                    stepMessage[this.state.step]),React.DOM.br(null),
                    mainField[this.state.step],
                    messageField,
                    backField,
                    nextField,React.DOM.br(null)
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
    componentDidUpdate: function() {
        if (puffworldprops.menu.section == "identity") 
            this.getDOMNode().scrollIntoView(true);
    },
    componentDidMount: function() {
        if (puffworldprops.menu.section == "identity")
            this.getDOMNode().scrollIntoView(true);
    },

    checkKeys: function() {
        // Stuff to register. These are public keys
        var rootKeyPublic    = this.refs.rootKeyPublic.getDOMNode().value;
        var adminKeyPublic   = this.refs.adminKeyPublic.getDOMNode().value;
        var defaultKeyPublic = this.refs.defaultKeyPublic.getDOMNode().value;

        var polyglot = Translate.language[puffworldprops.view.language];
        if(!rootKeyPublic || !adminKeyPublic || !defaultKeyPublic) {
            this.setState({usernameMessage: polyglot.t("menu.identity.newKey.error.missing")});
            return false;
        }

        var rootKeyPrivate = this.refs.rootKeyPrivate.getDOMNode().value;
        var adminKeyPrivate = this.refs.adminKeyPrivate.getDOMNode().value;
        var defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;

        // store keys to state
        this.state.keys = {
            rootKeyPublic    : rootKeyPublic,
            adminKeyPublic   : adminKeyPublic,
            defaultKeyPublic : defaultKeyPublic,
            rootKeyPrivate   : rootKeyPrivate,
            adminKeyPrivate  : adminKeyPrivate,
            defaultKeyPrivate: defaultKeyPrivate
        };
        return true;
    },

    handleUsernameRequest: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        // BUILD REQUEST
        var requestedUsername = this.state.desiredUsername;
        var prefix = "anon";
        var prefixIndex = requestedUsername.indexOf('.');
        if (requestedUsername.indexOf('.') != -1) {
            prefix = requestedUsername.split('.')[0];
        }
        console.log("BEGIN username request for ", requestedUsername);

        var rootKeyPublic     = this.state.keys.rootKeyPublic;
        var adminKeyPublic    = this.state.keys.adminKeyPublic;
        var defaultKeyPublic  = this.state.keys.defaultKeyPublic;

        var rootKeyPrivate    = this.state.keys.rootKeyPrivate;
        var adminKeyPrivate   = this.state.keys.adminKeyPrivate;
        var defaultKeyPrivate = this.state.keys.defaultKeyPrivate;

        this.setState({keys: {}});

        var self = this;

        var payload = {
            requestedUsername: requestedUsername,
            rootKey: rootKeyPublic,
            adminKey: adminKeyPublic,
            defaultKey: defaultKeyPublic
        };
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        // import
        var importInfo = this.state.importInfo;
        console.log(importInfo);
        if (Object.keys(importInfo).length != 0) {
            payload.importNetwork = importInfo.network;
            payload.importToken = importInfo.token;
            payload.importId = importInfo.id;
        }

        var puff = Puffball.buildPuff(prefix, CONFIG.users[prefix].adminKey, routes, type, content, payload); 

        // SUBMIT REQUEST
        var prom = PuffNet.updateUserRecord(puff);
        prom.then(function(userRecord) {
                // store directly because we know they're valid
                PuffWardrobe.storePrivateKeys(requestedUsername, rootKeyPrivate, adminKeyPrivate, defaultKeyPrivate);
                self.setState({step: 3,
                    enableContentImport: true,
                    usernameMessage: polyglot.t("menu.identity.newKey.success")});

                // Set this person as the current user
                PuffWardrobe.switchCurrent(requestedUsername);
                events.pub('ui/event', {});
            },
            function(err) {
                console.log("ERR")
                self.setState({step: 3,
                    enableContentImport: true,
                    usernameMessage: err.toString()});
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


/*
 // TODO: Put in stuff for

 // TODO put back recent conversations when working
 Call this Info instead of about, and have About puff
 <div>User guide</div>
 // TODO: Contact us:
 brings up a stub for a private puff with .puffball in the routing.
 // TODO: Privacy policy:
 Privacy policy: If you choose to make a puff public, it is public for everyone to see. If you encrypt a puff, its true contents will only be visible to your intended recipient, subject to the limitations of the cryptograhic tools used and your ability to keep your private keys private. Nothing prevents your intended recipient from sharing decripted copies of your content. <br /> Your username entry contains your public keys and information about your most recent content. You can view your full username record in the Advanced Tools section.

 */