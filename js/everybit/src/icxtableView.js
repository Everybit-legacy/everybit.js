/** @jsx React.DOM */

/*
 BROKEN:
 
 Refresh button


  */


var TableView = React.createClass({
	sortDate: function(p1, p2) {
		return p2.payload.time - p1.payload.time
	}, 
	sort_column: function(col) {
		var functionName = "sort" + col.slice(0, 1).toUpperCase() + col.slice(1)
		if (this[functionName]) {
			return this[functionName]
		}
		return false
	},
	sortPuffs: function(puffs) {
		var col = puffworldprops.view.table.sort.column
		var desc = puffworldprops.view.table.sort.desc
		puffs = puffs || []
		var fn = this.sort_column(col)
		if (fn === false) {
			console.log('Missing sort function', col)
			return puffs
		}
		puffs = puffs.sort(function(p1, p2){
			if (desc) return fn(p1, p2)
			else return -fn(p1, p2)
		})
		return puffs
	},

    forceRefreshPuffs: function() {
        var cl = this.refs.refresh.getDOMNode().classList
        cl.toggle("fa-spin")
        getMyPrivateShells()
        setTimeout(
            function() {cl.toggle("fa-spin")},2000
        )
    },

    componentWillMount: function() {
        Events.pub('ui/event', {
            'view.table.loaded': CONFIG.initialLoad
        })
    },

	render: function() {
		var query = puffworldprops.view.query
		var filters = puffworldprops.view.filters
		var limit = puffworldprops.view.table.loaded
		var puffs = PB.M.Forum.getPuffList(query, filters, limit).filter(Boolean)
        var total = 0

		puffs = this.sortPuffs(puffs)
        //ICX.loading = !!puffs.length
        total = puffs.length - 1

        var refreshStyle = {
            right: Math.floor(ICX.calculated.baseFontH/2)+'px',
            top: Math.floor(ICX.calculated.baseFontH/2)+'px',
            padding: Math.floor(ICX.calculated.baseFontH/4)+'px',
            backgroundColor: 'rgba(255,255,255,.8)',
            borderRadius: Math.floor(ICX.calculated.baseFontH)+'px',
            border: '1px dashed #000',
            position: 'absolute'
        }

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        var polyglot = Translate.language[puffworldprops.view.language]

		return (
			<div className="viewContainer">
                <div style={headerStyle}>View your messages and files</div>
                <div style={{fontSize: '60%'}}>
                    <br />
                    <b>All content is encrypted on the user’s device. Only the sender and recipient can decode it.</b><br /><br />
                </div>
                <span style={refreshStyle}><a onClick={this.forceRefreshPuffs}><i ref="refresh" className="fa fa-refresh small" /></a></span>
				<ViewFilters />
                {
                	puffs.map(function(puff, index){
                        ICX.loading = (index < total)
						return <ICXContentItem tot={total} key={index} puff={puff} />
					})
				}
                <ViewLoadMore query={this.props.view.query} />
			</div>
		)
	}
})

var ViewFilters = React.createClass({
	handleGetCurrentFilter: function() {
		var filters = puffworldprops.view.filters
		var filter = ''

		if ( filters.users != undefined ) {
			filter = "from " + filters.users[0]
		}
		if ( filters.routes != undefined ) {
			filter = "to " + filters.routes[0]
		}
		return filter
	},

	handleRemoveCurrentFilter: function() {
		return Events.pub('ui/show/by-user', {
			'view.filters': {}
		})
	},

	render: function() {
		var filter = this.handleGetCurrentFilter()
		var style = {
            display: (!filter) ? 'none' : 'inline',
            fontSize: '80%'
        }

		return (
			<div style={style} className="filters">
				<b>Filters: {filter}</b> <a onClick={this.handleRemoveCurrentFilter}><i className="fa fa-times-circle"></i></a>
                <hr />
			</div>
		)
	}
})

