/** @jsx React.DOM */

var PuffFancyBox = React.createClass({displayName: 'PuffFancyBox',
    render: function() {
        var   puff = this.props.puff
        var  style = {}
        var  stats = this.props.stats
        var arrows = stats.arrows
        var  width = stats.width
        var height = stats.height
        var    top = stats.y
        var   left = stats.x + CONFIG.leftMargin
        var hidden = !this.props.view.showinfo

        // set up classes
        var classArray = ['block']
        if(this.props.extraClassy)
            classArray.push(this.props.extraClassy)
        if(this.props.view.cursor == puff.sig) {
            classArray.push('cursor')            
        }
        if(PB.Data.getBonus(puff, 'envelope'))
            classArray.push('encrypted')
        
        if (this.props.view.flash) {
            classArray.push('flashPuff')
            update_puffworldprops({'view.flash': false})
        }
        var flaggedPuff = PB.Persist.get('flagged') || []
        var flagged = false
        var outerPuff = PB.Data.getBonus(puff, 'envelope')
        if (flaggedPuff.indexOf(puff.sig)!= -1 ||
            (outerPuff && flaggedPuff.indexOf(outerPuff.sig) != -1)) {
            classArray.push('flagged')
            flagged = true
        }
        var className = classArray.join(' ')
        
        var offset = CONFIG.extraSpacing
        var spacing = CONFIG.minSpacing
        if(arrows) {
            width  -= offset
            height -= offset
            top  += offset/2
            left += offset/2
        } else {
            width  -= spacing
            height -= spacing
            top  += spacing
            left += spacing
        }

        var replied = false
        var countChildren = PB.M.Forum.getChildCount(puff)
        if (countChildren > 0) {
            var kids = PB.Data.graph.v(puff.sig).out('child').run()
            var curUser = PB.M.Wardrobe.getCurrentUsername()
            for (var i=0; i<countChildren; i++) {
                if (kids[i].shell.username==curUser) {
                    replied = true
                    break
                }
            }
        }

        // TODO: Move these into css
        if(stats)
            style = {position: 'absolute', width: width, height: height, left: left, top: top }

        if(replied)
            style = {position: 'absolute', width: width, height: height, left: left, top: top, backgroundColor: 'rgba(220,255,220,.9)'}

        return (
            React.DOM.div( {className:className, id:puff.sig, key:puff.sig, style:style}, 
                PuffAuthor( {ref:"author", puff:puff, hidden:hidden} ),
                PuffContent( {puff:puff, height:height} ),
                PuffBar( {ref:"bar", puff:puff, hidden:hidden, flagged:flagged})
            )
        )
    }
})


var PuffAuthor = React.createClass({displayName: 'PuffAuthor',
    clickUsername: function(username) {
        return Events.pub('ui/show/by-user', { 'view.mode': 'list'
                                             , 'view.filters': {}
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.filters.users': [username]
                                             })
    },
    handleClick: function() {
        var username = this.props.puff.username
        return this.clickUsername(username)
    },
    render: function() {
        // var username = humanizeUsernames(this.props.puff.username)
        var username = this.props.puff.username
        var className = 'author' + (this.props.hidden ? ' hidden' : '')

        var routes = this.props.puff.routes || []
        if (routes.length == 0)
            routes = this.props.puff.payload.routes || []
        routes = routes.filter(function(r){return r!=CONFIG.zone && r!=username})
        var sendTo = ""
        var self = this
        var total = routes ? routes.length : 0
        if (total != 0) 
            sendTo = (
                React.DOM.span(null, 
                    " > ",
                    routes.map(function(value, index){
                        var link = React.DOM.a( {href:"", onClick:self.clickUsername.bind(self, value)}, ".",value)
                        return React.DOM.span( {key:value}, link,
                                    (index != total-1) ? ', ' : '')
                    })
                )
            )

        return (
            React.DOM.div( {className:className}, React.DOM.a( {href:"", onClick:this.handleClick}, ".",username),sendTo)
        )
    }
})

