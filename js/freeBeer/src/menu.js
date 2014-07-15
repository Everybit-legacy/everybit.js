/** @jsx React.DOM */

var Tooltip = React.createClass({
    render: function() {
        var className = "menuTooltip";
        if (this.props.position) className += " " + this.props.position;
        else className += " right";
        return (
            <div className={className}>{this.props.content}</div>
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
/* not in use
var FlashSectionMixin = {
    switchMenuSection: function() {
        var section = this.props.section || false;
        events.pub("ui/menu-section", {'menu.section': section});
    },
    componentDidMount: function() {
        this.getDOMNode().onclick = this.switchMenuSection;
    }
};*/


var Menu = React.createClass({
    handleClose: function() {
        return events.pub('ui/menu/close', {'menu.show': false})
    },

    render: function() {
        return (
            <div className="menu">
                <a href="#" onClick={this.handleClose}>
                    <i className="fa fa-times-circle-o fa-fw closeBox"></i>
                </a>

                <Logo />

                <br />
                <Cluster clusterName="filters" clusterPath='ui/clusters/filters' clusterPropPath='clusters.filters' 
                         clusterMenu='FilterMenu' clusterIcon='fa-search-plus' view={this.props.view} />
                <Cluster clusterName="publish" clusterPath='ui/clusters/publish' clusterPropPath='clusters.publish' 
                         clusterMenu='PuffPublishFormEmbed' clusterIcon='fa-paper-plane' view={this.props.view} />
                <Cluster clusterName="view" clusterPath='ui/clusters/view' clusterPropPath='clusters.view'
                         clusterMenu='ViewMenu' clusterIcon='fa-sitemap' view={this.props.view} />
                <Cluster clusterName="identity" clusterPath='ui/clusters/identity' clusterPropPath='clusters.identity' 
                         clusterMenu='IdentityMenu' clusterIcon='fa-user' view={this.props.view} />
                <Cluster clusterName="preferences" clusterPath='ui/clusters/preferences' 
                         clusterPropPath='clusters.preferences' clusterMenu='PreferencesMenu' 
                         clusterIcon='fa-gears' view={this.props.view} />
                <Cluster clusterName="about" clusterPath='ui/clusters/about' clusterPropPath='clusters.about'  
                         clusterMenu='AboutMenu' clusterIcon='fa-info-circle' view={this.props.view} />
                <Cluster clusterName="tools" clusterPath='ui/clusters/tools' clusterPropPath='clusters.tools' 
                         clusterMenu='ToolsMenu' clusterIcon='fa-wrench' view={this.props.view} />
            </div>
        )
    }

});



var Cluster = React.createClass({
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

        case "filters":
            clusterMenu = <div><CurrentFilters view={this.props.view} /><FilterMenu view={this.props.view} /></div>
            break;
        case "publish":
            clusterMenu = puffworldprops.reply.expand ? '' : <PuffPublishFormEmbed reply={puffworldprops.reply} />
            break;
        case "view":
            clusterMenu = <ViewMenu />
            break;
        case "identity":
            clusterMenu = <IdentityMenu />
            break;
        case "preferences":
            clusterMenu = <PreferencesMenu />
            break;
        case "about":
            clusterMenu = <AboutMenu />
            break;
        case "tools":
            clusterMenu = <ToolsMenu />
            break;
        default:
            break;
        }


        /*if(!puffworldprops.clusters[this.props.clusterName]) {
            clusterMenu = '';
        } */

        var section = this.props.clusterName;
        var className = (puffworldprops.clusters[section] && section == puffworldprops.menu.section) ? 'flash' : '';
        // <span className="floatRight gray"><i className={setClass}></i></span>
        
        var slide = puffworldprops.clusters[this.props.clusterName] ? 'slidedown' : 'slideup';
        return (
            <div className="menuCluster">
                <div className={className}>
                    <a href="#" onClick={this.handleToggleShowMenu}>
                        <div className="menuHeader">
                            <i className={"fa " + this.props.clusterIcon + " fa-fw gray"}></i>
                            {polyglot.t(menuTitle)}
                        </div>
                    </a>
                    <div className={slide}>{clusterMenu}</div>
                </div>
            </div>
        )
    }
});

var Logo = React.createClass({
    render: function() {
        return (
            <a href={CONFIG.url}><img src={CONFIG.logo} alt="Logo" className="logo" /></a>
            )
    }
});

var FilterMenu = React.createClass({
    mixins: [TooltipMixin],
    
    handlePickFilter: function() {
        var filterType = ['tags', 'users', 'routes'];
        var filters = PB.shallow_copy(this.props.view.filters);

        for (var i=0; i<filterType.length; i++) {
            var type = filterType[i];
            var newFilter = this.refs[type].getDOMNode().value || false;
            var currFilter = PB.shallow_copy(this.props.view.filters[type]);
            if (newFilter && currFilter.indexOf(newFilter) == -1) 
                currFilter.push(newFilter);
            filters[type] = currFilter;
            this.refs[type].getDOMNode().value = '';
        }

        return events.pub('ui/view/filter/set', {'view.filters': filters
                                                ,'view.mode': 'list'});
    },
    
    handleKeyDown: function(event) {
        if (event.keyCode == 13) {
            this.handlePickFilter();
        }
    },
    createEachFilter: function(type) {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <div className="menuItem">
                {polyglot.t("menu.filters."+type)}:
                <div className="menuInput">
                    <input type="text" name={type} ref={type} size="12" defaultValue="" onKeyDown={this.handleKeyDown} />
                    <Tooltip position="under" content={polyglot.t("menu.tooltip."+type+"Filter")} />
                    {' '}<a href="#" onClick={this.handlePickFilter}><i className="fa fa-search-plus fa-fw"></i></a>
                </div><br/>
            </div>
        )
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var all_filter = ['tags', 'users', 'routes'];
        
        return (
            <div>
                {all_filter.map(this.createEachFilter)}
            </div>
        );
    }
});

var CurrentFilters = React.createClass({
    render: function() {
        var filterNodes = Object.keys(this.props.view.filters).map(function(key) {
            return <FilterBubble filterName={key} filterValue={this.props.view.filters[key]} />
        }.bind(this))

        return (
            <div>
                {filterNodes}
            </div>
        );
    }
});

var FilterBubble = React.createClass({
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
            return events.pub('ui/filter/remove', propsMod);
         }

        return false;
    },

    render: function() {
        var filterArray = Array.isArray(this.props.filterValue)
                        ? this.props.filterValue
                        : [this.props.filterValue]

        if (filterArray.length == 0) return <span></span>;
        
        var toReturn = filterArray.map(function(value) {
            return (
                <span className='filterNode'>
                    {value}
                    <a href="#" onClick={this.handleRemoveFilter.bind(this, value)}>
                        <i className="fa fa-times-circle-o fa-fw"></i>
                    </a>
                </span>
            )
        }.bind(this));
        
        return (
            <div className="menuItem">
                {this.props.filterName}:{' '}
                {toReturn}
            </div>
        );
    }

});


