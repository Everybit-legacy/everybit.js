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
				<ViewReplyBox />
                {
                	puffs.map(function(puff, index){
						return <ViewItem key={index} puff={puff} />
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
			filter = "From: " + filters.users[0]
		} else if ( filters.routes != undefined ) {
			filter = "To: " + filters.routes[0]
		} else {
			filter = ''
		}
		return filter
	},

	handleRemoveCurrentFilter: function() {
		console.log("remove this?")
		return Events.pub('ui/show/by-user', {
			'view.filters': {}
		})
	},

	render: function() {
		var filter = this.handleGetCurrentFilter()
		var hasFilter = false
		if (filter != '') {
			hasFilter = true
		}
		var style = {display: (hasFilter) ? 'inline' : 'none'}

		return (
			<div className="filters">
				Filters: {filter}
				<span style={style} onClick={this.handleRemoveCurrentFilter}> remove</span>
			</div>
		)
	}
})

var ViewItem = React.createClass({
	render: function() {
		var puff = this.props.puff
		if (!puff.sig) {return <span></span>}

		var username = puff.username
		var routes = puff.routes
		var puffContent = PB.M.Forum.getProcessedPuffContent(puff)

		var classname = (ICX.username == username) ? "accordion viewItem sent" : "accordion viewItem received"

		return (
			<div className={classname}>
				<UserInfo username={username} routes={routes} />
				<div className="viewContent accordion-content expanded">
					<span dangerouslySetInnerHTML={{__html: puffContent}}></span>
				</div>
				<metaInfo puff={puff} />
			</div>
		)
	}
})

var UserInfo = React.createClass({
	handleToggleAccordion: function() {
		var self = this.refs.acrd.getDOMNode()
		var classes = self.classList
		var toToggle = self.parentNode.parentNode.getElementsByClassName("accordion-content")[0].classList
		console.log(toToggle)
		if( toToggle.contains("expanded") ) {
			toToggle.remove("expanded")
			toToggle.add("collapsed")
		} else {
			toToggle.remove("collapsed")
			toToggle.add("expanded")
		}
		// if( (toToggle.style.display == "block") || (toToggle.style.display == "") ) {
		// 	toToggle.style.display = "none" 
		// } else {
		// 	toToggle.style.display = "block"
		// }

		if( classes.contains("expanded") ) {
			self.innerHTML = '<i class="fa fa-expand" />'
			classes.remove("expanded")
			classes.add("collapsed")
		} else {
			self.innerHTML = '<i class="fa fa-compress" />'
			classes.remove("collapsed")
			classes.add("expanded")
		}
		self.classList = classes
	},

	handleViewUser: function(flag, username) {
		if(flag) {
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
		var flag = false
		if(ICX.username == username) {	// current user is the sender, render the recipient
			username = routes[0]
			flag = true
		}

		var prof = getProfilePuff(username)
        var avatar = <span></span>
        if(prof && prof.payload.content) {
        	avatar = <span className="rowReference"><img className="iconSized" src={prof.payload.content}  /><div className="rowReferencePreview"><img src={prof.payload.content} /></div></span>
        }

		return (
			<div className="userInfo">
				<div className="infoItem userRecord">{avatar}
					<span onClick={this.handleViewUser.bind(this, flag, username)}> {username}</span>
				</div>
				<div className="infoItem accordion-control expanded" ref="acrd" onClick={this.handleToggleAccordion} >
					<i className="fa fa-compress" />
				</div>
			</div>
		)
	},
})

var metaInfo = React.createClass({
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
	renderRefs: function() {
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
                <div><i className="fa fa-fw fa-dot-circle-o"></i>{parentIcons}</div>
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
                childrenEle = <div><i className="fa fa-fw">●</i>{childrenIcons}</div>
        }

		return (
            <div className="refs">
			    {parentsEle}
			    {childrenEle}
		    </div>
        )
	},
	render: function() {
		var puff = this.props.puff
		var date = new Date(puff.payload.time)

		var filelink = ""
		var download = ""
		var style = {display: 'none'}

    	if(puff.payload.type == 'file') {
    		filelink = PBFiles.prepBlob(puff.payload.content, puff.payload.type)
			download = puff.payload.filename
			style = {display: 'inline'}
        }

        var refs = this.renderRefs()

		return (
			<div className="metaInfo">
				<div className="info">
					<div className="date-since">{timeSince(date)} ago</div>
					{refs}
				</div>
				<div className="options">
					<a style={style} href={filelink} download={download}><i className="fa fa-fw fa-download" /></a>
					<ICXReplyPuff ref="reply" sig={puff.sig} user={puff.username}/>
				</div>
			</div>
		)
	}
})

var ViewReplyBox = React.createClass({
	handleReply: function() {
		var type = 'text'
        var content = this.refs.messageText.getDOMNode().value
        if(puffworldprops.reply.isReply) {
            var parents = puffworldprops.reply.parents
        }
        var metadata = {}
        metadata.routes = [puffworldprops.reply.replyTo]
        var envelopeUserKeys = ''
        var self = this

        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [puffworldprops.reply.replyTo]

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
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PB.M.Wardrobe.getCurrentUserRecord())
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
	handleCancelReply: function() {
		this.handleCleanup()
	},
	render: function() {
		var username = puffworldprops.reply.replyTo

		return (
			<div id="inlineReply" ref="replyBox" style={{display: 'none'}}>
				Reply to: {username} <br/>
				Message:
				<textarea ref="messageText" style={{width: '100%', height: '20%'}} />
				<button onClick={this.handleReply}>Reply</button><span onClick={this.handleCancelReply}> Cancel</span>
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

        return Events.pub('ui/reply/add-parent',
            {
               'reply.parents': parents,
               'reply.isReply': true,
               'reply.replyTo': user
            }
        )
    },

    handleReply: function() {
      	var replyBox = document.getElementById("inlineReply")
      	var viewBody = document.getElementsByClassName("icx-tableview")[0]
      	replyBox.style.display = 'block'
      	viewBody.scrollTop = 0

      	this.handleParents()
    },
    render: function() {
        if ( this.props.user == ICX.username ) {
            return <span></span>
        } else {
            return (
                <span className="icon relative">
                    <a onClick={this.handleReply}><i className="fa fa-reply fa-fw"></i></a>
                    <Tooltip position="under" content="Reply to this puff" />
                </span>
            )
        }
    }
})