var PuffContent = React.createClass({displayName: 'PuffContent',
    handleClick: function() {
        var puff = this.props.puff
        showPuff(puff.sig)
    },
    render: function() {
        var puff = this.props.puff
        var rawPuffs = puffworldprops.raw.puffs || []
        var puffcontent = ''
        if (rawPuffs.indexOf(puff.sig) == -1) {
            puffcontent = PB.M.Forum.getProcessedPuffContent(puff)
        } else {
            puffcontent = puff.payload.content
            puffcontent = puffcontent
                                     .replace(/&/g, "&amp;") // escape html
                                     .replace(/</g, "&lt;")
                                     .replace(/>/g, "&gt;")
                                     .replace(/"/g, "&quot;")
                                     .replace(/'/g, "&#039;")
                                     .replace(/(?:\r\n|\r|\n)/g, '<br />') // replace line break with <br /> tag;

        }

        // show meta for profile // TODO add this to config
        /*
        if (puff.type != 'profile') {
            var keysNotShow = ['content', 'parents', 'type'];
            return <div style={{height: this.props.height}} className="txt" onClick={this.handleClick}>
                <div  dangerouslySetInnerHTML={{__html: puffcontent}}></div>
                <span>
                    {Object.keys(puff.payload).map(function(key){
                        var value = puff.payload[key];
                        if (keysNotShow.indexOf(key)==-1 && value && value.length) {
                            return <div><span className="profileKey">{key+": "}</span><span className="profileValue">{value}</span></div>
                        }
                    })}
                </span>
            </div>
        }
        */

        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return React.DOM.div( {style:{height: this.props.height}, className:"txt", onClick:this.handleClick, dangerouslySetInnerHTML:{__html: puffcontent}})
    }
})

var PuffBar = React.createClass({displayName: 'PuffBar',
    mixins: [TooltipMixin],
    getInitialState: function() {
        return {iconSet: 0}
    },
    handleShowMore: function() {
        this.setState({iconSet: (this.state.iconSet+1)%3})
    },
    componentDidUpdate: function() {
        // to show tooltips for the other puffs
        this.componentDidMount()
    },
    render: function() {
        var puff = this.props.puff
        var className = 'bar' + (this.props.hidden ? ' hidden' : '')
        var canViewRaw = puff.payload.type=='bbcode'||puff.payload.type=='markdown'||puff.payload.type=='PGN'
        var showStar = true
        var envelope = PB.Data.getBonus(this.props.puff, 'envelope')
        if(envelope && envelope.keys)
            showStar = false

        var polyglot = Translate.language[puffworldprops.view.language]
        var iconSet = this.state.iconSet
        var boldStyle = {
            fontWeight: 'bold'
        }
        var selectedStyle = {
            color: '#00aa00'
        }
        var moreButton = (
            React.DOM.span( {className: "icon"}, 
                React.DOM.a( {style:boldStyle, onClick:this.handleShowMore}, 
                    [0,1,2].map(function(i){
                        if (i == iconSet) return React.DOM.span( {key:i, style:selectedStyle}, "•")
                        else return React.DOM.span( {key:i}, "•")
                    })
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.see_more")} )
            )
        )


        // ICON SETS
        var iconSetOne = (
            React.DOM.span( {className:iconSet == 0 ? "" : "hidden"}, 
                PuffFlagLink( {ref:"flag", puff:puff, username:puff.username, flagged:this.props.flagged}),
                PuffInfoLink( {puff:puff} ),
                PuffParentCount( {puff:puff} ),
                PuffChildrenCount( {puff:puff} ),
                showStar ? PuffStar( {show:showStar, sig:puff.sig} ) : '',
                PuffReplyLink( {ref:"reply", sig:puff.sig} )
            )
        )
        var iconSetTwo = (
            React.DOM.span( {className:iconSet == 1 ? "" : "hidden"}, 
                canViewRaw ? PuffViewRaw( {sig:puff.sig} ) : '',
                puff.payload.type == 'image' ? PuffViewImage( {puff:puff} ) : "",
                PuffExpand( {puff:puff} ),
                PuffTipLink( {username:puff.username} )
            )
        )
        var iconSetThree = (
            React.DOM.span( {className:iconSet == 2 ? "" : "hidden"}, 
                PuffJson( {puff:puff} ),
                PuffPermaLink( {sig:puff.sig} ),
                PuffClone( {puff:puff} )
            )
        )
        return (
        React.DOM.div( {className:className}, 
            iconSetOne,
            iconSetTwo,
            iconSetThree,
            moreButton
        )
        )
    }
})

var PuffViewImage = React.createClass({displayName: 'PuffViewImage',
    render: function() {
        var puff = this.props.puff
        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className: "icon"}, 
                React.DOM.a( {href:puff.payload.content, target:"new"}, React.DOM.i( {className:"fa fa-search-plus fa-fw"})),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.view_image")})
            )
        )
    }
})