/*
 <p>Identity avatar</p>
 */

var ViewMenu = React.createClass({
    mixins: [TooltipMixin],
    handleViewRoots: function() {
        return events.pub('ui/show/roots', { 'view.mode': 'list'
                                           , 'view.query.roots': true
                                           , 'menu': puffworlddefaults.menu});
    },

    handleViewLatest: function() {
        return events.pub('ui/show/latest', { 'view.mode': 'list'
                                            , 'menu': puffworlddefaults.menu
                                            , 'view.filters': puffworlddefaults.view.filters
                                            , 'view.query': puffworlddefaults.view.query
                                            });
    },

    handleShowUserPuffs: function(username) {
        return events.pub('ui/show/by-user', { 'view.mode': 'list'
                                             , 'view.filters': puffworlddefaults.view.filters
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.filters.users': [username]
                                             })
    },

    handleShowShortcuts: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        showPuff(polyglot.t("puff.shortcut"));
        return false;
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];

        return (
            <div>
                <div className="menuItem">
                    <a href="http://everybit.com/qa.html" target="_blank">{polyglot.t("menu.view.faq")}</a>
                </div>
                <div className="menuItem">
                    <a href="#" onClick={this.handleViewLatest}>{polyglot.t("menu.view.latest")}</a>{' '}<span className="shortcut">[l]</span>
                    <Tooltip content={polyglot.t("menu.tooltip.latest")} />
                </div>

                <div className="menuItem"> 
                    <a href="#" onClick={this.handleViewRoots}>{polyglot.t("menu.view.roots")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.roots")} />
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleShowUserPuffs.bind(this,'choices.book')}>{polyglot.t("menu.view.collection")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.collection")} />
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleShowShortcuts}>{polyglot.t("menu.view.shortcut")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.shortcut")} />
                </div>

            </div>
            )
    }
});



