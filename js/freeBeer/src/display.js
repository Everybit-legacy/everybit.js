/** @jsx React.DOM */

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;


globalCreatePuffBox = function(puff) {
    return <PuffBox puff={puff} key={puff.sig} />
}


// MAIN VIEWS
var PuffWorld = React.createClass({
    render: function() {

        var view;
        var viewprops = this.props.view || {};

        if( viewprops.style == 'PuffTree' )
            view  = <PuffTree puff={viewprops.puff} />

        if( viewprops.style == 'PuffTallTree' )
            view  = <PuffTallTree    view={viewprops} reply={this.props.reply} />

        else if( viewprops.style == 'PuffAllChildren' )
            view  = <PuffAllChildren view={viewprops} reply={this.props.reply} puff={viewprops.puff} />

        else if( viewprops.style == 'PuffAllParents' )
            view  = <PuffAllParents view={viewprops} reply={this.props.reply} puff={viewprops.puff} />

        else if( viewprops.style == 'PuffByUser' )
            view  = <PuffByUser view={viewprops} reply={this.props.reply} user={viewprops.user} />

        else if( viewprops.style == 'PuffPacker' )
            view  = <PuffPacker tools={this.props.tools} />

        else view = <PuffRoots       view={viewprops} reply={this.props.reply} />

        var reply = this.props.reply.show ? <PuffReplyForm reply={this.props.reply} /> : ''

        var menu = this.props.menu.show ? <div><PuffMenu menu={this.props.menu} prefs={this.props.prefs} profile={this.props.profile} /> <Menu prefs={this.props.prefs} profile={this.props.profile} /></div> : ''

        return (
            <div>
                <PuffHeader menu={this.props.menu} />
                {menu}
                {view}
                {reply}
                <PuffFooter />
            </div>
            )
    }
});



var PuffToolsPuffDisplay = React.createClass({
    getInitialState: function() {
        return {value: '', oldpuff: ''};
    },
    handleChange: function(event) {
        this.setState({value: event.target.value});
    },
    render: function() {
        if(this.state.oldpuff != this.props.puff) {
            this.state.value = formatForDisplay(this.props.puff, 'edit');
            this.state.oldpuff = this.props.puff;
        }


        if(this.props.style == 'edit') {
            var puffString = this.state.value;

            return (
                <textarea ref="puffString" name="puffString" id="puffString" cols="50" value={puffString} onChange={this.handleChange} />
            )
        }

        // for raw or formatted styles:
        var puffString = formatForDisplay(this.props.puff, this.props.style);

        return (
            <textarea ref="puffString" name="puffString" rows="5" cols="50" value={puffString}></textarea>
            )
    }
});

var PuffRoots = React.createClass({
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var puffs = PuffForum.getRootPuffs(); // sorted

        // puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        // puffs = puffs.slice(-1 * CONFIG.maxLatestRootsToShow);                    // don't show them all

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )

        // return <section id="children">{puffs.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllChildren = React.createClass({
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var kids = PuffForum.getChildren(this.props.puff); // sorted

        //kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )

        // return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffAllParents = React.createClass({
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var kids = PuffForum.getParents(this.props.puff); // sorted

        // kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )

        // return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffByUser = React.createClass({
    componentDidMount: function() {
        // TODO: make this a mixin
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32)
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this)
        document.addEventListener('keypress', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keypress', this.keyfun)
    },
    render: function() {
        var puffs = PuffForum.getByUser(this.props.user); // sorted

        // kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = this.props.view.cols
        var standardBox = getStandardBox(cols)
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )

        // return <section id="children">{kids.map(globalCreatePuffBox)}</section>
    }
});

var PuffTree = React.createClass({
    render: function() {

        var puff = this.props.puff;
        var parentPuffs = PuffForum.getParents(puff);
        var childrenPuffs = PuffForum.getChildren(puff); // sorted
        
        childrenPuffs = childrenPuffs.slice(0, CONFIG.maxChildrenToShow);

        return (
            <div>
                <section id="parents">{parentPuffs.map(globalCreatePuffBox)}</section>
                <section id="main-content"><PuffBox puff={puff} /></section>
                <section id="children">{childrenPuffs.map(globalCreatePuffBox)}</section>
            </div>
            );
    }

});