var PuffJson = React.createClass({displayName: 'PuffJson',
    handleClick: function() {
        var jsonstring = JSON.stringify(this.props.puff)
        var jswin = window.open("")
        jswin.document.write(jsonstring)
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className: "icon", onClick:this.handleClick}, 
                React.DOM.a(null, React.DOM.i( {className:"fa fa-cubes fa-fw"})),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.json")})
            )
        )
    }
 })

var PuffFlagLink = React.createClass({displayName: 'PuffFlagLink',
    getInitialState: function() {
        return {flagged: false}
    },

    handleFlagRequest: function() {
        if (PB.M.Wardrobe.getCurrentUsername() != this.props.username &&PB.M.Wardrobe.getCurrentUsername() != CONFIG.zone)
            return false
        if (this.props.flagged) return false

        var polyglot = Translate.language[puffworldprops.view.language]
        var doIt = confirm(polyglot.t("alert.flag"))

        if(!doIt)
            return false

        var self = this
        var sig = this.props.puff.sig
        var env = PB.Data.getBonus(self.props.puff, 'envelope')
        if (env)
            sig = env.sig
        var prom = PB.M.Forum.flagPuff(sig)

        prom.then(function(result) {
                console.log(result)
                self.setState({flagged: true})
            })
            .catch(function(err) {
               alert(err)
            })

        return false
    },

    render: function() {
        var cx1 = React.addons.classSet
        var newClass = cx1({
            'fa fa-bomb fa-fw': true,
            'red': this.props.flagged,
            'black': !this.props.flagged
        })
        var polyglot = Translate.language[puffworldprops.view.language]

        // Does this user have right to flag?
        if(PB.M.Wardrobe.getCurrentUsername() == this.props.username || PB.M.Wardrobe.getCurrentUsername() == CONFIG.zone) {
            return (
                React.DOM.span(null, 
                    React.DOM.a( {href:"#", onClick:this.handleFlagRequest}, React.DOM.i( {className:newClass} )),
                    Tooltip( {position:"above", content:polyglot.t("menu.tooltip.flag_link")} )
                )
            )
        } else {
            return React.DOM.i(null)
        }

    }
})



var PuffParentCount = React.createClass({displayName: 'PuffParentCount',
    handleClick: function() {
        var puff  = this.props.puff
        return Events.pub('ui/show/parents', { 'view.mode': 'list'
                                             ,'view.filters': {}
                                             ,'view.query': puffworlddefaults.view.query
                                             , 'view.query.focus': puff.sig
                                             , 'view.query.ancestors': 1
                                             })
    },
    render: function() {
        var puff = this.props.puff
        var parentCount = PB.M.Forum.getParentCount(puff)
        var polyglot = Translate.language[puffworldprops.view.language]
        if (!parentCount) {
            return (
                    React.DOM.span(null, 
                        React.DOM.span( {className:"click droid"}, React.DOM.span( {ref:"count"} , "0"), " " ),
                        Tooltip( {position:"above", content:polyglot.t("menu.tooltip.parent")} )
                    )
           )
        }
        else {
            return (
                React.DOM.span(null, 
                    React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                        React.DOM.span( {ref:"count droid"}, parentCount, " " )
                    ),
                    Tooltip( {position:"above", content:polyglot.t("menu.tooltip.parent")})
                )
            )
        }
    }
})

/**
 *
 * Show the Info icon and pop-up the information window
 */
