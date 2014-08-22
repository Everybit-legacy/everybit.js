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


var Menu = React.createClass({displayName: 'Menu',
    render: function() {
        return (
            React.DOM.div( {className:"menu"}, 
                Cluster( {clusterName:"publish", clusterMenu:"PuffPublishFormEmbed", clusterIcon:"fa-paper-plane", view:this.props.view}),
                Cluster( {clusterName:"view", clusterMenu:"ViewMenu", clusterIcon:"fa-search", view:this.props.view} ),
                Cluster( {clusterName:"identity", clusterMenu:"IdentityMenu", clusterIcon:"fa-user", view:this.props.view} ),
                Cluster( {clusterName:"preferences", clusterMenu:"PreferencesMenu", 
                         clusterIcon:"fa-gears", view:this.props.view} ),
                Cluster( {clusterName:"about", clusterMenu:"AboutMenu", clusterIcon:"fa-info-circle", view:this.props.view} ),
                Cluster( {clusterName:"tools", clusterMenu:"ToolsMenu", clusterIcon:"fa-wrench", view:this.props.view} ),

                Logo(null )
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
        var clusterName = this.props.clusterName;
        var path = "ui/clusters/" + clusterName;
        var propPath = "clusters." + clusterName;

        var changed = !puffworldprops.clusters[clusterName];
        var eventJSON = {};
        eventJSON[propPath] = changed;

        return events.pub(path, eventJSON);
    },
    handlePopoutMenu:function() {
        var clusterName = this.props.clusterName;
        var propPath = "clusters." + clusterName;

        var eventJSON = {};
        eventJSON[propPath] = true;

        var popout = clusterName;
        var showMenu = false;
        if (puffworldprops.menu.popout == popout) {
            popout = false;
            showMenu = true;
        }

        eventJSON['menu.show'] = showMenu;
        eventJSON['menu.popout'] = popout;
        return events.pub('ui/expand/menu', eventJSON);
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
        case "publish":
            clusterMenu = PuffPublishFormEmbed( {reply:puffworldprops.reply} )
            break;
        case "view":
            clusterMenu = ViewMenu( {view:this.props.view})
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

        if (puffworldprops.menu.popout == this.props.clusterName &&
            !this.props.isPopout)
            clusterMenu = '';

        var section = this.props.clusterName;
        var className = (puffworldprops.clusters[section] && section == puffworldprops.menu.section) ? 'flash' : '';
        // <span className="floatRight gray"><i className={setClass}></i></span>
        
        var slide = puffworldprops.clusters[this.props.clusterName] ? 'slidedown' : 'slideup';
        var popoutClassName = this.props.isPopout ? "fa fa-fw fa-compress gray" : "fa fa-fw fa-expand gray";
        return (
            React.DOM.div( {className:"menuCluster"}, 
                React.DOM.div( {className:className}, 
                    React.DOM.div( {className:"menuHeader"}, 
                        React.DOM.a( {href:"#", onClick:this.handleToggleShowMenu}, 
                            React.DOM.i( {className:"fa " + this.props.clusterIcon + " fa-fw gray"}),
                            polyglot.t(menuTitle)
                        ),
                        React.DOM.a( {className:"floatRight", href:"#", onClick:this.handlePopoutMenu}, 
                            React.DOM.i( {className:popoutClassName})
                        )
                    ),
                    
                    React.DOM.div( {className:slide}, clusterMenu)
                )
            )
        )
    }
});

/*var ProfileMenu = React.createClass({
    render: function() {
        var username = PuffWardrobe.getCurrentUsername();
        if (!username) 
            return <span>You have to set your identity first.</span>;
        
        return <ProfileForm />;
    }
})*/

var FilterMenu = React.createClass({displayName: 'FilterMenu',
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {type:'tags'}
    },
    
    handleAddFilter: function() {
        var type = this.state.type;
        var currFilter = PB.shallow_copy(this.props.view.filters[type]);
        var newFilter = this.refs.filter.getDOMNode().value.replace(/\s+/g, '') || false;
        if (!newFilter){
            alert('Enter a ' + type.slice(0, -1) + ' in the box and click to add it)');
            this.refs.filter.getDOMNode().value = '';
            return false;
        }

        // Remove leading "." on username
        if (type == 'users' || type == 'routes') {
            if (newFilter.slice(0, 1) == '.')
                newFilter = newFilter.slice(1);
        }

        if (newFilter && currFilter.indexOf(newFilter) == -1) 
            currFilter.push(newFilter);
        var jsonToSet = {};
        jsonToSet['view.filters.'+type] = currFilter;
        this.refs.filter.getDOMNode().value = '';
        return events.pub('filter/add', jsonToSet); 
    },
    
    handleKeyDown: function(event) {
        if (event.keyCode == 13) {
            this.handleAddFilter();
        }
    },
    handlePickFilter: function(type) {
        this.setState({type: type});
        return false;
    },
    createEachFilter: function(type) {
        var polyglot = Translate.language[puffworldprops.view.language];
        var filterToIcon = {
            tags: 'fa-tag',
            types: 'fa-asterisk',
            users:'fa-user',
            routes:'fa-sitemap'
        }
        var icon = filterToIcon[type];

        var color = this.state.type == type ? 'green' : 'black';
        return (
            React.DOM.span( {key:type}, 
                React.DOM.button( {value:type, className:"btn " + color, onClick:this.handlePickFilter.bind(this, type)}, icon.indexOf('fa-')!=0 ? icon : React.DOM.i( {className:'fa fa-fw '+icon})),
                Tooltip( {position:"under", content:polyglot.t("menu.tooltip."+type+"Filter")} )
            )
        )
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        // var all_filter = ['tags', 'users', 'routes'];
        var leftColStyle = {
            width: '80px',
            display: 'inline-block'
        }
        
        return (
            React.DOM.div( {className:"menuItem"}, 
                React.DOM.span( {style:leftColStyle}, polyglot.t("menu.filters.title"),":"),
                React.DOM.input( {ref:"filter", type:"text", className:"btn narrowInputField", onKeyDown:this.handleKeyDown} ),React.DOM.a( {href:"#", onClick:this.handleAddFilter}, ' ',React.DOM.i( {className:"fa fa-plus-circle fa-fw"})),React.DOM.br(null),
                React.DOM.span( {style:leftColStyle}, polyglot.t("menu.filters.by"),":"),
                React.DOM.span( {className:"relative"}, 
                    Object.keys(puffworldprops.view.filters).sort().map(this.createEachFilter)
                )
            )
        );
    }
});

var CurrentFilters = React.createClass({displayName: 'CurrentFilters',
    render: function() {
        var filterNodes = Object.keys(this.props.view.filters).map(function(key) {
            return FilterBubble( {key:key, filterName:key, filterValue:this.props.view.filters[key]} )
        }.bind(this))

        return (
            React.DOM.div(null, 
                filterNodes
            )
        );
    }
});

var FilterBubble = React.createClass({displayName: 'FilterBubble',
    handleRemoveFilter: function(toRemove) {
        // TODO: Remove this value from the props array
         var filterPath  = 'view.filters.' + this.props.filterName;
         var filterValue = PB.shallow_copy(this.props.filterValue);       // don't mutate props
         // var propPiece = puffworldprops.filter[this.props.filterName]; 

         // THINK: do we still need this?
         // var viewStyle = puffworldprops.view.mode;
         // if (viewStyle == 'PuffByUser') viewStyle = "PuffLatest";

         var index = filterValue.indexOf(toRemove);
         if(index >= 0) {
            filterValue.splice(index, 1);
            var propsMod = {};
            propsMod[filterPath] = filterValue;
            return events.pub('filter/remove', propsMod);
         }

        return false;
    },
    componentDidUpdate: function(prevProp) {
        if (prevProp.filterValue != this.props.filterValue) {
            TooltipMixin.componentDidMount.bind(this)();
        }
    },

    render: function() {
        var filterArray = Array.isArray(this.props.filterValue)
                        ? this.props.filterValue
                        : [this.props.filterValue]

        if (filterArray.length == 0) return React.DOM.span(null);
        
        var polyglot = Translate.language[puffworldprops.view.language];
        
        var self = this;
        var isUsername = this.props.filterName == "routes" || this.props.filterName == "users";

        return (
            React.DOM.div( {className:"menuItem"}, 
                this.props.filterName,":",' ',
                filterArray.map(function(value) {
                return (
                    React.DOM.span( {key:value, className:"bubbleNode relative"}, 
                        isUsername ? StringConversion.toDisplayUsername(value) : value,
                        React.DOM.span(null , 
                            React.DOM.a( {href:"#", onClick:self.handleRemoveFilter.bind(self, value)}, 
                            React.DOM.i( {className:"fa fa-times-circle-o fa-fw"})
                            ),
                            Tooltip( {position:"under", content:polyglot.t("menu.tooltip.removeFilter")} )
                        )
                    )
                )
            })
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
        return events.pub('ui/show/roots', { 'view.mode': 'list'
                                           , 'view.query.roots': true
                                           , 'menu': puffworlddefaults.menu});
    },

    handleViewLatest: function() {
        if(puffworldprops.view.rows < 2)
            var showRows = puffworlddefaults.view.rows
        else
            var showRows = puffworldprops.view.rows

        return events.pub('ui/show/latest', { 'view.mode': 'list'
                                            , 'view.rows': showRows
                                            , 'menu': puffworlddefaults.menu
                                            , 'view.filters': {}
                                            , 'view.query': puffworlddefaults.view.query
                                            });
    },

    handleShowUserPuffs: function(username) {
        if(puffworldprops.view.rows < 2)
            var showRows = puffworlddefaults.view.rows
        else
            var showRows = puffworldprops.view.rows


        return events.pub('filter/show/by-user', 
                            { 'view.filters': {}, 
                              'view.rows': showRows,
                              'view.filters.users': [username] })
    },

    handleShowShortcuts: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        events.pub('ui/view/rows/1', {'view.rows': 1})
        showPuff(polyglot.t("puff.shortcut"));
        return false;
    },

    /*
     <div className="menuItem">
     <a href="#" onClick={this.handleViewRoots}>{polyglot.t("menu.view.roots")}</a>
     <Tooltip content={polyglot.t("menu.tooltip.roots")} />
     </div>
     */

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];

        return (
            React.DOM.div(null, 
                React.DOM.div(null, CurrentFilters( {view:this.props.view} ),FilterMenu( {view:this.props.view} )),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleViewLatest}, polyglot.t("menu.view.latest")),' ',React.DOM.span( {className:"shortcut"}, "[l]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.latest")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowUserPuffs.bind(this,'choices.book')}, polyglot.t("menu.view.collection")),
                    Tooltip( {content:polyglot.t("menu.tooltip.collection")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowShortcuts}, polyglot.t("menu.view.shortcut")),' ',React.DOM.span( {className:"shortcut"}, "[k]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.shortcut")} )
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
            section: false
        }
    },



    handleToggleShowSection: function(name) {
        var section = name;
        if (this.state.section == section)
            section = false;
        this.setState({section: section});
        return false;
    },

    render: function() {
        var currUser = PuffWardrobe.getCurrentUsername();

        // TODO: Help icon takes you to tutorial related to this.
        var polyglot = Translate.language[puffworldprops.view.language];
        var self = this;
        var sectionToIcon = {
            "new": "fa-plus", "set": "fa-sign-in", "view": "fa-eye"
        };
        return (
            React.DOM.div(null, 
                AuthorPicker(null ),
                React.DOM.div( {style:{display:'inline-block'}, className:"menuItem"}, 
                    ['new', 'set', 'view'].map(function(key){
                        var show = self.state.section == key;
                        var tabClassName = show ? "linkTabHighlighted" : "linkTab";
                        return (
                            React.DOM.span( {className:tabClassName, key:key}, 
                                React.DOM.a( {href:"#", onClick:self.handleToggleShowSection.bind(self, key)}, React.DOM.i( {className:"fa fa-fw "+sectionToIcon[key]}),polyglot.t("menu.identity."+key+"Identity.title")),
                                Tooltip( {position:"under", content:polyglot.t("menu.tooltip."+key+"Identity")} )
                            )
                        )
                    })
                ),
                React.DOM.div( {className:"menuItem"}, 
                    NewIdentity( {show:this.state.section == "new"} ),
                    SetIdentity( {show:this.state.section == "set", username:currUser} ),
                    ViewIdentity( {show:this.state.section == 'view', username:currUser} )
                ),
                React.DOM.br(null)
            )
            )
    }
});


