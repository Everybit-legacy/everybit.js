/** @jsx React.DOM */

var ViewKeybindingsMixin = {
    componentDidMount: function() {
        
        // n shows new puff form
        Mousetrap.bind('n', function() { 
            if (puffworldprops.reply.preview) return false;
            return events.pub('ui/reply/open', {'menu': puffworlddefaults.menu, 'reply': {show: true}});
        }.bind(this));
        
        // r replies to 'selected' puff
        Mousetrap.bind('r', function() { 
            if (puffworldprops.reply.preview) return false;
            var parents = puffworldprops.reply.parents || [] // OPT: global prop hits prevent early bailout
            parents = parents.slice()                        // don't mutate props directly
            var sig = this.props.view.cursor
            
            if (!sig) return;                                // no cursor? do nothing
            
            var index = parents.indexOf(sig)
            
            if(index == -1) {
                parents.push(sig)
            } else {
                parents.splice(index, 1)
            }
            
            return events.pub('ui/reply/open', {'menu': puffworlddefaults.menu, 'reply': {show: true, parents: parents
}});
        }.bind(this));

        // a toggles animation
        Mousetrap.bind('a', function() {
            return events.pub( 'ui/animation/toggle',
                             { 'view.animation': !this.props.view.animation})
        }.bind(this));
        
        // i toggles info boxes
        Mousetrap.bind('i', function() { 
            return events.pub( 'ui/view/showinfo/toggle', 
                             { 'view.showinfo': !this.props.view.showinfo})
        }.bind(this));

        // m toggles menu show
        Mousetrap.bind('m', function() {
            if(puffworldprops.menu.show) {
                return events.pub('ui/menu/close', {'menu.show': false})
            } else {
                return events.pub('ui/menu/open', {'menu.show': true})
            }

        }.bind(this));

        // l shows latest puffs
        Mousetrap.bind('l', function() {
            return events.pub('ui/show/latest', {'view.style': 'PuffLatest', 'view.puff': false, 'menu': puffworlddefaults.menu, 'view.user': ''});
        }.bind(this));


        // 1-9 controls number of rows
        Mousetrap.bind(['1','2','3','4','5','6','7','8','9'], function(e) { 
            return events.pub('ui/view/rows/set', {'view.rows': 1*String.fromCharCode(e.which)})
        }.bind(this));

        // Go with wide aspect ratio
        Mousetrap.bind('w', function(e) {
            return events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1.618})
        }.bind(this));

        // Go with tall aspect ratio
        Mousetrap.bind('t', function(e) {
            return events.pub('ui/view/boxRatio/set', {'view.boxRatio': 0.618})
        }.bind(this));

        // Go square
        Mousetrap.bind('s', function(e) {
            return events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1})
        }.bind(this));
        
        // spacebar toggles display mode
        Mousetrap.bind('space', function(e) { 
            return events.pub( 'ui/view-mode/change', 
                             { 'view.mode': this.props.view.mode == 'browse' ? 'arrows' : 'browse'})
        }.bind(this));
        
        // escape closes menu, else closes reply, else removes cursor, else pops up 'nothing to close' alert
        Mousetrap.bind('esc', function(e) { 
            if(puffworldprops.menu.show)
                return events.pub('ui/menu/close', {'menu.show': false})

            if(puffworldprops.reply.show)
                return events.pub('ui/menu/close', {'reply': {show: false, parents: []}})

            if(puffworldprops.view.cursor) {
                var cursor = document.getElementById(puffworldprops.view.cursor);
                cursor.className = cursor.className.replace(' cursor', '');
                return events.pub('ui/menu/close', {'view.cursor': false})
            }

            alert("I'm afraid there's nothing left to close!")
        }.bind(this));
        
        // cmd-enter submits the reply box
        Mousetrap.bind(['command+enter','ctrl+enter'], function(e) {
            if(!this.props.reply.show) 
                return true
            
            if(typeof globalReplyFormSubmitArg == 'function')
                globalReplyFormSubmitArg()
        }.bind(this));
        
        
        // we have to customize stopCallback to make cmd-enter work inside reply boxes
        Mousetrap.stopCallback = function(e, element, combo) {

            // if the element has the class "mousetrap" AND the combo is command+enter or esc, then no need to stop
            if(~['command+enter', 'esc','ctrl+enter'].indexOf(combo) && (' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
                return false;
            }

            // stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true');
        }
    },
    componentWillUnmount: function() {
        Mousetrap.reset();
    }
};