var ICXContentItem = React.createClass({

    getInitialState: function() {
        return {
            expanded: true,
            showReply: false
        }
    },

    componentDidMount: function() {
        //console.log(this.props.key + "/" + this.props.tot)
        //console.log(ICX.loading)
        // if ( this.props.key == ICX.actual-1 ) {
        //     //console.log("finished loading \n")
        //     ICX.loading = false
        // } else {
        //     //console.log("still more to load \n")
        //     ICX.loading = true
        // }
    },

    handleToggleShowItem: function() {
        if(this.state.expanded)
            this.setState({expanded: false})
        else
            this.setState({expanded: true})

        return false
    },

    handleShowReply: function() {
        this.setState({expanded: true})
        var activeReplies = puffworldprops.view.icx.activeReplies
        // Add if not already in there
        var sig = this.props.puff.sig
        if(activeReplies.indexOf(sig) === -1) {
            activeReplies.push(sig)
        }

        Events.pub('ui/reply/activate',
            {'view.icx.activeReplies': activeReplies}
        )
    },

	render: function() {
        var puff = this.props.puff

		if (!puff.sig) {return <span></span>}

        var itemPadding = Math.floor(ICX.calculated.baseFontH/4)+'px'

        var overalBoxStyle = {
            background: 'rgba(255,255,255,.7)',
            width: '90%',
            marginBottom: itemPadding,
            padding: itemPadding,
            borderLeft: Math.floor(ICX.calculated.baseFontH/2.5)+'px' + ' solid rgba(26, 40, 60,.4)'
        }

        // Put it left or right depending on from or to
        if(ICX.username == puff.username.stripCapa()) {
            overalBoxStyle.marginLeft = '10%'
        } else {
            overalBoxStyle.marginRight = '10%'
        }

        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-expand': !this.state.expanded,
            'fa-compress': this.state.expanded
        })

        var replyStyle = {}
        replyStyle.display = (ICX.username == puff.username.stripCapa()) ? 'none' : 'block'
        replyStyle.float = 'right'


        return (
            <div style={overalBoxStyle}>
                <div>
                    <div className="tableHeader" style={{fontSize: '65%'}} >
                        <ICXTableUserInfo puff={puff} />

                        <ICXRelationshipInfo puff={puff} />
                        <a className="toggler" onClick={this.handleToggleShowItem}><i className={cbClass}></i></a>
                        <span className="icon reply relative" style={replyStyle}>
                        <a onClick={this.handleShowReply}>
                            <i className="fa fa-mail-forward fa-fw fa-rotate-180" />
                            <Tooltip position="under" content="Reply" />
                        </a>
                        </span>
                        <ICXDownloadLink puff={puff} />
                    </div>
                </div>
                <ICXItemMainContent show={this.state.expanded} puff={puff} />

            </div>
		)
	}
})


var ICXItemMainContent = React.createClass({

    render: function() {
        if(this.props.show) {
            var puffContent = PB.M.Forum.getProcessedPuffContent(this.props.puff)
            var itemPadding = Math.floor(ICX.calculated.baseFontH/4)+'px'

            var itemContentStyle = {
                background: 'rgba(255,255,255,.9)',
                fontSize: '70%',
                padding: itemPadding
            }

            if(this.props.puff.payload.type == 'file') {
                return (
                    <div className="accordion-content" style={itemContentStyle}>
                        <ICXDownloadLink puff={this.props.puff} filename={puffContent} />
                        <ICXInlineReply puff={this.props.puff} />
                    </div>
                )
            } else {
                return(
                    <div className="accordion-content" style={itemContentStyle}>
                        <span dangerouslySetInnerHTML={{__html: puffContent}}></span>
                        <ICXInlineReply puff={this.props.puff} />
                    </div>
                )
            }
        } else {
            return <span></span>
        }
    }
})

var ICXTableUserInfo = React.createClass({
    handleViewUser: function(isSender, username) {
        if(isSender) {
            return Events.pub( 'filter/show/by-user',
                {
                    'view.filters': {},
                    'view.filters.routes': [username],
                    'view.mode': 'tableView'
                }
            )
        } else {
            return Events.pub( 'filter/show/by-user',
                {
                    'view.filters': {},
                    'view.filters.users': [username],
                    'view.mode': 'tableView'
                }
            )
        }
    },
    render: function() {

        var fromUser = this.props.puff.username.stripCapa()
        var toUser = this.props.puff.routes[0].stripCapa()

        // If current user is the sender, we will render the recipient
        if(ICX.username == fromUser) {
            var username = toUser
            var isSender = true
        } else {
            var username = fromUser
            var isSender = false
        }

        var prof = getProfilePuff(username)
        var avatar = <span></span>
        if(prof && prof.payload.content) {
            avatar = <span className="rowReference"><img className="iconSized" src={prof.payload.content}  /><div className="rowReferencePreview"><img src={prof.payload.content} /></div> </span>
        }

        if(isSender) {
            var sentOrReceived = 'sent'
            var fromOrTo = 'To '
        } else {
            var sentOrReceived = 'received'
            var fromOrTo = 'From '
        }

        return (
            <span className="userInfo">
                {avatar} {fromOrTo} <a onClick={this.handleViewUser.bind(this, isSender, username)}>{username}</a>
                {' '}
                {sentOrReceived}<ICXTableItemDate date={this.props.puff.payload.time} />
            </span>
        )
    }
})


