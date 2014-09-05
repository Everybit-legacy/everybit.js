/** @jsx React.DOM */

// TODO: Add hover effect for buttons
// TODO: Make whole button clickable
// TODO: Do text size based on overall area as well as logo size

var ICXWorld = React.createClass({
    // Get dimensions
    // Render compoents
    componentDidMount: function() {
        // Take them to where they need to go
        thisScreen = ICX.screens.filter(function( obj ) {
            return obj.name == puffworldprops.view.icx.screen;
        });

        xOffset = thisScreen[0].left;
        window.scrollTo(xOffset,0);

    },

    componentDidUpdate: function() {
        // Take them to where they need to go
        thisScreen = ICX.screens.filter(function( obj ) {
            return obj.name == puffworldprops.view.icx.screen;
        });

        xOffset = thisScreen[0].left;
        window.scrollTo(xOffset,0);

    },


    render: function () {

        var w = window.innerWidth
        var h = window.innerHeight
        var p = w*h


        var env = {w: w, h: h}

        // TODO put in config for this module
        ICX.config = {
            rightBorder: {
                min: 2,
                max: 100,
                ratio:.06
            },
            logo: {
                originalW: 643,
                originalH: 279,
                areaRatio:.02,
                minW: 32,
                maxW: 1000,
                insets: {
                    top:.08
                }
            },
            text: {
                areaRatio: 0.001,
                default: 14,
                min: 5,
                max: 100
            },
            content: {
                insets: {
                    top:.1,
                    right:.25,
                    left:.1,
                    bottom:.1
                }
            },
            minBorder: 1,
            maxBorder: 100,
            borderRatio:.03,
            logoBigRatio:.2,
            logoYFromTop:.05,
            logoSmallRatio:.1,
            buttonHeightRatio:.1,
            buttonWidthRatio:.6,
            buttonSmallWidthRatio:.15,
            buttonFontHeightRatio:.03,
            mainPageFontHeightRatio:.03,
            contentLeftInset: .02,
            contentRightInset: 0.15,
            contentBottomInset:.04
        }

        var l = ICX.config.logo.originalW*ICX.config.logo.originalH
        var logoAdjustRatio = Math.sqrt(p*ICX.config.logo.areaRatio/l)

        ICX.calculated = {

            rightBorder: keepNumberBetween(w*ICX.config.rightBorder.ratio, ICX.config.rightBorder.min, ICX.config.rightBorder.max),

            logoW: keepNumberBetween(ICX.config.logo.originalW*logoAdjustRatio, ICX.config.logo.minW, ICX.config.logo.maxW),

            fontSizeMultiplier: Math.sqrt(p*ICX.config.text.areaRatio)

        }

        ICX.screens = [
            {order: 0, name: 'home',  left: 0*w, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page'},
            {order: 1, name: 'send',  left: 1*w, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'SEND a private message or file'},
            {order: 2, name: 'store', left: 2*w, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately'},
            {order: 3, name: 'login', left: 3*w, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-sign-in', fullText: 'LOG IN to view your files or messages'},
            {order: 4, name: 'how',   left: 4*w, color: 'rgba(49,  68,  92, .8)', icon: 'fa fa-fw fa-file-text-o', fullText: 'HOW it works'},
            {order: 5, name: 'learn', left: 5*w, color: 'rgba(85,  65,  94, .8)', icon: 'fa fa-fw fa-info-circle', fullText: 'LEARN more about i.cx'}
        ]


        var mainPages = ICX.screens.map(function(data) {

            borderWidth = Math.floor(ICX.calculated.rightBorder)+'px';

            var screenStyles = {
                position: "absolute",
                width: w,
                height: h,
                top:0,
                left: data.left,
                borderRightWidth: borderWidth,
                borderRightColor: data.color,
                borderRightStyle: 'solid'
            }

            // TODO make this a component, that contains all others
            return <ICXFrame key={'frame'+data.name} styleInfo={screenStyles} screenInfo={data} env={env} />

        });

        return (
            <span>
                {mainPages}
            </span>
        );
    }
});

var ICXFrame = React.createClass({
    // Set color based on props
    render: function() {
        return (
              <div style={this.props.styleInfo}>
                <ICXPage screenInfo={this.props.screenInfo} env={this.props.env} />
              </div>
            )
    }
});

var ICXPage = React.createClass({

    render: function () {
        var content
        switch(this.props.screenInfo.name) {
            case "home":
                content = 'HOME PAGE'
                break;
            default:
                content = 'NOT HOME PAGE'
        }
        return <div><ICXLogo screenInfo={this.props.screenInfo} env={this.props.env}/><ICXLinks screenInfo={this.props.screenInfo} key={'buttons'+this.props.screenInfo.name} /><ICXContentSwitch screenInfo={this.props.screenInfo} /><ICXFooter /></div>
    }
});

var ICXLogo = React.createClass({

    handleGoHome: function() {
        Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'})
    },

    handleGoHow: function() {
        Events.pub('/ui/icx/screen', {"view.icx.screen": 'how'})
    },

    // TODO clean up redefining w and h everywhere
    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight


        if(this.props.screenInfo.name == 'home') {


            var logoW = ICX.calculated.logoW

            var logoX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.rightBorder-logoW ),0,10000) + "px"
            var logoY = Math.floor( h*ICX.config.logo.insets.top ) + "px"
            logoW = Math.floor(logoW) + 'px';

            var fontH = keepNumberBetween( Math.floor( ICX.calculated.fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)  + 'px'



            // return <img src="img/icx/icxLogo.png" style={{position: 'absolute', top: logoY, left: logoX, width: logoW}} alt={this.props.screenInfo.name} />
            return (
                <div key="mainLogo" style={{width: '100%'}}>
                    <div><img src="img/icx/icxLogo.png" style={{position: 'relative', marginTop: logoY, left: logoX, width: logoW, display: 'block'}} alt={this.props.screenInfo.name} /></div><br />
                    <div style={{width: '60%', fontFamily: 'Minion pro, Times, "Times New Roman", serif', fontSize: fontH, left: logoX, position: 'absolute'}}>The world’s first <a href="#" onClick={this.handleGoHow}><i>100% secure</i></a>, open source messaging system that works right in your web browser.
                    </div>
                </div>
            )
        } else {
            var logoW = w*ICX.config.logoSmallRatio
            var logoY = Math.floor( h*ICX.config.logoYFromTop ) + "px"
            logoW = logoW + "px"
            var divW = w*ICX.config.buttonSmallWidthRatio

            return (
                <div style={{position: 'absolute', top: logoY, width: divW, right: 0, textAlign: 'center'}}>
                    <a href="#" onClick={this.handleGoHome}>
                            <img src="img/icx/icxLogo.png" style={{width: logoW}} alt={this.props.screenInfo.name} />
                    </a>
                </div>
                )
        }
    }


});

var ICXLinks = React.createClass({
    handleGoTo: function(screen) {
        Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },


    render: function () {


        var w = window.innerWidth
        var h = window.innerHeight


        var self = this
        var buttonLinks = ICX.screens.map(function(data) {

            var fontSize = Math.floor( h*ICX.config.buttonFontHeightRatio );

            var buttonStyle = {
                backgroundColor: data.color,
                height: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
                position: 'absolute',
                right: 0,
                fontSize:  fontSize + 'px',
                top: Math.floor( (h*.3) + data.order*Math.floor( ICX.config.buttonHeightRatio*h )) + 'px',
                lineHeight: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
                color: 'white',
                paddingLeft: Math.floor(fontSize/2.5)+'px'
            }

            if(self.props.screenInfo.name == 'home') {
                buttonStyle.width = Math.floor( w*ICX.config.buttonWidthRatio ) + 'px'
            } else {
                buttonStyle.width = Math.floor( w*ICX.config.buttonSmallWidthRatio ) + 'px'
            }


            if(data.name == 'home') {
                return <span></span>
            } else {
                return <ICXButtonLink key={self.props.screenInfo + '_' + data.name} styleInfo={buttonStyle} screenInfo={data} />
            }

        });

        return <span>{buttonLinks}</span>

    }
});

var ICXButtonLink = React.createClass({
    handleGoTo: function(screen) {
        Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },


    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight

        var styleToUse = this.props.styleInfo

        if(puffworldprops.view.icx.screen == 'home') {
            var linkText = this.props.screenInfo.fullText
        } else {
            var linkText = this.props.screenInfo.name.toUpperCase()
        }

        return (
            <div style={styleToUse}>
                <a href="#"  onClick={this.handleGoTo.bind(self, this.props.screenInfo.name)} style={{color: '#ffffff'}}>
                <i className={this.props.screenInfo.icon}></i>{' '}
                    {linkText} <i className="fa fa-chevron-right" />
                </a>
            </div>
            )
    }


});

