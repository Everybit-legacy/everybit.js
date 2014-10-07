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
	render: function() {
		var query = puffworldprops.view.query
		var filters = puffworldprops.view.filters
		var limit = CONFIG.initialLoad
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
        return { expanded: true }
    },

    handleToggleShowItem: function() {
        if(this.state.expanded)
            this.setState({expanded: false})
        else
            this.setState({expanded: true})

        return false
    },

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
        var puff = this.props.puff
        var username = puff.username
        var routes = puff.routes

		if (!puff.sig) {return <span></span>}

        // If current user is the sender, we will render the recipient
        if(ICX.username == username) {
            username = routes[0]
            var isSender = true
        } else {
            var isSender = false
        }

		var puffContent = PB.M.Forum.getProcessedPuffContent(puff)
        var itemPadding = Math.floor(ICX.calculated.baseFontH/4)+'px'

        var overalBoxStyle = {
            background: 'rgba(255,255,255,.7)',
            padding: itemPadding,
            marginBottom: itemPadding,
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
            padding: itemPadding,
            // borderTop: '2px solid rgba(0,0,0,.9)',
            // borderBottom: '1px solid rgba(0,0,0,.9)',
            fontSize: '70%'
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

        var isFoldedClass = cb({
            'display': this.state.expanded ? 'block' : 'none'
        })

        return (
            <span style={overalBoxStyle}>
                <div className="userInfo" style={{fontSize: '65%'}} >
                    {fromToText} <a className="inline" onClick={this.handleViewUser.bind(this, isSender, username)}>{username}</a>
                    {avatar}
                    <ICXTableItemDate date={puff.payload.time}/> <ICXRelationshipInfo puff={this.props.puff} />
                    <span style={{float: 'right'}}>
                        <a href="#" onClick={this.handleToggleShowItem}>
                            <i className={cbClass}></i>
                        </a>
                    </span>
                    <ICXDownloadLink puff={this.props.puff} />
                    <ICXReplyPuff ref="reply" user={puff.username}/>
                </div>
                <div className={'accordion viewItem ' + isFoldedClass}>
                    <div className="viewContent accordion-content" style={itemContentStyle}>
                        <span dangerouslySetInnerHTML={{__html: puffContent}}></span>
                    </div>

                </div>
                <br />
                <ICXReplyIcon puff={puff} />
            </span>
		)
	}
})

var ICXTableItemDate = React.createClass({
    render: function() {
        var date = new Date(this.props.date)

        return (
                <span> sent {timeSince(date)} ago</span>
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
			<div className="metaInfo">
				<div className="options">
					<a style={style} href={filelink} download={download}><i className="fa fa-fw fa-download" /></a>
				</div>
			</div>
		)
	}
})


var ICXReplyIcon = React.createClass({
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
var ICXReplyPuff = React.createClass({
    handleParents: function() {
        var sig = this.props.sig
        var user = this.props.user

        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []

        var index = parents.indexOf(sig)
        if(index == -1) {
            if (parents.length == 0)
            parents.push(sig)
        } else {
            parents.splice(index, 1)
        }
    },

    handleReply: function() {
      	var self = this.getDOMNode()
		var replyBox = self.parentNode.parentNode.parentNode.getElementsByClassName("inlineReply")[0]
      	replyBox.style.display = 'block'

      	//this.handleParents()
    },
    render: function() {
        if ( this.props.user == ICX.username ) {
            return <span></span>
        } else {
            return (
                <span className="icon relative">
                    <a onClick={this.handleReply}><i className="fa fa-mail-forward fa-fw fa-rotate-180 small"></i></a>
                    <Tooltip position="under" content="Reply" />
                </span>
            )
        }
    }
})