var PreferencesMenu = React.createClass({displayName: 'PreferencesMenu',
    
     // OPT: reading puffworldprops prevents short circuiting rendering -- pass necessary props into here instead
    
    mixins: [TooltipMixin],
    handleShowHideRelationships: function() {
        return events.pub( 'ui/relationships/hide', 
                           {'view.arrows': !puffworldprops.view.arrows});
    },

    handleShowHideAnimations: function() {
        return events.pub( 'ui/animation/hide', 
                           {'view.animation': !puffworldprops.view.animation});
    },

    handleToggleReporting: function() {
        return events.pub( 'ui/prefs/reporting', 
                           {'prefs.reporting': !puffworldprops.prefs.reporting});
    },

    handleShowHideInfobar: function() {
        return events.pub( 'ui/view/showinfo/toggle',
                            {'view.showinfo': !puffworldprops.view.showinfo})
    },
    
    handlePickBgcolor: function() {
        var colorDiv = this.refs.bgcolor.getDOMNode();
        var color = colorDiv.color;
        var body = document.getElementsByTagName("body")[0];
        var overlay = document.getElementsByClassName("overlay")[0];
        body.style.backgroundColor = color;
        overlay.style.backgroundColor = color;
    },
    handlePickLanguage: function() {
        var language = this.refs.picklanguage.getDOMNode().value;
        return events.pub('ui/view/language/set', {'view.language': language});
    },
    componentDidMount: function() {
        if (this.refs.bgcolor) {
            jscolor.init();
            var colorDiv = this.refs.bgcolor.getDOMNode();

            var currentBg = document.body.style.backgroundColor;
            if (currentBg) {
                currentBg = currentBg.substring(4, currentBg.length-1)
                                     .replace(/ /g, '')
                                     .split(',');
                var r = parseFloat(currentBg[0]);
                var g = parseFloat(currentBg[1]);
                var b = parseFloat(currentBg[2]);
                colorDiv.color.fromRGB(r/255.0, g/255.0, b/255.0)
            } else {
                colorDiv.color.fromString(CONFIG.defaultBgcolor);
            }
            colorDiv.onchange = this.handlePickBgcolor;
        }
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
            'fa-check-square-o': (puffworldprops.view.arrows),
            'fa-square-o': !(puffworldprops.view.arrows),
            'green': (puffworldprops.view.arrows)
        });

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

        var cbClass4 = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': !puffworldprops.prefs.reporting,
            'fa-square-o': puffworldprops.prefs.reporting,
            'green': !puffworldprops.prefs.reporting
        });

        return(
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass,  onClick:this.handleShowHideRelationships} )),
                    React.DOM.a( {href:"#", onClick:this.handleShowHideRelationships}, polyglot.t("menu.preferences.relationship")),' ',React.DOM.span( {className:"shortcut"}, "[space]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.relationship")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass2, onClick:this.handleShowHideAnimations} )),
                    React.DOM.a( {href:"#", onClick:this.handleShowHideAnimations}, polyglot.t("menu.preferences.animation")),' ',React.DOM.span( {className:"shortcut"}, "[a]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.animation")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass3, onClick:this.handleShowHideInfobar} )),
                    React.DOM.a( {href:"#", onClick:this.handleShowHideInfobar}, polyglot.t("menu.preferences.infobar")),' ',React.DOM.span( {className:"shortcut"}, "[i]"),
                    Tooltip( {content:polyglot.t("menu.tooltip.infobar")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.span( {className:"floatingCheckbox"}, React.DOM.i( {className:cbClass4, onClick:this.handleToggleReporting} )),
                    React.DOM.a( {href:"#", onClick:this.handleToggleReporting}, polyglot.t("menu.preferences.disable_reporting")),
                    Tooltip( {content:polyglot.t("menu.tooltip.disable_reporting")} )
                ),


                React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.preferences.bgcolor"),":",' ',
                    React.DOM.input( {className:"colorPicker btn", size:"6", ref:"bgcolor"} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                polyglot.t("menu.preferences.language"),": ", React.DOM.select( {ref:"picklanguage", onChange:this.handlePickLanguage, defaultValue:language}, 
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

    handleShowFaq: function() {
        showPuff(CONFIG.faqPuff);
        return false;
    },

    handleToggleShowIntro: function() {
        if(puffworldprops.slider.show)
            return events.pub('ui/slider/open', {'slider.show': false});

        return events.pub('ui/slider/open', {'slider.show': true,
                                             'menu.show':   false});
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleToggleShowIntro}, polyglot.t("menu.about.introduction"))
                ),

                React.DOM.div( {className:"menuItem"}, React.DOM.a( {href:"https://github.com/puffball/freebeer/", target:"_new"}, polyglot.t("menu.about.code")),
                    Tooltip( {content:polyglot.t("menu.tooltip.code")} )
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowFaq}, polyglot.t("menu.about.faq"))
                )
            )
        )
    }
})


