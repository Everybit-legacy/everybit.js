/** @jsx React.DOM */

var ViewKeybindingsMixin = {
    componentDidMount: function() {
        this.keyfun = function(e) {
            if(this.props.reply.show)
                return false
            var char = String.fromCharCode(e.keyCode)
            
            if(1*char) {
                return events.pub('ui/view-cols/change', {'view.cols': 1*char})
            }
            
            if(e.keyCode == 32) { // spacebar
                return events.pub('ui/view-mode/change', 
                                 {'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
            }
            
            if (e.keyCode == 13) {// enter
                // FIXME: don't pub event if !view.cursor
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
                    
                if (!current)
                    current = document.querySelector('.block').id;
                    
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
};

var GridLayoutMixin = {    
    getScreenCoords: function() {
        return { width:  window.innerWidth - CONFIG.leftMargin
               , height: window.innerHeight
               }
    },
    getGridBox: function(rows, cols) {
        var screencoords = this.getScreenCoords()
        var rows = rows || 4
        var cols = cols || 5
        return getGridCoordBox(rows, cols, screencoords.width, screencoords.height)
    },
    getStandardBox: function(rows, cols) {
        var gridbox = this.getGridBox(rows, cols)
        return this.applySizes(1, 1, gridbox)
    },
    applySizes: function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
        return function(className) {
            return function(puff) {
                return extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx), 
                                             {puff: puff, className: className}) } } 
    },
    
};

// MAIN VIEWS
var PuffWorld = React.createClass({
    render: function() {

        var view;
        var viewprops = this.props.view || {};

        if( viewprops.style == 'PuffTallTree' )
            view  = <PuffTallTree    view={viewprops} reply={this.props.reply} />

        else if( viewprops.style == 'PuffAllChildren' )
            view  = <PuffAllChildren view={viewprops} reply={this.props.reply} puff={viewprops.puff} />

        else if( viewprops.style == 'PuffAllParents' )
            view  = <PuffAllParents  view={viewprops} reply={this.props.reply} puff={viewprops.puff} />

        else if( viewprops.style == 'PuffByUser' )
            view  = <PuffByUser      view={viewprops} reply={this.props.reply} user={viewprops.user} />

        else if( viewprops.style == 'PuffLatest' )
            view  = <PuffLatest      view={viewprops} reply={this.props.reply} />

        else if( viewprops.style == 'PuffPacker' )
            view  = <PuffPacker tools={this.props.tools} />

        else view = <PuffRoots       view={viewprops} reply={this.props.reply} />

        var reply = this.props.reply.show ? <PuffReplyForm reply={this.props.reply} /> : ''

        var menu = this.props.menu.show ? <div><Menu prefs={this.props.prefs} profile={this.props.profile} /></div> : ''

        var animateClass =  this.props.view.animation ? "animation" : '';

        return (
            <div className={animateClass}>
                <PuffHeader menu={this.props.menu} />
                {menu}
                {view}
                {reply}
                <PuffFooter />
            </div>
            )
    }
});


var PuffRoots = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {
        var puffs = PuffForum.getRootPuffs(); // sorted

        // puffs.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        // puffs = puffs.slice(-1 * CONFIG.maxLatestRootsToShow);                    // don't show them all

        var cols   = ~~this.props.view.cols
        var standardBox = this.getStandardBox(cols)
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )
    }
});

var PuffAllChildren = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {
        var kids = PuffForum.getChildren(this.props.puff); // sorted

        //kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = ~~this.props.view.cols
        var standardBox = this.getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )
    }
});

var PuffAllParents = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {
        var kids = PuffForum.getParents(this.props.puff); // sorted

        // kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = ~~this.props.view.cols
        var standardBox = this.getStandardBox(cols)
        var puffBoxList = kids.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )
    }
});

var PuffByUser = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {
        var puffs = PuffForum.getByUser(this.props.user); // sorted

        // kids.sort(function(a, b) {return b.payload.time - a.payload.time});      // sort by payload time

        var cols   = ~~this.props.view.cols
        var standardBox = this.getStandardBox(cols)
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )
    }
});

var PuffLatest = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {
        var rows   = 4
        var cols   = ~~this.props.view.cols
        var standardBox = this.getStandardBox(cols)
        
        var puffs = PuffForum.getLatestPuffs(cols * rows); // sorted
        
        var puffBoxList = puffs.map(standardBox('child')).map(globalCreateFancyPuffBox)

        return (
            <div id="talltree">
                {puffBoxList}
            </div>
        )
    }
});