var PuffInfoLink = React.createClass({displayName: 'PuffInfoLink',
    componentDidMount: function(){
        var node = this.getDOMNode()
        var infoLink = node.getElementsByClassName('infoLink')[0]
        var detailInfo = node.getElementsByClassName('detailInfo')[0]

        infoLink.onmouseover = function() {
            detailInfo.style.display = 'block'
        }
        infoLink.onmouseout = function() {
            detailInfo.style.display = 'none'
        }
    },
    render: function() {
        var puff = this.props.puff
        var date = new Date(puff.payload.time)
        var formattedTime = React.DOM.span(null, "Created ", timeSince(date), " ago")
        var lisc = puff.payload.license ?  React.DOM.span(null, React.DOM.br(null),"License: ", puff.payload.license) : ''

        var type = React.DOM.span(null, React.DOM.br(null),"Type: ", puff.payload.type)

        // var quote = puff.payload.quote ?  <span><br/>Quote: {puff.payload.quote}</span> : ''

        var photographer = puff.photographer ? React.DOM.span(null, React.DOM.br(null),"Photographer: ", puff.photographer) : ''
        var version = React.DOM.span(null, React.DOM.br(null), " Version: ", puff.version)
   //     var altText = formattedTime + ' ' + lisc + ' ' + photographer + ' ' + version;

        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a(null, React.DOM.span( {className:"infoLink"}, 
                    React.DOM.i( {className:"fa fa-info fa-fw"}),
                    React.DOM.span( {className:"detailInfo"}, 
                    formattedTime,
                    type,
                    lisc,
                    photographer
                    )
                ))
            )
            )
    }
})

var PuffTipLink = React.createClass({displayName: 'PuffTipLink',
    getInitialState: function() {
        return {
            showTipButtons: false
        }
    },

    handleToggleTipInfo: function(){
        var node = this.getDOMNode()
        var walletInfo = node.getElementsByClassName('walletInfo')[0]

        if(!this.state.showTipButtons) {
            this.setState({showTipButtons: true})
            walletInfo.style.display = 'block'

        } else {
            this.setState({showTipButtons: false})
            walletInfo.style.display = 'none'
        }
        return false
    },

    render: function() {
        if(this.state.showTipButtons) {

            var tipButtons = TipButton( {currency:"BTC", username:this.props.username} )
        } else {
            var tipButtons = ''
        }

        return (
            React.DOM.span( {className:"icon"}, 
            React.DOM.span( {className:"walletLink"}, 
                React.DOM.a( {href:"#", onClick:this.handleToggleTipInfo}, 
                    React.DOM.i( {className:"fa fa-gittip fa-fw"})
                ),
                React.DOM.span( {className:"walletInfo"}, 
                    tipButtons
                )
            )
            )
            )
    }
})

var TipButton = React.createClass({displayName: 'TipButton',
    getInitialState: function() {
        return {
            publicKey: '',
            btcAddy: '',
            akShort: ''
        }
    },

    componentDidMount: function(){
        // Get the public key for this user, convert to wallet
        // TODO: Get the link so have meta-data set, like "From puffball"

        var self = this
        var prom = PB.getUserRecord(this.props.username)

        prom.then(function(result) {

            self.setState({publicKey: result.adminKey})
            console.log(result.adminKey)

            var btcAddy = PB.Crypto.wifToPubKey(result.adminKey)

            console.log(btcAddy)

            btcAddy = btcAddy.getAddress().toString()
            self.setState({btcAddy: btcAddy})

            console.log("HI")

            var akShort = btcAddy.substr(0,5)+'...'
            self.setState({akShort: akShort})



            Events.pub('ui/tipbutton/userlookup', {})

            return false
        })
            .catch(function(err) {
                console.log("PROBLEM")

                self.setState({publicKey: false})
                this.setState({btcAddy: 'Unknown :-('})
                this.setState({akShort: 'FAIL'})
                Events.pub('ui/tipbutton/userlookup/failed', {})
                return false
            })
    },

    render: function() {
        if(this.state.btcAddy)
            return (
                    React.DOM.div( {className:"tip"}, 
                        "Tip user: ", React.DOM.a( {href:"bitcoin:" + this.state.btcAddy}, React.DOM.i( {className:"fa fa-bitcoin fa-fw"}))
                    )
            )

        return React.DOM.i( {className:"fa fa-fw fa-spinner"})
    }

})


var PuffViewRaw = React.createClass({displayName: 'PuffViewRaw',
    handleClick:function() {
        var sig = this.props.sig
        var rawPuff = puffworldprops.raw.puffs
            ? puffworldprops.raw.puffs.slice() 
            : []
        var index = rawPuff.indexOf(sig)
        if(index == -1) {
            rawPuff.push(sig)
        } else {
            rawPuff.splice(index, 1)
        }

        return Events.pub('ui/raw/add-raw', {'raw': {puffs: rawPuff}})
    },
    render: function() {
        var rawPuff = puffworldprops.raw.puffs
            ? puffworldprops.raw.puffs.slice() 
            : []
        var cx1 = React.addons.classSet
        var index   = rawPuff.indexOf(this.props.sig)
        if(index == -1) {
            var isGreen = false
        } else {
            var isGreen = true
        }

        var newClass = cx1({
            'fa fa-code fa-fw': true,
            'green': isGreen
        })

        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:newClass})
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.view_raw")})
            )
        )
    }

})

