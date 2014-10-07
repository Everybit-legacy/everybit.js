/** @jsx React.DOM */

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
        console.log("trigger reply \n")
        this.setState({showReply: true})
    },

	render: function() {
        var puff = this.props.puff
        var username = puff.username
        var routes = puff.routes

		if (!puff.sig) {return <span></span>}

		var puffContent = PB.M.Forum.getProcessedPuffContent(puff)
        var itemPadding = Math.floor(ICX.calculated.baseFontH/4)+'px'

        var overalBoxStyle = {
            background: 'rgba(255,255,255,.7)',
            width: '90%'
        }

        // Put it left or right depending on from or to
        if(ICX.username == puff.username) {
            overalBoxStyle.marginLeft = '10%'
        } else {
            overalBoxStyle.marginRight = '10%'
        }

        var itemContentStyle = {
            background: 'rgba(255,255,255,.9)',
            // borderTop: '2px solid rgba(0,0,0,.9)',
            // borderBottom: '1px solid rgba(0,0,0,.9)',
            fontSize: '70%'
        }

        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'gray': true,
            'fa-expand': !this.state.expanded,
            'fa-compress': this.state.expanded,
            'display': 'inline',
            'float': 'right'
        })
        var toggler = <a className="toggler" onClick={this.handleToggleShowItem}><i className={cbClass}></i></a>

        var isFoldedClass = cb({
            'display': this.state.expanded ? 'block' : 'none'
        })

        var inlineReplyDisplay = cb({
            'display': this.state.showReply ? 'block': 'none'
        })

        return (
            <div style={overalBoxStyle}>
                <div className="tableHeader" style={{fontSize: '65%'}} >
                    <ICXTableUserInfo username={puff.username} routes={puff.routes[0]} />
                    <ICXTableItemDate date={puff.payload.time} />
                    <ICXRelationshipInfo puff={puff} />
                    {toggler}
                    <ICXReplyIcon onClick={this.handleShowReply} ref="reply" user={puff.username}/>
                    <ICXDownloadLink puff={puff} />
                </div>
                <div className={'accordion viewItem ' + isFoldedClass}>
                    <div className="viewContent accordion-content" style={itemContentStyle}>
                        <span dangerouslySetInnerHTML={{__html: puffContent}}></span>
                    </div>
                </div>
                <ICXInlineReply style={inlineReplyDisplay} puff={puff} />
            </div>
		)
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
        var username = this.props.username
        var routes = this.props.routes

        // If current user is the sender, we will render the recipient
        if(ICX.username == username) {
            username = routes
            var isSender = true
        } else {
            var isSender = false
        }

        var prof = getProfilePuff(username)
        var avatar = <span></span>
        if(prof && prof.payload.content) {
            avatar = <span className="rowReference"><img className="iconSized" src={prof.payload.content}  /><div className="rowReferencePreview"><img src={prof.payload.content} /></div> </span>
        }

        if(isSender) {
            var fromToText = 'to '
        } else {
            var fromToText = 'from '
        }

        return (
            <div className="userInfo">
                {fromToText} <a className="inline" onClick={this.handleViewUser.bind(this, isSender, username)}>{username}</a>
                {avatar}
            </div>
        )
    }
})


var ICXTableItemDate = React.createClass({
    render: function() {
        var date = new Date(this.props.date)

        return (
                <span className="date"> sent {timeSince(date)} ago</span>
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
        // TODO: wrapping this in a span squelches the DANGER error message, but any previews with anchor tags still don't show up. the underlying issue is that an anchor inside an anchor gets split into two consecutive anchors in the DOM.

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

        var parentsEle = <div></div>
        var parents = PB.Data.graph.v(sig).out('parent').run()
        parents = parents.map(function(v){if (v.shell) return v.shell.sig})
            .filter(Boolean)
            .filter(function(s, i, array){return i == array.indexOf(s)})
        var parentIcons = parents.map(function(sig)
        {return self.getReferenceIcon(sig, 'parent')})
        if (parents.length) {
            parentsEle = (
                <span className="refs">In reply to: {parentIcons}</span>
                )
        }

        var childrenEle = <div></div>
        var children = PB.Data.graph.v(sig).out('child').run()
        children = children.map(function(v){if (v.shell) return v.shell.sig})
            .filter(Boolean)
            .filter(function(s, i, array){return i == array.indexOf(s)})
        var childrenIcons = children.map(function(sig)
        {return self.getReferenceIcon(sig, 'child')})


        if (children.length) {
            if(children.length > 1) {
                childrenEle = <span>{children.length} replies: {childrenIcons}</span>
            } else {
                childrenEle = <span>{children.length} reply: {childrenIcons}</span>
            }

        }

        return (
            <div className="refs relative">
			    {parentsEle} {childrenEle}
            </div>
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

        Events.pub('ui/reply/add-parent', {
               'reply.parents': parents
            }
        )

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
            return post_prom
        }).catch(function (err) {
            // self.cleanUpSubmit()
            console.log("ERROR")
        })

        self.handleCleanup()
	},
	handleSubmitSuccess: function () {
        console.log("SUCCESS")

    },
	handleCleanup: function() {
		this.refs.replyBox.getDOMNode().style.display = "none"
		this.refs.messageText.getDOMNode().value = ''

		return Events.pub('ui/reply', {
			'reply.parents': [],
            'reply.isReply': false,
            'reply.replyTo': ''
		})
	},
	render: function() {
		var puff=this.props.puff
		var username = puff.username

		return (
			<div className="inlineReply" ref="replyBox" style={{display: 'none'}}>
				Reply to: {username} <br/>
				Message:
				<textarea ref="messageText" style={{width: '100%', height: '20%'}} />
				<button onClick={this.handleReply}>Reply</button><span onClick={this.handleCleanup}> Cancel</span>
			</div>
		)
	}
})

// Reply to a single puff
var ICXReplyIcon = React.createClass({
    render: function() {
        if ( this.props.user == ICX.username ) {
            return <span></span>
        } else {
            return (
                <span className="reply icon relative">
                    <a><i className="fa fa-mail-forward fa-fw fa-rotate-180 small"></i></a>
                    <Tooltip position="under" content="Reply" />
                </span>
            )
        }
    }
})

// var ViewLoadMore = React.createClass({
// 	handleForceLoad: function() {
// 		var query = Boron.shallow_copy(this.props.query)
// 		query.offset = (+query.offset || 0) + puffworldprops.view.table.loaded
// 		var filters = puffworldprops.view.filters
// 		var puffs = PB.M.Forum.getPuffList(query, filters, 10)
// 		if ((!puffs) || (puffs.length == 0)) {
// 			Events.pub('ui/event', {
// 				'view.table.noMorePuffs': true
// 			})
// 		} else {
// 			Events.pub('ui/event', {
// 				'view.table.noMorePuffs': false
// 			})
// 			this.handleLoadMore()
// 		}
// 		return false
// 	},
// 	handleLoadMore: function() {
// 		var loaded = puffworldprops.view.table.loaded
// 		return Events.pub('ui/event', {
// 			'view.table.loaded': loaded + CONFIG.newLoad
// 		})
// 	},
// 	render: function() {
// 		var footer = <div></div>
// 		if (puffworldprops.view.table.noMorePuffs) {
// 			footer = <div>Nothing more to show</div>
// 		} else {
// 			footer = <div onClick={this.handleForceLoad}>Load More Puffs</div>
// 		}
// 		return (
// 			<div>{footer}</div>
// 		)
// 	}
// })