var PuffTallTree = React.createClass({
    mixins: [ViewKeybindingsMixin, GridLayoutMixin],
    render: function() {

        var puff   = this.props.view.puff
        var mode   = this.props.view.mode
        var cols   = ~~this.props.view.cols
        var sigfun = function(item) {return item.sig}
        
        // gridCoord params
        var rows
        var screencoords = this.getScreenCoords()
        var gridbox = this.getGridBox(rows, cols)
        
        var standardBox  = this.applySizes(1, 1, gridbox, {mode: mode})
        var secondRowBox = this.applySizes(1, 1, gridbox, {mode: mode}, 1)
        var fourthRowBox = this.applySizes(1, 1, gridbox, {mode: mode}, 4)
        var stuckbigBox  = this.applySizes(cols>1?2:1,
                                         2, gridbox, {mode: mode}, 1, 0, 1, 0)
        
        
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
        
        */
        
        // debugger;
        
        
        var puffBoxList = allPuffs.map(globalCreateFancyPuffBox)

        /*
        var colNumber = parseInt(Bitcoin.Crypto.MD5(puff.sig.slice(-32)),16);
        colNumber = colNumber % CONFIG.arrowColors.length;

        var fillColor = CONFIG.arrowColors[colNumber]
        */
        
        if(mode == 'arrows') {
            var arrows = allPuffs.reduce(function(acc, puffbox) {
                            return acc.concat(
                                puffbox.puff.payload.parents.map(
                                    function(parent) {
                                        return [allPuffs.filter(
                                            function(pb) {
                                                return pb.puff.sig == parent})[0], puffbox]}))}, [])
                                                    .filter(function(pair) {return pair[0]})

            var arrowList = (
                <svg width={screencoords.width} height={screencoords.height} style={{position:'absolute', top:'0px', left:'0px'}}>
                    <defs dangerouslySetInnerHTML={{__html: '<marker id="triangle" viewBox="0 0 20 20" refX="10" refY="10" fill="blue" markerUnits="strokeWidth" markerWidth="18" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 0 15 z" /><circle cx="15" cy="10" r="5" fill="white" /></marker>'}} ></defs>
                    {arrows.map(function(arrow) {
                        return <PuffArrow key={'arrow-' + arrow[0].puff.sig + '-' + arrow[1].puff.sig} arrow={arrow} />
                    })}
                </svg>
            )
        }

        //

        return (
            <div>
                <div id="talltree">
                    {puffBoxList}
                </div>
                
                {arrowList}
            </div>
        );
    }
})


var PuffArrow =  React.createClass({
    render: function() {
        var arrow = this.props.arrow
        
        var p = arrow[0]
        var c = arrow[1]
        
        var offset = 30
        var xoffset = CONFIG.leftMargin
        var yoffset = 0
        var baseShift = 12

        var x1 = p.x + p.width/2 + xoffset
        var y1 = p.y + p.height/2
        var x2 = c.x + c.width/2 + xoffset
        var y2 = c.y + c.height/2

        /*
        var leftEdge = x2 - (c.height/2) - offset/2
        var rightEdge = x2 + (c.height/2) + offset/2
        var topEdge = y2 -(c.height/2) - offset/2
        var bottomEdge = y2 + (c.height/2) + offset/2
        */

        var boxSlope = Math.abs(c.height/c.width)

        var dx = x2-x1
        var dy = y2-y1
        var lineSlope = Math.abs(dy/dx)
        var theta = Math.atan(lineSlope)

        // Child is below parent or sideways
        if(y2 >= y1) {

            // Which does it hit first, top edge or left edge?
            if (x2 > x1) {
                // Arrow is left to right
                if (boxSlope < lineSlope) {

                    // Limited by top edge
                    x2 -= ((c.height / 2) - offset / 2) / lineSlope
                    y2 -= ((c.height / 2) - offset / 2)

                    y2 -= Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by right edge
                    x2 -= ((c.width / 2) - offset / 2)
                    y2 -= ((c.width / 2) - offset / 2) * lineSlope

                    x2 -= Math.abs(Math.cos(theta)) * 5

                }
            } else {
                if (boxSlope < lineSlope) {

                    // Limited by top edge
                    x2 += ((c.height / 2) + offset / 2) / lineSlope
                    y2 -= ((c.height / 2) - offset / 2)

                    y2 -= Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by left edge
                    x2 += ((c.width / 2) - offset / 2)
                    y2 -= ((c.width / 2) - offset / 2) * lineSlope

                    x2 += Math.abs(Math.cos(theta)) * 5
                }
            }
        } else {
            // Which does it hit first, top edge or left edge?
            if (x2 < x1) {
                // Arrow is right to left
                if (boxSlope > lineSlope) {

                    // Limited by bottom edge
                    x2 -= ((c.height / 2) - offset / 2) / lineSlope
                    y2 += ((c.height / 2) - offset / 2)

                    y2 += Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by right edge
                    x2 += ((c.width / 2) - offset / 2)
                    y2 += ((c.width / 2) - offset / 2) * lineSlope

                    x2 += Math.abs(Math.cos(theta)) * 5

                }
            } else {
                // Arrow is left to right
                if (boxSlope < lineSlope) {

                    // Limited by bottom edge
                    x2 -= ((c.height / 2) + offset / 2) / lineSlope
                    y2 += ((c.height / 2) - offset / 2)

                    y2 += Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by left edge
                    x2 -= ((c.width / 2) - offset / 2)
                    y2 += ((c.width / 2) - offset / 2) * lineSlope

                    x2 -= Math.abs(Math.cos(theta)) * 5
                }
            }
        }

        // WORKING: All downward arrows
        // WORKING: Straight up
        // ?: Up and left limited by bottom
        // ?: Up and right limited by bottom
        // ?: Up and left limited by edge
        // WORKING: Up and right limited by edge


        // Use mod of sig, so we can do same for arrowheads!
        // TODO: Make mini-helper function
        var colNumber = parseInt(Bitcoin.Crypto.MD5(this.props.key.slice(-32)),16);
        colNumber = colNumber % CONFIG.arrowColors.length;

        var stroke = CONFIG.arrowColors[colNumber]
        
        return <Arrow x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} fill={stroke} />
    }
})

var Arrow = React.createClass({
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {
        
        // dangerouslySetInnerHTML={{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}}

        // save this!
        // <path d={'M ' + this.props.x1 + ' ' + this.props.y1 + ' Q ' + (this.props.x2  + (this.props.x2 - this.props.x1)/2 - 10) + ' ' + (this.props.y2 + (this.props.y2 - this.props.y1)/2 - 20) + ' ' + this.props.x2 + ' ' + this.props.y2} fillOpacity="0" stroke={this.props.stroke} strokeWidth="2" />

        //

        var result = (
            <line x1={this.props.x1} y1={this.props.y1} x2={this.props.x2} y2={this.props.y2} stroke={this.props.stroke} strokeWidth="2" fill={this.props.fill} ></line>

        )
        
        return result
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