var ICXTableItemDate = React.createClass({
    render: function() {
        var date = new Date(this.props.date)

        return (
                <span className="date">&nbsp;{timeSince(date)} ago</span>
            )
    }

})

var ICXRelationshipInfo = React.createClass({
    getReferenceIcon: function(sig, type) {
        if (!sig) return <span></span>
        var preview = <span></span>
        var puff = PB.M.Forum.getPuffBySig(sig)
        if (puff.payload && puff.payload.content) {
            var puffContent = PB.M.Forum.getProcessedPuffContent(puff)
            preview = <div className="rowReferencePreview"><span dangerouslySetInnerHTML={{__html: puffContent}}></span></div>
        }

        return (
            <span>
                <a key={sig} className="rowReference">
                    <img style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'middle'}} src={getImageCode(sig)}/>{preview}
                </a>
            </span>
            )
    },

    render: function() {
        var sig = this.props.puff.sig
        var self = this

        var parentsEle = <span></span>
        var parents = PB.Data.graph.v(sig).out('parent').run()
        parents = parents.map(function(v){if (v.shell) return v.shell.sig})
            .filter(Boolean)
            .filter(function(s, i, array){return i == array.indexOf(s)})
        var parentIcons = parents.map(function(sig)
        {return self.getReferenceIcon(sig, 'parent')})
        if (parents.length) {
            parentsEle = (
                <span className="relative">&nbsp;in reply to: {parentIcons}</span>
                )
        }

        var childrenEle = <span></span>
        var children = PB.Data.graph.v(sig).out('child').run()
        children = children.map(function(v){if (v.shell) return v.shell.sig})
            .filter(Boolean)
            .filter(function(s, i, array){return i == array.indexOf(s)})
        var childrenIcons = children.map(function(sig)
        {return self.getReferenceIcon(sig, 'child')})


        if (children.length) {
            if(children.length > 1) {
                childrenEle = <span className="relative">&nbsp;{children.length} replies: {childrenIcons}</span>
            } else {
                childrenEle = <span className="relative">&nbsp;{children.length} reply: {childrenIcons}</span>
            }

        }

        return (
            <span className="refs">
			    {parentsEle} {childrenEle}
            </span>
            )
    }
})


var ICXDownloadLink = React.createClass({

    handlePrepBlob: function() {
        // only prepares the file for download after user clicks on the button
        // this way we avoid preparing for all the files in view
        var puff = this.props.puff
        var link = document.createElement('a')
        link.href = PBFiles.prepBlob(puff.payload.content, puff.payload.type)
        link.download = puff.payload.filename

        if (getBrowser() == "IE") {
            window.navigator.msSaveBlob(PBFiles.prepBlob(puff.payload.content, puff.payload.type), puff.payload.filename)
        } else {
            document.body.appendChild(link)
            link.click()
            link.remove()
        }
    },

	render: function() {
        var puff = this.props.puff
        var style = {display: (puff.payload.type == 'file') ? 'inline' : 'none'}

        if(!this.props.filename) {
            return (
                <div className="download">
                    <a onClick={this.handlePrepBlob} style={style}><i className="fa fa-fw fa-download" /></a>
                </div>
                )
        } else {
    		return (
    			<span>File:<a onClick={this.handlePrepBlob} style={style}>{this.props.filename}</a></span>
    		)
        }
	}
})


