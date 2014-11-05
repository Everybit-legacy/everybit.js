/** @jsx React.DOM */

var ConversationListView = React.createClass({
    render: function() {
        var convos = puffworldprops.ICX.uniqueConvoIDs
        var ids = puffworldprops.ICX.convoList

        var conversations = ids.map(function (id) {
            return <ConversationItem content={convos[id]} key={convos[id].key} />
        })

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = '#046380'

        return (
            <div className="conversationListView">
                <div style={headerStyle}>View your conversations</div>
                {conversations}
            </div>
            )
    }
})

var ConversationItem = React.createClass({
    handleShowConvo: function() {
        var key = this.props.content.key
        return Events.pub('ui/event/', {
            'view.convoId': key,
            'view.icx.screen': 'convo'
        })
    },
    getPreview: function() {
        var convo = this.props.content
        if(convo.min == convo.max)
            getConversationPuffs(convo.key, convo.min-1, convo.max)

        return PB.Data.getDecryptedLetterBySig(convo.sigs[convo.sigs.length-1]) || false
    },
    render: function() {
        var content = this.props.content
        var partners = getUsernamesFromConvoKey(content.key)

        return (
            <div className="conversationItem" onClick={this.handleShowConvo}>
                <span>{partners} ({content.sigs.length})</span>
                <ConvoPreview puff={this.getPreview()} />
            </div>
            )
    }
})

var ConvoPreview = React.createClass({
    render: function() {
        if(this.props.puff) {
            var puff = this.props.puff
            var date = new Date(puff.payload.time)
            var timeStamp = timeSince(date) + ' ago'

            if(puff.payload.filename)
                var preview = 'FILE: '+puff.payload.filename
            else
                var preview = puff.payload.content
        }

        return (
            <div className="preview">
                <div className="previewContent">{preview}</div>
                <div className="previewTime">{timeStamp}</div>
            </div>
        )
    }
})

var puffContainer = React.createClass({
    componentWillMount: function() {
        initializeConvoContent(puffworldprops.view.convoId)
    },
    componentDidMount: function() {
        ICX.loading = true
    },

    getContent: function() {
        return getLocalConvoContent(puffworldprops.view.convoId)
    },

    render: function() {
        var puffs = this.getContent().map(function (puff) {
            return (
                <ICXContentItem puff={puff} key={puff.sig} />
            )
        })
        return (
            <div className="tour-item messageList">
                {puffs}
            </div>
        )
    }
})