var PuffTallTree = React.createClass({
    componentDidMount: function() {
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            if(1*char)
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            if(e.keyCode == 32) // spacebar
                return events.pub('ui/view-mode/change', {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
            if (e.keyCode == 13) {// enter
                if (this.props.view.cursor)
                    if (this.props.view.cursor == this.props.view.puff.sig) {
                        // remove cursor style
                        var cursor = document.getElementById(this.props.view.cursor);
                        cursor.className = cursor.className.replace(' cursor', '');
                        return;
                    }
                    return events.pub('ui/view-puff/change', 
                                      {'view.style': 'PuffTallTree',
                                       'view.puff': PuffForum.getPuffById(this.props.view.cursor),
                                       'view.cursor': false})
            }
            if (e.keyCode == 37 || // left arrow
                e.keyCode == 38 || // up arrow
                e.keyCode == 39 || // right arrow
                e.keyCode == 40) { // down arrow
                var current = this.props.view.cursor;
                if (!current || !document.getElementById(current))
                    current = this.props.view.puff.sig;
                    
                current = document.getElementById(current);
                var next = moveToNeighbour(current.id, e.keyCode, this.props.view.mode);
                
                if (next) {
                    this.props.view.cursor = next.id;
                
                    // remove style for current
                    current.className = current.className.replace(' cursor', '');
                    // add style for next
                    next.className = next.className.replace(' cursor', '');
                    next.className = next.className + ' cursor';
                }
                e.preventDefault();
            }
        }.bind(this)
        document.addEventListener('keydown', this.keyfun)
    },
    componentWillUnmount: function() {
        document.removeEventListener('keydown', this.keyfun)
    },
    render: function() {

        var puff   = this.props.view.puff
        var mode   = this.props.view.mode
        var cols   = this.props.view.cols
        var sigfun = function(item) {return item.sig}
        
        // gather puffs
        var parentPuffs   = PuffForum.getParents(puff) // sorted

        var grandPuffs    = parentPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
        var greatPuffs    =  grandPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
  
            parentPuffs   = parentPuffs.concat(grandPuffs, greatPuffs)
                                       .filter(function(item, index, array) {return array.indexOf(item) == index}) 
                                       .slice(0, cols)
        var siblingPuffs  = PuffForum.getSiblings(puff) // sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun)).indexOf(item.sig)})
                                     .slice(0, cols > 1 ? (cols-2)*2 : 0)
        var childrenPuffs = PuffForum.getChildren(puff) // sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun), siblingPuffs.map(sigfun))
                                                            .indexOf(item.sig)})
                                     .slice(0, cols)
        
        // gridCoord params
        var screenwidth  = window.innerWidth - CONFIG.leftMargin;
        var screenheight = window.innerHeight
        // var cols = mode == 'browse' ? 5 : 8
        var rows = 4

        var gridbox = getGridCoordBox(rows, cols, screenwidth, screenheight)
        var standardBox  = applySizes(1, 1, gridbox, {mode: mode})
        var secondRowBox = applySizes(1, 1, gridbox, {mode: mode}, 1)
        var fourthRowBox = applySizes(1, 1, gridbox, {mode: mode}, 4)
        var stuckbigBox  = applySizes(cols>1?2:1,
                                         2, gridbox, {mode: mode}, 1, 0, 1, 0)
        
        var allPuffs = [].concat( [puff].map(stuckbigBox('focused'))
                                , parentPuffs.map(standardBox('parent'))
                                , siblingPuffs.map(secondRowBox('sibling'))
                                , childrenPuffs.map(fourthRowBox('child'))
                                )
                         .filter(function(x) {return x.width})                  // remove nodes that don't fit in the grid 
                         .sort(function(a, b) {                                 // sort required so React doesn't have to 
                             if(a.puff.sig+'' < b.puff.sig+'') return -1;       // remove and re-add DOM nodes in order to
                             if(a.puff.sig+'' > b.puff.sig+'') return 1;        // order them properly
                             return 0; })
                             // return a.puff.sig+'' < b.puff.sig+'' ? 1 : a.puff.sig+'' == b.puff.sig+'' ? 0 : -1})
        
        /*
            - resize in place
            - draw arrows
        
        
                <ReactCSSTransitionGroup transitionName="example">
                    {puffBoxList}
                </ReactCSSTransitionGroup>
        
        
        
        
        
        
                <svg width={screenwidth} height={screenheight} style={{position:'absolute', top:'0px', left:'0px'}}>
                    <defs dangerouslySetInnerHTML={{__html: '<marker id="triangle" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>'}} ></defs>
                    {puffBoxList.map(function(puffbox) {
                        return <Arrow key={'arrow-'+puffbox.props.key+puffbox.props.stats.x+puffbox.props.stats.y} x1={screenwidth} y1={screenheight} x2={puffbox.props.stats.x} y2={puffbox.props.stats.y} />
                    })}
                    
                </svg>
        
        */
        
        // debugger;
        
        
        var puffBoxList = allPuffs.map(globalCreateFancyPuffBox)

        return (
            <div>
                <div id="talltree">
                    {puffBoxList}
                </div>
            </div>
        );
    }
})

var PuffHeader = React.createClass({
    handleClick: function() {
        if(this.props.menu.show)
            return events.pub('ui/menu/close', {'menu': puffworlddefaults.menu})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            <div>
                <img onClick={this.handleClick} src="img/puffballIconBigger.png" id="puffballIcon" height="48" width="41" className={this.props.menu.show ? 'menuOn' : ''} />
            </div>
            );
    }
});

var PuffFooter = React.createClass({
    render: function() {
        return (
            <div className="footer">
                <div className="footerText">
                Powered by <a href="http://www.puffball.io" className="footerText">puffball</a>.
                Responsibility for all content lies with the publishing author and not this website.
                </div>
            </div>
            );
    }
});