var ToolsMenu = React.createClass({displayName: 'ToolsMenu',
    mixins: [TooltipMixin],
    handlePackPuffs: function() {
        return events.pub('ui/show/puffpacker', {'view.mode': 'PuffPacker', 'menu': puffworlddefaults.menu});
    },
    clearPuffShells: function(){
        Puffball.Persist.remove('shells');
        Puffball.Persist.remove('flagged');
        document.location.reload(true);
        return false;
    },

    handleRefresh: function() {
        // TODO: this doesn't respect filters etc and should be websockets instead of a query
        PuffData.importRemoteShells()
        return false               // (like, sockets from a p2p node that links rtc-less browsers to the network)
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handlePackPuffs}, polyglot.t("menu.tools.builder")),
                    Tooltip( {content:polyglot.t("menu.tooltip.puffBuilder")} )
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleRefresh}, "Force update of content")
                ),
                Tooltip( {position:"under", content:polyglot.t('header.tooltip.refresh')} ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.clearPuffShells}, polyglot.t("menu.tools.clearCache"))
                )
            )
        )
    }
})



// Was PuffSwitchUser
var AuthorPicker = React.createClass({displayName: 'AuthorPicker',
    getInitialState: function() {
        return {profileMsg: ''}
    },
    handleUserPick: function() {
        this.setState({profileMsg: ''});
        PuffWardrobe.switchCurrent(this.refs.switcher.getDOMNode().value)
        return events.pub('ui/menu/user/pick-one/hide'/*, {'menu.user.pick_one': false}*/)
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
        var all_usernames = Object.keys(PuffWardrobe.getAll()).filter(function(u){return u!=userToRemove});
        if (all_usernames.length != 0) {
            PuffWardrobe.switchCurrent(all_usernames[0]);
        }
        events.pub('ui/user/'+userToRemove+'/remove', {}); // this should be generated by previous event
        return false;
    },

    handleViewUser: function() {
        var username = this.refs.switcher.getDOMNode().value;
        return events.pub( 'filter/show/by-user', 
                           { 'view.filters': {}
                           , 'view.filters.users': [username] } );
    },

    handleShowPuffsForMe: function(){
        var polyglot = Translate.language[puffworldprops.view.language];
        var username = PuffWardrobe.getCurrentUsername();
        if(!username.length) {
            alert(polyglot.t("alert.noUserSet"));
            return false;
        }
        // var route = this.refs.pickroute.getDOMNode().value;
        return events.pub( 'filter/show/for-user', 
                           { 'view.filters': {}
                           , 'view.filters.routes': [username] } );
    },

    handlePublishProfile: function() {
        var replyProps = PB.shallow_copy(puffworlddefaults.reply);
        replyProps.type = 'profile';
        return events.pub( 'ui/publish/profile',
                           { 'menu.show': true
                           , 'menu.section': 'publish'
                           , 'clusters.publish': true
                           , 'reply': replyProps } );
    },

    handleViewProfile: function() {
        var userRecord = PuffWardrobe.getCurrentUserRecord();
        var profile = userRecord.profile;
        var self = this;
        if (profile.length) {
            var puff = PuffForum.getPuffBySig(profile);
            if (puff) {
                this.setState({profileMsg: ''});
                return showPuffDirectly(puff);
            }

            var prom = PuffNet.getPuffBySig(profile);
            prom.then(function(p){
                if (p.payload) {
                    self.setState({profileMsg: ''});
                    showPuffDirectly(p);
                } else {
                    self.setState({profileMsg: 'No profile published.'})
                }
            })
        } else {
            this.setState({profileMsg: 'No profile published.'})
        }
        return false;
    },

    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())
        var polyglot = Translate.language[puffworldprops.view.language];
        if(!all_usernames.length) return React.DOM.div( {className:"menuItem"}, polyglot.t("menu.identity.current"),": ", polyglot.t("menu.identity.none"))

        // TODO: this creates an infinite loop, because switching the current user forces a check for private puffs, and importing private puffs forces a rerender. 
        // Force selection of the single user when just one
        // if(all_usernames.length == 1) {
        //     PuffWardrobe.switchCurrent(all_usernames[0]);
        // }

        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)
        // TODO: Need 2-way bind to prevent select from changing back every time you change it
        /*
        
                    {' '}<span style={relativeStyle}><a href="#" onClick={this.handleViewUser}><i className="fa fa-search fa-fw"></i></a><Tooltip position="under" content={polyglot.t('menu.tooltip.usersFilter')} /></span>
         */
        return (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuItem"}, 
                    polyglot.t("menu.identity.current"),": ", React.DOM.select( {ref:"switcher", onChange:this.handleUserPick, value:username}, 
                        all_usernames.map(function(username) {
                            return React.DOM.option( {key:username, value:username}, ".",username)
                        })
                        ),
                    ' ',React.DOM.span( {className:"relative"}, React.DOM.a( {href:"#", onClick:this.handleRemoveUser}, React.DOM.i( {className:"fa fa-trash-o fa-fw"})),Tooltip( {position:"under", content:polyglot.t('menu.tooltip.currentDelete')} ))
                ),

                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleViewUser}, polyglot.t("menu.view.showMine")),
                    Tooltip( {content:polyglot.t("menu.tooltip.showMine")} )
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleShowPuffsForMe}, polyglot.t("menu.view.showpuffs")),
                    Tooltip( {content:polyglot.t("menu.tooltip.showPuffs")} )
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handlePublishProfile}, "Publish Profile")
                ),
                React.DOM.div( {className:"menuItem"}, 
                    React.DOM.a( {href:"#", onClick:this.handleViewProfile}, "View profile"),
                    ' ',React.DOM.span( {className:"red"}, this.state.profileMsg)
                )
            )
            );
    }
    // TODO add alt tags to icons, or link it too a "help" puff.
    // NOTE: This might destroy the puff the person was working on
});