var ICXInlineReply = React.createClass({
	handleReply: function() {
		var puff=this.props.puff
		var type = 'text'
        var content = this.refs.messageText.getDOMNode().value
        var parents = [puff.sig]
        var metadata = {}
        metadata.routes = [puff.username.stripCapa()]
        var envelopeUserKeys = ''
        var self = this

        /*
        Events.pub('ui/reply/add-parent', {
               'reply.parents': parents
            }
        )
        */

        if(!content || content.length < 1) {
            return false
        }
        Events.pub('ui/thinking', { 'ICX.thinking': true })
        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [puff.username]

        var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function (userRecord) {
            return userRecord.username
        })

        if (userRecords.length < usernames.length) {
            usernames.forEach(function (username) {
                if (!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function () {
                        return PB.getUserRecordNoCache(username).then(function (userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }

        prom = prom.then(function () {
            if (envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
            } else {                     // add our regular old boring identity to the list of available keys
                userRecords.push(PB.getCurrentUserRecord())
            }

            var post_prom = PB.M.Forum.addPost(type, content, parents, metadata, userRecords, envelopeUserKeys)
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            self.handleCleanup()

            return post_prom
        }).catch(function (err) {
            self.handleCleanup()
            console.log(err.message)
            Events.pub('ui/thinking', { 'ICX.thinking': false })
        })
	},

	handleSubmitSuccess: function () {
        console.log("SUCCESS")
        Events.pub('ui/thinking', { 'ICX.thinking': false })
    },

	handleCleanup: function() {
		/*
        this.refs["replyBox"+this.props.puff.sig].getDOMNode().style.display = "none"
		this.refs.messageText.getDOMNode().value = ''

		return Events.pub('ui/reply', {
			'reply.parents': [],
            'reply.isReply': false,
            'reply.replyTo': ''
		})
		*/

        var activeReplies = puffworldprops.view.icx.activeReplies

        // Remove this one for things we are replying to
        var sig = this.props.puff.sig
        if(activeReplies.indexOf(sig) !== -1) {
            activeReplies.splice(activeReplies.indexOf(sig),1)
        }

        Events.pub('ui/reply/activate',
            {'view.icx.activeReplies': activeReplies}
        )
	},

    handleShowReply: function() {

    },

    handleKeyDown: function(e) {
        if (e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            this.handleReply()
        }
    },

	render: function() {
		var puff=this.props.puff
		var username = puff.username.stripCapa()

        var inlineReplyStyle = {}

        var activeReplies = puffworldprops.view.icx.activeReplies

        if(activeReplies.indexOf(puff.sig) !== -1) {
            inlineReplyStyle.display = 'block'

        } else {
            inlineReplyStyle.display = 'none'
        }

        inlineReplyStyle.border = '1px solid #000000'
        inlineReplyStyle.padding = Math.floor(ICX.calculated.baseFontH/4)+'px'
        inlineReplyStyle.backgroundColor = 'rgba(200,200,200,.5)'
        inlineReplyStyle.marginTop = Math.floor(ICX.calculated.baseFontH/2)+'px'


        var thisScreen = ICX.screens.filter(function( obj ) {
            return (obj.name == 'dashboard');
        })[0]

        ICX.buttonStyle.backgroundColor = thisScreen.color

        // <b>Reply to: {username}</b><br/>
        return (
            <div ref={"replyBox"+this.props.puff.sig} style={inlineReplyStyle}>

            <b>Message:</b><br />
                <textarea ref="messageText" onKeyDown={this.handleKeyDown} style={{width: '100%', height: '20%'}} />{' '}
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleReply}> Send </a>{' '}
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleCleanup}> Cancel </a>
            </div>
            )


	}
})

var ViewLoadMore = React.createClass({
	handleLoadMore: function() {
		var loaded = puffworldprops.view.table.loaded
		return Events.pub('ui/event', {
			'view.table.loaded': loaded + CONFIG.newLoad
		})
	},
	render: function() {
		var footer = <div></div>

        // TODO: clean up query and friends
        var query = Boron.shallow_copy(this.props.query)
        query.offset = 0
        var filters = puffworldprops.view.filters
        var puffs = PB.M.Forum.getPuffList(query, filters)
        var availablePuffs = puffs.length
        var showingPuffs = puffworldprops.view.table.loaded

        
		if (ICX.loading) {
            footer = <div>Loading more messages <img src="/img/icx/dotdotdot.gif" /></div>
        } else if (availablePuffs <= showingPuffs) {
            footer = <div>Nothing more to show</div>
        } else {
			footer = <a className="inline" onClick={this.handleLoadMore}>Load more messages</a>
		}
		return (
			<div>{footer}</div>
		)
	}
})