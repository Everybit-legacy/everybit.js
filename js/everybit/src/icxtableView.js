/** @jsx React.DOM */

/*
 BROKEN:
 
 Refresh button


  */

var puffContainer = React.createClass({
    render: function() {
        var puffs = this.props.content.map(function (puff) {
            return (
                <ICXContentItem puff={puff} />
            )
        })
        return (
            <div className="tour-item messageList">
                {puffs}
            </div>
        )
    },

    componentDidMount: function() {
        ICX.loading = true
    }
})

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
        PB.Data.updatePrivateShells()
        setTimeout(
            function() {cl.toggle("fa-spin")},2000
        )
    },

    componentWillMount: function() {
        Events.pub('ui/event', {
            'view.table.loaded': CONFIG.initLoadBatchSize
        })
    },

    componentDidMount: function() {
        if(typeof puffworldprops.ICX.hasShells === "undefined") {
            userHasShells(PB.getCurrentUsername(), function(numShells) {
                Events.pub('ui/event',{
                    'ICX.hasShells': numShells
                })
            })
        }
    },

    getContent: function() {
        var query = puffworldprops.view.query
        var filters = puffworldprops.view.filters
        var limit = puffworldprops.view.table.loaded
        return getTableViewContent(query, filters, limit)

    },


	render: function() {

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
                <puffContainer content={this.getContent()} key="messages"/>

                <ViewLoadMore query={this.props.view.query} update={puffworldprops.ICX.hasShells} loading={ICX.loading}/>
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
			filter = "to " + (filters.routes||[''])[0]
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

    componentDidUpdate: function() {
        ICX.loading = false
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
        var replyStyle = {}
        replyStyle.float = 'right'

        // Put it left or right depending on from or to
        if(PB.getCurrentUsername() == puff.username.stripCapa()) {
            overalBoxStyle.marginLeft = '10%'
            replyStyle.display = 'none'
        } else {
            overalBoxStyle.marginRight = '10%'
            replyStyle.display = 'block'
        }

        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-expand': !this.state.expanded,
            'fa-compress': this.state.expanded
        })



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
                var showCaption = {}
                if(!this.props.puff.payload.caption) {
                    showCaption.display = 'none'
                } else {
                    var caption = this.props.puff.payload.caption
                    showCaption.display = 'block'
                }

                return (
                    <div className="accordion-content" style={itemContentStyle}>
                        <ICXDownloadLink puff={this.props.puff} filename={puffContent} />
                        <span style={showCaption}>{caption}</span>
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
        var toUser = (this.props.puff.routes||[])[0]||''
        toUser = toUser.stripCapa()

        // If current user is the sender, we will render the recipient
        if(PB.getCurrentUsername() == fromUser) {
            var username = toUser
            var isSender = true
            var sentOrReceived = 'sent'
            var fromOrTo = 'To '
        } else {
            var username = fromUser
            var isSender = false
            var sentOrReceived = 'received'
            var fromOrTo = 'From '
        }

        var prof = getProfilePuff(username)
        var avatar = <span></span>
        if(prof && prof.payload.content) {
            avatar = <span className="rowReference"><img className="iconSized" src={prof.payload.content}  /><div className="rowReferencePreview"><img src={prof.payload.content} /></div> </span>
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
        var puff = PB.getPuffBySig(sig)
        if (puff.payload && puff.payload.content) {
            var puffContent = PB.M.Forum.getProcessedPuffContent(puff)
            preview = <div className="rowReferencePreview"><span dangerouslySetInnerHTML={{__html: puffContent}}></span></div>
        }

        return (
            <a key={sig} className="rowReference">
                <img style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'middle'}} src={getImageCode(sig)}/>{preview}
            </a>
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
    			<span><b>File: </b><a onClick={this.handlePrepBlob} style={style}>{this.props.filename}</a></span>
    		)
        }
	}
})