var ICXContentSwitch = React.createClass({


    // TODO: Position div for this right in here, then wrap return in a div with these specs


    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight

        var contentDivStyles = {
            position: "absolute",
            left: Math.floor( w*ICX.config.content.insets.left ) + "px",
            width: Math.floor( (1-(ICX.config.content.insets.left+ICX.config.content.insets.right))*w ) + 'px',
            height: Math.floor( (1-(ICX.config.content.insets.top+ICX.config.content.insets.bottom))*h ) + 'px',
            top: Math.floor( (ICX.config.content.insets.top)*h ) + 'px',
            borderWidth: 1,
            borderColor: 'red',
            borderStyle: 'solid',
            backgroundColor: 'rgba(23,56,45,.1)'
        }



        switch (this.props.screenInfo.name) {
            case 'home':
                return <div><ICXHomeContent /></div>
                break;

            case 'send':
                return <div style={contentDivStyles}><ICXSendContent /></div>
                break;

            case 'store':
                return <div style={contentDivStyles}><ICXStoreContent /></div>
                break;

            case 'login':
                return <div style={contentDivStyles}><ICXLoginContent /></div>
                break;

            case 'how':
                return <div style={contentDivStyles}><ICXHowContent /></div>
                break;

            case 'learn':
                return <div style={contentDivStyles}><ICXLearnContent /></div>
                break;

            default:
                return <span></span>

        }
    }


});