var CursorBindingsMixin = {
    componentDidMount: function() {
        
        // arrows move the selection cursor
        // THINK: wasd?
        Mousetrap.bind(['left', 'up', 'right', 'down'], function(e) { 
            var current = this.props.view.cursor;
            
            if (!current)                              // default cursors handled elsewhere (there should always 
                return false                           // be an active cursor, if we are in a cursorable mode)
            
            // current = document.getElementById(current);
            // var next = moveToNeighbour(current.id, e.which, this.props.view.mode);

            var next = findNeighbor(globalGridBox.get(), PuffForum.getPuffBySig(current), arrowToDir(e.which))
            
            if (next)
                events.pub('ui/view/cursor/set', {'view.cursor': next.sig});
            
            return false
        }.bind(this));
        
        // enter focuses the selected puff
        Mousetrap.bind('enter', function(e) { 
            // don't refocus if there's nothing selected
            if (!this.props.view.cursor)
                return false;
            
            // don't refocus if we're selecting the focused puff 
            if (this.props.view.cursor == this.props.view.puff.sig)
                return false;
            
            showPuff(this.props.view.cursor);
            return false;
        }.bind(this));
        
    },
    componentWillUnmount: function() {
        Mousetrap.reset();
    },
    cursorPower: function(puffs, defaultPuff) {
        var cursor = this.props.view.cursor
        
        if(cursor) {
            var oneOfThesePuffsIsSelected = puffs.filter(function(puff) {return puff.sig == cursor}).length
            if(oneOfThesePuffsIsSelected) {
                return false 
            }
        }
        
        var newCursor = (defaultPuff||puffs[0]||{}).sig
        
        if(newCursor) {    // do this manually so auto-cursoring doesn't gum up history
            events.update_puffworldprops({'view.cursor': newCursor})
            updateUI()
        }
    }
};

