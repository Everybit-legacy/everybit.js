/** @jsx React.DOM */

var HeaderHider = React.createClass({
    handleToggleShowHeader: function() {
        if(puffworldprops.header.show)
            return Events.pub('ui/header/close', {'header.show': false})
        else
            return Events.pub('ui/header/open', {'header.show': true})
    },

    render: function() {
        return (
            <div className="headerHider">
                <a href="#" onClick={this.handleToggleShowHeader}>
                    <i className="fa fa-reorder rot90"></i>
                </a>
            </div>
            )
    }
});


var HeaderBar = React.createClass({
    render: function() {
        return (
            <div className="headerBar">
                {' '} <HBPuffIcon />
                {' '} <HBpublish />
                {' '} <HBviewType />
                {' '} <HBscore />
                {' '} <HBidentity />
                {' '} <HBFilters />
                {' '} <HBsort />
                {' '} <HBroots />
                <HBCurrentFilters />
            </div>
            )
    }

});

var HBpublish = React.createClass({
    mixins: [TooltipMixin],
    handleToggleShowPublish: function() {
        // Send event
        if(puffworldprops.header.publish.show)
            return Events.pub('ui/header/publish/close', {'header.publish.show': false})
        else
            return Events.pub('ui/header/publish/open', {'header.publish.show': true})

    },

    handleShowPublish: function() {
        return Events.pub('ui/publish/show', {'menu.popout': 'publish',
                                             'clusters.publish': true})
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        if(puffworldprops.header.publish.show)
            var pulldown = <PublishPulldown />
        else
            var pulldown = ''

        return (
            <span className="headerIcon relative">
                <a href="#" onClick={this.handleShowPublish}>
                    <i className="fa fa-send fa-fw"></i>
                </a>
                {pulldown}
                <Tooltip position='under' content={polyglot.t('header.tooltip.publish')} />
            </span>
            )
    }

});

var HBviewType = React.createClass({
    mixins: [TooltipMixin],

    handleShowView: function (mode) {
        var jsonToSet = {}
        jsonToSet['view.mode'] = mode;
        if (mode == 'tableView') {
            jsonToSet['view.table.format'] = 'list'
        }
        return Events.pub('ui/view/mode', jsonToSet)
    },


    render: function() {
        // Find out what kind of view we are in
        // Show the appropriate icon
        // NOTE: Not supporting "focus" as it's own view
        var iconClass = "fa fa-fw "
        if(puffworldprops.view.mode == 'tableView') {
            iconClass += 'fa-th-large'
            var changeTo = 'list'
        } else {
            iconClass += 'fa-table'
            var changeTo = 'tableView'

        }

        return (
            <span className="headerIcon relative">
                <a href="#" onClick={this.handleShowView.bind(this,changeTo)}>
                    <i className={iconClass}></i>
                </a>
            </span>
            )

    }

});

var PublishPulldown = React.createClass({
    render: function() {
        return (
            <div className="headerPulldown">
                <PuffPublishFormEmbed reply={puffworldprops.reply} />
            </div>
            )
    }

});


var HBidentity = React.createClass({
    mixins: [TooltipMixin],
    handleShowIdentityPopout: function() {
        return Events.pub("ui/menu/popout", {'menu.popout': 'identity',
                                             'clusters.identity': true});
    },
    render: function() {
        var name = PB.M.Wardrobe.getCurrentUsername();
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className="headerIcon relative">
                <a className="authorSpan" onClick={this.handleShowIdentityPopout}><i className="fa fa-user fa-fw"></i>{StringConversion.toDisplayUsername(name)}</a>
                <Tooltip position='under' content={polyglot.t('header.tooltip.identity')} />
            </span>
            )
    }

});

var HBscore = React.createClass({

    render: function() {
        if(PB.M.Wardrobe.getCurrentUsername() != "") {
            var score = calculateScore(PB.M.Wardrobe.getCurrentUsername());
        } else {
            var score = 0;
        }

        return (
            <span className="headerIcon score">
            {score.toFixed(1)}
            </span>
            )
    }

});

var HBassorted = React.createClass({
    render: function() {
        return (
            <span className="headerIcon">
                <i className="fa fa-cubes fa-fw"></i>
            </span>
            )
    }

});