var ICXHomeContent = React.createClass({

    render: function () {
        return (
            <span></span>
            )
    }

});

var ICXSendContent = React.createClass({

    render: function () {
        var fontH = keepNumberBetween( Math.floor( 1.5*ICX.calculated.fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)  + 'px'

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={{fontSize: fontH, fontFamily: "GudeaBold"}}>
                    Send a private message or file
                </div>
            </div>
            )
    }

});

var ICXStoreContent = React.createClass({

    render: function () {
        return (
            <div style={{width: '100%', height: '100%'}}>
            STORE!
            </div>
            )
    }

});

var ICXLoginContent = React.createClass({

    render: function () {
        return (
            <div style={{width: '100%', height: '100%'}}>
            LOGIN!
            </div>
            )
    }

});



var ICXHowContent = React.createClass({

    render: function () {
        return (
            <div style={{width: '100%', height: '100%'}}>
            HOW!
            </div>
            )
    }

});


var ICXLearnContent = React.createClass({

    render: function () {
        return (
            <div style={{width: '100%', height: '100%'}}>
            LEARN!
            </div>
            )
    }

});





var ICXFooter = React.createClass({


    render: function () {
        var w = window.innerWidth

        // Same as logoX
        var footerX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.rightBorder-ICX.calculated.logoW ),0,10000) + "px"

        return (
            <div style={{position: 'absolute', bottom: '10px', left: footerX }}>
                <img className="puffballIconFooter" src="img/blueAnimated.gif" />
                Powered by <a href="http://www.puffball.io" target="_new">puffball</a>.
            </div>
        )
    }


});














var PuffBarShortcutMixin = {
    // call methods from PuffBar of cursor puff directly for shortcuts
    componentDidMount: function() {
        // shift+f bomb the cursor puff
        Mousetrap.bind(['shift+f'], function(){
            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            if (bar.refs.flag)
                bar.refs.flag.handleFlagRequest()
        }.bind(this))

        // shift+i toggle the infobar for the cursored puff only
        Mousetrap.bind(['shift+i'], function(){
            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            var author = this.refs[cursor].refs['author']
            var className = ' ' + bar.getDOMNode().className + ' '
            if (className.indexOf(' hidden ') == -1) {
                bar.getDOMNode().className += ' hidden'
                author.getDOMNode().className += ' hidden'
            } else {
                bar.getDOMNode().className = className.replace(' hidden ', '')
                var authorClassName = ' ' + author.getDOMNode().className + ' '
                author.getDOMNode().className = authorClassName.replace(' hidden ', '')
            }
        }.bind(this))

        // r replies to the cursored puff
        Mousetrap.bind('r', function() {
            // if (puffworldprops.reply.preview) return false
            
            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            if (bar.refs.reply) {
                bar.refs.reply.handleClick()
            }
            return false
        }.bind(this))
    }
}