var ICXInlineReply = React.createClass({
    componentWillUnmount: function() {
        var messageToCache = this.refs.messageText.getDOMNode().value
        var sigKey = this.props.puff.sig
        if(messageToCache) {
            ICX.cachedReplies[sigKey] = messageToCache
        }
    },

    componentDidMount: function() {
        var sig = this.props.puff.sig
        if(ICX.cachedReplies[sig]) {
            this.refs.messageText.getDOMNode().value = ICX.cachedReplies[sig]
        }
    },

	handleReply: function() {
		var puff = this.props.puff
        var toUser = puff.username.stripCapa()
        var parents = [puff.sig]
        var envelopeUserKeys = ''
        var self = this
        var metadata = {}
        metadata.routes = [toUser]

        if(puffworldprops.reply.replyType == 'message') {
            var type = 'text'
            var content = this.refs.messageText.getDOMNode().value
        }

        if (puffworldprops.reply.replyType == 'file') {

            // TODO: Throw file missing error
            if( !ICX.filelist ) return false
            var type = 'file'
            var file = ICX.filelist[0]
            var content = ICX.fileprom
            metadata.filename = file.name
            metadata.caption = puffworldprops.reply.caption
        }

        if(!content || content.length < 1) {
            return false
        }
        Events.pub('ui/thinking', { 'ICX.thinking': true })
        
        ICXAddPost(toUser, type, parents, content, metadata, envelopeUserKeys, function (err) {
            if (!err) {
                self.handleSubmitSuccess()
            } else {
                self.handleSubmitError(err)
            }
        })
	},

	handleSubmitSuccess: function () {
        Events.pub('ui/thinking', { 'ICX.thinking': false })
        Events.pub('ui/reply', {
            'reply.caption': ''
        })
        this.handleCleanup()
    },

    handleSubmitError: function (err) {
        Events.pub('ui/thinking', { 'ICX.thinking': false })
        // We don't know where to insert errors in tableview yet
        console.log(err.message)
        this.handleCleanup()
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
        //clear out reply text and any cache
        this.refs.messageText.getDOMNode().value = ""
        ICX.cachedReplies[sig] = ""

        Events.pub('ui/reply/activate', {
            'view.icx.activeReplies': activeReplies,
            'reply.caption': ''
        })
	},

    handleKeyDown: function(e) {
        if (e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            this.handleReply()
        }
    },

    handleAddCaption: function() {
        if(!ICX.filelist) return false

        var caption = this.refs.caption.getDOMNode().value
        Events.pub('ui/reply', {
            'reply.caption': caption
        })
    },

    handleToggleReplyOption: function(event) {
        var toggle = event.target.attributes.label.value
        Events.pub('ui/reply', {
            'reply.replyType': toggle
        })
    },

	render: function() {
		var puff=this.props.puff
		var username = puff.username.stripCapa()
        var headerStyle = ICX.calculated.pageHeaderTextStyle

        var inlineReplyStyle = {}
        var replyMsgStyle = {}
        var replyFileStyle = {}

        var activeReplies = puffworldprops.view.icx.activeReplies

        replyMsgStyle.display = (puffworldprops.reply.replyType == 'message') ? 'block' : 'none'
        replyFileStyle.display = (puffworldprops.reply.replyType == 'file') ? 'block' : 'none'

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
                <a className="icxNextButton icx-fade" label="message" style={ICX.buttonStyle} onClick={this.handleToggleReplyOption} >Message</a>
                {' '}
                <a className="icxNextButton icx-fade" label="file" style={ICX.buttonStyle} onClick={this.handleToggleReplyOption} >File</a>

                <div className="replyMessage" style={replyMsgStyle}>
                    <b>Message:</b><br />
                    <textarea ref="messageText" onKeyDown={this.handleKeyDown} style={{width: '100%', height: '20%'}} />{' '}
                </div>
                <div className="replyFile" style={replyFileStyle}>
                    <ICXFileUploader styling={headerStyle} />
                    <br />Memo: <br />
                    <input type="text" ref="caption" style={{ 'width': '80%' }} onBlur={this.handleAddCaption} />
                </div>
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleReply}> Send </a>{' '}
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleCleanup}> Cancel </a>
            </div>
            )


	}
})

var ViewLoadMore = React.createClass({
    shouldComponentUpdate: function(nextProps) {
        return nextProps.update !== this.props.update || nextProps.loading !== this.props.loading
    },

	handleLoadMore: function() {
		var loaded = puffworldprops.view.table.loaded
        var report = PB.Data.getMorePrivatePuffs('', loaded, CONFIG.pageBatchSize) // report is a Promise
        // TODO: use report to determine next state of button:
        //       - if report.counts.delivered == CONFIG.pageBatchSize then we can try loading more
        //       - otherwise we failed to gather all the puffs we tried to gather (either No More or Network Error)
        
        // NOTE: until report.private_promise resolves, not all puffs have been displayed in the GUI. 
        //       use that as the signal to transition from 'Loading' to 'Load More' or 'No more messages found'
		return Events.pub('ui/event', {
			'view.table.loaded': loaded + CONFIG.pageBatchSize
		})
	},
	render: function() {
		var footer = <div></div>

        // TODO: clean up query and friends
        var query = Boron.shallow_copy(this.props.query)
        query.offset = 0
        var filters = puffworldprops.view.filters
        var showingPuffs = puffworldprops.view.table.loaded


        
        if (puffworldprops.ICX.hasShells == 0) {
            footer = <div>No messages to display</div>
        } else if (this.props.loading == true) {
            footer = <div>Loading more messages <img src="/img/icx/dotdotdot.gif" /></div>
        } else if (puffworldprops.ICX.hasShells <= showingPuffs) {
            footer = <div>Nothing more to show</div>
        } else {
			footer = <a className="inline" onClick={this.handleLoadMore}>Load more messages</a>
		}
		return (
			<div>{footer}</div>
		)
	}
})