var Checkmark = React.createClass({displayName: 'Checkmark',
    render: function() {
        if(this.props.show === false) {
            return React.DOM.i( {className:"fa fa-check-circle fa-fw gray"})
        } else if(this.props.show === true) {
            return React.DOM.i( {className:"fa fa-check-circle fa-fw green"})
        } else {
            return React.DOM.span(null, React.DOM.i( {className:"fa fa-check-circle fa-fw red"}))
        }

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
        if (username.slice(0, 1) == '.')
            username = username.slice(1);

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
        if (username.slice(0, 1) == '.')
            username = username.slice(1);
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

    verifyUsername: function() {
        var username = this.refs.username.getDOMNode().value;
        username = StringConversion.reduceUsernameToAlphanumeric(username, /*allowDot*/true)
                    .toLowerCase();
        this.refs.username.getDOMNode().value = username;
    },

    render: function() {
        /*if (!this.props.show) {
            return <div></div>
        } else {*/
        var currUser = this.props.username;
        if (currUser)
            currUser = '.' + currUser;
        var polyglot = Translate.language[puffworldprops.view.language];

        var slide = this.props.show ? 'identitySection menuSection slidedown' : 'identitySection menuSection slideup';
        return (
            React.DOM.div( {className:slide}, 
                React.DOM.div( {className:"message red"}, polyglot.t("menu.identity.setIdentity.msg")),
                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.username"),":"),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"username", ref:"username", defaultValue:currUser, onBlur:this.verifyUsername, size:"12"} ),
                    ' ',React.DOM.a( {href:"#", onClick:this.handleUsernameLookup}, Checkmark( {show:this.state.usernameStatus} )),
                    React.DOM.span( {className:"message"}, this.state.usernameStatus)
                ),React.DOM.br(null ),
                React.DOM.div(null, React.DOM.i( {className:"fa fa-lock fa-fw gray"}), " ", polyglot.t("menu.identity.private")),

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"defaultKey", ref:"defaultKey", size:"12"} ),
                    ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'defaultKey')}, 
                    Checkmark( {show:this.state.defaultKey} )),
                    React.DOM.span( {className:"message"}, this.state.defaultKey)
                ),React.DOM.br(null ),

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"adminKey", ref:"adminKey", size:"12"} ),
                    ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'adminKey')}, 
                    Checkmark( {show:this.state.adminKey} )),
                    React.DOM.span( {className:"message"}, this.state.adminKey)
                ),React.DOM.br(null ),

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"rootKey", ref:"rootKey", size:"12"} ),
                    ' ',React.DOM.a( {href:"#", onClick:this.handleKeyCheck.bind(this,'rootKey')}, 
                    Checkmark( {show:this.state.rootKey} )),
                    React.DOM.span( {className:"message"}, this.state.rootKey)
                ),React.DOM.br(null )
            )
            )
       //}
    }
});


