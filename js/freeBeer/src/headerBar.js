/** @jsx React.DOM */

var HeaderHider = React.createClass({
    handleToggleShowHeader: function() {
        if(puffworldprops.header.show)
            return events.pub('ui/header/close', {'header.show': false})
        else
            return events.pub('ui/header/open', {'header.show': true})
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
                <HBPuffIcon />{' '}
                <HBpublish />{' '}
                <HBscore />{' '}
                <HBidentity />{' '}
                <HBFilters view={this.props.view} /><HBCurrentFilters view={this.props.view} />

            </div>
            )
    }

});

var HBpublish = React.createClass({
    handleToggleShowPublish: function() {
        // Send event
        if(puffworldprops.header.publish.show)
            return events.pub('ui/header/publish/close', {'header.publish.show': false})
        else
            return events.pub('ui/header/publish/open', {'header.publish.show': true})

    },

    render: function() {
        if(puffworldprops.header.publish.show)
            var pulldown = <PublishPulldown />
        else
            var pulldown = ''

        return (
            <span className="headerIcon">
                <a href="#" onClick={this.handleToggleShowPublish}>
                    <i className="fa fa-send fa-fw"></i>
                </a>
                {pulldown}
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
    render: function() {
        var name = PuffWardrobe.getCurrentUsername();

        return (
            <span className="headerIcon">
                <i className="fa fa-user fa-fw"></i><span className="authorSpan">{name}</span>
            </span>
            )
    }

});

var HBscore = React.createClass({

    render: function() {
        if(PuffWardrobe.getCurrentUsername() != "") {
            var score = calculateScore(PuffWardrobe.getCurrentUsername());
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
        var filterNodes = Object.keys(this.props.view.filters).map(function(key) {
            return <HBFilterBubble key={key} filterName={key} filterValue={this.props.view.filters[key]} />
        }.bind(this))

        return (
            <span>
                {filterNodes}
            </span>
            );
    }
});

var HBFilterBubble = React.createClass({
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

    render: function() {
        var filterArray = Array.isArray(this.props.filterValue)
            ? this.props.filterValue
            : [this.props.filterValue]

        if (filterArray.length == 0) return <span></span>;

        var toReturn = filterArray.map(function(value) {
            return (
                <span className='bubbleNode'>
                    {value}
                    <a href="#" onClick={this.handleRemoveFilter.bind(this, value)}>
                        <i className="fa fa-times-circle-o fa-fw"></i>
                    </a>
                </span>
                )
        }.bind(this));

        return (
            <span>
                {this.props.filterName}:{' '}
                {toReturn}
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
        var currFilter = PB.shallow_copy(this.props.view.filters[type]);
        var newFilter = this.refs.filter.getDOMNode().value.replace(/\s+/g, '') || false;
        if (!newFilter){
            alert('Enter a ' + type.slice(0, -1) + ' in the box and click to add it)');
            this.refs.filter.getDOMNode().value = '';
            return false;
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
            users:'fa-user',
            routes:'fa-sitemap'
        }
        var icon = filterToIcon[type];

        var color = this.state.type == type ? 'green' : 'black';
        return (
            <span key={type}>
                <button value={type} className={"btn " + color} onClick={this.handlePickFilter.bind(this, type)}>{icon.indexOf('fa-')!=0 ? icon : <i className={'fa '+icon}></i>}</button>
                <Tooltip position="under" content={polyglot.t("menu.tooltip."+type+"Filter")} />
            </span>
            )
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var all_filter = ['tags', 'users', 'routes'];
        var leftColStyle = {
            display: 'inline-block'
        }

        return (
            <span>
                <input ref="filter" type="text" placeholder="Add filter" className="btn narrowInputField" onKeyDown={this.handleKeyDown} />{' '}
                <span>
                    {all_filter.map(this.createEachFilter)}
                </span>
            </span>
            );
    }

});

var HBPuffIcon = React.createClass({
    handleClick: function() {
        if(puffworldprops.menu.show)
            return events.pub('ui/menu/close', {'menu.show': false})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            <div className="headerIcon">
                <img onClick={this.handleClick} src="img/puffballIconAnimated.gif" id="puffballIcon" />
            </div>
            );
    }
});

calculateScore = function(username) {
    if(username.indexOf('.') === -1)
        return 1.0
    else
        return 0.1
}