var HBCurrentFilters = React.createClass({
    render: function() {
        /*var filterNodes = Object.keys(this.props.view.filters).map(function(key) {
            return <HBFilterBubble key={key} filterName={key} filterValue={this.props.view.filters[key]} />
        }.bind(this))*/
        return (
            <span>
                {Object.keys(puffworldprops.view.filters).filter(function(n){ return !!puffworldprops.view.filters[n] }).map(function(key) {
                    return <HBFilterBubble key={key} filterName={key} filterValue={puffworldprops.view.filters[key]} />
                })}
            </span>
            );
    }
});

var HBFilterBubble = React.createClass({
    mixins: [TooltipMixin],
    handleRemoveFilter: function(toRemove) {
        // TODO: Remove this value from the props array
        var filterPath  = 'view.filters.' + this.props.filterName
        var filterValue = Boron.shallow_copy(this.props.filterValue)       // don't mutate props
        // var propPiece = puffworldprops.filter[this.props.filterName];

        var index = filterValue.indexOf(toRemove)
        if(index >= 0) {
            filterValue.splice(index, 1)
            var propsMod = {}
            propsMod[filterPath] = filterValue
            propsMod['view.mode'] = puffworldprops.view.mode // KEEP THE SAME!
            return Events.pub('filter/remove', propsMod)
        }

        return false;
    },
    componentDidUpdate: function(prevProp) {
        if (prevProp.filterValue != this.props.filterValue) {
            TooltipMixin.componentDidMount.bind(this)()
        }
    },

    render: function() {
        if(Array.isArray(this.props.filterValue))
            var filterArray = this.props.filterValue
        else
            var filterArray = [this.props.filterValue]

        if (filterArray.length == 0) return <span></span>

        var polyglot = Translate.language[puffworldprops.view.language]
        
        var self = this
        var isUsername = this.props.filterName == "routes" || this.props.filterName == "users"
        return (
            <span>
                {filterArray.map(function(value) {
                    var icon = '';
                    if(self.props.filterName == 'tags') {
                        icon = <i className="fa gray fa-tag"></i>
                    } else if(self.props.filterName == 'types') {
                        icon = <i className="fa gray fa-asterisk"></i>
                    } else if(self.props.filterName == 'users') {
                        icon = <i className="fa gray fa-user"></i>
                    } else if(self.props.filterName == 'routes') {
                        icon = <i className="fa gray fa-sitemap"></i>
                    }

                    return (
                        <span key={value} className='bubbleNode relative'>
                            {icon}
                            {' '}
                            {isUsername ? StringConversion.toDisplayUsername(value) : value}
                            <span>
                                <a href="#" onClick={self.handleRemoveFilter.bind(self, value)}>
                                    <i className="fa fa-times-circle-o fa-fw"></i>
                                </a>
                                <Tooltip position="under" content={polyglot.t("menu.tooltip.removeFilter")} />
                            </span>
                        </span>
                    )
                })}
            </span>
        );
    }

});


var HBFilters = React.createClass({
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {type:'tags'}
    },

    handleAddFilter: function() {
        var type = this.state.type;
        var currFilter = Boron.shallow_copy(puffworldprops.view.filters[type]);
        var newFilter = this.refs.filter.getDOMNode().value.replace(/\s+/g, '') || false;
        if (!newFilter){
            alert('Enter a ' + type.slice(0, -1) + ' in the box and click to add it)');
            this.refs.filter.getDOMNode().value = '';
            return false;
        }

        // Remove leading "." on username
        if (type == "users" || type == 'routes') {
            if (newFilter.slice(0, 1) == '.')
                newFilter = newFilter.slice(1);
        }
        if (newFilter && currFilter.indexOf(newFilter) == -1)
            currFilter.push(newFilter);
        var jsonToSet = {};
        jsonToSet['view.filters.'+type] = currFilter;
        this.refs.filter.getDOMNode().value = '';
        return Events.pub('filter/add', jsonToSet);
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

        // No buttons for non-arrays
        if(puffworldprops.view.filters[type] instanceof Array) {
            return (
                <span key={type}>
                    <button value={type} className={"btn " + color} onClick={this.handlePickFilter.bind(this, type)}>{icon.indexOf('fa-')!=0 ? icon : <i className={'fa '+icon}></i>}</button>
                    <Tooltip position="under" content={polyglot.t("menu.tooltip."+type+"Filter")} />
                </span>
                )

        } else {
            return <span></span>
        }

    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var all_filter = Object.keys(puffworldprops.view.filters).sort().filter(function(n){ return !!puffworldprops.view.filters[n] });

        var leftColStyle = {
            display: 'inline-block'
        }

        return (
            <span>
                <input ref="filter" type="text" placeholder="Add filter" className="btn narrowInputField" onKeyDown={this.handleKeyDown} />{' '}
                <span className="relative">
                    {all_filter.map(this.createEachFilter)}
                </span>
            </span>
            );
    }

});