var ViewIdentity = React.createClass({displayName: 'ViewIdentity',
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
        /* (!this.props.show) {
            return <span></span>
        } else {*/

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
                qrcodeField = (React.DOM.img( {className:"qrcode", src:data, width:image_data.width, height:image_data.height, onClick:this.handleClickQRCode}));
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
        var slide = this.props.show ? 'identitySection menuSection slidedown' : 'identitySection menuSection slideup';
        return (
            React.DOM.div( {className:slide}, 
                React.DOM.div( {className:"message"}, polyglot.t("menu.identity.viewIdentity.msg"),": ", React.DOM.span( {className:"authorSpan"}, ".",currUser)
                ),

                React.DOM.div(null, React.DOM.i( {className:"fa fa-lock fa-fw gray"}), " ", polyglot.t("menu.identity.private")),
                qrcodeField,

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.default"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"defaultKey", ref:"defaultKey", size:"12", value:defaultKey, onFocus:this.handleFocus, readOnly:true} ),
                    React.DOM.i( {className:defaultKeyQRStyle, name:"default", onClick:this.handleShowQRCode} )
                ),React.DOM.br(null ),

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.admin"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"adminKey", ref:"adminKey", size:"12", value:adminKey, onFocus:this.handleFocus, readOnly:true} ),
                    React.DOM.i( {className:adminKeyQRStyle, name:"admin", onClick:this.handleShowQRCode})
                ),React.DOM.br(null ),

                React.DOM.div( {className:"menuLabel"}, polyglot.t("menu.identity.root"),": " ),
                React.DOM.div( {className:"menuInput"}, 
                    React.DOM.input( {type:"text", name:"rootKey", ref:"rootKey", size:"12", value:rootKey, onFocus:this.handleFocus, readOnly:true} ),
                    React.DOM.i( {className:rootKeyQRStyle, name:"root", onClick:this.handleShowQRCode})
                ),React.DOM.br(null )

            )
            )
        //}
    }
    /* not in use
    toggleShowRootKey: function() {
        if(this.state.rootKey == 'hidden') {
            this.setState({rootKey: PuffWardrobe.getCurrentUserRecord().rootKey});
        } else {
            this.setState({rootKey: 'hidden'});
        }
        return false;
    },

    handleChange: function(event){
        return false;
    }*/

});

