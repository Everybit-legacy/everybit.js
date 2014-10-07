/** @jsx React.DOM */

/*
 BROKEN:
 hover over puff to show preview
 Hover over avatar if down on page
 Inline reply
 Scroll to view more puffs
 Refresh button
 Message for no puffs


WORKING:
Download link
View text of message
 Collapse of row


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

		puffs = this.sortPuffs(puffs)
		
		return (
			<div className="viewContainer">
				<ViewFilters />
                {
                	puffs.map(function(puff, index){
						return <ICXContentItem key={index} puff={puff} />
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
		var style = {display: (!filter) ? 'none' : 'inline'}

		return (
			<div style={style} className="filters">
				<b>Filters: {filter}</b>
				<span onClick={this.handleRemoveCurrentFilter}><i className="fa fa-times"></i></span>
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
            borderLeft: Math.floor(ICX.calculated.baseFontH/2)+'px' + ' solid rgba(26, 40, 60,.5)'
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
                        <ICXTableItemDate date={puff.payload.time} />
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

            return(
                <div className="accordion-content" style={itemContentStyle}>
                    <span dangerouslySetInnerHTML={{__html: puffContent}}></span>
                    <ICXInlineReply puff={this.props.puff} />
                </div>
                )

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
            var fromToText = 'To '
        } else {
            var fromToText = 'From '
        }

        return (
            <span className="userInfo">
                {fromToText} <a onClick={this.handleViewUser.bind(this, isSender, username)}>{username}</a> {avatar}
                {' '}
            </span>
        )
    }
})


var ICXTableItemDate = React.createClass({
    render: function() {
        var date = new Date(this.props.date)

        return (
                <span className="date">&nbsp;sent {timeSince(date)} ago</span>
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
                childrenEle = <span className="relative">{children.length} replies: {childrenIcons}</span>
            } else {
                childrenEle = <span className="relative">{children.length} reply: {childrenIcons}</span>
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

	render: function() {
		var puff = this.props.puff

		var filelink = ""
		var download = ""
		var style = {display: 'none'}

    	if(puff.payload.type == 'file') {
    		filelink = PBFiles.prepBlob(puff.payload.content, puff.payload.type)
			download = puff.payload.filename
			style = {display: 'inline'}
        }

		return (
			<div className="download">
				<a style={style} href={filelink} download={download}><i className="fa fa-fw fa-download" /></a>
			</div>
		)
	}
})


var ICXInlineReply = React.createClass({
	handleReply: function() {
		var puff=this.props.puff
		var type = 'text'
        var content = this.refs.messageText.getDOMNode().value
        var parents = [puff.sig]
        var metadata = {}
        metadata.routes = [puff.username]
        var envelopeUserKeys = ''
        var self = this

        /*
        Events.pub('ui/reply/add-parent', {
               'reply.parents': parents
            }
        )
        */

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
            // self.cleanUpSubmit()
            console.log("ERROR")
        })
	},

	handleSubmitSuccess: function () {
        console.log("SUCCESS")

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


        var thisScreen = ICX.screens.filter(function( obj ) {
            return (obj.name == 'dashboard');
        })[0]

        ICX.buttonStyle.backgroundColor = thisScreen.color

        return (
            <div ref={"replyBox"+this.props.puff.sig} style={inlineReplyStyle}>
            <b>Reply to: {username}</b><br/>
            <b>Message:</b><br />
                <textarea ref="messageText" style={{width: '100%', height: '20%'}} />
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleReply}> Send </a>{' '}
                <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleCleanup}> Cancel </a>
            </div>
            )


	}
})

var ViewLoadMore = React.createClass({
	handleForceLoad: function() {
		var query = Boron.shallow_copy(this.props.query)
		query.offset = (+query.offset || 0) + puffworldprops.view.table.loaded
		var filters = puffworldprops.view.filters
		var puffs = PB.M.Forum.getPuffList(query, filters, 10)
		if ((!puffs) || (puffs.length == 0)) {
			Events.pub('ui/event', {
				'view.table.noMorePuffs': true
			})
		} else {
			Events.pub('ui/event', {
				'view.table.noMorePuffs': false
			})
			this.handleLoadMore()
		}
		return false
	},
	handleLoadMore: function() {
		var loaded = puffworldprops.view.table.loaded
		return Events.pub('ui/event', {
			'view.table.loaded': loaded + CONFIG.newLoad
		})
	},
	render: function() {
		var footer = <div></div>
		if (puffworldprops.view.table.noMorePuffs) {
			footer = <div>Nothing more to show</div>
		} else {
			footer = <a className="inline" onClick={this.handleForceLoad}>Load more messages</a>
		}
		return (
			<div>{footer}</div>
		)
	}
})