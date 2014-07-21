/** @jsx React.DOM */

var PuffBarShortcutMixin = {
    componentDidMount: function() {
        Mousetrap.bind(['shift+f'], function(){
            var cursor = puffworldprops.view.cursor;
            var bar = this.refs[cursor].refs['bar'];
            if (bar.refs.flag)
                bar.refs.flag.handleFlagRequest();
        }.bind(this));
    }
};

var ViewKeybindingsMixin = {
    componentDidMount: function() {
        
        // n shows new puff form
        Mousetrap.bind('n', function() { 
            if (puffworldprops.reply.preview) return false;
            
            var menu = PB.shallow_copy(puffworlddefaults.menu);
            menu.show = true;
            menu.section = 'publish';

            return events.pub('ui/reply/open', { 'clusters.publish': true
                                               , 'menu': menu
                                             //  , 'reply': {show: true} 
                                                });
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
            /*if (parents.length == 0) 
                return events.pub('ui/reply/open', { 'reply.parents': parents });*/

            var menu = PB.shallow_copy(puffworlddefaults.menu); // don't mutate directly!
            if (!puffworldprops.reply.expand) {
                menu.show = true;
                menu.section = 'publish';
            }

            var contentEle = document.getElementById('content');
            if (contentEle) {
                contentEle.focus();
            }

            return events.pub('ui/reply/open', { 'clusters.publish': true
                                               , 'menu': menu
                                               , 'reply.parents': parents });
        }.bind(this));

        // a toggles animation
        Mousetrap.bind('a', function() {
            return events.pub( 'ui/animation/toggle',
                             { 'view.animation': !this.props.view.animation })
        }.bind(this));
        
        // i toggles info boxes
        Mousetrap.bind('i', function() { 
            return events.pub( 'ui/view/showinfo/toggle', 
                             { 'view.showinfo': !this.props.view.showinfo })
        }.bind(this));

        // m toggles menu show
        Mousetrap.bind('m', function() {
            if(puffworldprops.menu.show) {
                return events.pub('ui/menu/close', {'menu.show': false})
            } else {
                return events.pub('ui/menu/open',  {'menu.show': true})
            }

        }.bind(this));

        // l shows latest puffs
        Mousetrap.bind('l', function() {
            return events.pub('ui/show/latest', { 'view.mode': 'list'
                                                , 'view.filters': puffworlddefaults.view.filters
                                                , 'view.query': puffworlddefaults.view.query
                                                , 'menu': puffworlddefaults.menu});
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
        
        // spacebar toggles arrow display
        Mousetrap.bind('space', function(e) { 
            return events.pub( 'ui/relationships/toggle', 
                             { 'view.arrows': !this.props.view.arrows })
        }.bind(this));
        
        // escape closes menu, else closes reply, else removes cursor, else pops up 'nothing to close' alert
        Mousetrap.bind('esc', function(e) { 
            if(puffworldprops.menu.show)
                return events.pub('ui/menu/close', {'menu.show': false})

            if(puffworldprops.reply.expand)
                return events.pub('ui/expand/close', {'reply': {expand: false, parents: []}})

            if(puffworldprops.view.cursor) {
                var cursor = document.getElementById(puffworldprops.view.cursor);
                cursor.className = cursor.className.replace(' cursor', '');
                return events.pub('ui/menu/close', {'view.cursor': false})
            }

            alert("I'm afraid there's nothing left to close!")
        }.bind(this));
        
        // cmd-enter submits the reply box
        Mousetrap.bind(['command+enter','ctrl+enter'], function(e) {
            if(!(puffworldprops.reply.expand || 
                (puffworldprops.menu.show && puffworldprops.menu.section == 'publish'))) {
                return true
            }
            
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
    gotoNext: function(current, dir) {
        var next = findNeighbor(globalGridBox.get(), PuffForum.getPuffBySig(current), dir)
        if (next) {
            events.pub('ui/view/cursor/set', {'view.cursor': next.sig});
            return true;
        }
        return false;
    },
    componentDidMount: function() {
        
        var arrowToDir = { 37: 'left'
                         , 38: 'up'
                         , 39: 'right'
                         , 40: 'down' }
        
        // arrows move the selection cursor
        // THINK: wasd?
        Mousetrap.bind(['left', 'up', 'right', 'down'], function(e) { 
            var current = this.props.view.cursor;
            var dir = arrowToDir[e.which];
            
            if (!current)                              // default cursors handled elsewhere (there should always 
                return false                           // be an active cursor, if we are in a cursorable mode)
            
            var nextFn = this.gotoNext.bind(this, current, dir);
            var success = nextFn();
            if (!success){
                if (e.which == 38 && this.refs.scrollup) {
                    this.refs.scrollup.handleScroll();
                    var success = false;
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn();
                        if (success) {
                            clearInterval(readyStateCheckInterval);
                        }
                    }, 25);
                }
                if (e.which == 40 && this.refs.scrolldown) {
                    this.refs.scrolldown.handleScroll();
                    // may need a limit on this
                    var limit = 40;
                    var success = false;
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn();
                        limit--;
                        if (success || limit < 0) {
                            clearInterval(readyStateCheckInterval);
                        }
                    }, 25);
                }
            }
            
            return false
        }.bind(this));
        
        // enter focuses the selected puff
        Mousetrap.bind('enter', function(e) { 
            // don't refocus if there's nothing selected
            if (!this.props.view.cursor)
                return false;
            
            // don't refocus if we're selecting the focused puff 
            if (this.props.view.cursor == this.props.view.query.focus)
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
        
        if(newCursor) {  // do this manually so auto-cursoring doesn't gum up history
            update_puffworldprops({'view.cursor': newCursor})
            updateUI()
        }
    }
};

var GridLayoutMixin = {
    getScreenCoords: function() {
        if(CONFIG.menuRight) {
            var margin = CONFIG.rightMargin
        } else {
            var margin = CONFIG.leftMargin
        }

        return { width:  window.innerWidth - margin
               , height: window.innerHeight - CONFIG.verticalPadding
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
        var arrows  = this.props.view.arrows
        return this.applySizes(1, 1, gridbox.add, {arrows: arrows})
    },
    applySizes: function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
        return function(className) {
            return function(puff) {
                return PB.extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx, puff), // THINK: puff gc ok?
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
            React.DOM.svg( {width:screencoords.width, height:screencoords.height, style:{position:'absolute', top:'0px', left:'0px'}}, 
                React.DOM.defs( {dangerouslySetInnerHTML:{__html: '<marker id="triangle" viewBox="0 0 20 20" refX="10" refY="10" fill="blue" markerUnits="strokeWidth" markerWidth="18" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 0 15 z" /><circle cx="15" cy="10" r="5" fill="white" /></marker>'}} ),
                arrows.map(function(arrow) {
                    return PuffArrow( {key:'arrow-' + arrow[0].puff.sig + '-' + arrow[1].puff.sig, arrow:arrow} )
                })
            )
        )        
    },
    standardGridify: function(puffs) {
        var puffBoxList = this.getPuffBoxList(puffs)
        return this.manualGridify(puffBoxList)
    },
    manualGridify: function(puffBoxList) {
        var arrowList = this.props.view.arrows ? this.makeArrowPairs(puffBoxList) : ''
        var viewprops = this.props.view
        
        var fancyWrapper = (function() {
            return function(puffplus) {     // this is getting really messy -- maybe just transfer props
                var className = puffplus.className
                var stats = puffplus
                var puff  = puffplus.puff
                var view  = viewprops
                return PuffFancyBox( {puff:puff, key:puff.sig, extraClassy:className, stats:stats, view:view, ref:puff.sig} )
            }
        })()
        
        
        return (
            React.DOM.div(null, 
                React.DOM.div( {id:"talltree"}, 
                    puffBoxList.map(fancyWrapper)
                ),

                arrowList
            )
        )
    }
};


// MAIN VIEWS
var PuffWorld = React.createClass({displayName: 'PuffWorld',
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        
        var view;
        var viewprops = this.props.view || {};

        if(this.props.menu.show) {
            CONFIG.rightMargin = 420;
        } else {
            CONFIG.rightMargin = 60;
        }

        /*
        if(CONFIG.menuRight) {
            if(this.props.menu.show) {
                CONFIG.leftMargin = 460;
            } else {
                CONFIG.leftMargin = 60;
            }
        } else {
            if(this.props.menu.show) {
                CONFIG.leftMargin = 460;
            } else {
                CONFIG.leftMargin = 60;
            }
        }
        */



        if( viewprops.mode == 'focus' )
            view  = PuffTallTree(    {view:viewprops, reply:this.props.reply} )

        // else if( viewprops.mode == 'list' && viewprops.query.descendants )
        //     view  = <PuffAllChildren  view={viewprops} reply={this.props.reply} puff={viewprops.query.focus} />

        // else if( viewprops.mode == 'list' && viewprops.query.ancestors )
        //     view  = <PuffAllParents  view={viewprops} reply={this.props.reply} puff={viewprops.query.focus} />

        else if( viewprops.mode == 'list' )
            view  = PuffList(        {view:viewprops, reply:this.props.reply} )

        else if( viewprops.mode == 'PuffPacker' )
            view  = PuffPacker(      {tools:this.props.tools} )

        else {  // no mode? smash cut to default puff.
            var defaultPuffSig = polyglot.t("puff.default") || CONFIG.defaultPuff;
            events.pub('ui/mode/default', { 'view': puffworlddefaults.view
                                          , 'view.mode': 'focus'
                                          , 'view.query.focus': defaultPuffSig })
            return React.DOM.div(null);
        }
        
        
        // TODO: Focus the reply box when arrow clicked
        var replyExpand = this.props.reply.expand ? PuffPublishFormExpand( {reply:this.props.reply} ) : ''

        var menu = this.props.menu.show 
                 ? React.DOM.div(null, Menu( {prefs:this.props.prefs, profile:this.props.profile, view:this.props.view} )) 
                 : '';

        var animateClass = this.props.view.animation ? "animation" : '';

        return (
            React.DOM.div( {className:animateClass}, 
                Slider(null ),
                PuffHeader( {menu:this.props.menu} ),
                menu,
                view,
                replyExpand,
                PuffFooter(null )
            )
        )
    }
});

// var PuffAllChildren = React.createClass({
//     mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
//     render: function() {
//         var puffs = PuffForum.getChildren(this.props.puff, this.props); // pre-sorted
//         this.cursorPower(puffs)
//         return this.standardGridify(puffs);
//     }
// });

// var PuffAllParents = React.createClass({
//     mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin],
//     render: function() {
//         var puffs = PuffForum.getParents(this.props.puff, this.props); // pre-sorted
//         this.cursorPower(puffs)
//         return this.standardGridify(puffs);
//     }
// });



var PuffList = React.createClass({displayName: 'PuffList',
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],
    shouldComponentUpdate: function(nextProps, nextState) {
        // TODO: todo this
        return true
        return JSON.stringify(puffworldprops) !== JSON.stringify(globalSillyPropsClone)
        return JSON.stringify(nextProps) !== JSON.stringify(this.props) // THINK: why aren't the pointers the same?
        return nextProps !== this.props // TODO: this won't update when new items arrive
    },
    render: function() {
        globalSillyPropsClone = PB.shallow_copy(puffworldprops)
        
        var dimensions = this.getDimensions();
        var limit = dimensions.cols * dimensions.rows;
        
        var query   = this.props.view.query
        var filters = this.props.view.filters
        var puffs   = PuffForum.getPuffList(query, filters, limit);
        
        this.cursorPower(puffs)

        var showScrollUp = this.props.view.mode == 'list' && this.props.view.query.offset != 0;
        var showScrollDown = this.props.view.mode == 'list' && puffs.length == limit;
        return (
            React.DOM.div(null, 
                this.standardGridify(puffs),
                PuffScroller( {ref:"scrollup", position:"up", view:this.props.view, show:showScrollUp} ),
                PuffScroller( {ref:"scrolldown", position:"down", view:this.props.view, show:showScrollDown} )
            )
        );
    }
});


var PuffTallTree = React.createClass({displayName: 'PuffTallTree',
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],
    render: function() {

        var sig    = this.props.view.query.focus
        var puff   = PuffForum.getPuffBySig(sig)

        if(!puff) return React.DOM.div(null)
        
        var arrows = this.props.view.arrows
        var sigfun = function(item) {return item.sig}
        var username = PuffWardrobe.getCurrentUsername()
        
        var filters = this.props.view.filters
        var query = this.props.view.query
        var queryfilter = PB.extend({}, query, filters)

        // gridCoord params
        var screencoords = this.getScreenCoords()
        var dimensions   = this.getDimensions()
        var cols    = dimensions.cols
        var rows    = dimensions.rows
        var gridbox = this.getGridBox(rows, cols)
        
        var standardBox  = this.applySizes(1, 1, gridbox.add, {arrows: arrows})
        var secondRowBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, 1)
        var fourthRowBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, 3)
        var stuckBigBox  = this.applySizes(cols > 1 ? 2 : 1, rows > 1 ? 2 : 1, gridbox.add, {arrows: arrows}, 1, 0, 1, 0)
        
        // gather puffs
        var parentPuffs   = PuffForum.getParents(puff) // pre-sorted

        var grandPuffs    = parentPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
        var greatPuffs    =  grandPuffs.reduce(function(acc, puff) {return acc.concat(PuffForum.getParents(puff))}, [])
  
            parentPuffs   = parentPuffs.concat(grandPuffs, greatPuffs)
                                       .filter(function(item, index, array) {return array.indexOf(item) == index}) 
                                       .filter(PuffForum.filterByFilters(queryfilter))
                                       .slice(0, cols)
                                       
        var siblingPuffs  = PuffForum.getSiblings(puff) // pre-sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun)).indexOf(item.sig)})
                                     .filter(PuffForum.filterByFilters(queryfilter))
                                     .slice(0, cols > 1 ? (cols-2)*2 : 0)
                                     
        var childrenPuffs = PuffForum.getChildren(puff) // pre-sorted
                                     .filter(function(item) {
                                         return !~[puff.sig].concat(parentPuffs.map(sigfun), siblingPuffs.map(sigfun))
                                                            .indexOf(item.sig)})
                                     .filter(PuffForum.filterByFilters(queryfilter))
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


var PuffArrow =  React.createClass({displayName: 'PuffArrow',
    render: function() {
        var arrow = this.props.arrow
        
        var p = arrow[0]
        var c = arrow[1]
        
        var offset = 30
        var xoffset = CONFIG.leftMargin
        // Move over if menu open
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
                    x2 += ((c.height / 2) - offset / 2) / lineSlope
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
        return Arrow( {x1:x1, y1:y1, x2:x2, y2:y2, stroke:stroke, fill:stroke} )
    }
})

var Arrow = React.createClass({displayName: 'Arrow',
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {
        
        // dangerouslySetInnerHTML={{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}}

        // save this!
        // <path d={'M ' + this.props.x1 + ' ' + this.props.y1 + ' Q ' + (this.props.x2  + (this.props.x2 - this.props.x1)/2 - 10) + ' ' + (this.props.y2 + (this.props.y2 - this.props.y1)/2 - 20) + ' ' + this.props.x2 + ' ' + this.props.y2} fillOpacity="0" stroke={this.props.stroke} strokeWidth="2" />

        //

        var result = (
            React.DOM.line( {x1:this.props.x1, y1:this.props.y1, x2:this.props.x2, y2:this.props.y2, stroke:this.props.stroke, strokeWidth:"2", fill:this.props.fill} )

        )
        
        return result
    }
})
 


var PuffHeader = React.createClass({displayName: 'PuffHeader',
    handleClick: function() {
        if(puffworldprops.menu.show)
            return events.pub('ui/menu/close', {'menu.show': false})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.img( {onClick:this.handleClick, src:"img/puffballIconAnimated.gif", id:"puffballIcon", height:"48", width:"41", className:this.props.menu.show ? 'menuOn' : ''} )
            )
        );
    }
});