var GridLayoutMixin = {
    getScreenCoords: function() {
        return { width:  window.innerWidth - CONFIG.leftMargin
               , height: window.innerHeight
               }
    },
    getDimensions: function() {
        var rows = ~~this.props.view.rows || 4
        var cols = this.getCols(rows)
        return { rows: rows
               , cols: cols
               }
    },
    getCols: function(rows) {
        var screencoords = this.getScreenCoords();
        var boxHeight = screencoords.height / rows;


        var boxWidth = this.props.view.boxRatio * boxHeight;
        // Make sure this is not too big for page!
        if (boxWidth > screencoords.width) {
            boxWidth = screencoords.width;
        }

        var nCol = Math.floor(screencoords.width/boxWidth);

        return nCol;

    },
    getGridBox: function(rows) {
        var screencoords = this.getScreenCoords()
        var boxHeight = screencoords.height / rows;

        // How many cols fit in this page
        var nCol = this.getCols(rows);
        var w = nCol * this.props.view.boxRatio* boxHeight;
        if(w > screencoords.width) {
            w = screencoords.width;
        }
        
        var gridBox = getGridCoordBox(rows, nCol, w, screencoords.height)


        // this.setState({gridBox: gridBox}) // ugh state but whaddyagonnado
        globalGridBox = gridBox // ugh globals but whaddyagonnado
        return gridBox
    },
    getStandardBox: function(rows, cols) {
        var gridbox = this.getGridBox(rows)
        var mode    = this.props.view.mode
        return this.applySizes(1, 1, gridbox.add, {mode: mode})
    },
    applySizes: function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
        return function(className) {
            return function(puff) {
                return extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx, puff), // THINK: puff gc ok?
                                             {puff: puff, className: className}) } } 
    },
    getPuffBoxList: function(puffs) {
        var dimensions  = this.getDimensions() 
        var standardBox = this.getStandardBox(dimensions.rows)
        return puffs.map(standardBox('child'))
                    .filter(function(pbox) {return pbox.height})
    },
    makeArrowPairs: function(puffBoxen) {
        var screencoords = this.getScreenCoords()
        
        var arrows = puffBoxen.reduce(function(acc, puffbox) {
                        return acc.concat(
                            (puffbox.puff.payload.parents||[]).map(
                                function(parent) {
                                    return [puffBoxen.filter(
                                        function(pb) {
                                            return pb.puff.sig == parent})[0], puffbox]}))}, [])
                                                .filter(function(pair) {return pair[0]})

        return (
            <svg width={screencoords.width} height={screencoords.height} style={{position:'absolute', top:'0px', left:'0px'}}>
                <defs dangerouslySetInnerHTML={{__html: '<marker id="triangle" viewBox="0 0 20 20" refX="10" refY="10" fill="blue" markerUnits="strokeWidth" markerWidth="18" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 0 15 z" /><circle cx="15" cy="10" r="5" fill="white" /></marker>'}} ></defs>
                {arrows.map(function(arrow) {
                    return <PuffArrow key={'arrow-' + arrow[0].puff.sig + '-' + arrow[1].puff.sig} arrow={arrow} />
                })}
            </svg>
        )        
    },
    standardGridify: function(puffs) {
        var puffBoxList = this.getPuffBoxList(puffs)
        return this.manualGridify(puffBoxList)
    },
    manualGridify: function(puffBoxList) {
        var arrowList = this.props.view.mode == 'arrows' ? this.makeArrowPairs(puffBoxList) : ''
        var viewprops = this.props.view
        
        var fancyWrapper = (function() {
            return function(puffplus) {     // this is getting really messy -- maybe just transfer props
                var className = puffplus.className
                var stats = puffplus
                var puff  = puffplus.puff
                var view  = viewprops
                return <PuffFancyBox puff={puff} key={puff.sig} extraClassy={className} stats={stats} view={view} />
            }
        })()
        
        
        return (
            <div>
                <div id="talltree">
                    {puffBoxList.map(fancyWrapper)}
                </div>

                {arrowList}
            </div>
        )
    }
};

// MAIN VIEWS
var PuffWorld = React.createClass({
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var defaultPuffId = polyglot.t("puff.default") || CONFIG.defaultPuff;
        var defaultPuff = PuffForum.getPuffBySig(defaultPuffId);
        var defaultViewProps = {};
        defaultViewProps.puff = defaultPuff;

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

        // else if( viewprops.style == 'PuffByRoute' )
        //     view  = <PuffByRoute     view={viewprops} reply={this.props.reply} user={viewprops.user} />

        else if( viewprops.style == 'PuffLatest' )
            view  = <PuffLatest      view={viewprops} reply={this.props.reply} />

        else if( viewprops.style == 'PuffPacker' )
            view  = <PuffPacker         tools={this.props.tools} />

        else view = <PuffTallTree    view={extend(this.props.view, defaultViewProps)} reply={this.props.reply} />

        var reply = this.props.reply.show ? <PuffReplyFormExp reply={this.props.reply} /> : ''

        if (viewprops.style == "Menu" || viewprops.style == "MenuAdd") {
            this.props.menu.show = true;
        }
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
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {
        var dimensions = this.getDimensions();
        var limit = dimensions.cols * dimensions.rows;
        var puffs = PuffForum.getRootPuffs(limit, this.props); // pre-sorted
        this.cursorPower(puffs)
        return this.standardGridify(puffs);
    }
});

var PuffAllChildren = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {
        var puffs = PuffForum.getChildren(this.props.puff, this.props); // pre-sorted
        this.cursorPower(puffs)
        return this.standardGridify(puffs);
    }
});