var ViewKeybindingsMixin = {
    componentDidMount: function() {
        
        // n shows new puff form
        Mousetrap.bind('n', function() { 
            // if (puffworldprops.reply.preview) return false
            
            var menu = Boron.shallow_copy(puffworlddefaults.menu)
            menu.show = true
            menu.section = 'publish'

            return Events.pub('ui/reply/open', { 'clusters.publish': true
                                               , 'menu': menu
                                                })
        }.bind(this))

        // a toggles animation
        Mousetrap.bind('a', function() {
            return Events.pub( 'ui/animation/toggle',
                             { 'view.animation': !this.props.view.animation })
        }.bind(this))
        
        // i toggles info boxes
        Mousetrap.bind('i', function() { 
            return Events.pub( 'ui/view/showinfo/toggle', 
                             { 'view.showinfo': !this.props.view.showinfo })
        }.bind(this))

        // m toggles menu show
        Mousetrap.bind('m', function() {
            return Events.pub('ui/menu/toggle', 
                              {'menu.show': !puffworldprops.menu.show})
        }.bind(this))

        // k go to keyboard shortcut
        Mousetrap.bind('k', function() {
            var polyglot = Translate.language[puffworldprops.view.language]
            Events.pub('ui/view/rows/1', {'view.rows': 1})
            showPuff(polyglot.t("puff.shortcut"))
            return false
        }.bind(this))
        

        // l shows latest puffs
        Mousetrap.bind('l', function() {
            if(puffworldprops.view.rows < 2)
                var showRows = puffworlddefaults.view.rows
            else
                var showRows = puffworldprops.view.rows

            return Events.pub('ui/show/latest', { 'view.mode': 'list'
                                                , 'view.rows': showRows
                                                , 'view.filters': {}
                                                , 'view.query': puffworlddefaults.view.query
                                                , 'menu': puffworlddefaults.menu})
        }.bind(this))

        // 1-9 controls number of rows
        Mousetrap.bind(['1','2','3','4','5','6','7','8','9'], function(e) { 
            return Events.pub('ui/view/rows/set', {'view.rows': 1*String.fromCharCode(e.which)})
        }.bind(this))

        // Go with wide aspect ratio
        Mousetrap.bind('w', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1.618})
        }.bind(this))

        // Go with tall aspect ratio
        Mousetrap.bind('t', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 0.618})
        }.bind(this))

        // Go square
        Mousetrap.bind('s', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1})
        }.bind(this))
        
        // spacebar toggles arrow display
        Mousetrap.bind('space', function(e) { 
            return Events.pub( 'ui/relationships/toggle', 
                             { 'view.arrows': !this.props.view.arrows })
        }.bind(this))
        
        // escape closes expand, else closes menu, else set cursor back to default (topleft for list mode, or focused puff for focus mode)
            //// NOT removes cursor, else pops up 'nothing to close' alert since we are setting the cursor to a default position when it is false
        Mousetrap.bind('esc', function(e) {
            if(puffworldprops.menu.popout) {
                var section = puffworldprops.menu.popout
                return Events.pub('ui/close-popout', {'menu.popout': false,
                                                      'menu.show': true,
                                                      'menu.section': section})

            }

            if(puffworldprops.slider.show)
                return Events.pub('ui/slider/close', {'slider.show': false})

            if(puffworldprops.menu.show)
                return Events.pub('ui/menu/close', {'menu.show': false})

            /*if(puffworldprops.reply.expand)
                return Events.pub('ui/expand/close', {'reply': {expand: false, parents: []}})*/

            if(puffworldprops.view.cursor) {
                var cursor = document.getElementById(puffworldprops.view.cursor)
                cursor.className = cursor.className.replace(' cursor', '')
                return Events.pub('ui/menu/close', {'view.cursor': false})
            }

            // alert("I'm afraid there's nothing left to close!")
        }.bind(this))
        
        // cmd-enter submits the reply box
        Mousetrap.bind(['command+enter','ctrl+enter'], function(e) {
            if(!(puffworldprops.menu.popout == 'publish' || 
                (puffworldprops.menu.show && puffworldprops.menu.section == 'publish'))) {
                return true
            }
            
            if(typeof globalReplyFormSubmitArg == 'function')
                globalReplyFormSubmitArg()
        }.bind(this))
        
        
        // we have to customize stopCallback to make cmd-enter work inside reply boxes
        Mousetrap.stopCallback = function(e, element, combo) {

            // if the element has the class "mousetrap" AND the combo is command+enter or esc, then no need to stop
            if(~['command+enter', 'esc','ctrl+enter'].indexOf(combo) && (' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
                return false
            }

            // stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true')
        }
    },
    componentWillUnmount: function() {
        Mousetrap.reset()
    }
}