var TableView = React.createClass({
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

        var convoInfo = puffworldprops.ICX.uniqueConvoIDs[puffworldprops.view.convoId]
        var partners = getUsernamesFromConvoKey(convoInfo.key)

		return (
			<div className="viewContainer">
                <div style={headerStyle}>Conversation with {partners}</div>
                <ViewLoadMore convoId={puffworldprops.view.convoId} update={convoInfo.min} loading={ICX.loading}/>
                <div style={{fontSize: '60%'}}>
                    <br />
                    <b>All content is encrypted on the user’s device. Only the sender and recipient can decode it.</b><br /><br />
                </div>
                <span style={refreshStyle}><a onClick={this.forceRefreshPuffs}><i ref="refresh" className="fa fa-refresh small" /></a></span>
                <ViewFilters />
                <puffContainer key="messages"/>

                <ICXInlineReply convoId={puffworldprops.view.convoId} key={puffworldprops.view.convoId} />
			</div>
		)
	},
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

    handleToggleShowItem: function() {
        if(this.state.expanded)
            this.setState({expanded: false})
        else
            this.setState({expanded: true})

        return false
    },

    componentDidUpdate: function() {
        ICX.loading = false
    },

	render: function() {
        var puff = this.props.puff
        var convoId = getConvoKeyByPuff(puff)

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
                    </div>
                )
            } else {
                return(
                    <div className="accordion-content" style={itemContentStyle}>
                        <span dangerouslySetInnerHTML={{__html: puffContent}}></span>
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
        var sigKey = this.props.convoId
        if(messageToCache) {
            ICX.cachedReplies[sigKey] = messageToCache
        }
    },

    componentDidMount: function() {
        var convoId = this.props.convoId
        if(ICX.cachedReplies[convoId]) {
            this.refs.messageText.getDOMNode().value = ICX.cachedReplies[convoId]
        }
    },

	handleReply: function() {
        var toUser = getUsernamesFromConvoKey(this.props.convoId)  // getting usernames from convoId in viewProps

        // THINK: Do we still need to keep track of parents in ICX?
        var parents = []
        var envelopeUserKeys = ''
        var self = this
        var metadata = {}
        metadata.routes = toUser

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

        // var activeReplies = puffworldprops.view.icx.activeReplies

        // Remove this one for things we are replying to
        // var sig = this.props.puff.sig
        // if(activeReplies.indexOf(sig) !== -1) {
        //     activeReplies.splice(activeReplies.indexOf(sig),1)
        // }
        //clear out reply text and any cache
        this.refs.messageText.getDOMNode().value = ""
        ICX.cachedReplies[this.props.convoId] = ""

        Events.pub('ui/reply/activate', {
            //'view.icx.activeReplies': activeReplies,
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
		var username = getUsernamesFromConvoKey(this.props.convoId)
        var headerStyle = ICX.calculated.pageHeaderTextStyle

        var inlineReplyStyle = {}
        var replyMsgStyle = {}
        var replyFileStyle = {}

        // var activeReplies = puffworldprops.view.icx.activeReplies       // no longer need to keep track of active replies

        replyMsgStyle.display = (puffworldprops.reply.replyType == 'message') ? 'block' : 'none'
        replyFileStyle.display = (puffworldprops.reply.replyType == 'file') ? 'block' : 'none'

        // if(activeReplies.indexOf(puff.sig) !== -1) {
        //     inlineReplyStyle.display = 'block'

        // } else {
        //     inlineReplyStyle.display = 'none'
        // }

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
            <div ref={"replyBox"+this.props.convoId} style={inlineReplyStyle}>
                <div className="replyMessage" style={replyMsgStyle}>
                    <b>Message:</b><br />
                    <textarea ref="messageText" onKeyDown={this.handleKeyDown} style={{width: '100%', height: '20%'}} />{' '}
                </div>
                <div className="replyFile" style={replyFileStyle}>
                    <ICXFileUploader styling={headerStyle} />
                    <br />Memo: <br />
                    <input type="text" ref="caption" style={{ 'width': '80%' }} onBlur={this.handleAddCaption} />
                </div>
                <div className="replyBoxButtons">
                    <a className="icxNextButton icx-fade" label="message" style={ICX.buttonStyle} onClick={this.handleToggleReplyOption} >Message</a>
                    <a className="icxNextButton icx-fade" label="file" style={ICX.buttonStyle} onClick={this.handleToggleReplyOption} >File</a>
                    <a className="icxNextButton icx-fade right" style={ICX.buttonStyle} onClick={this.handleReply}> Send </a>
                    <a className="icxNextButton icx-fade right" style={ICX.buttonStyle} onClick={this.handleCleanup}> Cancel </a>
                </div>
            </div>
            )


	}
})

var ViewLoadMore = React.createClass({
    shouldComponentUpdate: function(nextProps) {
        return nextProps.update !== this.props.update || nextProps.loading !== this.props.loading
    },

	handleLoadMore: function() {
        var convoId = this.props.convoId
        var convoInfo = puffworldprops.ICX.uniqueConvoIDs[convoId]

        getConvoContent(convoId)
        // var report = PB.Data.getMorePrivatePuffs('', loaded, CONFIG.pageBatchSize) // report is a Promise
        // PB.Data.getConversationPuffs(convoId, convoInfo.loaded, CONFIG.pageBatchSize)
        // TODO: use report to determine next state of button:
        //       - if report.counts.delivered == CONFIG.pageBatchSize then we can try loading more
        //       - otherwise we failed to gather all the puffs we tried to gather (either No More or Network Error)
        
        // NOTE: until report.private_promise resolves, not all puffs have been displayed in the GUI. 
        //       use that as the signal to transition from 'Loading' to 'Load More' or 'No more messages found'

        // This has wierd behavior
        // THINK: Where should we keep track of the loaded field?
        // We could do it when a new puff has been cached, or here
        // var obj = {}
        // convoInfo.loaded += CONFIG.pageBatchSize
        // obj['ICX.uniqueConvoIDs.' + convoId] = convoInfo
		// return Events.pub('ui/event', obj)
	},
	render: function() {
		var footer = <div></div>

        var convoId = this.props.convoId
        var convoInfo = puffworldprops.ICX.uniqueConvoIDs[convoId]
        var min = convoInfo.min

        if (this.props.loading) {
            footer = <div>Loading more messages <img src="/img/icx/dotdotdot.gif" /></div>
        } else if (!min) {
            footer = <div>Nothing more to show</div>
        } else {
			footer = <a className="inline" onClick={this.handleLoadMore}>Load more messages</a>
		}
		return (
			<div className="loadMore">{footer}</div>
		)
	}
})