var PuffFooter = React.createClass({displayName: 'PuffFooter',
    render: function() {
        var width = (window.innerHeight-66)+'px';
        var polyglot = Translate.language[puffworldprops.view.language];
        // TODO: Is this a very bad idea?

        return (
            React.DOM.div( {className:"footerWrapper"}, 
            React.DOM.div( {className:"footer", style:{maxWidth: width, right: 0}}, 
                React.DOM.div( {className:"footerText"}, 
                polyglot.t("footer.powered"), " ", React.DOM.a( {href:"http://www.puffball.io", className:"footerText"}, "puffball"),".",
                polyglot.t("footer.rest")
                )
            )
            )
        );
    }
});

var Logo = React.createClass({displayName: 'Logo',
    render: function() {
        return (
            React.DOM.img( {src:CONFIG.logo, alt:"Logo", className:"logo"} )
            )
    }
});


var PuffScroller = React.createClass({displayName: 'PuffScroller',
    mixins: [GridLayoutMixin],
    handleScroll: function() {
        if (!this.props.show) return false;

        var col   = this.getDimensions().cols;
        var offset = parseInt(this.props.view.query.offset) || 0;
        offset = this.props.position == "up" ? offset - col : offset + col;
        offset = Math.max(offset, 0);
        return events.pub("ui/scroll/down", {'view.query.offset': offset});
    },
    render: function() {
        if (!this.props.show) {
            return (React.DOM.span(null))
        }

        var left = CONFIG.leftMargin;

        var col   = this.getDimensions().cols;
        var screencoords = this.getScreenCoords();
        var boxHeight = screencoords.height / this.getDimensions().rows;
        var w = col * this.props.view.boxRatio* boxHeight;
        if(w > screencoords.width) {
            w = screencoords.width;
        }

        var style = {left: left, width: w};
        var className = "scroller gray " + this.props.position;
        var iconClass = "fa fa-fw fa-chevron-"+this.props.position;
        return (
            React.DOM.div( {className:className, style:style}, 
                React.DOM.a( {href:"#", onClick:this.handleScroll}, 
                    React.DOM.i( {className:iconClass}),React.DOM.br(null),
                    React.DOM.i( {className:iconClass}),React.DOM.br(null),
                    React.DOM.i( {className:iconClass}),React.DOM.br(null)
                )
            )
        )
    }
});