var IdentityMenu = React.createClass({
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {
            username: PuffWardrobe.getCurrentUsername(),
            showUserRootPrivateKey: false,
            showUserAdminPrivateKey: false,
            showUserDefaultPrivateKey: false,
            section: {
                setIdentity: false,
                editIdentity: false,
                newIdentity: puffworldprops.menu.import
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

    handleToggleShowSection: function(name) {
        /*var newState = {
            setIdentity: false,
            editIdentity: false,
            newIdentity: false
        };
        if (this.state.section[name] == false) {
            newState[name] = true;
        };*/
        var newState = this.state.section;
        newState[name] = !newState[name];
        this.setState({section: newState});
    },

    render: function() {
        var currUser = PuffWardrobe.getCurrentUsername();

        // TODO: Help icon takes you to tutorial related to this.
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <div>
                <AuthorPicker />

                <div>
                    <div className="menuItem" >
                        <a className='menuLabel' onClick={this.handleToggleShowSection.bind(this, 'newIdentity')}>
                            <i className="fa fa-plus fa-fw"></i>{polyglot.t("menu.identity.newIdentity.title")}
                        </a>
                        <Tooltip content={polyglot.t("menu.tooltip.newIdentity")} />
                        <br/>
                        <NewIdentity show={this.state.section.newIdentity} />
                    </div>

                    <div className="menuItem" >
                        <a className='menuLabel' onClick={this.handleToggleShowSection.bind(this, 'setIdentity')}><i className="fa fa-sign-in fa-fw"></i>{polyglot.t("menu.identity.setIdentity.title")}</a><br/>
                        <Tooltip content={polyglot.t("menu.tooltip.setIdentity")} />
                        <SetIdentity show={this.state.section.setIdentity} username={currUser} />
                    </div>
                    
                    <div className="menuItem" >
                        <a className='menuLabel' onClick={this.handleToggleShowSection.bind(this, 'editIdentity')}><i className="fa fa-eye fa-fw"></i>{polyglot.t("menu.identity.editIdentity.title")}</a><br/>
                        <Tooltip content={polyglot.t("menu.tooltip.editIdentity")} />
                        <EditIdentity show={this.state.section.editIdentity} username={currUser} />
                    </div>
                </div>

            </div>
            )
    }
    /*not in use ,

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

    }*/
});


var PreferencesMenu = React.createClass({
    
     // OPT: reading puffworldprops prevents short circuiting rendering -- pass necessary props into here instead
    
    mixins: [TooltipMixin],
    handleShowHideRelationships: function() {
        if(puffworldprops.view.arrows) {
            return events.pub('ui/relationships/hide', {'view.arrows': false});
        } else {
            return events.pub('ui/relationships/show', {'view.arrows': true});
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
            'fa-check-square-o': (puffworldprops.view.arrows),
            'fa-square-o': !(puffworldprops.view.arrows),
            'green': (puffworldprops.view.arrows)
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
            <div>

                <div className="menuItem">
                    <span className="floatingCheckbox"><i className={cbClass}  onClick={this.handleShowHideRelationships} ></i></span>
                    <a href="#" onClick={this.handleShowHideRelationships}>{polyglot.t("menu.preferences.relationship")}</a>{' '}<span className="shortcut">[space]</span>
                    <Tooltip content={polyglot.t("menu.tooltip.relationship")} />
                </div>

                <div className="menuItem">
                    <span className="floatingCheckbox"><i className={cbClass2} onClick={this.handleShowHideAnimations} ></i></span>
                    <a href="#" onClick={this.handleShowHideAnimations}>{polyglot.t("menu.preferences.animation")}</a>{' '}<span className="shortcut">[a]</span>
                    <Tooltip content={polyglot.t("menu.tooltip.animation")} />
                </div>

                <div className="menuItem">
                    <span className="floatingCheckbox"><i className={cbClass3} onClick={this.handleShowHideInfobar} ></i></span>
                    <a href="#" onClick={this.handleShowHideInfobar}>{polyglot.t("menu.preferences.infobar")}</a>{' '}<span className="shortcut">[i]</span>
                    <Tooltip content={polyglot.t("menu.tooltip.infobar")} />
                </div>

                <div className="menuItem">
                {polyglot.t("menu.preferences.language")}: <select ref="picklanguage" onChange={this.handlePickLanguage} defaultValue={language}>
                    {all_languages.map(function(lang) {
                        return <option key={lang} value={lang}>{Translate.language[lang].t("dropdownDisplay")}</option>
                    })}
                </select>
                </div>

            </div>
            )

    }

});


var AboutMenu = React.createClass({
    mixins: [TooltipMixin],

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <div className="menuItem"><a href="https://github.com/puffball/freebeer/" target="_new">{polyglot.t("menu.about.code")}</a>
                <Tooltip content={polyglot.t("menu.tooltip.code")} />
            </div>
        )
    }
})