var CursorBindingsMixin = {
    gotoNext: function(current, dir) {
        var next = Gridbox.findNeighbor(globalGridBox.get(), PB.M.Forum.getPuffBySig(current), dir)
        if (next) {
            Events.pub('ui/view/cursor/set', {'view.cursor': next.sig})
            return true
        }
        return false
    },
    componentDidMount: function() {
        
        var arrowToDir = { 37: 'left'
                         , 38: 'up'
                         , 39: 'right'
                         , 40: 'down' }
        
        // arrows move the selection cursor
        // THINK: wasd?
        Mousetrap.bind(['left', 'up', 'right', 'down'], function(e) { 
            var current = this.props.view.cursor
            var dir = arrowToDir[e.which]
            
            if (!current)                              // default cursors handled elsewhere (there should always 
                return false                           // be an active cursor, if we are in a cursorable mode)
            
            var nextFn = this.gotoNext.bind(this, current, dir)
            var success = nextFn()
            if (!success){
                if (e.which == 38 && this.refs.scrollup) {
                    this.refs.scrollup.handleScroll()
                    var success = false
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn()
                        if (success) {
                            clearInterval(readyStateCheckInterval)
                        }
                    }, 25)
                }
                if (e.which == 40 && this.refs.scrolldown) {
                    this.refs.scrolldown.handleScroll()
                    // may need a limit on this
                    var limit = 40
                    var success = false
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn()
                        limit--
                        if (success || limit < 0) {
                            clearInterval(readyStateCheckInterval)
                        }
                    }, 25)
                }
            }
            
            return false
        }.bind(this))
        
        // enter focuses the selected puff
        Mousetrap.bind('enter', function(e) { 
            // don't refocus if there's nothing selected
            if (!this.props.view.cursor)
                return false
            
            // don't refocus if we're selecting the focused puff 
            if (this.props.view.cursor == this.props.view.query.focus)
                return false
            
            showPuff(this.props.view.cursor)
            return false
        }.bind(this))


    },
    componentWillUnmount: function() {
        Mousetrap.reset()
    },
    cursorPower: function(puffs, defaultPuff) {
        // set the cursor to default when cursor puff is outside the view or cursor is set to false
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
}

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
        var screencoords = this.getScreenCoords()
        var boxHeight = (screencoords.height / rows)


        var boxWidth = this.props.view.boxRatio * boxHeight
        // Make sure this is not too big for page!
        if (boxWidth > screencoords.width) {
            boxWidth = screencoords.width
        }

        var nCol = Math.floor(screencoords.width/boxWidth)

        return nCol

    },
    getGridBox: function(rows) {
        var screencoords = this.getScreenCoords()
        var boxHeight = screencoords.height / rows

        // How many cols fit in this page
        var nCol = this.getCols(rows)
        var w = nCol * this.props.view.boxRatio* boxHeight
        if(w > screencoords.width) {
            w = screencoords.width
        }
        
        var myGridbox = Gridbox.getGridCoordBox(rows, nCol, w, screencoords.height)

        // this.setState({gridBox: myGridbox}) // ugh state but whaddyagonnado
        globalGridBox = myGridbox // ugh globals but whaddyagonnado
        return myGridbox
    },
    getStandardBox: function(rows, cols) {
        var gridbox = this.getGridBox(rows)
        var arrows  = this.props.view.arrows
        return this.applySizes(1, 1, gridbox.add, {arrows: arrows})
    },
    applySizes: function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
        return function(className) {
            return function(puff) {
                return Boron.extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx, puff), // THINK: puff gc ok?
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
            <svg width={screencoords.width} height={screencoords.height} style={{position:'absolute', top:'0px', left:CONFIG.leftMargin}}>
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
        var arrowList = this.props.view.arrows ? this.makeArrowPairs(puffBoxList) : ''
        var viewprops = this.props.view
        
        var fancyWrapper = (function() {
            return function(puffplus) {     // this is getting really messy -- maybe just transfer props
                var className = puffplus.className
                var stats = puffplus
                var puff  = puffplus.puff
                var view  = viewprops
                return <PuffFancyBox puff={puff} key={puff.sig} extraClassy={className} stats={stats} view={view} ref={puff.sig} />
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
}


// MAIN VIEWS
var PuffWorld = React.createClass({
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        
        var view
        var viewprops = this.props.view || {}

        if( viewprops.mode == 'focus' ) {
            view = <PuffTallTree view={viewprops} reply={this.props.reply} />
            document.body.style.overflowY = "hidden"
        }

        else if( viewprops.mode == 'list' ) {
            view = <PuffList view={viewprops} reply={this.props.reply} />
            document.body.style.overflowY = "hidden"
        }

        else { // ( viewprops.mode == 'tableView' ) {
            view = <TableView view={viewprops} table={this.props.view.table}/>
            document.body.style.overflowY = "auto"
        }
        
        var animateClass = this.props.view.animation ? "animation" : ''

        return (
            <div className={animateClass}>
                {view}
            </div>
        )
    }
})

var PuffList = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],
    /*
    shouldComponentUpdate: function(nextProps, nextState) {
        // TODO: todo this
        return true
        return JSON.stringify(puffworldprops) !== JSON.stringify(globalSillyPropsClone)
        return JSON.stringify(nextProps) !== JSON.stringify(this.props) // THINK: why aren't the pointers the same?
        return nextProps !== this.props // TODO: this won't update when new items arrive
    },
    */
    render: function() {
        // if(!PB.Data.stupidHorribleGlobalThing) return <div></div>
        
        globalSillyPropsClone = Boron.shallow_copy(puffworldprops)
        
        var dimensions = this.getDimensions()
        var limit = dimensions.cols * dimensions.rows
        
        var query   = this.props.view.query
        var filters = this.props.view.filters
        var puffs   = PB.M.Forum.getPuffList(query, filters, limit)
        
        this.cursorPower(puffs)

        var showScrollUp = this.props.view.mode == 'list' && this.props.view.query.offset
        var showScrollDown = this.props.view.mode == 'list' && puffs.length == limit
        return (
            <div>
                {this.standardGridify(puffs)}
                <PuffScroller ref="scrollup" position="up" view={this.props.view} show={showScrollUp} />
                <PuffScroller ref="scrolldown" position="down" view={this.props.view} show={showScrollDown} />
            </div>
        )
    }
})