var HBPuffIcon = React.createClass({
    mixins: [TooltipMixin],
    handleClick: function() {
        if(puffworldprops.menu.show)
            return Events.pub('ui/menu/close', {'menu.show': false})
        else
            return Events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <span className="relative">
                <img id="puffballIcon" onClick={this.handleClick} src="img/blueAnimated.gif" />
                <Tooltip position="under" content={polyglot.t("header.tooltip.icon")} />
            </span>
            );
    }
});

calculateScore = function(username) {
    scoreRules = {

        // Base score for being one of these users
        base: {
            anon: 0.1,
            tlu: 1.0,
            slu: 0.1
        },

        stars: {
            valuesByUser: {
                anon: 0.1,
                tlu: 0.5,
                slu: 0.2
            },

            maxValue: {
                fromAnon: 1,
                fromTlu: 10,
                fromSlu: 3
            }
        }

        // Other factors
        // Number of published things
        // Date of last published thing
        // Date of first published thing

        // Formula for putting it all together

    }


    var score = 0;
    if(username.substring(0, 4) == 'anon.') {
        score += scoreRules.base.anon
    } else if(username.indexOf('.') === -1) {
        score += scoreRules.base.tlu
    } else {
        score += scoreRules.base.slu
    }

    return score;

    // Look at everyone who has starred this, add in value for that

    // Get puffs from this user

}


var HBoffset = React.createClass({
    handleSetOffset: function() {
        var offset = this.refs.offset.getDOMNode().value || 0;
        Events.pub("ui/set-offset", {'view.query.offset': offset});
        return false;
    },
    handleKeyDown: function(e) {
        if (e.keyCode == 13) {
            this.handleSetOffset();
        }
    },
    render: function() {
        var offsetStart = puffworldprops.query.offset || 0;
        return (
            <span>
                Showing {offsetStart} &em;
            </span>
        )
    }
})

var HBsort = React.createClass({
    mixins: [TooltipMixin],
    handleToggleSort: function() {
        var sort = puffworldprops.view.query.sort || 'DESC';
        sort = (sort == 'DESC') ? 'ASC' : 'DESC';
        Events.pub("ui/query/sort", {'view.query.sort': sort});
        return false;
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var sort = puffworldprops.view.query.sort || 'DESC';
        var className = "fa btn blue fa-sort-amount-"+sort.toLowerCase();
        return (
            <span className="relative">
                <a href="#" onClick={this.handleToggleSort}><i className={className}></i></a>{' '}
                <Tooltip position="under" content={polyglot.t("menu.tooltip.sort"+sort)} />
            </span>
        )
    }
})


var HBroots = React.createClass({
    mixins: [TooltipMixin],
    handleToggleShowRoots: function() {
        var showRoots = puffworldprops.view.query.roots
        Events.pub("ui/query/roots", {'view.query.roots': !showRoots})
        return false;
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var showRoots = puffworldprops.view.query.roots
        if(showRoots) {
            var className = "fa btn green fa-dot-circle-o"
            var tooltipId = 'menu.tooltip.show_roots_true'
        } else {
            var className = "fa btn gray fa-dot-circle-o"
            var tooltipId = 'menu.tooltip.show_roots_false'
        }


        return (
            <span className="relative">
                <a href="#" onClick={this.handleToggleShowRoots}><i className={className}></i></a>{' '}
                <Tooltip position="under" content={polyglot.t(tooltipId)} />
            </span>
            )
    }
})