var ToolsMenu = React.createClass({
    mixins: [TooltipMixin],
    handlePackPuffs: function() {
        return events.pub('ui/show/puffpacker', {'view.mode': 'PuffPacker', 'menu': puffworlddefaults.menu});
    },
    clearLocalStorage: function(){
        var allKeys = Object.keys(window.localStorage);
        allKeys = allKeys.filter(function(k){return k.indexOf('PUFF::') == 0});
        for (var i=0; i<allKeys.length; i++) 
            window.localStorage.removeItem(allKeys[i]);
        document.location.reload(true);
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <div>
                <div className="menuItem">
                    <a href="#" onClick={this.handlePackPuffs}>{polyglot.t("menu.tools.builder")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.puffBuilder")} />
                </div>
                <div className="menuItem">
                    <a href="#" onClick={this.clearLocalStorage}>Clear local storage</a>
                </div>
            </div>
        )
    }
})



// Was PuffSwitchUser
var AuthorPicker = React.createClass({
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
        return events.pub('ui/show/by-user', {'view.mode': 'list', 'view.filters': puffworlddefaults.view.filters, 'view.filters.users': [username]})
    },

    handleShowPuffsForMe: function(){
        var polyglot = Translate.language[puffworldprops.view.language];
        var username = PuffWardrobe.getCurrentUsername();
        if(!username.length) {
            alert(polyglot.t("alert.noUserSet"))
            return false;
        }
        // var route = this.refs.pickroute.getDOMNode().value;
        return events.pub('ui/view/route/set', { 'view.mode': 'list', 
                                                 'view.filters.routes': [username] });
    },

    render: function() {
        var all_usernames = Object.keys(PuffWardrobe.getAll())
        var polyglot = Translate.language[puffworldprops.view.language];
        if(!all_usernames.length) return <div className="menuItem">{polyglot.t("menu.identity.current")}: {polyglot.t("menu.identity.none")}</div>

        // Force selection of the single user when just one
        if(all_usernames.length == 1) {
            PuffWardrobe.switchCurrent(all_usernames[0]);
        }

        var username = PuffWardrobe.getCurrentUsername()

        // TODO: find a way to select from just one username (for remove user with exactly two users)
        // TODO: Need 2-way bind to prevent select from changing back every time you change it
        var relativeStyle = {position: 'relative'};
        /*
        
                    {' '}<span style={relativeStyle}><a href="#" onClick={this.handleViewUser}><i className="fa fa-search fa-fw"></i></a><Tooltip position="under" content={polyglot.t('menu.tooltip.usersFilter')} /></span>
         */
        return (
            <div>
                <div className="menuItem">
                    {polyglot.t("menu.identity.current")}: <select ref="switcher" onChange={this.handleUserPick} defaultValue={username}>
                        {all_usernames.map(function(username) {
                            return <option key={username} value={username}>{username}</option>
                        })}
                </select>
                    {' '}<span style={relativeStyle}><a href="#" onClick={this.handleRemoveUser}><i className="fa fa-trash-o fa-fw"></i></a><Tooltip position="under" content={polyglot.t('menu.tooltip.currentDelete')} /></span>
                </div>

                <div className="menuItem">
                    <a href="#" onClick={this.handleViewUser}>{polyglot.t("menu.view.showMine")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.showMine")} />
                </div>
                <div className="menuItem">
                    <a href="#" onClick={this.handleShowPuffsForMe}>{polyglot.t("menu.view.showpuffs")}</a>
                    <Tooltip content={polyglot.t("menu.tooltip.showPuffs")} />
                </div>
            </div>
            );
    }
    // TODO add alt tags to icons, or link it too a "help" puff.
    // NOTE: This might destroy the puff the person was working on
});