var PuffTallTree = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],
    render: function() {

        var sig    = this.props.view.query.focus
        var puff   = PB.M.Forum.getPuffBySig(sig)

        if(!puff) return <div></div>
        
        // sundry miscellany
        var arrows = this.props.view.arrows
        var username = PB.M.Wardrobe.getCurrentUsername()
        var filters = this.props.view.filters
        var query = this.props.view.query
        var queryfilter = Boron.extend({}, query, filters)

        // gridCoord params
        var screencoords = this.getScreenCoords()
        var dimensions   = this.getDimensions()
        var cols    = dimensions.cols
        var rows    = dimensions.rows
        var gridbox = this.getGridBox(rows, cols)
        
        // big box
        var bigrows = +this.props.view.bigrows || 2
        var bigcols = +this.props.view.bigcols || 2

        if(bigrows < 0) bigrows = Math.max(rows + bigrows, 1)
        if(bigcols < 0) bigcols = Math.max(cols + bigcols, 1)

        if(rows < bigrows) bigrows = rows
        if(cols < bigcols) bigcols = cols
        
        // determine start row for big box, and totals for relatives
        // THINK: should we allow columnar offset also?
        var bigBoxStartRow = Math.floor((rows - bigrows) / 2)
        var childrenStartRow = bigBoxStartRow + bigrows
        var ancestorTotal = bigBoxStartRow * cols
        var childrenTotal = (rows - childrenStartRow) * cols
        var siblingTotal  = (cols - bigcols) * bigrows

        // box building
        // TODO: partial application
        var ancestorBox  = this.applySizes(1, 1, gridbox.add, {arrows: arrows})
        var siblingBox   = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow)
        var childrenBox  = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow)
        var stuckBigBox  = this.applySizes(bigcols, bigrows, gridbox.add, {arrows: arrows}, bigBoxStartRow, 0, bigBoxStartRow, 0)
  
        // filters
        var graphize    = function(f) { return function(x) { return x.shell&&f(x.shell) } } // TODO: pipe(prop('shell'), f)
        var propsfilter = graphize(PB.M.Forum.filterByFilters(queryfilter))
        var difffilter  = function(set) { return function(item) { return !~set.indexOf(item) } }


        ///// new focus mode stuff here /////
        
        // TODO: this can only currently handle 9 rows with a 2x2 bigbox: 3 ancestors and 4 descendants
        
        var ancestorRows = Math.min(3, bigBoxStartRow)
        var ancestorBoxes = []
        var parents = [], grandparents = [], greatgrandparents = []
        
        if(ancestorRows >= 1) {
            parents = PB.Data.graph.v(sig).out('parent')
                              .unique().filter(propsfilter).take(cols)
                              .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            parentBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-1, 0, bigBoxStartRow-1, cols)
            ancestorBoxes = ancestorBoxes.concat(parents.map(parentBox('parent')))
        }
        
        var notParent = graphize(difffilter([puff].concat(parents)))

        if(ancestorRows >= 2) {
            grandparents = PB.Data.graph.v(sig).out('parent').out('parent')
                                   .unique().filter(propsfilter).filter(notParent).take(cols)
                                   .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gpBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-2, 0, bigBoxStartRow-2, cols)
            ancestorBoxes = ancestorBoxes.concat(grandparents.map(gpBox('parent')))
        }
        
        var notGrandParent = graphize(difffilter([puff].concat(parents, grandparents)))

        if(ancestorRows >= 2) {
            greatgrandparents = PB.Data.graph.v(sig).out('parent').out('parent').out('parent')
                                   .unique().filter(propsfilter).filter(notGrandParent).take(cols)
                                   .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            ggpBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-3, 0, bigBoxStartRow-3, cols)
            ancestorBoxes = ancestorBoxes.concat(greatgrandparents.map(ggpBox('parent')))
        }
        
        var ancestorPuffs = [].concat(parents, grandparents, greatgrandparents)
        
        
        
        /////// descendants ////////
        
        var descendantRows = Math.min(4, rows - childrenStartRow)
        var descendantBoxes = []
        var kids = [], gkids = [], ggkids = [], gggkids = []
        
        if(descendantRows >= 1) {
            kids = PB.Data.graph.v(sig).out('child')
                           .unique().filter(propsfilter).take(cols)
                           .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            kidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow, 0, childrenStartRow, cols)
            descendantBoxes = descendantBoxes.concat(kids.map(kidsBox('child')))
        }
        
        var notKid = graphize(difffilter([puff].concat(kids)))
        
        if(descendantRows >= 2) {
            gkids = PB.Data.graph.v(sig).out('child').out('child')
                            .unique().filter(propsfilter).filter(notKid).take(cols)
                            .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+1, 0, childrenStartRow+1, cols)
            descendantBoxes = descendantBoxes.concat(gkids.map(gkidsBox('child')))
        }
        
        var notGKid = graphize(difffilter([puff].concat(kids, gkids)))
        
        if(descendantRows >= 3) {
            ggkids = PB.Data.graph.v(sig).out('child').out('child').out('child')
                             .unique().filter(propsfilter).filter(notGKid).take(cols)
                             .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            ggkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+2, 0, childrenStartRow+2, cols)
            descendantBoxes = descendantBoxes.concat(ggkids.map(ggkidsBox('child')))
        }
        
        var notGGKid = graphize(difffilter([puff].concat(kids, gkids, ggkids)))
        
        if(descendantRows >= 4) {
            gggkids = PB.Data.graph.v(sig).out('child').out('child').out('child').out('child')
                             .unique().filter(propsfilter).filter(notGGKid).take(cols)
                             .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gggkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+3, 0, childrenStartRow+3, cols)
            descendantBoxes = descendantBoxes.concat(gggkids.map(gggkidsBox('child')))
        }
        
        childrenPuffs = [].concat(kids, gkids, ggkids, gggkids)
        
        
        ///// end new focus mode stuff /////




        // gather puffs, graph style
        // THINK: can we parametrize this query structure? f(outAllIn, notSelf, ancestorTotal)...
        // var genLimit = 10
        // var notSelf  = graphize(difffilter([puff]))
        // var ancestorPuffs = PB.Data.graph.v(sig).outAllN('parent', genLimit)
        //                             .unique().filter(propsfilter).filter(notSelf)
        //                             .take(ancestorTotal).property('shell').run()
        //                             .map(PB.M.Forum.getPuffBySig).filter(Boolean)
        //
        // var notAncestor = graphize(difffilter([puff].concat(ancestorPuffs)))
        //
        // var childrenPuffs = PB.Data.graph.v(sig).inAllN('parent', genLimit)
        //                             .unique().filter(propsfilter).filter(notAncestor)
        //                             .take(childrenTotal).property('shell').run()
        //                             .map(PB.M.Forum.getPuffBySig).filter(Boolean)
        
        var notRelated = graphize(difffilter([puff].concat(ancestorPuffs, childrenPuffs)))
        
        var siblingPuffs  = PB.Data.graph.v(sig).out('parent').out('child')  // THINK: second cousins?
                                    .unique().filter(propsfilter).filter(notRelated)
                                    .take(siblingTotal).property('shell').run()
                                    .map(PB.M.Forum.getPuffBySig).filter(Boolean)
        
        // fill remaining slots
        // TODO: this isn't right with the new stuff
        PB.Data.fillSomeSlotsPlease(ancestorTotal, ancestorPuffs.length, Boron.extend({}, query, {mode: 'ancestors'}), filters)
        PB.Data.fillSomeSlotsPlease(childrenTotal, childrenPuffs.length, Boron.extend({}, query, {mode: 'descendants'}), filters)
        PB.Data.fillSomeSlotsPlease(siblingTotal, siblingPuffs.length, Boron.extend({}, query, {mode: 'siblings'}), filters)
        
        // special sorting for children puffs
        // TODO: bring this back for the new stuff
        // var childrenPuffs =
        //     childrenPuffs.sort(function(a, b) {
        //                         return a.username == username ? -1 : 0       // fancy sorting for current user puffs
        //                             || b.username == username ?  1 : 0
        //                             || a.username == puff.username ? -1 : 0  // fancy sorting for author puffs
        //                             || b.username == puff.username ?  1 : 0
        //                             || PB.M.Forum.sortByPayload(b, a) * -1    // regular temporal sort
        //                             })
        
        // box the puffs 
        var puffBoxes = [].concat( [puff].map(stuckBigBox('focused'))
                                 // , ancestorPuffs.map(ancestorBox('parent'))
                                 , ancestorBoxes
                                 , siblingPuffs.map(siblingBox('sibling'))
                                 // , childrenPuffs.map(childrenBox('child'))
                                 , descendantBoxes
                                )
                          .filter(function(x) {return x.width})               // remove nodes that don't fit in the grid 
                          .sort(function(a, b) {                              // sort required so React doesn't have  
                              if(a.puff.sig+'' < b.puff.sig+'') return -1    //   to remove and re-add DOM nodes   
                              if(a.puff.sig+'' > b.puff.sig+'') return 1     //   in order to order them properly
                             return 0 })
        
        // ensure cursor is set
        this.cursorPower(puffBoxes.map(function(pbox) {return pbox.puff}), puff)
        
        // lay out the boxes
        return this.manualGridify(puffBoxes)
    }
})