var PuffChildrenCount = React.createClass({displayName: 'PuffChildrenCount',
    handleClick: function() {
        var puff  = this.props.puff
        return Events.pub('ui/show/parents', { 'view.mode': 'list'
                                             ,'view.filters': {}
                                             , 'view.query': puffworlddefaults.view.query
                                             , 'view.query.focus': puff.sig
                                             , 'view.query.descendants': 1
                                             })
    },
    render: function() {
        var puff = this.props.puff
        var childCount = PB.M.Forum.getChildCount(puff)
        var polyglot = Translate.language[puffworldprops.view.language]
        if (!childCount) {
            return (
                React.DOM.span(null, 
                    React.DOM.span( {className:"click droid"}, React.DOM.span( {ref:"count"}, "0"), " " ),
                    Tooltip( {position:"above", content:polyglot.t("menu.tooltip.children")})
                )
            )
        }
        else {
            return (
                React.DOM.span(null, 
                    React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                        React.DOM.span( {ref:"count droid"}, childCount, " " )
                    ),
                    Tooltip( {position:"above", content:polyglot.t("menu.tooltip.children")})
                )
            )
        }
    }
})

var PuffPermaLink = React.createClass({displayName: 'PuffPermaLink',
    handleClick: function() {
        var sig  = this.props.sig
        // var puff = PB.M.Forum.getPuffBySig(sig)
        showPuff(sig)
        return false
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-link fa-fw"})
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.permalink")})
            )
        )
    }
})

var PuffReplyLink = React.createClass({displayName: 'PuffReplyLink',
    handleClick: function() {
        // TODO: make this a toggle. Does it already?
        // TODO: Remove coloring when submit puff

        var sig = this.props.sig

        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []

        var index = parents.indexOf(sig)
        var openMenu = true
        var type = puffworldprops.reply.type
        if(index == -1) {
            if (parents.length == 0)
                type = PB.M.Forum.getPuffBySig(sig).payload.type
            parents.push(sig)
        } else {
            parents.splice(index, 1)
            /*if (parents.length == 0)
                type = puffworldprops.reply.lastType*/
            openMenu = puffworldprops.menu.show // if removing a parent, then do not force menu open
        }

        var menu = Boron.shallow_copy(puffworldprops.menu)    // don't mutate directly!
        if (puffworldprops.menu.popout != 'publish') {
            menu.show = openMenu
            menu.section = 'publish'
        }

        var contentEle = document.getElementById('content')
        if (contentEle) {
            contentEle.focus()
        }

        return Events.pub('ui/reply/add-parent', { 'clusters.publish': true,
                                                   'reply.parents': parents,
                                                   'reply.type': type,
                                                   'menu': menu
                                                 })

        // TODO: draw reply arrows. Maybe
    },
    render: function() {
        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []
        var cx1 = React.addons.classSet
        var index   = parents.indexOf(this.props.sig)

        if(index == -1) {
            var isGreen = false
        } else {
            var isGreen = true
        }

        var newClass = cx1({
            'fa fa-reply fa-fw': true,
            'green': isGreen
        })

        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:newClass})
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.reply")})
            )
        )
    }
})


var PuffExpand = React.createClass({displayName: 'PuffExpand',
    handleClick: function() {
        var puff = this.props.puff
        var row = puffworldprops.view.rows == 1 ? puffworlddefaults.view.rows : 1
        return Events.pub("ui/expand-puff", { 'view.mode': 'focus'
                                            // , 'view.filters': {}
                                            // , 'view.query': puffworlddefaults.view.query
                                            , 'view.query.focus': puff.sig
                                            , 'menu': puffworlddefaults.menu
                                            // , 'reply': puffworlddefaults.reply
                                            , 'view.rows': row
                                            })
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        var expand = puffworldprops.view.rows == 1 ? "compress" : "expand"
        // var iconClass = puffworldprops.view.rows == 1 ? "fa fa-compress fa-fw" : "fa fa-expand fa-fw"
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-fw fa-"+expand})
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip."+expand)})
            )
        )
    }
})