var Checkmark = React.createClass({
    render: function() {
        if(this.props.show === false) {
            return <i className="fa fa-check-circle fa-fw gray"></i>
        } else if(this.props.show === true) {
            return <i className="fa fa-check-circle fa-fw green"></i>
        } else {
            return <i className="fa fa-check-circle fa-fw red"></i>
        }

    }
});

var SetIdentity = React.createClass({
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

    verifyUsername: function() {
        var username = this.refs.username.getDOMNode().value;
        username = reduceUsernameToAlphanumeric(username, /*allowDot*/true)
                    .toLowerCase();
        this.refs.username.getDOMNode().value = username;
    },

    render: function() {
        /*if (!this.props.show) {
            return <div></div>
        } else {*/
            var currUser = this.props.username;
            var polyglot = Translate.language[puffworldprops.view.language];

            var slide = this.props.show ? 'identitySection menuSection slidedown' : 'identitySection menuSection slideup';
            return (
                <div className={slide}>
                    <div className="message red">{polyglot.t("menu.identity.setIdentity.msg")}</div>
                    <div className="menuLabel">{polyglot.t("menu.identity.username")}:</div>
                    <div className="menuInput">
                        <input type="text" name="username" ref="username" defaultValue={currUser} onBlur={this.verifyUsername} size="12" />
                        {' '}<a href="#" onClick={this.handleUsernameLookup}><Checkmark show={this.state.usernameStatus} /></a>
                        <span className="message">{this.state.usernameStatus}</span>
                    </div><br />
                    <div><i className="fa fa-lock fa-fw gray"></i> {polyglot.t("menu.identity.private")}</div>

                    <div className="menuLabel">{polyglot.t("menu.identity.default")}: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKey" ref="defaultKey" size="12" />
                        {' '}<a href="#" onClick={this.handleKeyCheck.bind(this,'defaultKey')}>
                        <Checkmark show={this.state.defaultKey} /></a>
                        <span className="message">{this.state.defaultKey}</span>
                    </div><br />

                    <div className="menuLabel">{polyglot.t("menu.identity.admin")}: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKey" ref="adminKey" size="12" />
                        {' '}<a href="#" onClick={this.handleKeyCheck.bind(this,'adminKey')}>
                        <Checkmark show={this.state.adminKey} /></a>
                        <span className="message">{this.state.adminKey}</span>
                    </div><br />

                    <div className="menuLabel">{polyglot.t("menu.identity.root")}: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKey" ref="rootKey" size="12" />
                        {' '}<a href="#" onClick={this.handleKeyCheck.bind(this,'rootKey')}>
                        <Checkmark show={this.state.rootKey} /></a>
                        <span className="message">{this.state.rootKey}</span>
                    </div><br />
                </div>
                )
       //}
    }
});