var PuffArrow =  React.createClass({
    render: function() {
        var arrow = this.props.arrow
        
        var p = arrow[0]
        var c = arrow[1]
        
        var offset = 30
        // Move over if menu open
        var yoffset = 0
        var baseShift = 12

        var x1 = p.x + p.width/2
        var y1 = p.y + p.height/2
        var x2 = c.x + c.width/2
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
            // arrow is top to down
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
                // arrow is right to left
                if (boxSlope < lineSlope) {

                    // Limited by top edge
                    x2 += ((c.height / 2) - offset / 2) / lineSlope
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
                if (boxSlope < lineSlope) {

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
                    x2 -= ((c.height / 2) - offset / 2) / lineSlope
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
        var colNumber = parseInt(Bitcoin.Crypto.MD5(this.props.key.slice(-32)),16)
        colNumber = colNumber % CONFIG.arrowColors.length

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

        return (
            <line x1={this.props.x1} y1={this.props.y1} x2={this.props.x2} y2={this.props.y2} stroke={this.props.stroke} strokeWidth="2" fill={this.props.fill} ></line>
        )
    }
})


var PuffFooter = React.createClass({
    render: function() {
        var width = (window.innerHeight-66)+'px'
        var polyglot = Translate.language[puffworldprops.view.language]
        // TODO: Is this a very bad idea?

        return (

            <div className="footer" style={{maxWidth: width}}>
                <div className="footerText">
                {polyglot.t("footer.powered")} <a href={CONFIG.url} className="footerText">puffball</a>.
                {polyglot.t("footer.rest")}
                </div>
            </div>
        )
    }
})



var Logo = React.createClass({
    render: function() {
        return (
            <div>
                <a href={CONFIG.url}>
                    <img src={CONFIG.logo} alt="Logo" className="logo" />
                </a>
            </div>
            )
    }
})


var PuffScroller = React.createClass({
    mixins: [GridLayoutMixin],

    handleScroll: function() {
        if (!this.props.show) return false

        var col   = this.getDimensions().cols
        var offset = parseInt(this.props.view.query.offset) || 0
        offset = this.props.position == "up" ? offset - col : offset + col
        offset = Math.max(offset, 0)
        return Events.pub("ui/scroll/down", {'view.query.offset': offset})
    },

    render: function() {
        if (!this.props.show) {
            return (<span></span>)
        }

        var left = CONFIG.leftMargin

        var col   = this.getDimensions().cols
        var screencoords = this.getScreenCoords()
        var boxHeight = screencoords.height / this.getDimensions().rows
        var w = col * this.props.view.boxRatio* boxHeight
        if(w > screencoords.width) {
            w = screencoords.width
        }

        var style = {left: left, width: w}
        var className = "scroller gray " + this.props.position
        var iconClass = "fa fa-fw fa-chevron-"+this.props.position
        return (
            <div className={className} style={style}>
                <a href="#" onClick={this.handleScroll}>
                    <i className={iconClass}></i><br/>
                    <i className={iconClass}></i><br/>
                    <i className={iconClass}></i><br/>
                </a>
            </div>
        )
    }
})