/* not in use
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
*/

var NewIdentity = React.createClass({displayName: 'NewIdentity',
    getInitialState: function() {
        return {
            step: 0,
            keys: {},
            desiredUsername: '',
            usernameAvailable: 'unknown',
            errorMessage: ''
        }
    },
    handleImport: function() {
        var network = this.refs.import.getDOMNode().value;
        UsernameImport[network].requestAuthentication();
    },
    handleFocus: function(e) {
        var target = e.target;
        setTimeout(function() {
            target.select();
        }, 0);
    },
    handleBack: function() {
        // this.state.keys = {};
        this.setState({step: (this.state.step+3)%4,
            errorMessage: ''});
    },
    handleNext: function() {
        if (this.state.step == 0) {
            // set the desired username
            var username = this.refs.prefix.getDOMNode().value + '.' + this.refs.newUsername.getDOMNode().value;
            this.setState({desiredUsername: username});
            this.handleGenerateKeys();
        } else if (this.state.step == 1) {
            var valid = this.checkKeys();
            if (!valid) return false;
            this.setState({errorMessage: ''});
        }
        this.setState({step: (this.state.step+1)%4});
        return false;
    },
    handleStartOver: function() {
        /*var show = this.props.show;
        this.props = {};                                    // THINK: why is this here? don't mutate props.
        this.props.show = show;*/
        var state = this.getInitialState();
        this.setState(state);
        this.handleGenerateUsername();
    },

    // TODO: Add options for users to save keys
    // TODO: Add to advanced tools <UsernameCheckbox show={this.state.usernameAvailable} />
    render: function() {
        var showNext = true;
        var polyglot = Translate.language[puffworldprops.view.language];
        var generatedName = PuffWardrobe.generateRandomUsername();

        var usernameField = (
            React.DOM.div(null, 
                React.DOM.div( {className:"menuLabel"}, React.DOM.span( {className:"message"}, polyglot.t("menu.identity.newIdentity.msg"),":")),React.DOM.br(null),
                React.DOM.div( {className:  "menuItem"}, 
                    React.DOM.select( {ref:"prefix"}, 
                    CONFIG.users.map(function(u) {
                        return React.DOM.option( {key:u.username, value:u.username}, ".",u.username)
                    })
                    ), " ", React.DOM.em(null, "."),' ',
                    React.DOM.input( {type:"text", name:"newUsername", ref:"newUsername",  defaultValue:generatedName, size:"12"} ),
                    React.DOM.span( {className:"relative"}, 
                        React.DOM.a( {href:"#", onClick:this.handleGenerateUsername}, React.DOM.i( {className:"fa fa-question-circle fa-fw", rel:"tooltip"})),
                        Tooltip( {position:"under", content:polyglot.t("menu.tooltip.generate")})
                    )
                ),
            polyglot.t("menu.identity.step.import"),
            ' ',React.DOM.select( {id:"import", ref:"import", onChange:this.handleImport}, 
                React.DOM.option( {value:""}),
                React.DOM.option( {value:"instagram"}, "Instagram"),
                React.DOM.option( {value:"reddit"}, "Reddit")
            )
            ));

            var keyArray = ['root', 'admin', 'default'];
            var self=this;
            var publicKeyField= (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-unlock-alt"}), " ", polyglot.t("menu.identity.public")),
                    keyArray.map(function(k){
                        var name = k + 'KeyPublic';
                        return (
                            React.DOM.div( {key:name}, 
                                React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),polyglot.t("menu.identity."+k),": " ),
                                React.DOM.div( {className:"menuInput"}, 
                                    React.DOM.input( {type:"text", name:name, ref:name, size:"18", defaultValue:self.state.keys[name], onFocus:self.handleFocus} )
                                ),
                                React.DOM.br(null )
                            )
                        )
                    })
                )
                );
            var privateKeyField = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuHeader"}, React.DOM.i( {className:"fa fa-lock"}), " ", polyglot.t("menu.identity.private")),
                    keyArray.map(function(k){
                        var name = k + 'KeyPrivate';
                        return (
                            React.DOM.div( {key:name}, 
                                React.DOM.div( {className:"menuLabel"}, React.DOM.sup(null, "*"),polyglot.t("menu.identity."+k),": " ),
                                React.DOM.div( {className:"menuInput"}, 
                                    React.DOM.input( {type:"text", name:name, ref:name, size:"18", defaultValue:self.state.keys[name], onFocus:self.handleFocus, onChange:self.handlePrivateKeyChange.bind(self, k)} )
                                ),
                                React.DOM.br(null )

                            )
                        )
                    })
                )
                )
            var keyField = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"message red"}, polyglot.t("menu.identity.step.remember")),
                publicKeyField,
                    React.DOM.a( {href:"#", onClick:this.handleRegenerateKeys} , polyglot.t("menu.identity.newIdentity.generate")), " ", polyglot.t("menu.identity.newIdentity.or"), " ", React.DOM.a( {href:"#", onClick:this.handleConvertPrivatePublic} , polyglot.t("menu.identity.private"),React.DOM.span( {className:"fa fa-long-arrow-right fa-fw"}),polyglot.t("menu.identity.public")),React.DOM.br(null ),
                privateKeyField
                )
                );

            var requestedUsernameField = (
                React.DOM.div(null, ".",this.state.desiredUsername)
            );

            var mainField = [usernameField, keyField, requestedUsernameField, ""];
            var stepMessage = [
                polyglot.t("menu.identity.step.select"),
                polyglot.t("menu.identity.step.generate", {username: '.'+this.state.desiredUsername}),
                polyglot.t("menu.identity.step.request"),
                this.state.desiredUsername
            ];

            var nextField = (
                React.DOM.a( {className:"floatRight steps", onClick:this.handleNext}, polyglot.t("menu.identity.step.next"),React.DOM.i( {className:"fa fa-chevron-right fa-fw"}))
                );
            if (!showNext || this.state.step > 1) nextField = "";
            if (this.state.step == 2) nextField = (
                React.DOM.a( {href:"#", className:"floatRight steps", onClick:this.handleUsernameRequest}, polyglot.t("menu.identity.newIdentity.submit"),React.DOM.i( {className:"fa fa-chevron-right fa-fw"}))
                );

            var backField = (
                React.DOM.a( {className:"floatLeft steps", onClick:this.handleBack}, React.DOM.i( {className:"fa fa-chevron-left fa-fw"}),polyglot.t("menu.identity.step.back"))
                );
            if (this.state.step == 0) backField="";
            if (this.state.step == 3) backField=(
                React.DOM.a( {className:"floatLeft steps", onClick:this.handleStartOver}, React.DOM.i( {className:"fa fa-chevron-left fa-fw"}),"Start Over")
                );

            var messageField = this.state.errorMessage ? (React.DOM.div( {className:"message red"}, this.state.errorMessage)) : "";

            var slide = this.props.show ? 'identitySection menuSection slidedown' : 'identitySection menuSection slideup';
            return (
                React.DOM.div( {className:slide}, 
                    React.DOM.div( {className:"menuLabel"}, 
                        polyglot.t("menu.identity.step.title", {n:this.state.step+1}),
                        ': ',
                        stepMessage[this.state.step]
                    ),React.DOM.br(null),
                    mainField[this.state.step],
                    messageField,
                    backField,
                    nextField,
                    React.DOM.div( {className:"clear"}),React.DOM.br(null)
                )
                )
       // }
    },

    handleGenerateUsername: function() {
        var generatedName = PuffWardrobe.generateRandomUsername();
        if (this.refs.newUsername) 
            this.refs.newUsername.getDOMNode().value = generatedName;
        return false;
    },
    scrollToShow: function() {
        var node = this.getDOMNode().parentNode;
        var top = node.offsetTop;
        if (document.getElementsByClassName('menu')[0])
            document.getElementsByClassName('menu')[0].scrollTop = top;
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (this.state.step != prevState.step || this.props.show != prevProps.show) {
            this.scrollToShow();
        }
    },
    /*componentDidMount: function() {
        if (puffworldprops.menu.section == "identity") {
            this.scrollToShow();           
        }
    },*/

    handlePrivateKeyChange: function(key) {
        this.refs[key+'KeyPublic'].getDOMNode().value = "";
    },
    checkKeys: function() {
        // Stuff to register. These are public keys
        var rootKeyPublic    = this.refs.rootKeyPublic.getDOMNode().value;
        var adminKeyPublic   = this.refs.adminKeyPublic.getDOMNode().value;
        var defaultKeyPublic = this.refs.defaultKeyPublic.getDOMNode().value;

        var polyglot = Translate.language[puffworldprops.view.language];
        if(!rootKeyPublic || !adminKeyPublic || !defaultKeyPublic) {
            this.setState({errorMessage: polyglot.t("menu.identity.newIdentity.errorMissing")});
            return false;
        }

        var rootKeyPrivate = this.refs.rootKeyPrivate.getDOMNode().value;
        var adminKeyPrivate = this.refs.adminKeyPrivate.getDOMNode().value;
        var defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;

        // store keys to state
        var keys = {
            rootKeyPublic    : rootKeyPublic,
            adminKeyPublic   : adminKeyPublic,
            defaultKeyPublic : defaultKeyPublic,
            rootKeyPrivate   : rootKeyPrivate,
            adminKeyPrivate  : adminKeyPrivate,
            defaultKeyPrivate: defaultKeyPrivate
        };
        this.setState({keys: keys});
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

        var puff = Puffball.buildPuff(prefix, CONFIG.users[prefix].adminKey, routes, type, content, payload); 
        // SUBMIT REQUEST
        var prom = PuffNet.updateUserRecord(puff);
        prom.then(function(userRecord) {
                // store directly because we know they're valid
                PuffWardrobe.storePrivateKeys(requestedUsername, rootKeyPrivate, adminKeyPrivate, defaultKeyPrivate);
                self.setState({step: 3,
                    errorMessage: polyglot.t("menu.identity.newIdentity.success")});

                // Set this person as the current user
                PuffWardrobe.switchCurrent(requestedUsername);
                events.pub('ui/event', {});
            },
            function(err) {
                console.log("ERR")
                self.setState({step: 3,
                    errorMessage: err.toString()});
                events.pub('ui/event', {});
            });
        return false;
    },

    handleRegenerateKeys: function() {
        console.log('here');
        var rootKey = Puffball.Crypto.generatePrivateKey();
        var adminKey = Puffball.Crypto.generatePrivateKey();
        var defaultKey = Puffball.Crypto.generatePrivateKey();

        this.refs.rootKeyPrivate.getDOMNode().value = rootKey;
        this.refs.adminKeyPrivate.getDOMNode().value = adminKey;
        this.refs.defaultKeyPrivate.getDOMNode().value = defaultKey;

        this.refs.rootKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(rootKey);
        this.refs.adminKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(adminKey);
        this.refs.defaultKeyPublic.getDOMNode().value = Puffball.Crypto.privateToPublic(defaultKey);   
        return false;
    },
    handleGenerateKeys: function() {
        // Get private keys
        var rootKey = Puffball.Crypto.generatePrivateKey();
        var adminKey = Puffball.Crypto.generatePrivateKey();
        var defaultKey = Puffball.Crypto.generatePrivateKey();
        var keys = {
            rootKeyPrivate   : rootKey,
            adminKeyPrivate  : adminKey,
            defaultKeyPrivate: defaultKey,
            rootKeyPublic    : Puffball.Crypto.privateToPublic(rootKey),
            adminKeyPublic   : Puffball.Crypto.privateToPublic(adminKey),
            defaultKeyPublic : Puffball.Crypto.privateToPublic(defaultKey)
        };
        this.setState({keys: keys});
        
        return false;
    },

    handleConvertPrivatePublic: function() {
        // NOTE: When blank, Puffball.Crypto.privateToPublic generates a new public key
        var rP = this.refs.rootKeyPrivate.getDOMNode().value;
        var aP = this.refs.adminKeyPrivate.getDOMNode().value;
        var dP = this.refs.defaultKeyPrivate.getDOMNode().value;

        if(!rP.length) {
            this.setState({errorMessage: 'Missing root key. '});
            return false
        }
        if(!aP.length) {
            this.setState({errorMessage: 'Missing admin key. '});
            return false
        }
        if(!dP.length) {
            this.setState({errorMessage: 'Missing default key. '});
            return false;
        }

        var rPublic = Puffball.Crypto.privateToPublic(rP);
        var aPublic = Puffball.Crypto.privateToPublic(aP);
        var dPublic = Puffball.Crypto.privateToPublic(dP);

        rPublic ? this.refs.rootKeyPublic.getDOMNode().value = rPublic : this.setState({errorMessage: 'Invalid root key. '});
        aPublic ? this.refs.adminKeyPublic.getDOMNode().value = aPublic : this.setState({errorMessage: 'Invalid admin key. '});
        dPublic ? this.refs.defaultKeyPublic.getDOMNode().value = dPublic : this.setState({errorMessage: 'Invalid default key. '});

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
            var usernameNotice = 'Yes! Username available.';
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

var PopoutCluster = React.createClass({displayName: 'PopoutCluster',
    mixins: [TooltipMixin],
    render: function() {
        if (!this.props.section) {
            return React.DOM.span(null)
        } 
        var section = this.props.section;
        var cluster = Cluster( {clusterName:section, view:this.props.view, isPopout:true})
        return (
            React.DOM.div( {className:"expand"}, 
                cluster
            )
        )
    }
})


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