var EditIdentity = React.createClass({
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
                    qrcodeField = (<img id="qrcode" src={data} width={image_data.width} height={image_data.height} onClick={this.handleClickQRCode}/>);
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
                <div className={slide}>
                    <div className="message">{polyglot.t("menu.identity.editIdentity.msg")}: <span className="authorSpan">{currUser}</span>
                    </div>

                    <div><i className="fa fa-lock fa-fw gray"></i> {polyglot.t("menu.identity.private")}</div>
                    {qrcodeField}

                    <div className="menuLabel">{polyglot.t("menu.identity.default")}: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKey" ref="defaultKey" size="12" value={defaultKey} onFocus={this.handleFocus} />
                        <i className={defaultKeyQRStyle} name="default" onClick={this.handleShowQRCode} ></i>
                    </div><br />

                    <div className="menuLabel">{polyglot.t("menu.identity.admin")}: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKey" ref="adminKey" size="12" value={adminKey} onFocus={this.handleFocus} />
                        <i className={adminKeyQRStyle} name="admin" onClick={this.handleShowQRCode}></i>
                    </div><br />

                    <div className="menuLabel">{polyglot.t("menu.identity.root")}: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKey" ref="rootKey" size="12" value={rootKey} onFocus={this.handleFocus} />
                        <i className={rootKeyQRStyle} name="root" onClick={this.handleShowQRCode}></i>
                    </div><br />

                </div>
                )
        //}
    },

    toggleShowRootKey: function() {
        // console.log(this.state.rootKey);
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

var NewIdentity = React.createClass({
    getInitialState: function() {
        return {
            step: 0,
            keys: {},
            desiredUsername: '',
            importInfo: {},
            enableContentImport: false,
            usernameAvailable: 'unknown',
            errorMessage: ''/*,
            newUsername: ''*/
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
        this.setState({errorMessage: ""});
        var network = this.state.importInfo.network;
        try {
            UsernameImport[network].contentURL(this.state.importInfo.username, this.state.importInfo.id, this.state.importInfo.token);
        } catch (err) {
            this.setState({enableContentImport: false, errorMessage: err.message});
        }
        return false;
    },
    handleCancelImport: function() {
        this.setState({desiredUsername: '', importInfo: {}})
    },
    handleBack: function() {
        this.state.keys = {};
        this.setState({step: (this.state.step+3)%4,
            errorMessage: ''});
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
            this.setState({errorMessage: ''});
        }
        this.setState({step: (this.state.step+1)%4});
        return false;
    },

    handleStartOver: function() {
        var show = this.props.show;
        this.props = {};                                    // THINK: why is this here? don't mutate props.
        this.props.show = show;
        var state = this.getInitialState();
        this.setState(state);
        this.handleGenerateUsername();
    },

    // TODO: Add options for users to save keys
    // TODO: Add to advanced tools <UsernameCheckbox show={this.state.usernameAvailable} />
    render: function() {
        /*if (!this.props.show) {
            return <span></span>
        } else {*/
            var showNext = true;
            var polyglot = Translate.language[puffworldprops.view.language];
            var generatedName = PuffWardrobe.generateRandomUsername();

            var relativeStyle = {position: 'relative'};
            var usernameField = (
                <div>
                    <div className="menuLabel"><span className="message">{polyglot.t("menu.identity.newIdentity.msg")}:</span></div><br/>
                    <div className = "menuItem">
                        <select ref="prefix">
                        {CONFIG.users.map(function(u) {
                            return <option key={u.username} value={u.username}>{u.username}</option>
                        })}
                        </select> <em>.</em>{' '}
                        <input type="text" name="newUsername" ref="newUsername"  defaultValue={generatedName} size="12" />
                        <span style={relativeStyle}>
                            <a href="#" onClick={this.handleGenerateUsername}><i className="fa fa-question-circle fa-fw" rel="tooltip"></i></a>
                            <Tooltip position="under" content={polyglot.t("menu.tooltip.generate")}/>
                        </span>
                    </div>
                {polyglot.t("menu.identity.step.import")}
                {' '}<select id="import" ref="import" onChange={this.handleImport}>
                    <option value=""></option>
                    <option value="instagram">Instagram</option>
                    <option value="reddit">Reddit</option>
                </select>
                </div>);

            // check if there is requestedUsername parameter
            var params = getStashedKeysFromURL();
            if (params['requestedUsername'] && Object.keys(this.state.importInfo).length == 0) {
                var importInfo = {
                    username: reduceUsernameToAlphanumeric(params['requestedUsername']).toLowerCase(),
                    token  : params['token'],
                    id     : params['requestedUserId'],
                    network: params['network']
                };
                delete stashedKeysFromURL['requestedUsername'];
                delete stashedKeysFromURL['token'];
                delete stashedKeysFromURL['requestedUserId'];
                delete stashedKeysFromURL['network'];


                // check if username exist
                var prom = Puffball.getUserRecord(importInfo.username);
                var self = this;
                prom.then(function(userRecord){
                    var message = "Username already exist.";
                    if (importInfo.network == "instagram") {
                        message += " You may try to import your content."
                    }
                    self.setState({importInfo: importInfo, 
                                   desiredUsername: importInfo.username,
                                   enableContentImport: (importInfo.network == "instagram"),
                                   step: 3, 
                                   errorMessage: message});
                }).catch(function(err){
                    self.setState({importInfo: importInfo});
                })

            }

            if (Object.keys(this.state.importInfo).length != 0) {
                showNext = true;
                usernameField = (
                    <div>
                        <div className="menuLabel"><em>Imported Username</em></div>{' '}<span>{this.state.importInfo.username}</span>{' '}<input className="btn-link" type="button" onClick={this.handleCancelImport} value="Cancel"/>
                    </div>);
            }


            var publicKeyField= (
                <div>
                    <div className="menuHeader"><i className="fa fa-unlock-alt"></i> {polyglot.t("menu.identity.public")}</div>
                    <div className="menuLabel"><sup>*</sup>{polyglot.t("menu.identity.root")}: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKeyPublic" ref="rootKeyPublic" size="18" onFocus={this.handleFocus} />
                    </div>
                    <br />

                    <div className="menuLabel"><sup>*</sup>{polyglot.t("menu.identity.admin")}: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKeyPublic" ref="adminKeyPublic" size="18" onFocus={this.handleFocus} />
                    </div>

                    <br />

                    <div className="menuLabel"><sup>*</sup>{polyglot.t("menu.identity.default")}: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKeyPublic" ref="defaultKeyPublic" size="18" onFocus={this.handleFocus} />
                    </div>
                    <br />
                </div>
                );
            var privateKeyField = (
                <div>
                    <div className="menuHeader"><i className="fa fa-lock"></i> {polyglot.t("menu.identity.private")}</div>
                    <div className="menuLabel">{polyglot.t("menu.identity.root")}: </div>
                    <div className="menuInput">
                        <input type="text" name="rootKeyPrivate" ref="rootKeyPrivate" size="18" onFocus={this.handleFocus} />
                    </div>
                    <br />

                    <div className="menuLabel">{polyglot.t("menu.identity.admin")}: </div>
                    <div className="menuInput">
                        <input type="text" name="adminKeyPrivate" ref="adminKeyPrivate" size="18" onFocus={this.handleFocus} />
                    </div>
                    <br />

                    <div className="menuLabel">{polyglot.t("menu.identity.default")}: </div>
                    <div className="menuInput">
                        <input type="text" name="defaultKeyPrivate" ref="defaultKeyPrivate" size="18" onFocus={this.handleFocus} />
                    </div>
                    <br/>
                </div>
                )
            var keyField = (
                <div>
                    <div className="message red">{polyglot.t("menu.identity.step.remember")}</div>
                {publicKeyField}
                    <a href="#" onClick={this.handleGeneratePrivateKeys} >{polyglot.t("menu.identity.newIdentity.generate")}</a> {polyglot.t("menu.identity.newIdentity.or")} <a href="#" onClick={this.handleConvertPrivatePublic} >{polyglot.t("menu.identity.private")}<span className="fa fa-long-arrow-right fa-fw"></span>{polyglot.t("menu.identity.public")}</a><br />
                {privateKeyField}
                </div>
                );

            var importContentField = "";
            if (this.state.enableContentImport) {
                importContentField = (
                    <span id="importContent"><a href="#" onClick={this.handleContentImport}>Import Content</a></span>
                );
            }
            var requestedUsernameField = (
                <div>{this.state.desiredUsername}</div>
            );

            var mainField = [usernameField, keyField, requestedUsernameField, importContentField];
            var stepMessage = [
                polyglot.t("menu.identity.step.select"),
                polyglot.t("menu.identity.step.generate", {username: this.state.desiredUsername}),
                polyglot.t("menu.identity.step.request"),
                this.state.desiredUsername
            ];

            var nextField = (
                <a className="floatRight steps" onClick={this.handleNext}>{polyglot.t("menu.identity.step.next")}<i className="fa fa-chevron-right fa-fw"></i></a>
                );
            if (!showNext || this.state.step > 1) nextField = "";
            if (this.state.step == 2) nextField = (
                <a href="#" className="floatRight steps" onClick={this.handleUsernameRequest}>{polyglot.t("menu.identity.newIdentity.submit")}<i className="fa fa-chevron-right fa-fw"></i></a>
                );

            var backField = (
                <a className="floatLeft steps" onClick={this.handleBack}><i className="fa fa-chevron-left fa-fw"></i>{polyglot.t("menu.identity.step.back")}</a>
                );
            if (this.state.step == 0) backField="";
            if (this.state.step == 3) backField=(
                <a className="floatLeft steps" onClick={this.handleStartOver}><i className="fa fa-chevron-left fa-fw"></i>Start Over</a>
                );

            var messageField = this.state.errorMessage ? (<div className="message red">{this.state.errorMessage}</div>) : "";

            var slide = this.props.show ? 'identitySection menuSection slidedown' : 'identitySection menuSection slideup';
            return (
                <div className={slide}>
                    <div className="menuLabel">
                        {polyglot.t("menu.identity.step.title", {n:this.state.step+1})}
                        {': '}
                        {stepMessage[this.state.step]}
                    </div><br/>
                    {mainField[this.state.step]}
                    {messageField}
                    {backField}
                    {nextField}
                    <div className="clear"></div><br/>
                </div>
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
        document.getElementsByClassName('menu')[0].scrollTop = top;
    },
    componentDidUpdate: function() {
        if (puffworldprops.menu.section == "identity") {
            this.scrollToShow();           
        }
    },
    componentDidMount: function() {
        if (puffworldprops.menu.section == "identity") {
            this.scrollToShow();           
        }
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
                    enableContentImport: importInfo.network == "instagram",
                    errorMessage: polyglot.t("menu.identity.newIdentity.success")});

                // Set this person as the current user
                PuffWardrobe.switchCurrent(requestedUsername);
                events.pub('ui/event', {});
            },
            function(err) {
                console.log("ERR")
                self.setState({step: 3,
                    enableContentImport: importInfo.network == "instagram",
                    errorMessage: err.toString()});
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