var PuffStar = React.createClass({displayName: 'PuffStar',
    getInitialState: function(){
        return { pending: false }
    },
    handleClick: function() {
        var username = PB.M.Wardrobe.getCurrentUsername()
        
        if(username == PB.M.Forum.getPuffBySig(this.props.sig).username)
            return false // can't star your own puff
            
        var sig = this.props.sig
        var fauxShell = {sig: sig} // grumble grumble
        var starStats = PB.Data.getBonus(fauxShell, 'starStats')
        var iHaveStarredThis = ((starStats||{}).from||{})[username]
        
        if(iHaveStarredThis) {
            var self = this
            var starSig = iHaveStarredThis
            var prom = PB.M.Forum.flagPuff(starSig)
            prom.then(function(result) {
                    PB.Data.removeStar(sig, username)
                })
                .catch(function(err) {
                   alert(err)
                })
        } else {
            this.setState({ pending: true })
            var self = this
            var content = this.props.sig
            var type = 'star'

            var userprom = PB.M.Wardrobe.getUpToDateUserAtAnyCost()
            var takeUserMakePuff = PB.M.Forum.partiallyApplyPuffMaker(type, content, [], {}, [])
            var prom = userprom.catch(PB.promiseError('Failed to add post: could not access or create a valid user'))
            prom.then(takeUserMakePuff)
                .then(function(puff){
                    self.setState({ pending: false })
                    PB.Data.addStar(sig, username, puff.sig)
                })
                .catch(PB.promiseError('Posting failed'))
        }
        return false
    },
    render: function() {
        var fauxShell = {sig: this.props.sig} // grumble grumble
        var starStats = PB.Data.getBonus(fauxShell, 'starStats')

        var score = 0
        var color = 'black'
        
        if(starStats && starStats.from) {
            var username = PB.M.Wardrobe.getCurrentUsername()
            var selfStar = starStats.from[username]
            score = starStats.score
            color = selfStar ? 'yellow' : 'black'
        }
        
        if(this.state.pending)
            color = 'gray'
        
        var link = (
            React.DOM.a( {href:"#", onClick:this.handleClick}, 
                React.DOM.i( {className:"fa fa-fw fa-star " + color})
            )
        )
        var pointerStyle = {}
        var self = this
        if (PB.M.Wardrobe.getCurrentUsername() == PB.M.Forum.getPuffBySig(this.props.sig).username) {
            pointerStyle = {cursor: 'default'}
            link = React.DOM.span( {style:pointerStyle}, React.DOM.i( {className:"fa fa-fw fa-star " + color}))
        }
        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className:"icon"}, 
                link,React.DOM.span( {style:pointerStyle}, score),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.star")})
            )
        )
    }
})

var PuffClone = React.createClass({displayName: 'PuffClone',
    handleClick: function(){
        var puff = this.props.puff

        var menu = Boron.shallow_copy(puffworlddefaults.menu)
        if (puffworldprops.menu.popout != "publish") {
            menu.show = true
            menu.section = 'publish'
        } else {
            menu.popout = 'publish'
        }

        var reply = Boron.shallow_copy(puffworldprops.reply)
        reply.type = puff.payload.type

        reply.showPreview = false
        reply.state = {}
        reply.state.showAdvanced = true
        reply.state.meta = Boron.shallow_copy(puff.payload)

        reply.privacy = 'public'
        var envelope = PB.Data.getBonus(puff, 'envelope')
        if(envelope && envelope.keys)
            reply.privacy = "private"
        if (puff.payload.type == 'profile' || puff.payload.type == 'image') {
            reply.state.imageSrc = puff.payload.content
        } else {
            reply.content = puff.payload.content
        }

        Events.pub('ui/reply/open', { 'clusters.publish': true
                                    , 'menu': menu
                                    , 'reply': reply })
        
        // may want a different way...
        var contentNode = document.getElementById('content')
        if (contentNode && puff.payload.type != 'profile')
            contentNode.value = puff.payload.content

        return false
    },
    render: function(){
        var polyglot = Translate.language[puffworldprops.view.language]
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-fw fa-copy"})
                ),
                Tooltip( {position:"above", content:polyglot.t("menu.tooltip.copy")})
            )
        )
    }
})