var PuffAllParents = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {
        var puffs = PuffForum.getParents(this.props.puff, this.props); // pre-sorted
        this.cursorPower(puffs)
        return this.standardGridify(puffs);
    }
});

var PuffByUser = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {
        var dimensions = this.getDimensions();
        var limit = dimensions.cols * dimensions.rows;
        var puffs = PuffForum.getByUser(this.props.user, limit, this.props); // pre-sorted
        this.cursorPower(puffs)
        return this.standardGridify(puffs);
    }
});

// var PuffByRoute = React.createClass({
//     mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
//     render: function() {
//         var dimensions = this.getDimensions();
//         var limit = dimensions.cols * dimensions.rows;
//         var puffs = PuffForum.getByRoute(this.props.view.route, limit); // pre-sorted
//         this.cursorPower(puffs)
//         return this.standardGridify(puffs);
//     }
// });

var PuffLatest = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {
        var dimensions = this.getDimensions();
        var limit = dimensions.cols * dimensions.rows;
        var puffs = PuffForum.getLatestPuffs(limit, this.props); // pre-sorted
        this.cursorPower(puffs)
        return this.standardGridify(puffs);
    }
});


var PuffTallTree = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
    render: function() {

        var puff   = this.props.view.puff
        var mode   = this.props.view.mode
        var sigfun = function(item) {return item.sig}
        var username = PuffWardrobe.getCurrentUsername()
        
        if(!puff)
            return <div></div>
        
        // gridCoord params
        var screencoords = this.getScreenCoords()
        var dimensions   = this.getDimensions()
        var cols    = dimensions.cols
        var rows    = dimensions.rows
        var gridbox = this.getGridBox(rows, cols)
        
        var standardBox  = this.applySizes(1, 1, gridbox.add, {mode: mode})
        var secondRowBox = this.applySizes(1, 1, gridbox.add, {mode: mode}, 1)
        var fourthRowBox = this.applySizes(1, 1, gridbox.add, {mode: mode}, 3)
        var stuckBigBox  = this.applySizes(cols > 1 ? 2 : 1, rows > 1 ? 2 : 1, gridbox.add, {mode: mode}, 1, 0, 1, 0)
        
        // gather puffs
        var parentPuffs   = PuffForum.getParents(puff) // pre-sorted

        var grandPuffs    = parentPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
        var greatPuffs    =  grandPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
  
            parentPuffs   = parentPuffs.concat(grandPuffs, greatPuffs)
                                       .filter(function(item, index, array) {return array.indexOf(item) == index}) 
                                       .slice(0, cols)
                                       
        var siblingPuffs  = PuffForum.getSiblings(puff) // pre-sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun)).indexOf(item.sig)})
                                     .slice(0, cols > 1 ? (cols-2)*2 : 0)
                                     
        var childrenPuffs = PuffForum.getChildren(puff) // pre-sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun), siblingPuffs.map(sigfun))
                                                            .indexOf(item.sig)})
                                     .slice(0, cols)
                                     .sort(function(a, b) {
                                         return a.username == username ? -1 : 0       // fancy sorting for current user puffs
                                             || b.username == username ?  1 : 0
                                             || a.username == puff.username ? -1 : 0  // fancy sorting for author puffs
                                             || b.username == puff.username ?  1 : 0
                                             || PuffForum.sortByPayload(b, a) * -1    // regular temporal sort
                                             })
        
        var allPuffs = [].concat( [puff].map(stuckBigBox('focused'))
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
        
        
        this.cursorPower(allPuffs.map(function(pbox) {return pbox.puff}), puff)
        
        return this.manualGridify(allPuffs)
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
        var width = (window.innerHeight-66)+'px';
        var polyglot = Translate.language[puffworldprops.view.language];
        return (
            <div className="footer" style={{width: width}}>
                <div className="footerText">
                {polyglot.t("footer.powered")} <a href="http://www.puffball.io" className="footerText">puffball</a>.
                {polyglot.t("footer.rest")}
                </div>
            </div>
        );
    }
});
