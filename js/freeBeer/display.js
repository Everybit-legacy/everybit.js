/** @jsx React.DOM */

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;


// MAIN VIEWS
var PuffWorld = React.createClass({displayName: 'PuffWorld',
    render: function() {

        var view;
        var viewprops = this.props.view || {};

        if( viewprops.style == 'PuffTallTree' )
            view  = PuffTallTree(    {view:viewprops, reply:this.props.reply} )

        else if( viewprops.style == 'PuffAllChildren' )
            view  = PuffAllChildren( {view:viewprops, reply:this.props.reply, puff:viewprops.puff} )

        else if( viewprops.style == 'PuffAllParents' )
            view  = PuffAllParents( {view:viewprops, reply:this.props.reply, puff:viewprops.puff} )

        else if( viewprops.style == 'PuffByUser' )
            view  = PuffByUser( {view:viewprops, reply:this.props.reply, user:viewprops.user} )

        else if( viewprops.style == 'PuffPacker' )
            view  = PuffPacker( {tools:this.props.tools} )

        else view = PuffRoots(       {view:viewprops, reply:this.props.reply} )

        var reply = this.props.reply.show ? PuffReplyForm( {reply:this.props.reply} ) : ''

        var menu = this.props.menu.show ? React.DOM.div(null, PuffMenu( {menu:this.props.menu, prefs:this.props.prefs, profile:this.props.profile} ), " ", Menu( {prefs:this.props.prefs, profile:this.props.profile} )) : ''

        return (
            React.DOM.div(null, 
                PuffHeader( {menu:this.props.menu} ),
                menu,
                view,
                reply,
                PuffFooter(null )
            )
            )
    }
});



var PuffToolsPuffDisplay = React.createClass({displayName: 'PuffToolsPuffDisplay',
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
                React.DOM.textarea( {ref:"puffString", name:"puffString", id:"puffString", cols:"50", value:puffString, onChange:this.handleChange} )
            )
        }

        // for raw or formatted styles:
        var puffString = formatForDisplay(this.props.puff, this.props.style);

        return (
            React.DOM.textarea( {ref:"puffString", name:"puffString", rows:"5", cols:"50", value:puffString})
            )
    }
});

var PuffRoots = React.createClass({displayName: 'PuffRoots',
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
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )
    }
});

var PuffAllChildren = React.createClass({displayName: 'PuffAllChildren',
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
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )
    }
});

var PuffAllParents = React.createClass({displayName: 'PuffAllParents',
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
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )
    }
});

var PuffByUser = React.createClass({displayName: 'PuffByUser',
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
            React.DOM.div( {id:"talltree"}, 
                puffBoxList
            )
        )
    }
});


var PuffTallTree = React.createClass({displayName: 'PuffTallTree',
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
        
        */
        
        // debugger;
        
        
        var puffBoxList = allPuffs.map(globalCreateFancyPuffBox)
        
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
                React.DOM.svg( {width:screenwidth, height:screenheight, style:{position:'absolute', top:'0px', left:'0px'}}, 
                    React.DOM.defs( {dangerouslySetInnerHTML:{__html: '<marker id="triangle" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="12" markerHeight="9" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>'}} ),
                    arrows.map(function(arrow) {
                        return PuffArrow( {key:'arrow-' + arrow[0].puff.sig + '-' + arrow[1].puff.sig, arrow:arrow} )
                    })
                )
            )
        }
        
        return (
            React.DOM.div(null, 
                React.DOM.div( {id:"talltree"}, 
                    puffBoxList
                ),
                
                arrowList
            )
        );
    }
})


var PuffArrow =  React.createClass({displayName: 'PuffArrow',
    render: function() {
        var arrow = this.props.arrow
        var offset = 30
        var xoffset = 75
        var yoffset = 0
        var baseShift = 12
        var x1 = arrow[0].x + xoffset + arrow[0].width/2 - offset/2
        var y1 = arrow[0].y + yoffset + arrow[0].height - offset/2
        var x2 = arrow[1].x + xoffset + arrow[1].width/2 + offset/2
        var y2 = arrow[1].y + yoffset + offset/2

        var stroke = CONFIG.arrowColors[Math.floor(Math.random() * CONFIG.arrowColors.length)]

        // var stroke = '#88888';
        if(x1 > x2) {
            x1 -= baseShift;
            x2 += baseShift*2;
        } else {
            x1 += baseShift;
            x2 -= baseShift*2;
        }

        console.log(x1, x2, y1, y2, arrow[0].className, arrow[1].className)

        if(y1 > y2) {
            // set y coords to halfway down box
            y1 = arrow[0].y + arrow[0].height/2
            y2 = arrow[1].y + arrow[1].height/2

            // set x coords to right or left side
            if(arrow[0].x < arrow[1].x) {
                x1 = arrow[0].x + arrow[0].width + xoffset/2
                x2 = arrow[1].x + xoffset
            }
            else if (arrow[0].x == arrow[1].x) {
                x1 = arrow[0].x + arrow[0].width/2 + xoffset + offset/2
                x2 = arrow[1].x + arrow[1].width/2 + xoffset + offset/2
                y1 = arrow[0].y + offset/2
                y2 = arrow[1].y + arrow[1].height - offset/2
                console.log('hi', x1, x2, y1, y2)
            }
            else {
                x1 = arrow[0].x + xoffset
                x2 = arrow[1].x + arrow[1].width + xoffset/2 + xoffset/4 // sigh
            }

            // Flip arrow


            // Should it attach to left or right?

            // Attach to box

        }
        
        return Arrow( {x1:x1, y1:y1, x2:x2, y2:y2, stroke:stroke} )
    }
})

var Arrow = React.createClass({displayName: 'Arrow',
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {
        
        // dangerouslySetInnerHTML={{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}}
        
        var result = (
            React.DOM.line( {x1:this.props.x1, y1:this.props.y1, x2:this.props.x2, y2:this.props.y2, stroke:this.props.stroke, strokeWidth:"2"}
                
            )
        )
        
        return result
    }
})
 


var PuffHeader = React.createClass({displayName: 'PuffHeader',
    handleClick: function() {
        if(this.props.menu.show)
            return events.pub('ui/menu/close', {'menu': puffworlddefaults.menu})
        else
            return events.pub('ui/menu/open', {'menu.show': true})
    },
    render: function() {
        return (
            React.DOM.div(null, 
                React.DOM.img( {onClick:this.handleClick, src:"img/puffballIconBigger.png", id:"puffballIcon", height:"48", width:"41", className:this.props.menu.show ? 'menuOn' : ''} )
            )
            );
    }
});

var PuffFooter = React.createClass({displayName: 'PuffFooter',
    render: function() {
        return (
            React.DOM.div( {className:"footer"}, 
                React.DOM.div( {className:"footerText"}, 
                "Powered by ", React.DOM.a( {href:"http://www.puffball.io", className:"footerText"}, "puffball"),"."+' '+
                "Responsibility for all content lies with the publishing author and not this website."
                )
            )
            );
    }
});
